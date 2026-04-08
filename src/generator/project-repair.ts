import 'server-only';

import ts from 'typescript';
import { aiLogger } from '@/ai/logger';
import { aiOrchestrator } from '@/ai/orchestrator';
import { AITask } from '@/ai/types';
import { Blueprint } from '@/validators/blueprint.validator';
import { selectStableDesignProfile } from './design-system';
import { generateFrontendFiles } from './templates/frontend';
import { generateConfigFiles } from './templates/config';
import { GeneratedFile } from './types';

const REPAIRABLE_FILE_PATTERN = /\.(?:[cm]?[jt]sx?)$/i;
const MAX_REPAIR_FILES_PER_PASS = 3;
const MAX_REPAIR_PASSES = 2;

export interface FileSyntaxIssue {
  path: string;
  message: string;
  code: number;
  line: number;
  column: number;
}

export interface ProjectRepairResult {
  files: GeneratedFile[];
  warnings: string[];
  repairedPaths: string[];
  unresolvedIssues: FileSyntaxIssue[];
}

export async function repairGeneratedProject(
  files: GeneratedFile[],
  blueprint: Blueprint,
  errorContext?: string
): Promise<ProjectRepairResult> {
  const warnings: string[] = [];
  const repairedPaths = new Set<string>();
  let workingFiles = [...files];
  let syntaxIssues = collectSyntaxIssues(workingFiles);

  for (let pass = 1; pass <= MAX_REPAIR_PASSES; pass += 1) {
    if (syntaxIssues.length === 0) {
      break;
    }

    const targetPaths = pickRepairTargets(workingFiles, syntaxIssues, errorContext);
    if (targetPaths.length === 0) {
      break;
    }

    let passRepaired = false;

    for (const targetPath of targetPaths) {
      const targetFile = workingFiles.find((file) => file.path === targetPath);
      if (!targetFile) {
        continue;
      }

      const fileIssues = syntaxIssues.filter((issue) => issue.path === targetPath);
      let repairedContent = attemptLocalRepair(targetFile, blueprint, fileIssues, errorContext);

      if (!repairedContent) {
        repairedContent = await repairSingleFile(targetFile, blueprint, fileIssues, errorContext);
      }

      if (!repairedContent || repairedContent.trim() === targetFile.content.trim()) {
        continue;
      }

      const remainingIssues = collectFileSyntaxIssues(targetPath, repairedContent);
      if (remainingIssues.length > 0) {
        warnings.push(
          `Automatic repair produced remaining syntax issues in ${targetPath}; keeping the previous version.`
        );
        continue;
      }

      workingFiles = workingFiles.map((file) =>
        file.path === targetPath
          ? {
              ...file,
              content: repairedContent,
              source: file.source === 'ai' ? 'ai' : 'hybrid',
            }
          : file
      );
      repairedPaths.add(targetPath);
      passRepaired = true;
    }

    syntaxIssues = collectSyntaxIssues(workingFiles);

    if (!passRepaired) {
      break;
    }
  }

  if (repairedPaths.size > 0) {
    warnings.push(
      `Automatically repaired ${repairedPaths.size} generated file${
        repairedPaths.size === 1 ? '' : 's'
      } before preview.`
    );
  }

  if (syntaxIssues.length > 0) {
    warnings.push(
      `Some generated files still have syntax issues: ${syntaxIssues
        .slice(0, 3)
        .map((issue) => issue.path)
        .join(', ')}`
    );
  }

  return {
    files: workingFiles,
    warnings,
    repairedPaths: [...repairedPaths],
    unresolvedIssues: syntaxIssues,
  };
}

export function collectSyntaxIssues(files: GeneratedFile[]) {
  return files.flatMap((file) => collectFileSyntaxIssues(file.path, file.content));
}

function collectFileSyntaxIssues(path: string, content: string): FileSyntaxIssue[] {
  if (!REPAIRABLE_FILE_PATTERN.test(path)) {
    return [];
  }

  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  };

  if (path.endsWith('.tsx') || path.endsWith('.jsx')) {
    compilerOptions.jsx = ts.JsxEmit.Preserve;
  }

  const result = ts.transpileModule(content, {
    fileName: path,
    reportDiagnostics: true,
    compilerOptions,
  });
  const sourceFile = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true, getScriptKind(path));

  return (result.diagnostics ?? []).map((diagnostic) => {
    const location =
      typeof diagnostic.start === 'number'
        ? sourceFile.getLineAndCharacterOfPosition(diagnostic.start)
        : { line: 0, character: 0 };

    return {
      path,
      code: diagnostic.code,
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
      line: location.line + 1,
      column: location.character + 1,
    };
  });
}

function attemptLocalRepair(
  file: GeneratedFile,
  blueprint: Blueprint,
  issues: FileSyntaxIssue[],
  errorContext?: string
) {
  const fallbackContent = buildTemplateFallback(file.path, blueprint);
  if (!fallbackContent) {
    return null;
  }

  const fallbackIssues = collectFileSyntaxIssues(file.path, fallbackContent);
  if (fallbackIssues.length > 0) {
    return null;
  }

  aiLogger.info('Applied local fallback repair', undefined, AITask.CODE_FIX, {
    file: file.path,
    originalIssues: issues.map((issue) => issue.message).slice(0, 3),
    hadErrorContext: Boolean(errorContext),
  });
  return fallbackContent;
}

function pickRepairTargets(
  files: GeneratedFile[],
  syntaxIssues: FileSyntaxIssue[],
  errorContext?: string
) {
  const filePaths = new Set(files.map((file) => file.path));
  const candidates = new Set<string>();

  for (const path of extractPathsFromErrorContext(errorContext)) {
    if (filePaths.has(path)) {
      candidates.add(path);
    }
  }

  for (const issue of syntaxIssues) {
    candidates.add(issue.path);
  }

  return [...candidates]
    .sort((left, right) => scoreRepairPath(right, errorContext) - scoreRepairPath(left, errorContext))
    .slice(0, MAX_REPAIR_FILES_PER_PASS);
}

async function repairSingleFile(
  file: GeneratedFile,
  blueprint: Blueprint,
  issues: FileSyntaxIssue[],
  errorContext?: string
) {
  try {
    const response = await aiOrchestrator.execute({
      task: AITask.CODE_FIX,
      prompt: buildRepairPrompt(file, blueprint, issues, errorContext),
      systemPrompt:
        'You fix broken generated Next.js files. Return ONLY the complete corrected file content with no markdown fences or explanation.',
      temperature: 0.2,
      maxTokens: 4096,
      expectJson: false,
    });

    return response.raw?.trim() || null;
  } catch (error) {
    aiLogger.warn('Automatic file repair failed', undefined, AITask.CODE_FIX, {
      file: file.path,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

function buildRepairPrompt(
  file: GeneratedFile,
  blueprint: Blueprint,
  issues: FileSyntaxIssue[],
  errorContext?: string
) {
  const issueText =
    issues.length > 0
      ? issues.map((issue) => `- ${issue.path}:${issue.line}:${issue.column} ${issue.message}`).join('\n')
      : '- Build failed but no parser diagnostics were available.';
  const runtimeContext = summarizeErrorContext(errorContext, file.path);
  const runtimeText = runtimeContext
    ? `\nPreview/build error context:\n${runtimeContext}\n`
    : '';
  const projectSummary = [blueprint.projectName, blueprint.description]
    .filter(Boolean)
    .join(' - ')
    .slice(0, 220);

  return `Fix this generated Next.js file so it builds successfully.

Project: ${projectSummary}

Target file: ${file.path}

Build issues:
${issueText}
${runtimeText}
Rules:
- Return the full corrected file content only.
- Preserve the page's intent, layout, and styling as much as possible.
- Fix malformed JSX, missing braces/parentheses, and broken props/imports caused by generation mistakes.
- Do not add new dependencies.
- Keep imports compatible with a default Next.js App Router project.

Current file:
\`\`\`
${compactPromptSource(file.content)}
\`\`\``;
}

function extractPathsFromErrorContext(errorContext?: string) {
  if (!errorContext) {
    return [];
  }

  const matches = errorContext.match(/(?:\.\/)?src\/[^\s\]]+\.(?:tsx?|jsx?)/g) ?? [];
  return matches.map((match) => match.replace(/^\.\//, ''));
}

function buildTemplateFallback(path: string, blueprint: Blueprint) {
  const configFallback = generateConfigFiles(blueprint).find((file) => file.path === path);
  if (configFallback) {
    return configFallback.content;
  }

  const designProfile = selectStableDesignProfile(blueprint);
  const frontendFallback = generateFrontendFiles(blueprint, designProfile).find(
    (file) => file.path === path
  );

  return frontendFallback?.content ?? null;
}

function summarizeErrorContext(errorContext: string | undefined, targetPath: string) {
  if (!errorContext) {
    return '';
  }

  const lines = errorContext
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const focused = lines.filter((line) => line.includes(targetPath) || /unexpected token|syntax error|failed to compile/i.test(line));
  const selected = focused.length > 0 ? focused.slice(-12) : lines.slice(-12);
  return selected.join('\n').slice(-1400);
}

function compactPromptSource(content: string) {
  return content
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .slice(0, 16000);
}

function scoreRepairPath(path: string, errorContext?: string) {
  let score = 0;

  if (errorContext?.includes(path)) {
    score += 100;
  }

  if (path === 'src/app/page.tsx') {
    score += 90;
  } else if (path.startsWith('src/app/')) {
    score += 70;
  } else if (path.startsWith('src/components/')) {
    score += 55;
  } else if (path.startsWith('src/lib/')) {
    score += 40;
  } else if (path.startsWith('src/')) {
    score += 25;
  } else {
    score += 5;
  }

  if (/\.(tsx|jsx)$/.test(path)) {
    score += 20;
  }

  return score;
}

function getScriptKind(path: string) {
  if (path.endsWith('.tsx')) {
    return ts.ScriptKind.TSX;
  }

  if (path.endsWith('.jsx')) {
    return ts.ScriptKind.JSX;
  }

  if (path.endsWith('.js')) {
    return ts.ScriptKind.JS;
  }

  return ts.ScriptKind.TS;
}

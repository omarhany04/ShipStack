import 'server-only';

import ts from 'typescript';
import { aiLogger } from '@/ai/logger';
import { aiOrchestrator } from '@/ai/orchestrator';
import { AITask } from '@/ai/types';
import { Blueprint } from '@/validators/blueprint.validator';
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
      const repairedContent = await repairSingleFile(targetFile, blueprint, fileIssues, errorContext);

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

  const result = ts.transpileModule(content, {
    fileName: path,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: path.endsWith('.tsx') || path.endsWith('.jsx') ? ts.JsxEmit.Preserve : ts.JsxEmit.None,
    },
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

function pickRepairTargets(
  files: GeneratedFile[],
  syntaxIssues: FileSyntaxIssue[],
  errorContext?: string
) {
  const candidates = new Set<string>();

  for (const path of extractPathsFromErrorContext(errorContext)) {
    if (files.some((file) => file.path === path)) {
      candidates.add(path);
    }
  }

  for (const issue of syntaxIssues) {
    candidates.add(issue.path);
    if (candidates.size >= MAX_REPAIR_FILES_PER_PASS) {
      break;
    }
  }

  return [...candidates].slice(0, MAX_REPAIR_FILES_PER_PASS);
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
  const runtimeText = errorContext?.trim()
    ? `\nPreview/build error context:\n${errorContext.trim().slice(-4000)}\n`
    : '';

  return `Fix this generated file so the Next.js project builds successfully.

Project: ${blueprint.projectName}
Description: ${blueprint.description}
Pages: ${blueprint.pages.map((page) => `${page.name} (${page.route})`).join(', ')}
Features: ${blueprint.features.slice(0, 8).map((feature) => feature.name).join(', ')}

Target file: ${file.path}

Detected syntax/build issues:
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
${file.content}
\`\`\``;
}

function extractPathsFromErrorContext(errorContext?: string) {
  if (!errorContext) {
    return [];
  }

  const matches = errorContext.match(/(?:\.\/)?src\/[^\s\]]+\.(?:tsx?|jsx?)/g) ?? [];
  return matches.map((match) => match.replace(/^\.\//, ''));
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

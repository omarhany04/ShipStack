import 'server-only';

import ts from 'typescript';
import { aiLogger } from '@/ai/logger';
import { aiOrchestrator } from '@/ai/orchestrator';
import { AITask } from '@/ai/types';
import { type ValidationIssue, validateGeneratedFiles } from '@/builder/file-writer';
import { getGeneratedPageFilePath, normalizeGeneratedRoute } from '@/lib/generated-route';
import { Blueprint } from '@/validators/blueprint.validator';
import { selectStableDesignProfile } from './design-system';
import { generateBackendFiles } from './templates/backend';
import { generateConfigFiles } from './templates/config';
import { generateDatabaseFiles } from './templates/database';
import { generateFrontendFiles } from './templates/frontend';
import { generateStyleFiles } from './templates/styles';
import { GeneratedFile } from './types';

const REPAIRABLE_FILE_PATTERN = /\.(?:[cm]?[jt]sx?)$/i;
const DEFAULT_MAX_REPAIR_FILES_PER_PASS = 4;
const DEFAULT_MAX_REPAIR_PASSES = 3;
const AGGRESSIVE_MAX_REPAIR_FILES_PER_PASS = 8;
const AGGRESSIVE_MAX_REPAIR_PASSES = 5;

export interface FileSyntaxIssue {
  path: string;
  message: string;
  code: number;
  line: number;
  column: number;
}

export interface ProjectRepairOptions {
  aggressive?: boolean;
}

export interface ProjectRepairResult {
  files: GeneratedFile[];
  warnings: string[];
  repairedPaths: string[];
  unresolvedIssues: FileSyntaxIssue[];
  unresolvedValidationIssues: ValidationIssue[];
}

export async function repairGeneratedProject(
  files: GeneratedFile[],
  blueprint: Blueprint,
  errorContext?: string,
  options: ProjectRepairOptions = {}
): Promise<ProjectRepairResult> {
  const warnings = new Set<string>();
  const repairedPaths = new Set<string>();
  const maxRepairFilesPerPass = options.aggressive
    ? AGGRESSIVE_MAX_REPAIR_FILES_PER_PASS
    : DEFAULT_MAX_REPAIR_FILES_PER_PASS;
  const maxRepairPasses = options.aggressive ? AGGRESSIVE_MAX_REPAIR_PASSES : DEFAULT_MAX_REPAIR_PASSES;

  let workingFiles = dedupeFiles(files);
  let syntaxIssues = collectSyntaxIssues(workingFiles);
  let validationIssues = collectRepairValidationIssues(workingFiles);

  for (let pass = 1; pass <= maxRepairPasses; pass += 1) {
    const targetPaths = pickRepairTargets(
      workingFiles,
      syntaxIssues,
      validationIssues,
      errorContext,
      blueprint,
      maxRepairFilesPerPass
    );
    if (targetPaths.length === 0) {
      break;
    }

    let passRepaired = false;

    for (const targetPath of targetPaths) {
      const targetFile = workingFiles.find((file) => file.path === targetPath);
      const fileIssues = syntaxIssues.filter((issue) => issue.path === targetPath);
      const fileValidationIssues = validationIssues.filter((issue) => issue.file === targetPath);

      if (!targetFile) {
        const createdFile = await buildMissingRepairFile(targetPath, blueprint, fileValidationIssues, errorContext);
        if (!createdFile) {
          continue;
        }

        workingFiles = dedupeFiles([...workingFiles, createdFile]);
        repairedPaths.add(targetPath);
        passRepaired = true;
        continue;
      }

      let repairedContent =
        fileIssues.length > 0 || fileValidationIssues.length > 0
          ? attemptLocalRepair(targetFile, blueprint, fileIssues, fileValidationIssues, errorContext)
          : null;

      if (!repairedContent) {
        repairedContent = await repairSingleFile(
          targetFile,
          blueprint,
          fileIssues,
          fileValidationIssues,
          errorContext
        );
      }

      if (!repairedContent || repairedContent.trim() === targetFile.content.trim()) {
        continue;
      }

      const remainingIssues = collectFileSyntaxIssues(targetPath, repairedContent);
      if (remainingIssues.length > 0) {
        warnings.add(
          `Automatic repair produced remaining syntax issues in ${targetPath}; keeping the previous version.`
        );
        continue;
      }

      workingFiles = upsertGeneratedFile(workingFiles, {
        ...targetFile,
        content: repairedContent,
        source: targetFile.source === 'ai' ? 'ai' : 'hybrid',
      });
      repairedPaths.add(targetPath);
      passRepaired = true;
    }

    syntaxIssues = collectSyntaxIssues(workingFiles);
    validationIssues = collectRepairValidationIssues(workingFiles);

    if (!passRepaired) {
      break;
    }
  }

  if (repairedPaths.size > 0) {
    warnings.add(
      `Automatically repaired ${repairedPaths.size} generated file${
        repairedPaths.size === 1 ? '' : 's'
      } before preview.`
    );
  }

  if (syntaxIssues.length > 0) {
    warnings.add(
      `Some generated files still have syntax issues: ${uniquePathsFromSyntaxIssues(syntaxIssues)
        .slice(0, 4)
        .join(', ')}`
    );
  }

  if (validationIssues.length > 0) {
    warnings.add(
      `Some generated files still have validation issues: ${uniquePathsFromValidationIssues(validationIssues)
        .slice(0, 4)
        .join(', ')}`
    );
  }

  return {
    files: workingFiles,
    warnings: [...warnings],
    repairedPaths: [...repairedPaths],
    unresolvedIssues: syntaxIssues,
    unresolvedValidationIssues: validationIssues,
  };
}

export function collectSyntaxIssues(files: GeneratedFile[]) {
  return files.flatMap((file) => collectFileSyntaxIssues(file.path, file.content));
}

function collectRepairValidationIssues(files: GeneratedFile[]) {
  return validateGeneratedFiles(files).filter((issue) => issue.severity === 'error');
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
  validationIssues: ValidationIssue[],
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
    originalIssues: [
      ...issues.map((issue) => issue.message),
      ...validationIssues.map((issue) => issue.message),
    ].slice(0, 4),
    hadErrorContext: Boolean(errorContext),
  });
  return fallbackContent;
}

function pickRepairTargets(
  files: GeneratedFile[],
  syntaxIssues: FileSyntaxIssue[],
  validationIssues: ValidationIssue[],
  errorContext: string | undefined,
  blueprint: Blueprint,
  maxTargets: number
) {
  const filePaths = new Set(files.map((file) => file.path));
  const candidateScores = new Map<string, number>();

  const addCandidate = (path: string | null | undefined, bonus = 0) => {
    if (!path) {
      return;
    }

    const nextScore = scoreRepairPath(path, errorContext) + bonus;
    const previousScore = candidateScores.get(path);
    if (previousScore === undefined || nextScore > previousScore) {
      candidateScores.set(path, nextScore);
    }
  };

  for (const path of extractPathsFromErrorContext(errorContext)) {
    addCandidate(path, filePaths.has(path) ? 180 : 120);
  }

  for (const issue of syntaxIssues) {
    addCandidate(issue.path, 160);
  }

  for (const issue of validationIssues) {
    addCandidate(issue.file, 140);
    for (const relatedPath of deriveRepairPathsFromValidationIssue(issue, blueprint)) {
      addCandidate(relatedPath, filePaths.has(relatedPath) ? 120 : 105);
    }
  }

  return [...candidateScores.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, maxTargets)
    .map(([path]) => path);
}

async function buildMissingRepairFile(
  path: string,
  blueprint: Blueprint,
  validationIssues: ValidationIssue[],
  errorContext?: string
): Promise<GeneratedFile | null> {
  const fallbackContent = buildTemplateFallback(path, blueprint);
  if (fallbackContent) {
    return {
      path,
      content: fallbackContent,
      source: 'template',
      description: `Fallback repair for ${path}`,
    };
  }

  const repairedContent = await repairMissingFile(path, blueprint, validationIssues, errorContext);
  if (!repairedContent) {
    return null;
  }

  const remainingIssues = collectFileSyntaxIssues(path, repairedContent);
  if (remainingIssues.length > 0) {
    aiLogger.warn('Automatic missing-file repair returned syntax errors', undefined, AITask.CODE_FIX, {
      file: path,
      remainingIssues: remainingIssues.slice(0, 3).map((issue) => issue.message),
    });
    return null;
  }

  return {
    path,
    content: repairedContent,
    source: 'hybrid',
    description: `AI repair for missing ${path}`,
  };
}

async function repairMissingFile(
  path: string,
  blueprint: Blueprint,
  validationIssues: ValidationIssue[],
  errorContext?: string
) {
  try {
    const response = await aiOrchestrator.execute({
      task: AITask.CODE_FIX,
      prompt: buildMissingFileRepairPrompt(path, blueprint, validationIssues, errorContext),
      systemPrompt:
        'You create missing Next.js App Router files needed to repair a generated project. Return ONLY the complete file content with no markdown fences or explanation.',
      temperature: 0.2,
      maxTokens: 4096,
      expectJson: false,
    });

    return response.raw?.trim() || null;
  } catch (error) {
    aiLogger.warn('Automatic missing-file repair failed', undefined, AITask.CODE_FIX, {
      file: path,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

async function repairSingleFile(
  file: GeneratedFile,
  blueprint: Blueprint,
  issues: FileSyntaxIssue[],
  validationIssues: ValidationIssue[],
  errorContext?: string
) {
  try {
    const response = await aiOrchestrator.execute({
      task: AITask.CODE_FIX,
      prompt: buildRepairPrompt(file, blueprint, issues, validationIssues, errorContext),
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
  validationIssues: ValidationIssue[],
  errorContext?: string
) {
  const issueText =
    issues.length > 0
      ? issues.map((issue) => `- ${issue.path}:${issue.line}:${issue.column} ${issue.message}`).join('\n')
      : '- Parser diagnostics were not available for this file.';
  const validationText =
    validationIssues.length > 0
      ? validationIssues.slice(0, 6).map((issue) => `- ${issue.message}`).join('\n')
      : '- No static validation issues were captured for this file.';
  const runtimeContext = summarizeErrorContext(errorContext, file.path);
  const runtimeText = runtimeContext
    ? `\nPreview/build error context:\n${runtimeContext}\n`
    : '';
  const projectSummary = [blueprint.projectName, blueprint.description]
    .filter(Boolean)
    .join(' - ')
    .slice(0, 220);

  return `Fix this generated Next.js file so it builds successfully and behaves correctly.

Project: ${projectSummary}

Target file: ${file.path}

Syntax issues:
${issueText}

Static validation issues:
${validationText}
${runtimeText}
Rules:
- Return the full corrected file content only.
- Preserve the page's intent, layout, and styling as much as possible.
- Fix malformed JSX, missing braces or parentheses, broken props, broken imports, and bad exports.
- Fix runtime, routing, interaction, hydration, and client/server boundary issues when they appear in the error context.
- If an internal import points to a missing module, replace it with a simple local implementation or a sturdy existing alternative.
- Prefer sturdy, boring implementations over clever ones if that is what makes the page fully functional.
- Do not add new dependencies.
- Keep imports compatible with a default Next.js App Router project.

Current file:
\`\`\`
${compactPromptSource(file.content)}
\`\`\``;
}

function buildMissingFileRepairPrompt(
  path: string,
  blueprint: Blueprint,
  validationIssues: ValidationIssue[],
  errorContext?: string
) {
  const projectSummary = [blueprint.projectName, blueprint.description]
    .filter(Boolean)
    .join(' - ')
    .slice(0, 220);
  const routeHints = blueprint.pages
    .slice(0, 8)
    .map((page) => `- ${page.name}: ${normalizeGeneratedRoute(page.route)}`)
    .join('\n');
  const validationText =
    validationIssues.length > 0
      ? validationIssues.slice(0, 6).map((issue) => `- ${issue.message}`).join('\n')
      : '- The project reported a missing file for this path.';
  const runtimeContext = summarizeErrorContext(errorContext, path);
  const runtimeText = runtimeContext
    ? `\nPreview/build error context:\n${runtimeContext}\n`
    : '';

  return `Create the missing Next.js App Router file needed to repair a generated project.

Project: ${projectSummary}

Missing file: ${path}

Known project routes:
${routeHints || '- /'}

Static validation issues:
${validationText}
${runtimeText}
Rules:
- Return the full file content only.
- Keep the implementation minimal, modern, and reliable.
- If this is a page file, export a usable default React component.
- If this is an API route file, export the correct App Router handlers.
- If this is a component or lib file, provide stable named exports that avoid breaking imports.
- Do not add new dependencies.
- Keep imports compatible with a default Next.js App Router project.`;
}

function extractPathsFromErrorContext(errorContext?: string) {
  if (!errorContext) {
    return [];
  }

  const matches = errorContext.match(/(?:\.\/)?src\/[^\s\]]+\.(?:tsx?|jsx?)/g) ?? [];
  return matches.map((match) => match.replace(/^\.\//, ''));
}

function deriveRepairPathsFromValidationIssue(issue: ValidationIssue, blueprint: Blueprint) {
  const paths = new Set<string>();
  paths.add(issue.file);

  const missingImportSpecifier = extractMissingImportSpecifier(issue.message);
  if (missingImportSpecifier) {
    for (const candidate of resolveAliasCandidates(missingImportSpecifier)) {
      paths.add(candidate);
    }
  }

  const missingRoute = extractReferencedRoute(issue.message);
  if (missingRoute && blueprint.pages.some((page) => normalizeGeneratedRoute(page.route) === missingRoute)) {
    paths.add(getGeneratedPageFilePath(missingRoute));
  }

  return [...paths];
}

function extractMissingImportSpecifier(message: string) {
  const match = message.match(/^Local import could not be resolved: (@\/[^\s]+)$/);
  return match?.[1] ?? null;
}

function extractReferencedRoute(message: string) {
  const match = message.match(
    /(?:Referenced (?:href|action|fetch|navigation) path does not exist in generated output|Direct (?:href|action|fetch|navigation) reference uses an unresolved dynamic path): (\/[^\s]+)/
  );
  return match ? normalizeGeneratedRoute(match[1]) : null;
}

function resolveAliasCandidates(specifier: string) {
  const basePath = `src/${specifier.slice(2)}`;

  if (/\.[a-z]+$/i.test(basePath)) {
    return [basePath];
  }

  return [
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    `${basePath}/index.ts`,
    `${basePath}/index.tsx`,
    `${basePath}/index.js`,
    `${basePath}/index.jsx`,
  ];
}

function buildTemplateFallback(path: string, blueprint: Blueprint) {
  const designProfile = selectStableDesignProfile(blueprint);
  const fallbacks = [
    ...generateConfigFiles(blueprint),
    ...generateDatabaseFiles(blueprint),
    ...generateBackendFiles(blueprint),
    ...generateFrontendFiles(blueprint, designProfile),
    ...generateStyleFiles(blueprint, designProfile),
  ];

  return fallbacks.find((file) => file.path === path)?.content ?? null;
}

function summarizeErrorContext(errorContext: string | undefined, targetPath: string) {
  if (!errorContext) {
    return '';
  }

  const lines = errorContext
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const focused = lines.filter(
    (line) =>
      line.includes(targetPath) ||
      /unexpected token|syntax error|failed to compile|build error|runtime error|referenceerror|typeerror|hydration|module not found|cannot resolve|nonerroremittederror|expression expected|cannot read|is not defined|is not a function/i.test(
        line
      )
  );
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
    score += 95;
  } else if (path === 'src/app/layout.tsx') {
    score += 88;
  } else if (path.startsWith('src/app/api/')) {
    score += 82;
  } else if (path.startsWith('src/app/')) {
    score += 74;
  } else if (path.startsWith('src/components/')) {
    score += 58;
  } else if (path.startsWith('src/lib/')) {
    score += 46;
  } else if (path.startsWith('prisma/')) {
    score += 32;
  } else if (path.startsWith('src/')) {
    score += 24;
  } else {
    score += 8;
  }

  if (/\.(tsx|jsx)$/.test(path)) {
    score += 18;
  }

  if (/\/page\.(tsx|jsx)$/.test(path)) {
    score += 14;
  }

  if (/\/route\.(ts|js)$/.test(path)) {
    score += 14;
  }

  return score;
}

function upsertGeneratedFile(files: GeneratedFile[], nextFile: GeneratedFile) {
  const existingIndex = files.findIndex((file) => file.path === nextFile.path);
  if (existingIndex === -1) {
    return [...files, nextFile];
  }

  return files.map((file, index) =>
    index === existingIndex
      ? {
          ...file,
          ...nextFile,
          description: nextFile.description ?? file.description,
        }
      : file
  );
}

function dedupeFiles(files: GeneratedFile[]) {
  const deduped = new Map<string, GeneratedFile>();
  for (const file of files) {
    deduped.set(file.path, file);
  }
  return [...deduped.values()];
}

function uniquePathsFromSyntaxIssues(issues: FileSyntaxIssue[]) {
  return [...new Set(issues.map((issue) => issue.path))];
}

function uniquePathsFromValidationIssues(issues: ValidationIssue[]) {
  return [...new Set(issues.map((issue) => issue.file))];
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

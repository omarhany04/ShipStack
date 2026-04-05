import { aiLogger } from '@/ai/logger';
import { GeneratedFile, GenerationResult } from '@/generator/types';
import {
  buildDisplayTree,
  buildFileSystemTree,
  buildFlatFileMap,
  FileSystemTree,
  FlatFileMap,
  prepareGeneratedFiles,
  TreeNode,
  validateGeneratedFiles,
  ValidationIssue,
} from './file-writer';

export interface ProjectMetadata {
  projectName: string;
  totalFiles: number;
  totalSizeBytes: number;
  buildTimestamp: number;
  generationStats: GenerationResult['stats'] | null;
}

export interface ProjectBuildResult {
  success: boolean;
  fileSystemTree: FileSystemTree;
  flatFiles: FlatFileMap;
  displayTree: TreeNode;
  files: GeneratedFile[];
  validationIssues: ValidationIssue[];
  metadata: ProjectMetadata;
}

export function buildProject(
  generationResult: GenerationResult,
  projectName: string
): ProjectBuildResult {
  const files = prepareGeneratedFiles(generationResult.files, projectName);

  const validationIssues = validateGeneratedFiles(files);
  const hasErrors = validationIssues.some((issue) => issue.severity === 'error');
  const fileSystemTree = buildFileSystemTree(files);
  const flatFiles = buildFlatFileMap(files);
  const displayTree = buildDisplayTree(files);
  const totalSizeBytes = files.reduce(
    (total, file) => total + new TextEncoder().encode(file.content).length,
    0
  );

  aiLogger.info('Project built', undefined, undefined, {
    projectName,
    totalFiles: files.length,
    totalSizeBytes,
    validationErrors: validationIssues.filter((issue) => issue.severity === 'error').length,
  });

  return {
    success: !hasErrors,
    fileSystemTree,
    flatFiles,
    displayTree,
    files,
    validationIssues,
    metadata: {
      projectName,
      totalFiles: files.length,
      totalSizeBytes,
      buildTimestamp: Date.now(),
      generationStats: generationResult.stats,
    },
  };
}

import { aiLogger } from '@/ai/logger';
import { prepareGeneratedFiles } from '@/builder/file-writer';
import { selectDesignProfile, summarizeDesignProfile } from './design-system';
import { repairGeneratedProject } from './project-repair';
import { Blueprint } from '@/validators/blueprint.validator';
import { enhanceWithAI } from './ai-enhancer';
import { generateConfigFiles } from './templates/config';
import { generateDatabaseFiles } from './templates/database';
import { generateFrontendFiles } from './templates/frontend';
import { generateBackendFiles } from './templates/backend';
import { generateStyleFiles } from './templates/styles';
import {
  GeneratedFile,
  GenerationResult,
  GenerationStage,
  GenerationStats,
  ProgressCallback,
} from './types';

interface PipelineStage {
  name: GenerationStage;
  label: string;
  execute: (blueprint: Blueprint) => GeneratedFile[] | Promise<GeneratedFile[]>;
}

export async function generateFullProject(
  blueprint: Blueprint,
  options: {
    enableAI?: boolean;
    onProgress?: ProgressCallback;
  } = {}
): Promise<GenerationResult> {
  const { enableAI = true, onProgress } = options;
  const startedAt = Date.now();
  const allFiles: GeneratedFile[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const stageTimings: Record<string, number> = {};
  const generatedPaths = new Set<string>();

  const designProfile = selectDesignProfile(blueprint);

  aiLogger.info('Selected generated design profile', undefined, undefined, {
    designProfile: designProfile.id,
    designSummary: summarizeDesignProfile(designProfile),
  });

  const frontendFiles = generateFrontendFiles(blueprint, designProfile);
  const backendFiles = generateBackendFiles(blueprint);

  const stages: PipelineStage[] = [
    {
      name: GenerationStage.CONFIG,
      label: 'Generating configuration files',
      execute: generateConfigFiles,
    },
    {
      name: GenerationStage.DATABASE,
      label: 'Generating database layer',
      execute: generateDatabaseFiles,
    },
    {
      name: GenerationStage.STYLES,
      label: 'Generating styles',
      execute: () => generateStyleFiles(blueprint, designProfile),
    },
    {
      name: GenerationStage.FRONTEND_LAYOUT,
      label: 'Generating layout, navigation, and types',
      execute: () =>
        frontendFiles.filter(
          (file) =>
            file.path === 'src/app/layout.tsx' ||
            file.path === 'src/components/Navigation.tsx' ||
            file.path === 'src/types/index.ts'
        ),
    },
    {
      name: GenerationStage.FRONTEND_PAGES,
      label: 'Generating pages',
      execute: () => frontendFiles.filter((file) => file.path.includes('/app/') && file.path.endsWith('page.tsx')),
    },
    {
      name: GenerationStage.FRONTEND_COMPONENTS,
      label: 'Generating shared UI components',
      execute: () =>
        frontendFiles.filter(
          (file) => file.path.startsWith('src/components/') && file.path !== 'src/components/Navigation.tsx'
        ),
    },
    {
      name: GenerationStage.BACKEND_API,
      label: 'Generating API routes',
      execute: () => backendFiles.filter((file) => file.path.includes('/api/') || file.path.includes('api-helpers')),
    },
    {
      name: GenerationStage.BACKEND_LIB,
      label: 'Generating backend support files',
      execute: () => backendFiles.filter((file) => file.path.startsWith('src/lib/') && !file.path.includes('api-helpers')),
    },
  ];

  const totalStages = stages.length + (enableAI ? 1 : 0);
  let stageIndex = 0;

  for (const stage of stages) {
    stageIndex += 1;
    const stageStartedAt = Date.now();
    onProgress?.({
      stage: stage.name,
      stageIndex,
      totalStages,
      filesGenerated: allFiles.length,
      message: stage.label,
    });

    try {
      const files = await stage.execute(blueprint);
      for (const file of files) {
        if (!generatedPaths.has(file.path)) {
          generatedPaths.add(file.path);
          allFiles.push(file);
        }
      }
    } catch (error) {
      errors.push(
        `Stage ${stage.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      stageTimings[stage.name] = Date.now() - stageStartedAt;
    }
  }

  if (enableAI) {
    stageIndex += 1;
    const stageStartedAt = Date.now();
    onProgress?.({
      stage: GenerationStage.AI_ENHANCEMENT,
      stageIndex,
      totalStages,
      filesGenerated: allFiles.length,
      message: 'Enhancing with AI',
    });

    try {
        const result = await enhanceWithAI(allFiles, blueprint, designProfile);
        allFiles.length = 0;
        allFiles.push(...result.enhanced);
        warnings.push(...result.warnings);
    } catch (error) {
      warnings.push(
        `AI enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      stageTimings[GenerationStage.AI_ENHANCEMENT] = Date.now() - stageStartedAt;
    }
  }

  onProgress?.({
    stage: GenerationStage.COMPLETE,
    stageIndex: totalStages,
    totalStages,
    filesGenerated: allFiles.length,
    message: 'Generation complete',
  });

  let preparedFiles = prepareGeneratedFiles(allFiles, blueprint);
  const repairResult = await repairGeneratedProject(preparedFiles, blueprint);
  if (repairResult.repairedPaths.length > 0) {
    preparedFiles = prepareGeneratedFiles(repairResult.files, blueprint);
  } else {
    preparedFiles = repairResult.files;
  }
  warnings.push(...repairResult.warnings);
  const stats = computeStats(preparedFiles, startedAt, stageTimings);
  aiLogger.info('Project generation complete', undefined, undefined, {
    totalFiles: stats.totalFiles,
    totalSizeBytes: stats.totalSizeBytes,
    totalLatencyMs: stats.totalLatencyMs,
  });

  return {
    success: errors.length === 0,
    files: preparedFiles,
    stats,
    warnings,
    errors,
  };
}

function computeStats(
  files: GeneratedFile[],
  startedAt: number,
  stageTimings: Record<string, number>
): GenerationStats {
  let totalSizeBytes = 0;
  let templateGenerated = 0;
  let aiGenerated = 0;
  let hybridGenerated = 0;

  for (const file of files) {
    totalSizeBytes += new TextEncoder().encode(file.content).length;
    if (file.source === 'template') {
      templateGenerated += 1;
    } else if (file.source === 'ai') {
      aiGenerated += 1;
    } else {
      hybridGenerated += 1;
    }
  }

  return {
    totalFiles: files.length,
    templateGenerated,
    aiGenerated,
    hybridGenerated,
    totalSizeBytes,
    totalLatencyMs: Date.now() - startedAt,
    stages: stageTimings,
  };
}

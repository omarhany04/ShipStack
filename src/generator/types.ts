import { Blueprint } from '@/validators/blueprint.validator';

export interface GeneratedFile {
  path: string;
  content: string;
  source: 'template' | 'ai' | 'hybrid';
  description?: string;
}

export interface GenerationContext {
  blueprint: Blueprint;
  projectRoot: string;
  files: GeneratedFile[];
  warnings: string[];
  currentStage: GenerationStage;
}

export enum GenerationStage {
  CONFIG = 'config',
  DATABASE = 'database',
  FRONTEND_LAYOUT = 'frontend_layout',
  FRONTEND_PAGES = 'frontend_pages',
  FRONTEND_COMPONENTS = 'frontend_components',
  BACKEND_API = 'backend_api',
  BACKEND_LIB = 'backend_lib',
  STYLES = 'styles',
  AI_ENHANCEMENT = 'ai_enhancement',
  COMPLETE = 'complete',
}

export interface GenerationResult {
  success: boolean;
  files: GeneratedFile[];
  stats: GenerationStats;
  warnings: string[];
  errors: string[];
}

export interface GenerationStats {
  totalFiles: number;
  templateGenerated: number;
  aiGenerated: number;
  hybridGenerated: number;
  totalSizeBytes: number;
  totalLatencyMs: number;
  stages: Record<string, number>;
}

export interface GenerationProgress {
  stage: GenerationStage;
  stageIndex: number;
  totalStages: number;
  filesGenerated: number;
  message: string;
}

export type ProgressCallback = (progress: GenerationProgress) => void;

export interface PrismaFieldDef {
  name: string;
  prismaType: string;
  attributes: string[];
}

export interface PrismaModelDef {
  name: string;
  fields: PrismaFieldDef[];
}

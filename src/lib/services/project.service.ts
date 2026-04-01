import { Prisma, Project } from '@prisma/client';
import { aiLogger } from '@/ai/logger';
import { GenerationResult } from '@/generator/types';
import prisma from '@/lib/prisma';
import { Blueprint as BlueprintType } from '@/validators/blueprint.validator';

export interface CreateProjectInput {
  userId: string;
  userPrompt: string;
  name: string;
  displayName: string;
  description: string;
}

export interface SaveGenerationInput {
  projectId: string;
  blueprint: BlueprintType;
  generationResult: GenerationResult;
  provider: string;
}

export interface ProjectWithDetails {
  project: Project;
  blueprint: BlueprintType | null;
  files: Array<{ path: string; content: string; source: string }> | null;
}

export class ProjectService {
  static async create(input: CreateProjectInput) {
    const project = await prisma.project.create({
      data: {
        userId: input.userId,
        userPrompt: input.userPrompt,
        name: input.name,
        displayName: input.displayName,
        description: input.description,
        status: 'GENERATING',
      },
    });

    aiLogger.info('Project created', undefined, undefined, { projectId: project.id });
    return project;
  }

  static async saveGeneration(input: SaveGenerationInput) {
    const { projectId, blueprint, generationResult } = input;

    await prisma.$transaction(async (transaction) => {
      await transaction.blueprint.upsert({
        where: { projectId },
        create: {
          projectId,
          data: blueprint as unknown as Prisma.JsonObject,
          featureCount: blueprint.features.length,
          modelCount: blueprint.dataModels.length,
          endpointCount: blueprint.apiEndpoints.length,
          pageCount: blueprint.pages.length,
          warnings: generationResult.warnings,
        },
        update: {
          data: blueprint as unknown as Prisma.JsonObject,
          featureCount: blueprint.features.length,
          modelCount: blueprint.dataModels.length,
          endpointCount: blueprint.apiEndpoints.length,
          pageCount: blueprint.pages.length,
          warnings: generationResult.warnings,
        },
      });

      await transaction.generation.create({
        data: {
          projectId,
          files: generationResult.files.map((file) => ({
            path: file.path,
            content: file.content,
            source: file.source,
          })) as unknown as Prisma.JsonArray,
          totalFiles: generationResult.stats.totalFiles,
          templateFiles: generationResult.stats.templateGenerated,
          aiFiles: generationResult.stats.aiGenerated,
          totalSizeBytes: generationResult.stats.totalSizeBytes,
          latencyMs: generationResult.stats.totalLatencyMs,
          providersUsed: [input.provider],
          validationErrors: generationResult.errors.length,
          validationWarnings: generationResult.warnings.length,
          warnings: generationResult.warnings,
        },
      });

      await transaction.project.update({
        where: { id: projectId },
        data: {
          name: blueprint.projectName,
          displayName: blueprint.projectName
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase()),
          description: blueprint.description,
          status: 'GENERATED',
          totalFiles: generationResult.stats.totalFiles,
          totalSizeBytes: generationResult.stats.totalSizeBytes,
          generationTimeMs: generationResult.stats.totalLatencyMs,
        },
      });
    });
  }

  static async markFailed(projectId: string, error: string) {
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'FAILED' },
    });

    aiLogger.warn('Project marked as failed', undefined, undefined, {
      projectId,
      error,
    });
  }

  static async loadWithDetails(projectId: string): Promise<ProjectWithDetails | null> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        blueprint: true,
        generations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!project) {
      return null;
    }

    return {
      project,
      blueprint: project.blueprint?.data as BlueprintType | null,
      files:
        (project.generations[0]?.files as Array<{
          path: string;
          content: string;
          source: string;
        }> | undefined) ?? null,
    };
  }

  static async listForUser(userId: string, page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: { userId },
        include: {
          blueprint: {
            select: {
              featureCount: true,
              modelCount: true,
              pageCount: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.project.count({
        where: { userId },
      }),
    ]);

    return {
      projects,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  static async delete(projectId: string) {
    await prisma.project.delete({
      where: { id: projectId },
    });
  }

  static async archive(projectId: string) {
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'ARCHIVED' },
    });
  }
}

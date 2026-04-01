import { NextRequest, NextResponse } from 'next/server';
import { aiLogger } from '@/ai/logger';
import { aiOrchestrator } from '@/ai/orchestrator';
import { generateBlueprint, refineBlueprint } from '@/generator/blueprint';
import { generateFullProject } from '@/generator/code-generator';
import { validateBlueprint } from '@/validators/blueprint.validator';

let ProjectService: typeof import('@/lib/services/project.service').ProjectService | null = null;
let getCurrentUser: typeof import('@/lib/services/session.service').getCurrentUser | null = null;

async function loadPersistenceModules() {
  try {
    const projectModule = await import('@/lib/services/project.service');
    const sessionModule = await import('@/lib/services/session.service');
    ProjectService = projectModule.ProjectService;
    getCurrentUser = sessionModule.getCurrentUser;
    return true;
  } catch {
    return false;
  }
}

interface GenerateRequest {
  idea?: string;
  enableAI?: boolean;
  blueprint?: unknown;
  modificationPrompt?: string;
  projectId?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();

  try {
    let body: GenerateRequest;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid JSON in request body.', 400, requestId);
    }

    if (
      (!body.idea || typeof body.idea !== 'string') &&
      typeof body.blueprint === 'undefined'
    ) {
      return errorResponse(
        'Provide either an "idea" string or a valid "blueprint" object.',
        400,
        requestId
      );
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'full';
    const persist = searchParams.get('persist') === 'true';
    const hasPersistence = persist ? await loadPersistenceModules() : false;

    let projectId: string | undefined;
    let userId: string | undefined;

    if (hasPersistence && getCurrentUser) {
      try {
        const user = await getCurrentUser();
        userId = user.id;
      } catch {
        return errorResponse('Authentication required.', 401, requestId);
      }
    }

    let blueprintResult:
      | Awaited<ReturnType<typeof generateBlueprint>>
      | Awaited<ReturnType<typeof refineBlueprint>>;

    if (typeof body.blueprint !== 'undefined') {
      const validatedBlueprint = validateBlueprint(body.blueprint);
      if (!validatedBlueprint.isValid || !validatedBlueprint.blueprint) {
        return NextResponse.json(
          {
            success: false,
            requestId,
            error: 'Edited blueprint is invalid.',
            details: validatedBlueprint.errors,
            warnings: validatedBlueprint.warnings,
            stage: 'blueprint_validation',
          },
          { status: 400 }
        );
      }

      blueprintResult = body.modificationPrompt?.trim()
        ? await refineBlueprint(validatedBlueprint.blueprint, body.modificationPrompt)
        : {
            success: true,
            blueprint: validatedBlueprint.blueprint,
            validation: validatedBlueprint,
            metadata: {
              userInput: typeof body.idea === 'string' ? body.idea : 'manual blueprint update',
              sanitizedInput: 'manual blueprint update',
              generationAttempts: 0,
              totalLatencyMs: 0,
              provider: 'manual-editor',
            },
          };
    } else {
      blueprintResult = await generateBlueprint(body.idea);
    }

    if (!blueprintResult.success) {
      if (projectId && ProjectService) {
        await ProjectService.markFailed(projectId, blueprintResult.error);
      }

      return NextResponse.json(
        {
          success: false,
          requestId,
          error: blueprintResult.error,
          details: blueprintResult.details,
          stage: blueprintResult.stage,
        },
        {
          status: blueprintResult.stage === 'input_validation' ? 400 : 502,
        }
      );
    }

    if (hasPersistence && userId && ProjectService) {
      try {
        if (body.projectId) {
          const existingProject = await ProjectService.loadWithDetails(body.projectId);
          if (!existingProject || existingProject.project.userId !== userId) {
            return errorResponse('Project not found.', 404, requestId);
          }
          projectId = existingProject.project.id;
        } else {
          const project = await ProjectService.create({
            userId,
            userPrompt: typeof body.idea === 'string' ? body.idea : blueprintResult.blueprint.description,
            name: blueprintResult.blueprint.projectName,
            displayName: blueprintResult.blueprint.projectName
              .replace(/-/g, ' ')
              .replace(/\b\w/g, (char) => char.toUpperCase()),
            description: blueprintResult.blueprint.description,
          });
          projectId = project.id;
        }
      } catch (error) {
        aiLogger.warn('Failed to create project record', undefined, undefined, {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    if (mode === 'blueprint') {
      return NextResponse.json({
        success: true,
        requestId,
        mode: 'blueprint',
        projectId: projectId ?? null,
        blueprint: blueprintResult.blueprint,
        metadata: blueprintResult.metadata,
      });
    }

    const projectResult = await generateFullProject(blueprintResult.blueprint, {
      enableAI: body.enableAI !== false,
    });

    if (hasPersistence && projectId && ProjectService) {
      try {
        await ProjectService.saveGeneration({
          projectId,
          blueprint: blueprintResult.blueprint,
          generationResult: projectResult,
          provider: blueprintResult.metadata.provider,
        });
      } catch (error) {
        aiLogger.warn('Failed to save project generation', undefined, undefined, {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      requestId,
      mode: 'full',
      projectId: projectId ?? null,
      blueprint: blueprintResult.blueprint,
      project: {
        files: projectResult.files.map((file) => ({
          path: file.path,
          content: file.content,
          source: file.source,
        })),
        stats: projectResult.stats,
        warnings: projectResult.warnings,
        errors: projectResult.errors,
      },
      metadata: {
        ...blueprintResult.metadata,
        generation: {
          totalFiles: projectResult.stats.totalFiles,
          templateGenerated: projectResult.stats.templateGenerated,
          aiGenerated: projectResult.stats.aiGenerated,
          totalSizeBytes: projectResult.stats.totalSizeBytes,
          totalLatencyMs: projectResult.stats.totalLatencyMs,
        },
      },
    });
  } catch (error) {
    aiLogger.error('Unhandled error in generate endpoint', undefined, undefined, {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return errorResponse('Internal server error. Please try again.', 500, requestId);
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    providers: aiOrchestrator.getHealthSnapshot(),
    cache: aiOrchestrator.getCacheStats(),
  });
}

function generateRequestId() {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function errorResponse(error: string, status: number, requestId: string) {
  return NextResponse.json(
    {
      success: false,
      requestId,
      error,
    },
    { status }
  );
}

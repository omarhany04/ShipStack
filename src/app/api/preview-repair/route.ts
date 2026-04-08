import { NextRequest, NextResponse } from 'next/server';
import { aiLogger } from '@/ai/logger';
import { prepareGeneratedFiles } from '@/builder/file-writer';
import { repairGeneratedProject } from '@/generator/project-repair';
import { GeneratedFile } from '@/generator/types';
import { validateBlueprint } from '@/validators/blueprint.validator';

export const dynamic = 'force-dynamic';

interface PreviewRepairRequest {
  files?: Array<{
    path: string;
    content: string;
    source?: string;
  }>;
  blueprint?: unknown;
  logs?: string[];
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let body: PreviewRepairRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON in request body.' }, { status: 400 });
    }

    if (!Array.isArray(body.files) || body.files.length === 0) {
      return NextResponse.json({ success: false, error: 'Missing generated files.' }, { status: 400 });
    }

    const validatedBlueprint = validateBlueprint(body.blueprint);
    if (!validatedBlueprint.isValid || !validatedBlueprint.blueprint) {
      return NextResponse.json(
        {
          success: false,
          error: 'Blueprint is required for preview repair.',
          details: validatedBlueprint.errors,
        },
        { status: 400 }
      );
    }

    const files: GeneratedFile[] = body.files.map((file) => ({
      path: file.path,
      content: file.content,
      source: normalizeSource(file.source),
    }));
    const errorContext = [body.error, ...(Array.isArray(body.logs) ? body.logs.slice(-60) : [])]
      .filter(Boolean)
      .join('\n');

    const repairResult = await repairGeneratedProject(files, validatedBlueprint.blueprint, errorContext);
    const preparedFiles = prepareGeneratedFiles(repairResult.files, validatedBlueprint.blueprint);

    return NextResponse.json({
      success: true,
      repaired: repairResult.repairedPaths.length > 0,
      repairedPaths: repairResult.repairedPaths,
      warnings: repairResult.warnings,
      files: preparedFiles.map((file) => ({
        path: file.path,
        content: file.content,
        source: file.source,
      })),
      unresolvedIssues: repairResult.unresolvedIssues,
    });
  } catch (error) {
    aiLogger.error('Preview repair failed', undefined, undefined, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Preview repair failed.',
      },
      { status: 500 }
    );
  }
}

function normalizeSource(source?: string): GeneratedFile['source'] {
  if (source === 'ai' || source === 'hybrid') {
    return source;
  }

  return 'template';
}

import { NextRequest, NextResponse } from 'next/server';
import { buildFileSystemTree, validateGeneratedFiles } from '@/builder/file-writer';
import { GeneratedFile } from '@/generator/types';
import { aiLogger } from '@/ai/logger';

interface PreviewRequest {
  files: Array<{
    path: string;
    content: string;
    source: string;
  }>;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let body: PreviewRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON in request body.' }, { status: 400 });
    }

    if (!body.files || !Array.isArray(body.files) || body.files.length === 0) {
      return NextResponse.json({ success: false, error: 'Missing or empty files array.' }, { status: 400 });
    }

    const files: GeneratedFile[] = body.files.map((file) => ({
      path: file.path,
      content: file.content,
      source: (file.source as 'template' | 'ai' | 'hybrid') || 'template',
    }));

    const issues = validateGeneratedFiles(files);
    const errors = issues.filter((issue) => issue.severity === 'error');
    const fileSystemTree = buildFileSystemTree(files);

    aiLogger.info('Preview tree built', undefined, undefined, {
      fileCount: files.length,
      errorCount: errors.length,
    });

    return NextResponse.json({
      success: true,
      fileSystemTree,
      validation: {
        errors: errors.length,
        warnings: issues.filter((issue) => issue.severity === 'warning').length,
        issues,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to build preview: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}

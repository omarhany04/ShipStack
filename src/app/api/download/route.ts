import { NextRequest, NextResponse } from 'next/server';
import { generateZipResponse } from '@/builder/zip-builder';
import { aiLogger } from '@/ai/logger';

interface DownloadRequest {
  projectName: string;
  files: Record<string, string>;
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    let body: DownloadRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON in request body.' }, { status: 400 });
    }

    if (!body.projectName || typeof body.projectName !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing required field: projectName.' }, { status: 400 });
    }

    if (!body.files || typeof body.files !== 'object' || Object.keys(body.files).length === 0) {
      return NextResponse.json({ success: false, error: 'Missing or empty files object.' }, { status: 400 });
    }

    const safeName = body.projectName
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 100);

    aiLogger.info('Download requested', undefined, undefined, {
      projectName: safeName,
      fileCount: Object.keys(body.files).length,
    });

    return generateZipResponse(body.files, safeName);
  } catch (error) {
    aiLogger.error('Download failed', undefined, undefined, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ success: false, error: 'Failed to generate download.' }, { status: 500 });
  }
}

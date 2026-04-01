import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/lib/services/project.service';
import { getCurrentUser } from '@/lib/services/session.service';

interface RouteParams {
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    const result = await ProjectService.loadWithDetails(params.id);

    if (!result || result.project.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Project not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      project: result.project,
      blueprint: result.blueprint,
      files: result.files,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: `Failed to load project: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    const result = await ProjectService.loadWithDetails(params.id);

    if (!result || result.project.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Project not found.' }, { status: 404 });
    }

    await ProjectService.delete(params.id);
    return NextResponse.json({ success: true, message: 'Project deleted.' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: `Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}

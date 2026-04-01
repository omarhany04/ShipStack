import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/session.service';
import { ProjectService } from '@/lib/services/project.service';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Math.min(Number.parseInt(searchParams.get('pageSize') || '10', 10), 50);
    const result = await ProjectService.listForUser(user.id, page, pageSize);

    return NextResponse.json({
      success: true,
      data: result.projects,
      pagination: {
        page,
        pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required.',
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: `Failed to load projects: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}

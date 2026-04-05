import { NextRequest, NextResponse } from 'next/server';
import { aiOrchestrator } from '@/ai/orchestrator';
import { UsageService } from '@/lib/services/usage.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const hours = Number.parseInt(searchParams.get('hours') || '24', 10);

    const [usage, recentErrors] = await Promise.all([
      UsageService.getStats(Math.min(hours, 168)),
      UsageService.getRecentErrors(10),
    ]);

    return NextResponse.json({
      success: true,
      period: `${hours}h`,
      usage,
      providers: aiOrchestrator.getHealthSnapshot(),
      cache: aiOrchestrator.getCacheStats(),
      recentErrors,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch usage stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}

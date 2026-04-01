import { NextResponse } from 'next/server';
import { aiLogger } from '@/ai/logger';
import { aiOrchestrator } from '@/ai/orchestrator';

export async function GET(): Promise<NextResponse> {
  const healthSnapshot = aiOrchestrator.getHealthSnapshot();
  const cacheStats = aiOrchestrator.getCacheStats();
  const recentErrors = aiLogger.getRecentLogs(20).filter((log) => log.level === 'error');
  const allHealthy = healthSnapshot.every((provider) => provider.isAvailable);

  return NextResponse.json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: Date.now(),
    providers: healthSnapshot.map((provider) => ({
      name: provider.provider,
      available: provider.isAvailable,
      consecutiveFailures: provider.consecutiveFailures,
      totalRequests: provider.totalRequests,
      totalFailures: provider.totalFailures,
      cooldownRemaining: provider.disabledUntil ? Math.max(0, provider.disabledUntil - Date.now()) : 0,
      lastError: provider.lastError,
    })),
    cache: cacheStats,
    recentErrors: recentErrors.map((entry) => ({
      timestamp: entry.timestamp,
      provider: entry.provider,
      message: entry.message,
    })),
  });
}

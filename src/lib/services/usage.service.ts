import { AIProviderError, AIResponse, AITask } from '@/ai/types';
import prisma from '@/lib/prisma';

export class UsageService {
  static async logSuccess(input: {
    provider: string;
    task: string;
    latencyMs: number;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    fromCache: boolean;
    userId?: string;
  }) {
    try {
      await prisma.usageLog.create({
        data: {
          provider: input.provider,
          task: input.task,
          success: true,
          latencyMs: input.latencyMs,
          promptTokens: input.promptTokens ?? null,
          completionTokens: input.completionTokens ?? null,
          totalTokens: input.totalTokens ?? null,
          fromCache: input.fromCache,
          userId: input.userId ?? null,
        },
      });
    } catch {}
  }

  static async logFailure(input: {
    provider: string;
    task: string;
    latencyMs: number;
    errorMessage: string;
    errorCode?: number;
    isQuotaError: boolean;
    isRateLimitError: boolean;
    userId?: string;
  }) {
    try {
      await prisma.usageLog.create({
        data: {
          provider: input.provider,
          task: input.task,
          success: false,
          latencyMs: input.latencyMs,
          errorMessage: input.errorMessage,
          errorCode: input.errorCode ?? null,
          isQuotaError: input.isQuotaError,
          isRateLimitError: input.isRateLimitError,
          fromCache: false,
          userId: input.userId ?? null,
        },
      });
    } catch {}
  }

  static async logFromResponse(response: AIResponse, userId?: string) {
    return this.logSuccess({
      provider: response.provider,
      task: response.task,
      latencyMs: response.latencyMs,
      fromCache: response.fromCache,
      userId,
    });
  }

  static async logFromError(
    error: AIProviderError,
    task: AITask,
    latencyMs: number,
    userId?: string
  ) {
    return this.logFailure({
      provider: error.provider,
      task,
      latencyMs,
      errorMessage: error.message,
      errorCode: error.statusCode ?? undefined,
      isQuotaError: error.isQuotaError,
      isRateLimitError: error.isRateLimitError,
      userId,
    });
  }

  static async getStats(sinceHours = 24) {
    const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000);
    const logs = await prisma.usageLog.findMany({
      where: {
        createdAt: {
          gte: since,
        },
      },
      select: {
        provider: true,
        task: true,
        success: true,
        latencyMs: true,
        totalTokens: true,
        fromCache: true,
      },
    });

    const byProvider: Record<string, { requests: number; failures: number; avgLatencyMs: number }> = {};
    const byTask: Record<string, { requests: number; failures: number }> = {};

    let totalSuccesses = 0;
    let totalFailures = 0;
    let totalCacheHits = 0;
    let totalTokensUsed = 0;

    for (const log of logs) {
      if (log.success) {
        totalSuccesses += 1;
      } else {
        totalFailures += 1;
      }
      if (log.fromCache) {
        totalCacheHits += 1;
      }
      totalTokensUsed += log.totalTokens ?? 0;

      if (!byProvider[log.provider]) {
        byProvider[log.provider] = { requests: 0, failures: 0, avgLatencyMs: 0 };
      }
      const providerStats = byProvider[log.provider];
      providerStats.requests += 1;
      if (!log.success) {
        providerStats.failures += 1;
      }
      providerStats.avgLatencyMs =
        (providerStats.avgLatencyMs * (providerStats.requests - 1) + log.latencyMs) /
        providerStats.requests;

      if (!byTask[log.task]) {
        byTask[log.task] = { requests: 0, failures: 0 };
      }
      byTask[log.task].requests += 1;
      if (!log.success) {
        byTask[log.task].failures += 1;
      }
    }

    return {
      totalRequests: logs.length,
      totalSuccesses,
      totalFailures,
      totalCacheHits,
      totalTokensUsed,
      byProvider,
      byTask,
    };
  }

  static async getRecentErrors(limit = 20) {
    return prisma.usageLog.findMany({
      where: { success: false },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        provider: true,
        task: true,
        errorMessage: true,
        errorCode: true,
        isQuotaError: true,
        isRateLimitError: true,
        latencyMs: true,
        createdAt: true,
      },
    });
  }
}

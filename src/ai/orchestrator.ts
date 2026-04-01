import { getEnvConfig } from '@/config/env';
import { aiCache } from './cache';
import { GeminiClient } from './gemini';
import { GroqClient } from './groq';
import { healthManager } from './health';
import { aiLogger } from './logger';
import { OpenRouterClient } from './openrouter';
import {
  AIOrchestrationError,
  AIProvider,
  AIProviderClient,
  AIProviderError,
  AIRequest,
  AIResponse,
  AITask,
  TaskRoutingRule,
} from './types';

const ROUTING_RULES: TaskRoutingRule[] = [
  {
    task: AITask.BLUEPRINT_GENERATION,
    primary: AIProvider.GEMINI,
    fallbacks: [AIProvider.GROQ, AIProvider.OPENROUTER],
  },
  {
    task: AITask.CODE_GENERATION,
    primary: AIProvider.GROQ,
    fallbacks: [AIProvider.GEMINI, AIProvider.OPENROUTER],
  },
  {
    task: AITask.CODE_IMPROVEMENT,
    primary: AIProvider.OPENROUTER,
    fallbacks: [AIProvider.GEMINI, AIProvider.GROQ],
  },
  {
    task: AITask.CODE_FIX,
    primary: AIProvider.OPENROUTER,
    fallbacks: [AIProvider.GROQ, AIProvider.GEMINI],
  },
  {
    task: AITask.CHAT_ASSISTANT,
    primary: AIProvider.GEMINI,
    fallbacks: [AIProvider.OPENROUTER, AIProvider.GROQ],
  },
];

class AIOrchestrator {
  private clients = new Map<AIProvider, AIProviderClient>([
    [AIProvider.GEMINI, new GeminiClient()],
    [AIProvider.GROQ, new GroqClient()],
    [AIProvider.OPENROUTER, new OpenRouterClient()],
  ]);

  async execute(request: AIRequest): Promise<AIResponse> {
    const startedAt = Date.now();
    const cacheKey = aiCache.generateKey(request.task, request.prompt, request.systemPrompt);
    const cached = aiCache.get(cacheKey);

    if (cached) {
      const response: AIResponse = {
        provider: this.getPrimaryProvider(request.task),
        task: request.task,
        raw: cached,
        parsed: request.expectJson ? this.safeJsonParse(cached) : null,
        latencyMs: Date.now() - startedAt,
        fromCache: true,
        timestamp: Date.now(),
      };

      void this.logUsageSuccess(response);
      aiLogger.info('Cache hit - returning cached response', response.provider, request.task);
      return response;
    }

    const providerOrder = this.resolveProviderOrder(request.task);
    if (providerOrder.length === 0) {
      aiLogger.error('No available providers for task', undefined, request.task, {
        health: healthManager.getHealthSnapshot(),
      });
      return this.retryWithGlobalBackoff(request, startedAt);
    }

    const attemptedProviders: AIProvider[] = [];
    const errors: Array<{ provider: AIProvider; error: string }> = [];

    for (const provider of providerOrder) {
      attemptedProviders.push(provider);

      try {
        const result = await this.executeWithProvider(provider, request);
        aiCache.set(cacheKey, result.raw);
        healthManager.recordSuccess(provider);
        void this.logUsageSuccess(result);

        aiLogger.info(`Request succeeded with ${provider}`, provider, request.task, {
          latencyMs: result.latencyMs,
          contentLength: result.raw.length,
        });

        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ provider, error: message });

        if (error instanceof AIProviderError) {
          healthManager.recordFailure(
            provider,
            message,
            error.isQuotaError || error.isRateLimitError
          );
          void this.logUsageFailure(error, request.task, Date.now() - startedAt);
          aiLogger.warn(`Provider failed: ${message}`, provider, request.task, {
            statusCode: error.statusCode,
            isQuotaError: error.isQuotaError,
            isRateLimitError: error.isRateLimitError,
          });
        } else {
          healthManager.recordFailure(provider, message, false);
          aiLogger.error(`Unexpected provider error: ${message}`, provider, request.task);
        }
      }
    }

    aiLogger.error('All ordered providers failed', undefined, request.task, {
      attemptedProviders,
      errors,
    });

    return this.retryWithGlobalBackoff(request, startedAt);
  }

  private async executeWithProvider(provider: AIProvider, request: AIRequest): Promise<AIResponse> {
    const client = this.clients.get(provider);
    if (!client) {
      throw new AIProviderError(provider, null, false, false, false, `No client for ${provider}`);
    }

    const callStartedAt = Date.now();
    const rawResponse = await client.complete(request);
    const latencyMs = Date.now() - callStartedAt;
    let content = this.stripCodeFences(rawResponse.content.trim());
    let parsed: unknown | null = null;

    if (request.expectJson) {
      parsed = this.safeJsonParse(content);
      if (parsed === null) {
        const extracted = this.extractJsonFromText(content);
        if (extracted) {
          content = extracted;
          parsed = this.safeJsonParse(extracted);
        }
      }

      if (parsed === null) {
        throw new AIProviderError(
          provider,
          null,
          false,
          false,
          true,
          `Provider returned invalid JSON. Content starts with: "${content.slice(0, 100)}"`
        );
      }
    }

    return {
      provider,
      task: request.task,
      raw: content,
      parsed,
      latencyMs,
      fromCache: false,
      timestamp: Date.now(),
    };
  }

  private resolveProviderOrder(task: AITask) {
    const rule = ROUTING_RULES.find((item) => item.task === task);
    if (!rule) {
      return healthManager.getAvailableProviders();
    }

    const ordered = [rule.primary, ...rule.fallbacks];
    const available = ordered.filter((provider) => healthManager.isAvailable(provider));
    aiLogger.debug(
      `Provider order for ${task}: [${ordered.join(', ')}] -> [${available.join(', ')}]`,
      undefined,
      task
    );
    return available;
  }

  private async retryWithGlobalBackoff(
    request: AIRequest,
    originalStartedAt: number
  ): Promise<AIResponse> {
    const config = getEnvConfig();

    for (let attempt = 1; attempt <= config.orchestrator.maxGlobalRetries; attempt += 1) {
      let shortestWait = Infinity;
      for (const provider of Object.values(AIProvider)) {
        shortestWait = Math.min(shortestWait, healthManager.getCooldownRemaining(provider));
      }

      const waitMs = Math.min(
        shortestWait > 0 ? shortestWait + 500 : config.orchestrator.retryDelayMs,
        config.orchestrator.retryDelayMs * attempt
      );

      aiLogger.warn(`Global retry attempt ${attempt}`, undefined, request.task, { waitMs });
      await this.sleep(waitMs);

      const providers = this.resolveProviderOrder(request.task);
      for (const provider of providers) {
        try {
          const result = await this.executeWithProvider(provider, request);
          const cacheKey = aiCache.generateKey(request.task, request.prompt, request.systemPrompt);
          aiCache.set(cacheKey, result.raw);
          healthManager.recordSuccess(provider);
          void this.logUsageSuccess(result);
          return result;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          if (error instanceof AIProviderError) {
            healthManager.recordFailure(
              provider,
              message,
              error.isQuotaError || error.isRateLimitError
            );
            void this.logUsageFailure(error, request.task, Date.now() - originalStartedAt);
          } else {
            healthManager.recordFailure(provider, message, false);
          }
        }
      }
    }

    throw new AIOrchestrationError(
      request.task,
      Object.values(AIProvider),
      `All providers failed after ${config.orchestrator.maxGlobalRetries} global retry attempts.`
    );
  }

  private stripCodeFences(text: string) {
    const match = text.match(/^```(?:\w+)?\s*\n?([\s\S]*?)\n?\s*```$/);
    return match ? match[1].trim() : text;
  }

  private extractJsonFromText(text: string) {
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        JSON.parse(objectMatch[0]);
        return objectMatch[0];
      } catch {}
    }

    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        JSON.parse(arrayMatch[0]);
        return arrayMatch[0];
      } catch {}
    }

    return null;
  }

  private safeJsonParse(text: string) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  private getPrimaryProvider(task: AITask) {
    return ROUTING_RULES.find((rule) => rule.task === task)?.primary ?? AIProvider.GEMINI;
  }

  private sleep(ms: number) {
    return new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private async logUsageSuccess(response: AIResponse) {
    try {
      const usageModule = await import('@/lib/services/usage.service');
      await usageModule.UsageService.logFromResponse(response);
    } catch {}
  }

  private async logUsageFailure(error: AIProviderError, task: AITask, latencyMs: number) {
    try {
      const usageModule = await import('@/lib/services/usage.service');
      await usageModule.UsageService.logFromError(error, task, latencyMs);
    } catch {}
  }

  getHealthSnapshot() {
    return healthManager.getHealthSnapshot();
  }

  resetProvider(provider: AIProvider) {
    healthManager.resetProvider(provider);
  }

  getCacheStats() {
    return aiCache.getStats();
  }

  clearCache() {
    aiCache.clear();
  }
}

export const aiOrchestrator = new AIOrchestrator();

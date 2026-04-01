import { getEnvConfig } from '@/config/env';
import {
  AIProvider,
  AIProviderClient,
  AIProviderError,
  AIProviderRawResponse,
  AIRequest,
} from './types';
import { aiLogger } from './logger';

export class OpenRouterClient implements AIProviderClient {
  readonly provider = AIProvider.OPENROUTER;

  async complete(request: AIRequest): Promise<AIProviderRawResponse> {
    const config = getEnvConfig().openRouter;
    const url = `${config.baseUrl}/chat/completions`;
    const messages: Array<{ role: string; content: string }> = [];

    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }

    messages.push({ role: 'user', content: request.prompt });

    const body: Record<string, unknown> = {
      model: config.model,
      messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
      stream: false,
    };

    if (request.expectJson) {
      body.response_format = { type: 'json_object' };
    }

    aiLogger.debug('Sending request to OpenRouter', this.provider, request.task, {
      model: config.model,
      promptLength: request.prompt.length,
    });

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
          'HTTP-Referer': 'https://ai-auto-startup-builder.dev',
          'X-Title': 'AI Auto Startup Builder',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(90_000),
      });
    } catch (error) {
      throw new AIProviderError(
        this.provider,
        null,
        false,
        false,
        true,
        `OpenRouter network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unable to read error body');
      const isQuota = this.isQuotaError(response.status, errorBody);
      const isRateLimit = this.isRateLimitError(response.status, errorBody);
      throw new AIProviderError(
        this.provider,
        response.status,
        isQuota,
        isRateLimit,
        isQuota || isRateLimit || response.status >= 500,
        `OpenRouter API error ${response.status}: ${errorBody.slice(0, 500)}`
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new AIProviderError(
        this.provider,
        null,
        false,
        false,
        true,
        `OpenRouter returned empty response: ${JSON.stringify(data).slice(0, 300)}`
      );
    }

    return {
      content,
      finishReason: data.choices[0]?.finish_reason ?? undefined,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }

  private isQuotaError(status: number, body: string) {
    const normalized = body.toLowerCase();
    return (
      status === 429 ||
      normalized.includes('quota exceeded') ||
      normalized.includes('insufficient credits') ||
      normalized.includes('billing')
    );
  }

  private isRateLimitError(status: number, body: string) {
    const normalized = body.toLowerCase();
    return (
      status === 429 ||
      normalized.includes('rate limit') ||
      normalized.includes('too many requests') ||
      normalized.includes('rate_limit')
    );
  }
}

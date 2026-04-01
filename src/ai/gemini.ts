import { getEnvConfig } from '@/config/env';
import {
  AIProvider,
  AIProviderClient,
  AIProviderError,
  AIProviderRawResponse,
  AIRequest,
} from './types';
import { aiLogger } from './logger';

export class GeminiClient implements AIProviderClient {
  readonly provider = AIProvider.GEMINI;

  async complete(request: AIRequest): Promise<AIProviderRawResponse> {
    const config = getEnvConfig().gemini;
    const url = `${config.baseUrl}/models/${config.model}:generateContent?key=${config.apiKey}`;
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    if (request.systemPrompt) {
      contents.push({
        role: 'user',
        parts: [{ text: `[System Instructions]\n${request.systemPrompt}` }],
      });
      contents.push({
        role: 'model',
        parts: [{ text: 'Understood. I will follow these instructions.' }],
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: request.prompt }],
    });

    const body = {
      contents,
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 4096,
        ...(request.expectJson ? { responseMimeType: 'application/json' } : {}),
      },
    };

    aiLogger.debug('Sending request to Gemini', this.provider, request.task, {
      model: config.model,
      promptLength: request.prompt.length,
    });

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60_000),
      });
    } catch (error) {
      throw new AIProviderError(
        this.provider,
        null,
        false,
        false,
        true,
        `Gemini network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
        `Gemini API error ${response.status}: ${errorBody.slice(0, 500)}`
      );
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0];
    const content = candidate?.content?.parts?.[0]?.text;
    if (!content || typeof content !== 'string') {
      throw new AIProviderError(
        this.provider,
        null,
        false,
        false,
        true,
        `Gemini returned empty or malformed response: ${JSON.stringify(data).slice(0, 300)}`
      );
    }

    return {
      content,
      finishReason: candidate.finishReason ?? undefined,
      usage: data.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount,
            completionTokens: data.usageMetadata.candidatesTokenCount,
            totalTokens: data.usageMetadata.totalTokenCount,
          }
        : undefined,
    };
  }

  private isQuotaError(status: number, body: string) {
    const normalized = body.toLowerCase();
    return (
      status === 429 ||
      normalized.includes('quota exceeded') ||
      normalized.includes('resource exhausted') ||
      normalized.includes('rate_limit_exceeded')
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

export enum AIProvider {
  GEMINI = 'gemini',
  GROQ = 'groq',
  OPENROUTER = 'openrouter',
}

export enum AITask {
  BLUEPRINT_GENERATION = 'blueprint_generation',
  CODE_GENERATION = 'code_generation',
  CODE_IMPROVEMENT = 'code_improvement',
  CODE_FIX = 'code_fix',
}

export interface AIRequest {
  task: AITask;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  expectJson?: boolean;
  context?: Record<string, unknown>;
}

export interface AIResponse {
  provider: AIProvider;
  task: AITask;
  raw: string;
  parsed: unknown | null;
  latencyMs: number;
  fromCache: boolean;
  timestamp: number;
}

export interface AIProviderClient {
  readonly provider: AIProvider;
  complete(request: AIRequest): Promise<AIProviderRawResponse>;
}

export interface AIProviderRawResponse {
  content: string;
  finishReason?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface ProviderHealthState {
  provider: AIProvider;
  isAvailable: boolean;
  disabledUntil: number | null;
  consecutiveFailures: number;
  lastError: string | null;
  lastErrorTimestamp: number | null;
  totalRequests: number;
  totalFailures: number;
}

export interface TaskRoutingRule {
  task: AITask;
  primary: AIProvider;
  fallbacks: AIProvider[];
}

export class AIProviderError extends Error {
  constructor(
    public readonly provider: AIProvider,
    public readonly statusCode: number | null,
    public readonly isQuotaError: boolean,
    public readonly isRateLimitError: boolean,
    public readonly isRetryable: boolean,
    message: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

export class AIOrchestrationError extends Error {
  constructor(
    public readonly task: AITask,
    public readonly attemptedProviders: AIProvider[],
    message: string
  ) {
    super(message);
    this.name = 'AIOrchestrationError';
  }
}

export interface AILogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  provider?: AIProvider;
  task?: AITask;
  message: string;
  meta?: Record<string, unknown>;
}

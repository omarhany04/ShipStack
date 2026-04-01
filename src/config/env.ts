interface EnvConfig {
  gemini: {
    apiKey: string;
    baseUrl: string;
    model: string;
  };
  groq: {
    apiKey: string;
    baseUrl: string;
    model: string;
  };
  openRouter: {
    apiKey: string;
    baseUrl: string;
    model: string;
  };
  cache: {
    ttlMs: number;
    maxEntries: number;
  };
  health: {
    defaultCooldownMs: number;
    maxCooldownMs: number;
  };
  orchestrator: {
    maxGlobalRetries: number;
    retryDelayMs: number;
  };
  database: {
    url: string | null;
  };
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`[ENV] Missing required environment variable: ${key}`);
  }
  return value.trim();
}

function optionalEnv(key: string, fallback: string): string {
  const value = process.env[key];
  return value && value.trim() !== '' ? value.trim() : fallback;
}

function numberEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw || raw.trim() === '') {
    return fallback;
  }

  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }

  return value;
}

let cachedConfig: EnvConfig | null = null;

export function getEnvConfig(): EnvConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = {
    gemini: {
      apiKey: requireEnv('GEMINI_API_KEY'),
      baseUrl: optionalEnv(
        'GEMINI_BASE_URL',
        'https://generativelanguage.googleapis.com/v1beta'
      ),
      model: optionalEnv('GEMINI_MODEL', 'gemini-2.5-flash-lite'),
    },
    groq: {
      apiKey: requireEnv('GROQ_API_KEY'),
      baseUrl: optionalEnv('GROQ_BASE_URL', 'https://api.groq.com/openai/v1'),
      model: optionalEnv('GROQ_MODEL', 'llama-3.1-8b-instant'),
    },
    openRouter: {
      apiKey: requireEnv('OPENROUTER_API_KEY'),
      baseUrl: optionalEnv('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1'),
      model: optionalEnv(
        'OPENROUTER_MODEL',
        'meta-llama/llama-3.3-70b-instruct:free'
      ),
    },
    cache: {
      ttlMs: numberEnv('CACHE_TTL_MS', 600_000),
      maxEntries: numberEnv('CACHE_MAX_ENTRIES', 100),
    },
    health: {
      defaultCooldownMs: numberEnv('HEALTH_COOLDOWN_MS', 60_000),
      maxCooldownMs: numberEnv('HEALTH_MAX_COOLDOWN_MS', 300_000),
    },
    orchestrator: {
      maxGlobalRetries: numberEnv('ORCH_MAX_RETRIES', 2),
      retryDelayMs: numberEnv('ORCH_RETRY_DELAY_MS', 5_000),
    },
    database: {
      url: process.env.DATABASE_URL?.trim() || null,
    },
  };

  return cachedConfig;
}

export function getLazyRuntimeConfig() {
  return {
    cache: {
      ttlMs: numberEnv('CACHE_TTL_MS', 600_000),
      maxEntries: numberEnv('CACHE_MAX_ENTRIES', 100),
    },
  };
}

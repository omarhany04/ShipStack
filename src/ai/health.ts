import { getEnvConfig } from '@/config/env';
import { AIProvider, ProviderHealthState } from './types';
import { aiLogger } from './logger';

class ProviderHealthManager {
  private states = new Map<AIProvider, ProviderHealthState>();

  constructor() {
    for (const provider of Object.values(AIProvider)) {
      this.states.set(provider, {
        provider,
        isAvailable: true,
        disabledUntil: null,
        consecutiveFailures: 0,
        lastError: null,
        lastErrorTimestamp: null,
        totalRequests: 0,
        totalFailures: 0,
      });
    }
  }

  isAvailable(provider: AIProvider) {
    const state = this.getState(provider);

    if (state.disabledUntil !== null) {
      if (Date.now() >= state.disabledUntil) {
        state.isAvailable = true;
        state.disabledUntil = null;
        aiLogger.info('Provider cooldown expired, re-enabling', provider, undefined, {
          lastError: state.lastError,
        });
      } else {
        return false;
      }
    }

    return state.isAvailable;
  }

  getAvailableProviders() {
    return Object.values(AIProvider).filter((provider) => this.isAvailable(provider));
  }

  recordSuccess(provider: AIProvider) {
    const state = this.getState(provider);
    state.totalRequests += 1;
    state.consecutiveFailures = 0;
    state.isAvailable = true;
    state.disabledUntil = null;
  }

  recordFailure(provider: AIProvider, errorMessage: string, isQuotaOrRateLimit: boolean) {
    const state = this.getState(provider);
    const config = getEnvConfig();

    state.totalRequests += 1;
    state.totalFailures += 1;
    state.consecutiveFailures += 1;
    state.lastError = errorMessage;
    state.lastErrorTimestamp = Date.now();

    if (isQuotaOrRateLimit) {
      const factor = Math.min(
        2 ** (state.consecutiveFailures - 1),
        config.health.maxCooldownMs / config.health.defaultCooldownMs
      );
      const cooldownMs = Math.min(
        config.health.defaultCooldownMs * factor,
        config.health.maxCooldownMs
      );

      state.isAvailable = false;
      state.disabledUntil = Date.now() + cooldownMs;
      aiLogger.warn('Provider disabled due to quota or rate limiting', provider, undefined, {
        cooldownMs,
        consecutiveFailures: state.consecutiveFailures,
      });
      return;
    }

    if (state.consecutiveFailures >= 3) {
      state.isAvailable = false;
      state.disabledUntil = Date.now() + config.health.defaultCooldownMs;
      aiLogger.warn('Provider temporarily disabled after repeated failures', provider, undefined, {
        cooldownMs: config.health.defaultCooldownMs,
        consecutiveFailures: state.consecutiveFailures,
      });
    }
  }

  resetProvider(provider: AIProvider) {
    const state = this.getState(provider);
    state.isAvailable = true;
    state.disabledUntil = null;
    state.consecutiveFailures = 0;
    state.lastError = null;
    state.lastErrorTimestamp = null;
    aiLogger.info('Provider manually reset', provider);
  }

  getHealthSnapshot() {
    for (const provider of Object.values(AIProvider)) {
      this.isAvailable(provider);
    }

    return Array.from(this.states.values()).map((state) => ({ ...state }));
  }

  getCooldownRemaining(provider: AIProvider) {
    const state = this.getState(provider);
    if (state.disabledUntil === null) {
      return 0;
    }

    return Math.max(0, state.disabledUntil - Date.now());
  }

  private getState(provider: AIProvider) {
    const state = this.states.get(provider);
    if (!state) {
      throw new Error(`[HealthManager] Unknown provider: ${provider}`);
    }

    return state;
  }
}

export const healthManager = new ProviderHealthManager();

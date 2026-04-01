import { getLazyRuntimeConfig } from '@/config/env';
import { aiLogger } from './logger';

interface CacheEntry<T> {
  value: T;
  createdAt: number;
  expiresAt: number;
  hits: number;
}

export class AIResponseCache {
  private store = new Map<string, CacheEntry<string>>();

  private get ttlMs() {
    return getLazyRuntimeConfig().cache.ttlMs;
  }

  private get maxEntries() {
    return getLazyRuntimeConfig().cache.maxEntries;
  }

  generateKey(task: string, prompt: string, systemPrompt?: string) {
    const raw = `${task}::${systemPrompt ?? ''}::${prompt}`;
    return this.hashString(raw);
  }

  get(key: string) {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      aiLogger.debug(`Cache expired for key: ${key.slice(0, 12)}...`);
      return null;
    }

    entry.hits += 1;
    return entry.value;
  }

  set(key: string, value: string) {
    if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value as string | undefined;
      if (oldestKey) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(key, {
      value,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.ttlMs,
      hits: 0,
    });

    aiLogger.debug(`Cache set for key: ${key.slice(0, 12)}...`, undefined, undefined, {
      entries: this.store.size,
    });
  }

  clear() {
    this.store.clear();
    aiLogger.info('AI response cache cleared');
  }

  invalidate(key: string) {
    this.store.delete(key);
  }

  getStats() {
    return {
      size: this.store.size,
      maxEntries: this.maxEntries,
      ttlMs: this.ttlMs,
    };
  }

  private hashString(text: string) {
    let hash = 0;
    for (let index = 0; index < text.length; index += 1) {
      hash = (hash << 5) - hash + text.charCodeAt(index);
      hash |= 0;
    }

    return `ai_cache_${Math.abs(hash).toString(36)}`;
  }
}

export const aiCache = new AIResponseCache();

import { AILogEntry, AIProvider, AITask } from './types';

class AILogger {
  private logs: AILogEntry[] = [];
  private readonly maxBufferSize = 1000;

  private emit(entry: AILogEntry) {
    this.logs.push(entry);
    if (this.logs.length > this.maxBufferSize) {
      this.logs = this.logs.slice(-this.maxBufferSize);
    }

    const prefix = `[AI:${entry.level.toUpperCase()}]`;
    const providerTag = entry.provider ? `[${entry.provider}]` : '';
    const taskTag = entry.task ? `[${entry.task}]` : '';
    const line = `${prefix}${providerTag}${taskTag} ${entry.message}`;

    if (entry.level === 'error') {
      console.error(line, entry.meta ?? '');
      return;
    }

    if (entry.level === 'warn') {
      console.warn(line, entry.meta ?? '');
      return;
    }

    if (entry.level === 'debug') {
      if (process.env.NODE_ENV === 'development') {
        console.debug(line, entry.meta ?? '');
      }
      return;
    }

    console.log(line, entry.meta ?? '');
  }

  info(
    message: string,
    provider?: AIProvider,
    task?: AITask,
    meta?: Record<string, unknown>
  ) {
    this.emit({ timestamp: Date.now(), level: 'info', provider, task, message, meta });
  }

  warn(
    message: string,
    provider?: AIProvider,
    task?: AITask,
    meta?: Record<string, unknown>
  ) {
    this.emit({ timestamp: Date.now(), level: 'warn', provider, task, message, meta });
  }

  error(
    message: string,
    provider?: AIProvider,
    task?: AITask,
    meta?: Record<string, unknown>
  ) {
    this.emit({ timestamp: Date.now(), level: 'error', provider, task, message, meta });
  }

  debug(
    message: string,
    provider?: AIProvider,
    task?: AITask,
    meta?: Record<string, unknown>
  ) {
    this.emit({ timestamp: Date.now(), level: 'debug', provider, task, message, meta });
  }

  getRecentLogs(count = 50) {
    return this.logs.slice(-count);
  }

  getProviderErrors(provider: AIProvider, sinceMs = 3_600_000) {
    const cutoff = Date.now() - sinceMs;
    return this.logs.filter(
      (entry) =>
        entry.provider === provider &&
        entry.level === 'error' &&
        entry.timestamp >= cutoff
    );
  }
}

export const aiLogger = new AILogger();

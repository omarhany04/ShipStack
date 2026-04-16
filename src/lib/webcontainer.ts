'use client';

import { WebContainer } from '@webcontainer/api';
import { FileSystemTree } from '@/builder/file-writer';

export type WebContainerStatus =
  | 'idle'
  | 'booting'
  | 'mounting'
  | 'installing'
  | 'starting'
  | 'ready'
  | 'error';

interface WebContainerCallbacks {
  onLog?: (log: string) => void;
  onStatus?: (status: WebContainerStatus) => void;
  onUrl?: (url: string) => void;
  onError?: (error: string) => void;
}

interface WebContainerRunOptions {
  signal?: AbortSignal;
}

let instance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

async function getWebContainer() {
  if (instance) {
    return instance;
  }

  if (!bootPromise) {
    bootPromise = WebContainer.boot().then((container) => {
      instance = container;
      return container;
    });
  }

  return bootPromise;
}

function createWebContainerPackageJson(files: FileSystemTree) {
  const packageNode = files['package.json'];
  if (!packageNode || !('file' in packageNode)) {
    return files;
  }

  try {
    const pkg = JSON.parse(packageNode.file.contents);
    for (const dep of ['@prisma/client', 'prisma', 'next-auth', 'bcrypt', 'bcryptjs']) {
      delete pkg.dependencies?.[dep];
      delete pkg.devDependencies?.[dep];
    }
    delete pkg.scripts?.postinstall;
    if (pkg.scripts?.build === 'prisma generate && next build') {
      pkg.scripts.build = 'next build';
    }
    delete pkg.scripts?.['db:generate'];
    delete pkg.scripts?.['db:push'];
    delete pkg.scripts?.['db:studio'];
    delete pkg.scripts?.['db:seed'];

    return {
      ...files,
      'package.json': {
        file: {
          contents: JSON.stringify(pkg, null, 2),
        },
      },
    };
  } catch {
    return files;
  }
}

function injectPrismaMock(files: FileSystemTree) {
  const mockContent = `
type MockArgs = Record<string, any> | undefined;
type MockRow = Record<string, any>;

interface MockStore {
  records: Record<string, MockRow[]>;
  counters: Record<string, number>;
}

const globalStore = globalThis as typeof globalThis & {
  __shipstackMockStore?: MockStore;
};

const store =
  globalStore.__shipstackMockStore ??
  (globalStore.__shipstackMockStore = {
    records: {},
    counters: {},
  });

function cloneValue<T>(value: T): T {
  if (value === undefined) {
    return value;
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function getCollection(modelName: string) {
  if (!store.records[modelName]) {
    store.records[modelName] = [];
  }

  return store.records[modelName];
}

function nextId(modelName: string) {
  store.counters[modelName] = (store.counters[modelName] ?? 0) + 1;
  return modelName.toLowerCase() + '-' + store.counters[modelName];
}

function getWhereArgs(args: MockArgs) {
  return (args?.where as Record<string, any> | undefined) ?? {};
}

function resolveId(args: MockArgs) {
  const value = getWhereArgs(args).id;
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return String(value);
}

function matchesCondition(row: MockRow, condition: Record<string, any>) {
  return Object.entries(condition).every(([field, expected]) => {
    const value = row[field];

    if (expected && typeof expected === 'object' && 'contains' in expected) {
      const rawNeedle = String(expected.contains ?? '');
      const haystack = String(value ?? '');
      const isInsensitive = String(expected.mode ?? '').toLowerCase() === 'insensitive';

      return isInsensitive
        ? haystack.toLowerCase().includes(rawNeedle.toLowerCase())
        : haystack.includes(rawNeedle);
    }

    return value === expected;
  });
}

function matchesWhere(row: MockRow, where: Record<string, any>) {
  const baseConditions = Object.entries(where).filter(([key]) => key !== 'OR');
  const baseMatches = baseConditions.every(([field, expected]) =>
    matchesCondition(row, { [field]: expected })
  );

  if (!baseMatches) {
    return false;
  }

  const orConditions = Array.isArray(where.OR) ? (where.OR as Array<Record<string, any>>) : [];
  if (orConditions.length === 0) {
    return true;
  }

  return orConditions.some((condition) => matchesCondition(row, condition));
}

function applyWhere(collection: MockRow[], args: MockArgs) {
  const where = getWhereArgs(args);
  if (Object.keys(where).length === 0) {
    return [...collection];
  }

  return collection.filter((row) => matchesWhere(row, where));
}

function compareValues(left: unknown, right: unknown) {
  if (left === right) {
    return 0;
  }

  if (left === undefined || left === null) {
    return -1;
  }

  if (right === undefined || right === null) {
    return 1;
  }

  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

function applyOrder(rows: MockRow[], args: MockArgs) {
  const orderBy = args?.orderBy;
  if (!orderBy || Array.isArray(orderBy)) {
    return rows;
  }

  const [field, direction] = Object.entries(orderBy)[0] ?? [];
  if (!field) {
    return rows;
  }

  const multiplier = String(direction).toLowerCase() === 'asc' ? 1 : -1;
  return [...rows].sort((left, right) => compareValues(left[field], right[field]) * multiplier);
}

function applyPagination(rows: MockRow[], args: MockArgs) {
  const skip = typeof args?.skip === 'number' ? args.skip : 0;
  const take = typeof args?.take === 'number' ? args.take : rows.length;
  return rows.slice(skip, skip + take);
}

function normalizeMutationData(data: Record<string, unknown>, includeCreatedAt: boolean) {
  const now = new Date().toISOString();
  const normalized: MockRow = {};

  Object.entries(data).forEach(([key, value]) => {
    normalized[key] = value instanceof Date ? value.toISOString() : value;
  });

  if (includeCreatedAt && normalized.createdAt === undefined) {
    normalized.createdAt = now;
  }

  normalized.updatedAt = now;
  return normalized;
}

function createNotFoundError() {
  const error = new Error('Record not found.');
  (error as Error & { code?: string }).code = 'P2025';
  return error;
}

function createModel(modelName: string) {
  return new Proxy(
    {},
    {
      get(_target, methodName) {
        return async (args: MockArgs) => {
          console.log('[Mock DB]', modelName + '.' + String(methodName), args || '');
          const collection = getCollection(modelName);

          switch (methodName) {
            case 'findMany': {
              const filtered = applyWhere(collection, args);
              const ordered = applyOrder(filtered, args);
              return cloneValue(applyPagination(ordered, args));
            }
            case 'findUnique':
            case 'findFirst': {
              const rowId = resolveId(args);
              const match = rowId
                ? collection.find((row) => String(row.id) === rowId) ?? null
                : applyWhere(collection, args)[0] ?? null;
              return match ? cloneValue(match) : null;
            }
            case 'create': {
              const input = normalizeMutationData(
                (args?.data as Record<string, unknown> | undefined) ?? {},
                true
              );
              const item: MockRow = {
                id: String(input.id ?? nextId(modelName)),
                ...input,
                updatedAt: new Date().toISOString(),
              };

              collection.unshift(item);
              return cloneValue(item);
            }
            case 'update': {
              const rowId = resolveId(args);
              const index = collection.findIndex((row) => String(row.id) === rowId);
              if (index < 0) {
                throw createNotFoundError();
              }

              const current = collection[index];
              const updates = normalizeMutationData(
                (args?.data as Record<string, unknown> | undefined) ?? {},
                false
              );
              const nextItem = {
                ...current,
                ...updates,
                id: current.id,
                createdAt: current.createdAt ?? updates.createdAt,
                updatedAt: new Date().toISOString(),
              };

              collection[index] = nextItem;
              return cloneValue(nextItem);
            }
            case 'delete': {
              const rowId = resolveId(args);
              const index = collection.findIndex((row) => String(row.id) === rowId);
              if (index < 0) {
                throw createNotFoundError();
              }

              const [deleted] = collection.splice(index, 1);
              return cloneValue(deleted);
            }
            case 'count':
              return applyWhere(collection, args).length;
            default:
              return null;
          }
        };
      },
    }
  );
}

const prisma = new Proxy(
  {},
  {
    get(_target, propName) {
      if (propName === '$disconnect' || propName === '$connect') {
        return async () => {};
      }

      return createModel(String(propName));
    },
  }
) as Record<string, unknown>;

export { prisma };
export default prisma;
`;

  const srcNode = files.src;
  if (srcNode && 'directory' in srcNode) {
    if (!srcNode.directory.lib || !('directory' in srcNode.directory.lib)) {
      srcNode.directory.lib = { directory: {} };
    }
    srcNode.directory.lib.directory['prisma.ts'] = {
      file: {
        contents: mockContent,
      },
    };
  }

  return files;
}

export async function runInWebContainer(
  fileSystemTree: FileSystemTree,
  callbacks: WebContainerCallbacks = {},
  options: WebContainerRunOptions = {}
) {
  const log = (message: string) => callbacks.onLog?.(message);
  let installProcess:
    | Awaited<ReturnType<WebContainer['spawn']>>
    | null = null;
  let devProcess:
    | Awaited<ReturnType<WebContainer['spawn']>>
    | null = null;

  const stopProcesses = () => {
    try {
      devProcess?.kill();
    } catch {}
    try {
      installProcess?.kill();
    } catch {}
  };

  const throwIfAborted = () => {
    if (options.signal?.aborted) {
      throw createAbortError();
    }
  };

  const waitForAbort = async <T>(promise: Promise<T>) => {
    if (!options.signal) {
      return promise;
    }

    if (options.signal.aborted) {
      throw createAbortError();
    }

    return new Promise<T>((resolve, reject) => {
      const onAbort = () => {
        stopProcesses();
        void teardownWebContainer();
        reject(createAbortError());
      };

      options.signal?.addEventListener('abort', onAbort, { once: true });

      promise.then(
        (value) => {
          options.signal?.removeEventListener('abort', onAbort);
          resolve(value);
        },
        (error) => {
          options.signal?.removeEventListener('abort', onAbort);
          reject(error);
        }
      );
    });
  };

  try {
    throwIfAborted();
    callbacks.onStatus?.('booting');
    log('Booting WebContainer...');
    const container = await waitForAbort(getWebContainer());

    throwIfAborted();
    callbacks.onStatus?.('mounting');
    let preparedTree = createWebContainerPackageJson(fileSystemTree);
    preparedTree = injectPrismaMock(preparedTree);
    await waitForAbort(container.mount(preparedTree));
    log('Mounted project files.');

    throwIfAborted();
    callbacks.onStatus?.('installing');
    log('Installing dependencies...');
    installProcess = await waitForAbort(container.spawn('npm', ['install', '--legacy-peer-deps']));
    installProcess.output
      .pipeTo(
        new WritableStream({
          write(chunk) {
            log(`[npm] ${chunk}`);
          },
        })
      )
      .catch(() => {});
    const installExitCode = await waitForAbort(installProcess.exit);
    if (installExitCode !== 0) {
      throw new Error(`npm install failed with exit code ${installExitCode}`);
    }

    throwIfAborted();
    callbacks.onStatus?.('starting');
    log('Starting development server...');
    devProcess = await waitForAbort(container.spawn('npm', ['run', 'dev']));
    devProcess.output
      .pipeTo(
        new WritableStream({
          write(chunk) {
            log(`[next] ${chunk}`);
          },
        })
      )
      .catch(() => {});

    const url = await waitForAbort(new Promise<string>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        reject(new Error('Dev server failed to start within 60 seconds.'));
      }, 60_000);

      container.on('server-ready', (_port, serverUrl) => {
        window.clearTimeout(timeout);
        resolve(serverUrl);
      });
    }));

    callbacks.onStatus?.('ready');
    callbacks.onUrl?.(url);

    return {
      url,
      teardown: async () => {
        try {
          devProcess?.kill();
        } catch {}
      },
    };
  } catch (error) {
    stopProcesses();
    if (isAbortError(error) || options.signal?.aborted) {
      throw createAbortError();
    }
    const message = error instanceof Error ? error.message : 'WebContainer error';
    callbacks.onStatus?.('error');
    callbacks.onError?.(message);
    throw error;
  }
}

export async function teardownWebContainer() {
  if (instance) {
    instance.teardown();
    instance = null;
    bootPromise = null;
  }
}

function createAbortError() {
  return new DOMException('The preview launch was canceled.', 'AbortError');
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

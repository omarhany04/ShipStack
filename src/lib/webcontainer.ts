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
type MockArgs = Record<string, unknown> | undefined;

function createModel(modelName: string) {
  return new Proxy(
    {},
    {
      get(_target, methodName) {
        return async (args: MockArgs) => {
          console.log('[Mock DB]', modelName + '.' + String(methodName), args || '');
          switch (methodName) {
            case 'findMany':
              return [];
            case 'findUnique':
            case 'findFirst':
              return null;
            case 'create':
              return { id: 'mock-' + Date.now(), ...((args?.data as Record<string, unknown>) || {}), createdAt: new Date(), updatedAt: new Date() };
            case 'update':
              return { id: ((args?.where as Record<string, string> | undefined)?.id || 'mock'), ...((args?.data as Record<string, unknown>) || {}), updatedAt: new Date() };
            case 'delete':
              return { id: ((args?.where as Record<string, string> | undefined)?.id || 'mock') };
            case 'count':
              return 0;
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
  callbacks: WebContainerCallbacks = {}
) {
  const log = (message: string) => callbacks.onLog?.(message);
  let installProcess:
    | Awaited<ReturnType<WebContainer['spawn']>>
    | null = null;
  let devProcess:
    | Awaited<ReturnType<WebContainer['spawn']>>
    | null = null;

  try {
    callbacks.onStatus?.('booting');
    log('Booting WebContainer...');
    const container = await getWebContainer();

    callbacks.onStatus?.('mounting');
    let preparedTree = createWebContainerPackageJson(fileSystemTree);
    preparedTree = injectPrismaMock(preparedTree);
    await container.mount(preparedTree);
    log('Mounted project files.');

    callbacks.onStatus?.('installing');
    log('Installing dependencies...');
    installProcess = await container.spawn('npm', ['install', '--legacy-peer-deps']);
    installProcess.output.pipeTo(
      new WritableStream({
        write(chunk) {
          log(`[npm] ${chunk}`);
        },
      })
    );
    const installExitCode = await installProcess.exit;
    if (installExitCode !== 0) {
      throw new Error(`npm install failed with exit code ${installExitCode}`);
    }

    callbacks.onStatus?.('starting');
    log('Starting development server...');
    devProcess = await container.spawn('npm', ['run', 'dev']);
    devProcess.output.pipeTo(
      new WritableStream({
        write(chunk) {
          log(`[next] ${chunk}`);
        },
      })
    );

    const url = await new Promise<string>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        reject(new Error('Dev server failed to start within 60 seconds.'));
      }, 60_000);

      container.on('server-ready', (_port, serverUrl) => {
        window.clearTimeout(timeout);
        resolve(serverUrl);
      });
    });

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
    try {
      devProcess?.kill();
    } catch {}
    try {
      installProcess?.kill();
    } catch {}
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

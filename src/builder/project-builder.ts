import { aiLogger } from '@/ai/logger';
import { GeneratedFile, GenerationResult } from '@/generator/types';
import {
  buildDisplayTree,
  buildFileSystemTree,
  buildFlatFileMap,
  FileSystemTree,
  FlatFileMap,
  TreeNode,
  validateGeneratedFiles,
  ValidationIssue,
} from './file-writer';

export interface ProjectMetadata {
  projectName: string;
  totalFiles: number;
  totalSizeBytes: number;
  buildTimestamp: number;
  generationStats: GenerationResult['stats'] | null;
}

export interface ProjectBuildResult {
  success: boolean;
  fileSystemTree: FileSystemTree;
  flatFiles: FlatFileMap;
  displayTree: TreeNode;
  files: GeneratedFile[];
  validationIssues: ValidationIssue[];
  metadata: ProjectMetadata;
}

export function buildProject(
  generationResult: GenerationResult,
  projectName: string
): ProjectBuildResult {
  let files = patchGeneratedFiles(generationResult.files, projectName);
  files = ensureCriticalFiles(files, projectName);

  const validationIssues = validateGeneratedFiles(files);
  const hasErrors = validationIssues.some((issue) => issue.severity === 'error');
  const fileSystemTree = buildFileSystemTree(files);
  const flatFiles = buildFlatFileMap(files);
  const displayTree = buildDisplayTree(files);
  const totalSizeBytes = files.reduce(
    (total, file) => total + new TextEncoder().encode(file.content).length,
    0
  );

  aiLogger.info('Project built', undefined, undefined, {
    projectName,
    totalFiles: files.length,
    totalSizeBytes,
    validationErrors: validationIssues.filter((issue) => issue.severity === 'error').length,
  });

  return {
    success: !hasErrors,
    fileSystemTree,
    flatFiles,
    displayTree,
    files,
    validationIssues,
    metadata: {
      projectName,
      totalFiles: files.length,
      totalSizeBytes,
      buildTimestamp: Date.now(),
      generationStats: generationResult.stats,
    },
  };
}

function patchGeneratedFiles(files: GeneratedFile[], projectName: string) {
  return files.map((file) => {
    let content = file.content;

    if (file.path === 'package.json') {
      try {
        const pkg = JSON.parse(content);
        pkg.name = projectName;
        content = JSON.stringify(pkg, null, 2);
      } catch {}
    }

    if ((file.path.endsWith('.ts') || file.path.endsWith('.tsx')) && content.includes('use client')) {
      if (!content.startsWith("'use client'") && !content.startsWith('"use client"')) {
        content = content.replace(/['"]use client['"];?\s*/, '');
        content = `'use client';\n\n${content}`;
      }
    }

    return {
      ...file,
      content,
    };
  });
}

function ensureCriticalFiles(files: GeneratedFile[], projectName: string) {
  const paths = new Set(files.map((file) => file.path));

  if (!paths.has('package.json')) {
    files.push({
      path: 'package.json',
      content: JSON.stringify(
        {
          name: projectName,
          private: true,
          scripts: {
            dev: 'next dev',
            build: 'next build',
            start: 'next start',
          },
          dependencies: {
            next: '^14.2.30',
            react: '^18.3.1',
            'react-dom': '^18.3.1',
          },
          devDependencies: {
            typescript: '^5.8.3',
          },
        },
        null,
        2
      ),
      source: 'template',
      description: 'Fallback package.json',
    });
  }

  if (!paths.has('src/app/layout.tsx')) {
    files.push({
      path: 'src/app/layout.tsx',
      content: `import './globals.css';\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return <html lang="en"><body>{children}</body></html>;\n}\n`,
      source: 'template',
      description: 'Fallback layout',
    });
  }

  if (!paths.has('src/app/page.tsx')) {
    files.push({
      path: 'src/app/page.tsx',
      content: `export default function HomePage() {\n  return <main><h1>${projectName}</h1></main>;\n}\n`,
      source: 'template',
      description: 'Fallback home page',
    });
  }

  if (!paths.has('src/app/globals.css')) {
    files.push({
      path: 'src/app/globals.css',
      content: '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n',
      source: 'template',
      description: 'Fallback global css',
    });
  }

  return files;
}

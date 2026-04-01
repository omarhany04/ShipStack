import { GeneratedFile } from '@/generator/types';

export interface FileNode {
  file: {
    contents: string;
  };
}

export interface DirectoryNode {
  directory: FileSystemTree;
}

export type FileSystemTree = Record<string, FileNode | DirectoryNode>;

export interface FlatFileMap {
  [path: string]: string;
}

export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
  extension?: string;
  size?: number;
}

export interface ValidationIssue {
  severity: 'error' | 'warning';
  file: string;
  message: string;
}

export function buildFileSystemTree(files: GeneratedFile[]): FileSystemTree {
  const tree: FileSystemTree = {};

  for (const file of files) {
    insertIntoTree(tree, file.path.split('/').filter(Boolean), file.content);
  }

  return tree;
}

function insertIntoTree(tree: FileSystemTree, segments: string[], content: string): void {
  if (segments.length === 0) {
    return;
  }

  if (segments.length === 1) {
    tree[segments[0]] = {
      file: {
        contents: content,
      },
    };
    return;
  }

  const dirName = segments[0];
  if (!tree[dirName]) {
    tree[dirName] = { directory: {} };
  }

  const dirNode = tree[dirName];
  if ('directory' in dirNode) {
    insertIntoTree(dirNode.directory, segments.slice(1), content);
  }
}

export function buildFlatFileMap(files: GeneratedFile[]): FlatFileMap {
  const flat: FlatFileMap = {};
  for (const file of files) {
    flat[file.path] = file.content;
  }
  return flat;
}

export function buildDisplayTree(files: GeneratedFile[]): TreeNode {
  const root: TreeNode = {
    name: '/',
    path: '/',
    type: 'directory',
    children: [],
  };

  for (const file of files) {
    const segments = file.path.split('/').filter(Boolean);
    let currentNode = root;

    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index];
      const isFile = index === segments.length - 1;
      const currentPath = `/${segments.slice(0, index + 1).join('/')}`;

      if (isFile) {
        currentNode.children?.push({
          name: segment,
          path: currentPath,
          type: 'file',
          extension: segment.includes('.') ? segment.split('.').pop() : undefined,
          size: new TextEncoder().encode(file.content).length,
        });
      } else {
        let next = currentNode.children?.find(
          (child) => child.name === segment && child.type === 'directory'
        );

        if (!next) {
          next = {
            name: segment,
            path: currentPath,
            type: 'directory',
            children: [],
          };
          currentNode.children?.push(next);
        }

        currentNode = next;
      }
    }
  }

  sortTree(root);
  return root;
}

function sortTree(node: TreeNode): void {
  if (!node.children) {
    return;
  }

  node.children.sort((left, right) => {
    if (left.type !== right.type) {
      return left.type === 'directory' ? -1 : 1;
    }
    return left.name.localeCompare(right.name);
  });

  node.children.forEach((child) => {
    if (child.type === 'directory') {
      sortTree(child);
    }
  });
}

export function validateGeneratedFiles(files: GeneratedFile[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const paths = new Set<string>();
  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    'next.config.js',
    'tailwind.config.ts',
    'src/app/layout.tsx',
    'src/app/page.tsx',
    'src/app/globals.css',
  ];

  for (const file of files) {
    if (paths.has(file.path)) {
      issues.push({
        severity: 'error',
        file: file.path,
        message: 'Duplicate file path detected.',
      });
    }
    paths.add(file.path);

    if (!file.content.trim()) {
      issues.push({
        severity: 'warning',
        file: file.path,
        message: 'File has empty content.',
      });
    }

    if (file.path.endsWith('.json')) {
      try {
        JSON.parse(file.content);
      } catch {
        issues.push({
          severity: 'error',
          file: file.path,
          message: 'Invalid JSON content.',
        });
      }
    }
  }

  for (const requiredFile of requiredFiles) {
    if (!paths.has(requiredFile)) {
      issues.push({
        severity: 'error',
        file: requiredFile,
        message: 'Required file is missing from generated project.',
      });
    }
  }

  return issues;
}

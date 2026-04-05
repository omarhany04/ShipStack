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

const REQUIRED_FILES = [
  'package.json',
  'tsconfig.json',
  'next.config.js',
  'tailwind.config.ts',
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/app/globals.css',
];

const SUPPORT_IMPORT_PATTERN =
  /@\/components\/ui\/|@\/components\/GeneratedImageFallback|@\/lib\/(?:utils|demo-media)/;

const INTERNAL_IMPORT_PATTERN =
  /(?:import|export)\s+(?:[^'"]*?\sfrom\s+)?['"](@\/[^'"]+)['"]|import\(\s*['"](@\/[^'"]+)['"]\s*\)/g;

const CODE_FILE_PATTERN = /\.(?:[cm]?[jt]sx?|css|scss|sass|less|json|mjs|cjs|prisma|html)$/i;

const UNSPLASH_PORTRAIT_URLS = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cG9ydHJhaXR8ZW58MHx8MHx8fDA%3D&ixlib=rb-4.1.0&q=60&w=3000',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cG9ydHJhaXR8ZW58MHx8MHx8fDA%3D&ixlib=rb-4.1.0&q=60&w=3000',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cG9ydHJhaXR8ZW58MHx8MHx8fDA%3D&ixlib=rb-4.1.0&q=60&w=3000',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHBvcnRyYWl0fGVufDB8fDB8fHww&ixlib=rb-4.1.0&q=60&w=3000',
  'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fHBvcnRyYWl0fGVufDB8fDB8fHww&ixlib=rb-4.1.0&q=60&w=3000',
];

const UNSPLASH_LANDSCAPE_URLS = [
  'https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8d29ya3NwYWNlfGVufDB8fDB8fHww&ixlib=rb-4.1.0&q=60&w=3000',
  'https://images.unsplash.com/photo-1568992687947-868a62a9f521?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8d29ya3NwYWNlfGVufDB8fDB8fHww&ixlib=rb-4.1.0&q=60&w=3000',
  'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8d29ya3NwYWNlfGVufDB8fDB8fHww&ixlib=rb-4.1.0&q=60&w=3000',
  'https://images.unsplash.com/photo-1502945015378-0e284ca1a5be?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8d29ya3NwYWNlfGVufDB8fDB8fHww&ixlib=rb-4.1.0&q=60&w=3000',
];

const GENERATED_SUPPORT_FILES: GeneratedFile[] = [
  {
    path: 'src/lib/utils.ts',
    content: `import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
`,
    source: 'template',
    description: 'Shared className utility',
  },
  {
    path: 'src/components/ui/button.tsx',
    content: `import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-slate-950 text-white hover:bg-slate-800',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
  outline: 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50',
  ghost: 'text-slate-700 hover:bg-slate-100',
  link: 'text-slate-950 underline-offset-4 hover:underline',
};

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-11 px-5 py-2',
  sm: 'h-9 rounded-md px-3',
  lg: 'h-12 rounded-xl px-6',
  icon: 'h-10 w-10',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { asChild = false, className, variant = 'default', size = 'default', type = 'button', children, ...props },
  ref
) {
  const classes = cn(
    'inline-flex items-center justify-center rounded-full text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:pointer-events-none disabled:opacity-50',
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  if (asChild && React.isValidElement<{ className?: string }>(children)) {
    return React.cloneElement(children, {
      className: cn(children.props.className, classes),
    });
  }

  return (
    <button ref={ref} type={type} className={classes} {...props}>
      {children}
    </button>
  );
});

Button.displayName = 'Button';
`,
    source: 'template',
    description: 'Fallback button primitive',
  },
  {
    path: 'src/components/ui/card.tsx',
    content: `import * as React from 'react';
import { cn } from '@/lib/utils';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function Card({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn('rounded-3xl border border-slate-200 bg-white/90 text-slate-950 shadow-sm', className)}
        {...props}
      />
    );
  }
);

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardHeader({ className, ...props }, ref) {
    return <div ref={ref} className={cn('flex flex-col gap-2 p-6', className)} {...props} />;
  }
);

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  function CardTitle({ className, ...props }, ref) {
    return <h3 ref={ref} className={cn('text-xl font-semibold tracking-tight', className)} {...props} />;
  }
);

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className, ...props }, ref) {
  return <p ref={ref} className={cn('text-sm leading-6 text-slate-500', className)} {...props} />;
});

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardContent({ className, ...props }, ref) {
    return <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />;
  }
);

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardFooter({ className, ...props }, ref) {
    return <div ref={ref} className={cn('flex items-center gap-3 p-6 pt-0', className)} {...props} />;
  }
);

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardTitle.displayName = 'CardTitle';
CardDescription.displayName = 'CardDescription';
CardContent.displayName = 'CardContent';
CardFooter.displayName = 'CardFooter';
`,
    source: 'template',
    description: 'Fallback card primitives',
  },
  {
    path: 'src/components/ui/badge.tsx',
    content: `import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {}

export function Badge({ className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700',
        className
      )}
      {...props}
    />
  );
}
`,
    source: 'template',
    description: 'Fallback badge primitive',
  },
  {
    path: 'src/components/ui/input.tsx',
    content: `import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
`,
    source: 'template',
    description: 'Fallback input primitive',
  },
  {
    path: 'src/components/ui/textarea.tsx',
    content: `import * as React from 'react';
import { cn } from '@/lib/utils';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'min-h-[120px] w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200',
        className
      )}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';
`,
    source: 'template',
    description: 'Fallback textarea primitive',
  },
  {
    path: 'src/components/ui/label.tsx',
    content: `import * as React from 'react';
import { cn } from '@/lib/utils';

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  function Label({ className, ...props }, ref) {
    return <label ref={ref} className={cn('text-sm font-medium text-slate-700', className)} {...props} />;
  }
);

Label.displayName = 'Label';
`,
    source: 'template',
    description: 'Fallback label primitive',
  },
  {
    path: 'src/components/ui/separator.tsx',
    content: `import * as React from 'react';
import { cn } from '@/lib/utils';

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

export function Separator({
  className,
  orientation = 'horizontal',
  ...props
}: SeparatorProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'shrink-0 bg-slate-200',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className
      )}
      {...props}
    />
  );
}
`,
    source: 'template',
    description: 'Fallback separator primitive',
  },
  {
    path: 'src/components/ui/sparkles-core.tsx',
    content: `import * as React from 'react';
import { cn } from '@/lib/utils';

interface SparklesCoreProps extends React.HTMLAttributes<HTMLDivElement> {
  background?: string;
  minSize?: number;
  maxSize?: number;
  particleDensity?: number;
  particleColor?: string;
  particleOpacity?: number;
  speed?: number;
}

export function SparklesCore({
  className,
  background = 'transparent',
  minSize = 0.8,
  maxSize = 1.8,
  particleDensity = 60,
  particleColor = 'rgba(255,255,255,0.9)',
  particleOpacity = 0.85,
  speed = 1,
  style,
  ...props
}: SparklesCoreProps) {
  const particleCount = Math.max(16, Math.min(90, Math.round(particleDensity)));
  const sizeRange = Math.max(maxSize - minSize, 0.1);

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      style={{ background, ...style }}
      {...props}
    >
      {Array.from({ length: particleCount }, (_, index) => {
        const size = minSize + (sizeRange * ((index % 7) / 6));
        const left = (index * 17) % 100;
        const top = (index * 29) % 100;
        const duration = Math.max(2.8, 5.2 / Math.max(speed, 0.25)) + (index % 5) * 0.35;

        return (
          <span
            key={index}
            className="absolute rounded-full animate-pulse"
            style={{
              left: left + '%',
              top: top + '%',
              width: size + 'px',
              height: size + 'px',
              backgroundColor: particleColor,
              opacity: particleOpacity,
              animationDelay: index * 0.08 + 's',
              animationDuration: duration + 's',
            }}
          />
        );
      })}
    </div>
  );
}
`,
    source: 'template',
    description: 'Fallback sparkles background component',
  },
  {
    path: 'src/lib/demo-media.ts',
    content: `const UNSPLASH_PORTRAIT_URLS = ${JSON.stringify(UNSPLASH_PORTRAIT_URLS, null, 2)};

const UNSPLASH_LANDSCAPE_URLS = ${JSON.stringify(UNSPLASH_LANDSCAPE_URLS, null, 2)};

const SQUARE_IMAGE_HINTS = [
  'avatar',
  'profile',
  'author',
  'user',
  'member',
  'team',
  'person',
  'testimonial',
];

const WIDE_IMAGE_HINTS = [
  'hero',
  'banner',
  'cover',
  'header',
  'background',
  'feature',
  'landing',
  'showcase',
];

export function normalizeDemoToken(value: string, fallback = 'demo-photo') {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || fallback;
}

export function normalizeDemoLabel(value: string, fallback = 'Demo Photo') {
  const normalized = value
    .replace(/[_-]+/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim();

  if (!normalized) {
    return fallback;
  }

  return normalized
    .split(' ')
    .slice(0, 4)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getDemoImageUrl(seed: string, label = 'Demo Photo', _variant?: string) {
  const normalizedSeed = normalizeDemoToken(seed);
  const normalizedLabel = normalizeDemoLabel(label).toLowerCase();
  const context = normalizedSeed + ' ' + normalizedLabel;
  const size = pickDemoImageSize(context);
  const library = pickUnsplashLibrary(context);
  const baseUrl = library[hashString(context) % library.length];

  return formatUnsplashUrl(baseUrl, size.width, size.height);
}

function pickDemoImageSize(context: string) {
  if (SQUARE_IMAGE_HINTS.some((hint) => context.includes(hint))) {
    return { width: 640, height: 640 };
  }

  if (WIDE_IMAGE_HINTS.some((hint) => context.includes(hint))) {
    return { width: 1600, height: 900 };
  }

  return { width: 1200, height: 900 };
}

function pickUnsplashLibrary(context: string) {
  return SQUARE_IMAGE_HINTS.some((hint) => context.includes(hint))
    ? UNSPLASH_PORTRAIT_URLS
    : UNSPLASH_LANDSCAPE_URLS;
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function formatUnsplashUrl(rawUrl: string, width: number, height: number) {
  const url = new URL(rawUrl);
  url.searchParams.set('auto', 'format');
  url.searchParams.set('fit', 'crop');
  url.searchParams.set('fm', 'jpg');
  url.searchParams.set('q', '80');
  url.searchParams.set('w', String(width));
  url.searchParams.set('h', String(height));
  return url.toString();
}
`,
    source: 'template',
    description: 'Shared demo image utilities',
  },
  {
    path: 'src/app/api/demo-image/route.ts',
    content: `import { NextRequest, NextResponse } from 'next/server';
import { getDemoImageUrl, normalizeDemoLabel, normalizeDemoToken } from '@/lib/demo-media';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const seed = normalizeDemoToken(searchParams.get('seed') ?? 'demo-photo');
  const label = normalizeDemoLabel(searchParams.get('label') ?? 'Demo Photo');
  const response = NextResponse.redirect(getDemoImageUrl(seed, label), 307);
  response.headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  return response;
}
`,
    source: 'template',
    description: 'Generated demo image API route',
  },
  {
    path: 'src/components/GeneratedImageFallback.tsx',
    content: `'use client';

import { useEffect } from 'react';
import { getDemoImageUrl, normalizeDemoLabel, normalizeDemoToken } from '@/lib/demo-media';

const INVALID_IMAGE_VALUES = new Set(['', '/', 'undefined', 'null']);

export function GeneratedImageFallback() {
  useEffect(() => {
    const scanNode = (root: ParentNode) => {
      root.querySelectorAll('img').forEach((node) => {
        if (node instanceof HTMLImageElement) {
          applyFallback(node);
        }
      });
    };

    const handleError = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement)) {
        return;
      }

      target.dataset.demoFallbackApplied = '';
      applyFallback(target, true);
    };

    scanNode(document);
    document.addEventListener('error', handleError, true);

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'attributes' && record.target instanceof HTMLImageElement) {
          record.target.dataset.demoFallbackApplied = '';
          applyFallback(record.target);
        }

        for (const node of Array.from(record.addedNodes)) {
          if (node instanceof HTMLImageElement) {
            applyFallback(node);
            continue;
          }

          if (node instanceof HTMLElement) {
            scanNode(node);
          }
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src'],
    });

    return () => {
      document.removeEventListener('error', handleError, true);
      observer.disconnect();
    };
  }, []);

  return null;
}

function applyFallback(image: HTMLImageElement, force = false) {
  if (image.dataset.demoFallbackApplied === 'true') {
    return;
  }

  const rawSrc = (image.getAttribute('src') ?? '').trim();
  if (!force && !shouldForceFallback(rawSrc)) {
    return;
  }

  image.dataset.demoFallbackApplied = 'true';
  image.removeAttribute('srcset');
  image.src = getDemoImageUrl(buildSeed(image), buildLabel(image));
}

function shouldForceFallback(rawSrc: string) {
  if (INVALID_IMAGE_VALUES.has(rawSrc)) {
    return true;
  }

  return rawSrc.includes('undefined') || rawSrc.includes('null');
}

function buildSeed(image: HTMLImageElement) {
  return normalizeDemoToken(
    image.getAttribute('data-demo-seed') ??
      image.getAttribute('alt') ??
      image.getAttribute('src') ??
      'demo-photo',
    'demo-photo'
  );
}

function buildLabel(image: HTMLImageElement) {
  return normalizeDemoLabel(image.getAttribute('alt') ?? 'Demo Photo');
}
`,
    source: 'template',
    description: 'Global generated image fallback component',
  },
];

export function normalizeGeneratedFiles(
  files: GeneratedFile[],
  projectName?: string
): GeneratedFile[] {
  const resolvedProjectName = sanitizeProjectName(projectName ?? inferProjectName(files) ?? 'generated-app');
  const normalized = files.map((file) => ({
    ...file,
    content: normalizeFileContent(file, resolvedProjectName),
  }));

  return injectSupportFiles(normalized);
}

export function prepareGeneratedFiles(files: GeneratedFile[], projectName?: string): GeneratedFile[] {
  const resolvedProjectName = sanitizeProjectName(projectName ?? inferProjectName(files) ?? 'generated-app');
  return injectSupportFiles(
    ensureCriticalFiles(normalizeGeneratedFiles(files, resolvedProjectName), resolvedProjectName)
  );
}

export function buildFileSystemTree(files: GeneratedFile[]): FileSystemTree {
  const preparedFiles = prepareGeneratedFiles(files);
  const tree: FileSystemTree = {};

  for (const file of preparedFiles) {
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
  for (const file of prepareGeneratedFiles(files)) {
    flat[file.path] = file.content;
  }
  return flat;
}

export function buildDisplayTree(files: GeneratedFile[]): TreeNode {
  const preparedFiles = prepareGeneratedFiles(files);
  const root: TreeNode = {
    name: '/',
    path: '/',
    type: 'directory',
    children: [],
  };

  for (const file of preparedFiles) {
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
  const normalizedFiles = normalizeGeneratedFiles(files);
  const issues: ValidationIssue[] = [];
  const paths = new Set<string>();

  for (const file of normalizedFiles) {
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

  for (const requiredFile of REQUIRED_FILES) {
    if (!paths.has(requiredFile)) {
      issues.push({
        severity: 'error',
        file: requiredFile,
        message: 'Required file is missing from generated project.',
      });
    }
  }

  const missingImports = collectMissingInternalImports(normalizedFiles, paths);
  for (const missingImport of missingImports) {
    issues.push({
      severity: 'error',
      file: missingImport.file,
      message: `Local import could not be resolved: ${missingImport.specifier}`,
    });
  }

  return issues;
}

function normalizeFileContent(file: GeneratedFile, projectName: string) {
  let content = stripMarkdownCodeWrappers(file.path, file.content);

  if (file.path === 'package.json') {
    try {
      const pkg = JSON.parse(content);
      pkg.name = projectName;
      content = JSON.stringify(pkg, null, 2);
    } catch {}
  }

  if (
    (file.path.endsWith('.ts') ||
      file.path.endsWith('.tsx') ||
      file.path.endsWith('.js') ||
      file.path.endsWith('.jsx')) &&
    content.includes('use client')
  ) {
    if (!content.startsWith("'use client'") && !content.startsWith('"use client"')) {
      content = content.replace(/['"]use client['"];?\s*/, '');
      content = `'use client';\n\n${content}`;
    }
  }

  if (file.path === 'src/app/layout.tsx') {
    content = ensureGeneratedImageFallbackLayout(content);
  }

  content = replacePlaceholderImageUrls(content, projectName, file.path);
  content = replaceLocalDemoImageUrls(content, projectName, file.path);

  return content;
}

function stripMarkdownCodeWrappers(filePath: string, content: string) {
  if (!CODE_FILE_PATTERN.test(filePath)) {
    return content;
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return content;
  }

  const completeFenceMatch = trimmed.match(/^```(?:[\w.+-]+)?\s*\n([\s\S]*?)\n```$/);
  if (completeFenceMatch) {
    return completeFenceMatch[1].trim();
  }

  if (/^```(?:[\w.+-]+)?\s*\n/.test(trimmed)) {
    return trimmed
      .replace(/^```(?:[\w.+-]+)?\s*\n/, '')
      .replace(/\n```[\t ]*$/, '')
      .trim();
  }

  const fencedBlocks = [...trimmed.matchAll(/```(?:[\w.+-]+)?\s*\n([\s\S]*?)\n```/g)];
  if (fencedBlocks.length === 1) {
    return fencedBlocks[0][1].trim();
  }

  return content;
}

function injectSupportFiles(files: GeneratedFile[]) {
  const shouldInjectSupportFiles = files.some((file) => SUPPORT_IMPORT_PATTERN.test(file.content));
  if (!shouldInjectSupportFiles) {
    return files;
  }

  const prepared = [...files];
  const paths = new Set(prepared.map((file) => file.path));

  for (const supportFile of GENERATED_SUPPORT_FILES) {
    if (paths.has(supportFile.path)) {
      continue;
    }

    paths.add(supportFile.path);
    prepared.push(supportFile);
  }

  return prepared;
}

function ensureGeneratedImageFallbackLayout(content: string) {
  const importLine = `import { GeneratedImageFallback } from '@/components/GeneratedImageFallback';`;
  let updated = content;

  if (!updated.includes(importLine)) {
    const importMatches = [...updated.matchAll(/^import .*;$/gm)];
    if (importMatches.length > 0) {
      const lastImport = importMatches[importMatches.length - 1];
      const insertAt = (lastImport.index ?? 0) + lastImport[0].length;
      updated = `${updated.slice(0, insertAt)}\n${importLine}${updated.slice(insertAt)}`;
    } else {
      updated = `${importLine}\n${updated}`;
    }
  }

  if (!updated.includes('<GeneratedImageFallback />')) {
    updated = updated.replace(/(<body\b[^>]*>)/, '$1\n              <GeneratedImageFallback />');
  }

  return updated;
}

function replacePlaceholderImageUrls(content: string, projectName: string, filePath: string) {
  const placeholderPattern =
    /https?:\/\/(?:via\.placeholder\.com|placehold\.co|dummyimage\.com)[^'"`\s)]+/gi;

  if (!placeholderPattern.test(content)) {
    return content;
  }

  placeholderPattern.lastIndex = 0;
  let replacementIndex = 0;
  return content.replace(placeholderPattern, () => {
    replacementIndex += 1;
    return buildStaticDemoImageUrl(
      `${projectName}-${filePath}-${replacementIndex}`,
      labelFromPath(filePath)
    );
  });
}

function replaceLocalDemoImageUrls(content: string, projectName: string, filePath: string) {
  const demoRoutePattern = /\/api\/demo-image\?[^'"`\s)]+/gi;

  if (!demoRoutePattern.test(content)) {
    return content;
  }

  demoRoutePattern.lastIndex = 0;
  let replacementIndex = 0;

  return content.replace(demoRoutePattern, (rawMatch) => {
    replacementIndex += 1;
    const query = rawMatch.split('?')[1] ?? '';
    const params = new URLSearchParams(query);
    const seed = params.get('seed') ?? `${projectName}-${filePath}-${replacementIndex}`;
    const label = params.get('label') ?? labelFromPath(filePath);
    return buildStaticDemoImageUrl(seed, label);
  });
}

function ensureCriticalFiles(files: GeneratedFile[], projectName: string) {
  const prepared = [...files];
  const paths = new Set(prepared.map((file) => file.path));

  if (!paths.has('package.json')) {
    prepared.push({
      path: 'package.json',
      content: JSON.stringify(
        {
          name: projectName,
          version: '0.1.0',
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
            clsx: '^2.1.1',
          },
          devDependencies: {
            typescript: '^5.8.3',
            '@types/node': '^20.17.46',
            '@types/react': '^18.3.18',
            '@types/react-dom': '^18.3.5',
            tailwindcss: '^3.4.17',
            postcss: '^8.5.3',
            autoprefixer: '^10.4.20',
          },
        },
        null,
        2
      ),
      source: 'template',
      description: 'Fallback package.json',
    });
  }

  if (!paths.has('tsconfig.json')) {
    prepared.push({
      path: 'tsconfig.json',
      content: JSON.stringify(
        {
          compilerOptions: {
            target: 'es2022',
            lib: ['dom', 'dom.iterable', 'es2022'],
            allowJs: false,
            skipLibCheck: true,
            strict: true,
            noEmit: true,
            esModuleInterop: true,
            module: 'esnext',
            moduleResolution: 'bundler',
            resolveJsonModule: true,
            isolatedModules: true,
            jsx: 'preserve',
            incremental: true,
            plugins: [{ name: 'next' }],
            baseUrl: '.',
            paths: {
              '@/*': ['./src/*'],
            },
          },
          include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
          exclude: ['node_modules'],
        },
        null,
        2
      ),
      source: 'template',
      description: 'Fallback TypeScript config',
    });
  }

  if (!paths.has('next.config.js')) {
    prepared.push({
      path: 'next.config.js',
      content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'images.unsplash.com',
          },
        ],
      },
};

module.exports = nextConfig;
`,
      source: 'template',
      description: 'Fallback Next.js config',
    });
  }

  if (!paths.has('tailwind.config.ts')) {
    prepared.push({
      path: 'tailwind.config.ts',
      content: `import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
`,
      source: 'template',
      description: 'Fallback Tailwind config',
    });
  }

  if (!paths.has('postcss.config.js')) {
    prepared.push({
      path: 'postcss.config.js',
      content: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`,
      source: 'template',
      description: 'Fallback PostCSS config',
    });
  }

  if (!paths.has('src/app/layout.tsx')) {
    prepared.push({
      path: 'src/app/layout.tsx',
      content: `import { GeneratedImageFallback } from '@/components/GeneratedImageFallback';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <GeneratedImageFallback />
        {children}
      </body>
    </html>
  );
}
`,
      source: 'template',
      description: 'Fallback layout',
    });
  }

  if (!paths.has('src/app/page.tsx')) {
    prepared.push({
      path: 'src/app/page.tsx',
      content: `export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-24">
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Generated App</p>
        <h1 className="mt-4 text-4xl font-bold text-slate-950">${projectName}</h1>
      </div>
    </main>
  );
}
`,
      source: 'template',
      description: 'Fallback home page',
    });
  }

  if (!paths.has('src/app/globals.css')) {
    prepared.push({
      path: 'src/app/globals.css',
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  color-scheme: light;
}

body {
  margin: 0;
  min-height: 100vh;
  background: #f8fafc;
  color: #0f172a;
}

* {
  box-sizing: border-box;
}
`,
      source: 'template',
      description: 'Fallback global CSS',
    });
  }

  return prepared;
}

function inferProjectName(files: GeneratedFile[]) {
  const packageFile = files.find((file) => file.path === 'package.json');
  if (!packageFile) {
    return null;
  }

  try {
    const pkg = JSON.parse(packageFile.content);
    return typeof pkg.name === 'string' && pkg.name.trim() ? pkg.name.trim() : null;
  } catch {
    return null;
  }
}

function sanitizeProjectName(projectName: string) {
  const cleaned = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return cleaned || 'generated-app';
}

function buildStaticDemoImageUrl(seedSource: string, labelSource: string) {
  const seed = sanitizeProjectName(`${seedSource}-${labelSource}`);
  const context = `${seed} ${normalizeStaticLabel(labelSource).toLowerCase()}`;
  const size = pickStaticDemoImageSize(context);
  const library = /(avatar|profile|author|user|member|team|person|testimonial)/i.test(context)
    ? UNSPLASH_PORTRAIT_URLS
    : UNSPLASH_LANDSCAPE_URLS;
  const baseUrl = library[hashStaticString(context) % library.length];

  return formatStaticUnsplashUrl(baseUrl, size.width, size.height);
}

function labelFromPath(filePath: string) {
  const fileName = filePath.split('/').pop() ?? 'demo-photo';
  const baseName = fileName.replace(/\.[^.]+$/, '');

  return normalizeStaticLabel(baseName);
}

function normalizeStaticLabel(value: string) {
  const cleaned = value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return 'Demo Photo';
  }

  return cleaned
    .split(' ')
    .slice(0, 4)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function pickStaticDemoImageSize(context: string) {
  if (/(avatar|profile|author|user|member|team|person|testimonial)/i.test(context)) {
    return { width: 640, height: 640 };
  }

  if (/(hero|banner|cover|header|background|feature|landing|showcase)/i.test(context)) {
    return { width: 1600, height: 900 };
  }

  return { width: 1200, height: 900 };
}

function hashStaticString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function formatStaticUnsplashUrl(rawUrl: string, width: number, height: number) {
  const url = new URL(rawUrl);
  url.searchParams.set('auto', 'format');
  url.searchParams.set('fit', 'crop');
  url.searchParams.set('fm', 'jpg');
  url.searchParams.set('q', '80');
  url.searchParams.set('w', String(width));
  url.searchParams.set('h', String(height));
  return url.toString();
}

function collectMissingInternalImports(files: GeneratedFile[], paths: Set<string>) {
  const missing = new Map<string, { file: string; specifier: string }>();

  for (const file of files) {
    if (!/\.(ts|tsx|js|jsx)$/.test(file.path)) {
      continue;
    }

    INTERNAL_IMPORT_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = INTERNAL_IMPORT_PATTERN.exec(file.content)) !== null) {
      const specifier = match[1] ?? match[2];
      if (!specifier || hasLocalModule(paths, specifier)) {
        continue;
      }

      missing.set(`${file.path}:${specifier}`, {
        file: file.path,
        specifier,
      });
    }
  }

  return [...missing.values()];
}

function hasLocalModule(paths: Set<string>, specifier: string) {
  return resolveAliasCandidates(specifier).some((candidate) => paths.has(candidate));
}

function resolveAliasCandidates(specifier: string) {
  const basePath = `src/${specifier.slice(2)}`;

  if (/\.[a-z]+$/i.test(basePath)) {
    return [basePath];
  }

  return [
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    `${basePath}/index.ts`,
    `${basePath}/index.tsx`,
    `${basePath}/index.js`,
    `${basePath}/index.jsx`,
  ];
}

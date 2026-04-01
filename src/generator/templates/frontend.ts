import { Blueprint, BlueprintDataModel, BlueprintPage } from '@/validators/blueprint.validator';
import { GeneratedFile } from '../types';
import { dedent, joinBlocks } from '../template-engine';

export function generateFrontendFiles(blueprint: Blueprint): GeneratedFile[] {
  const files: GeneratedFile[] = [
    generateRootLayout(blueprint),
    generateNavigation(blueprint),
    generateTypeDefinitions(blueprint),
  ];

  for (const page of blueprint.pages) {
    files.push(generatePage(page, blueprint));
  }

  files.push(generateLoadingSpinner());
  files.push(generateErrorDisplay());
  files.push(generateEmptyState());
  files.push(generateDataTable());

  return files;
}

function generateRootLayout(blueprint: Blueprint): GeneratedFile {
  const appName = toTitleCase(blueprint.projectName);
  return {
    path: 'src/app/layout.tsx',
    content: dedent(`
      import type { Metadata } from 'next';
      import { Space_Grotesk } from 'next/font/google';
      import './globals.css';
      import Navigation from '@/components/Navigation';

      const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

      export const metadata: Metadata = {
        title: '${appName}',
        description: '${blueprint.description}',
      };

      export default function RootLayout({
        children,
      }: {
        children: React.ReactNode;
      }) {
        return (
          <html lang="en">
            <body className={spaceGrotesk.className}>
              <div className="min-h-screen bg-gray-50">
                <Navigation />
                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                  {children}
                </main>
              </div>
            </body>
          </html>
        );
      }
    `),
    source: 'template',
    description: 'Generated project root layout',
  };
}

function generateNavigation(blueprint: Blueprint): GeneratedFile {
  const appName = toTitleCase(blueprint.projectName);
  const navLinks = blueprint.pages
    .filter((page) => page.route !== '/')
    .slice(0, 6)
    .map((page) => `      { name: '${page.name}', href: '${page.route}' },`)
    .join('\n');

  return {
    path: 'src/components/Navigation.tsx',
    content: dedent(`
      'use client';

      import clsx from 'clsx';
      import Link from 'next/link';
      import { usePathname } from 'next/navigation';
      import { useState } from 'react';

      const navigation = [
        { name: 'Home', href: '/' },
      ${navLinks}
      ];

      export default function Navigation() {
        const pathname = usePathname();
        const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

        return (
          <nav className="border-b border-gray-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center gap-8">
                  <Link href="/" className="text-xl font-bold text-primary-600">
                    ${appName}
                  </Link>
                  <div className="hidden items-center gap-6 sm:flex">
                    {navigation.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={clsx(
                          'text-sm font-medium transition-colors',
                          pathname === item.href ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
                        )}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((value) => !value)}
                  className="rounded-md p-2 text-gray-500 hover:bg-gray-100 sm:hidden"
                >
                  Menu
                </button>
              </div>
            </div>
            {mobileMenuOpen && (
              <div className="border-t border-gray-200 bg-white px-4 py-3 sm:hidden">
                <div className="flex flex-col gap-3">
                  {navigation.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={clsx(
                        'text-sm font-medium',
                        pathname === item.href ? 'text-primary-600' : 'text-gray-600'
                      )}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </nav>
        );
      }
    `),
    source: 'template',
    description: 'Generated navigation',
  };
}

function generateTypeDefinitions(blueprint: Blueprint): GeneratedFile {
  const typeBlocks = blueprint.dataModels.map((model) => {
    const fields = model.fields
      .filter((field) => field.type !== 'relation')
      .map((field) => `  ${field.name}${field.required ? '' : '?'}: ${blueprintTypeToTs(field.type)};`)
      .join('\n');
    return `export interface ${model.name} {\n${fields}\n}`;
  });

  const inputBlocks = blueprint.dataModels.map((model) => {
    const fields = model.fields
      .filter((field) => !['id', 'createdAt', 'updatedAt'].includes(field.name) && field.type !== 'relation')
      .map((field) => `  ${field.name}?: ${blueprintTypeToTs(field.type)};`)
      .join('\n');
    return `export interface ${model.name}Input {\n${fields}\n}`;
  });

  return {
    path: 'src/types/index.ts',
    content: joinBlocks(
      '// Auto-generated from blueprint',
      ...typeBlocks,
      ...inputBlocks,
      dedent(`
        export interface ApiResponse<T> {
          success: boolean;
          data?: T;
          error?: string;
          message?: string;
        }

        export interface PaginatedResponse<T> {
          success: boolean;
          data: T[];
          total: number;
          page: number;
          pageSize: number;
          totalPages: number;
        }
      `)
    ),
    source: 'template',
    description: 'Generated type definitions',
  };
}

function generatePage(page: BlueprintPage, blueprint: Blueprint): GeneratedFile {
  if (page.route === '/' || page.route === '/home') {
    return generateHomePage(page, blueprint);
  }

  const relatedModel = findRelatedModel(page, blueprint);
  if (relatedModel) {
    return generateModelListPage(page, relatedModel);
  }

  return generateGenericPage(page);
}

function generateHomePage(page: BlueprintPage, blueprint: Blueprint): GeneratedFile {
  const appName = toTitleCase(blueprint.projectName);
  const featureCards = blueprint.features
    .slice(0, 6)
    .map(
      (feature) => dedent(`
        <div key="${feature.name}" className="card">
          <h3 className="text-lg font-semibold text-gray-900">${feature.name}</h3>
          <p className="mt-2 text-sm text-gray-600">${feature.description}</p>
        </div>
      `)
    )
    .join('\n');

  const quickLinks = blueprint.pages
    .filter((entry) => entry.route !== '/' && entry.route !== '/home')
    .slice(0, 4)
    .map((entry) => `<Link href="${entry.route}" className="btn-primary">${entry.name}</Link>`)
    .join('\n              ');

  return {
    path: 'src/app/page.tsx',
    content: dedent(`
      import Link from 'next/link';

      export default function HomePage() {
        return (
          <div className="space-y-12">
            <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 px-8 py-16 text-white shadow-xl">
              <p className="text-sm uppercase tracking-[0.24em] text-orange-200">Generated Product</p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">${appName}</h1>
              <p className="mt-6 max-w-2xl text-lg text-slate-200">
                ${blueprint.description}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                ${quickLinks}
              </div>
            </section>

            <section>
              <div className="page-header">
                <h2 className="page-title">${page.name}</h2>
                <p className="page-description">${page.description}</p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                ${featureCards}
              </div>
            </section>
          </div>
        );
      }
    `),
    source: 'template',
    description: 'Generated home page',
  };
}

function generateModelListPage(page: BlueprintPage, model: BlueprintDataModel): GeneratedFile {
  const modelLower = model.name.charAt(0).toLowerCase() + model.name.slice(1);
  const displayFields = model.fields
    .filter((field) => !['id', 'createdAt', 'updatedAt'].includes(field.name) && field.type !== 'relation')
    .slice(0, 5);

  const interfaceFields = displayFields
    .map((field) => `  ${field.name}: ${blueprintTypeToTs(field.type)};`)
    .join('\n');

  const headers = displayFields
    .map(
      (field) =>
        `                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">${toTitleCase(field.name)}</th>`
    )
    .join('\n');

  const cells = displayFields
    .map((field) => {
      if (field.type === 'boolean') {
        return `                  <td className="px-4 py-4 text-sm text-gray-600">{item.${field.name} ? 'Yes' : 'No'}</td>`;
      }
      if (field.type === 'date') {
        return `                  <td className="px-4 py-4 text-sm text-gray-600">{new Date(item.${field.name}).toLocaleDateString()}</td>`;
      }
      return `                  <td className="px-4 py-4 text-sm text-gray-600">{item.${field.name}}</td>`;
    })
    .join('\n');

  return {
    path: `src/app${normalizeRoutePath(page.route)}/page.tsx`,
    content: dedent(`
      'use client';

      import { useEffect, useState } from 'react';
      import EmptyState from '@/components/EmptyState';
      import ErrorDisplay from '@/components/ErrorDisplay';
      import LoadingSpinner from '@/components/LoadingSpinner';

      interface ${model.name}Item {
        id: string;
      ${interfaceFields}
      }

      export default function ${toPascalCase(page.name)}Page() {
        const [items, setItems] = useState<${model.name}Item[]>([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);

        useEffect(() => {
          void fetchItems();
        }, []);

        async function fetchItems() {
          try {
            setLoading(true);
            setError(null);
            const response = await fetch('/api/${modelLower}s');
            if (!response.ok) {
              throw new Error('Failed to fetch ${page.name}');
            }
            const payload = await response.json();
            setItems(payload.data?.data ?? payload.data ?? []);
          } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : 'Unknown error');
          } finally {
            setLoading(false);
          }
        }

        if (loading) return <LoadingSpinner message="Loading ${page.name}..." />;
        if (error) return <ErrorDisplay message={error} onRetry={() => void fetchItems()} />;

        return (
          <div>
            <div className="page-header">
              <h1 className="page-title">${page.name}</h1>
              <p className="page-description">${page.description}</p>
            </div>

            {items.length === 0 ? (
              <EmptyState
                title="No ${model.name} items yet"
                description="Get started by adding your first ${model.name}."
              />
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
      ${headers}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
      ${cells}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      }
    `),
    source: 'template',
    description: `Generated list page for ${model.name}`,
  };
}

function generateGenericPage(page: BlueprintPage): GeneratedFile {
  return {
    path: `src/app${normalizeRoutePath(page.route)}/page.tsx`,
    content: dedent(`
      export default function ${toPascalCase(page.name)}Page() {
        return (
          <div>
            <div className="page-header">
              <h1 className="page-title">${page.name}</h1>
              <p className="page-description">${page.description}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">
                This page was scaffolded from the blueprint and is ready for custom logic.
              </p>
            </div>
          </div>
        );
      }
    `),
    source: 'template',
    description: `Generated generic page for ${page.name}`,
  };
}

function generateLoadingSpinner(): GeneratedFile {
  return {
    path: 'src/components/LoadingSpinner.tsx',
    content: dedent(`
      export default function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
        return (
          <div className="flex min-h-[220px] flex-col items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600" />
            <p className="mt-4 text-sm text-gray-500">{message}</p>
          </div>
        );
      }
    `),
    source: 'template',
    description: 'Generated loading spinner',
  };
}

function generateErrorDisplay(): GeneratedFile {
  return {
    path: 'src/components/ErrorDisplay.tsx',
    content: dedent(`
      interface ErrorDisplayProps {
        message: string;
        onRetry?: () => void;
      }

      export default function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
        return (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-base font-semibold text-red-800">Something went wrong</p>
            <p className="mt-2 text-sm text-red-600">{message}</p>
            {onRetry ? (
              <button onClick={onRetry} className="btn-primary mt-4">
                Try again
              </button>
            ) : null}
          </div>
        );
      }
    `),
    source: 'template',
    description: 'Generated error display',
  };
}

function generateEmptyState(): GeneratedFile {
  return {
    path: 'src/components/EmptyState.tsx',
    content: dedent(`
      interface EmptyStateProps {
        title: string;
        description: string;
      }

      export default function EmptyState({ title, description }: EmptyStateProps) {
        return (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-10 text-center">
            <p className="text-base font-semibold text-gray-900">{title}</p>
            <p className="mt-2 text-sm text-gray-500">{description}</p>
          </div>
        );
      }
    `),
    source: 'template',
    description: 'Generated empty state',
  };
}

function generateDataTable(): GeneratedFile {
  return {
    path: 'src/components/DataTable.tsx',
    content: dedent(`
      'use client';

      interface Column<T> {
        key: keyof T;
        label: string;
        render?: (value: T[keyof T], item: T) => React.ReactNode;
      }

      interface DataTableProps<T extends { id: string }> {
        columns: Column<T>[];
        data: T[];
      }

      export default function DataTable<T extends { id: string }>({
        columns,
        data,
      }: DataTableProps<T>) {
        return (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={String(column.key)}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    {columns.map((column) => (
                      <td key={String(column.key)} className="px-4 py-4 text-sm text-gray-600">
                        {column.render ? column.render(item[column.key], item) : String(item[column.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    `),
    source: 'template',
    description: 'Generated data table',
  };
}

function findRelatedModel(page: BlueprintPage, blueprint: Blueprint) {
  const pageName = page.name.toLowerCase();
  const route = page.route.toLowerCase();

  for (const model of blueprint.dataModels) {
    const singular = model.name.toLowerCase();
    const plural = singular.endsWith('s') ? singular : `${singular}s`;
    if (
      pageName.includes(singular) ||
      pageName.includes(plural) ||
      route.includes(singular) ||
      route.includes(plural)
    ) {
      return model;
    }
  }

  return null;
}

function normalizeRoutePath(route: string) {
  if (route === '/' || route === '/home') {
    return '';
  }
  return route.startsWith('/') ? route : `/${route}`;
}

function toTitleCase(value: string) {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function toPascalCase(value: string) {
  return value
    .replace(/[-_\s]+(.)?/g, (_match, character: string | undefined) =>
      character ? character.toUpperCase() : ''
    )
    .replace(/^(.)/, (_match, character: string) => character.toUpperCase());
}

function blueprintTypeToTs(type: string) {
  switch (type) {
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'date':
      return 'string';
    default:
      return 'string';
  }
}

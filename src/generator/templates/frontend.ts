import {
  Blueprint,
  BlueprintApiEndpoint,
  BlueprintDataModel,
  BlueprintFeature,
  BlueprintField,
  BlueprintPage,
} from '@/validators/blueprint.validator';
import {
  getGeneratedPageFilePath,
  isDynamicGeneratedRoute,
  normalizeGeneratedRoute,
} from '@/lib/generated-route';
import { DesignProfile } from '../design-system';
import { GeneratedFile } from '../types';
import { dedent, joinBlocks } from '../template-engine';

interface SerializedPageLink {
  name: string;
  route: string;
  description: string;
}

interface SerializedFeatureCard {
  name: string;
  description: string;
  priority: string;
}

interface SerializedModelCard {
  name: string;
  fieldCount: number;
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
  }>;
  description: string;
}

interface SerializedEndpointCard {
  method: string;
  path: string;
  description: string;
  relatedModel: string;
}

export function generateFrontendFiles(
  blueprint: Blueprint,
  designProfile: DesignProfile
): GeneratedFile[] {
  const files: GeneratedFile[] = [
    generateRootLayout(blueprint, designProfile),
    generateNavigation(blueprint, designProfile),
    generateSharedTypes(blueprint),
    generateLoadingStateComponent(),
    generateEmptyStateComponent(),
    generateCollectionExplorerComponent(),
    generateDashboardComponent(blueprint, designProfile),
  ];

  const seenPaths = new Set(files.map((file) => file.path));

  for (const page of blueprint.pages) {
    const generated = generatePageFile(page, blueprint, designProfile);
    if (!seenPaths.has(generated.path)) {
      seenPaths.add(generated.path);
      files.push(generated);
    }
  }

  return files;
}

function generateRootLayout(blueprint: Blueprint, designProfile: DesignProfile): GeneratedFile {
  const headingFont = designProfile.fonts.heading;
  const bodyFont = designProfile.fonts.body;
  const footerLinks = serializeValue(getPreferredPageLinks(blueprint.pages).slice(0, 6));

  return {
    path: 'src/app/layout.tsx',
    content: dedent(`
      import type { Metadata } from 'next';
      import { ${headingFont.importName}, ${bodyFont.importName} } from 'next/font/google';
      import '@/app/globals.css';
      import { Navigation } from '@/components/Navigation';

      const ${headingFont.constName} = ${headingFont.importName}(${headingFont.options});
      const ${bodyFont.constName} = ${bodyFont.importName}(${bodyFont.options});

      const footerLinks = ${footerLinks};

      export const metadata: Metadata = {
        title: '${toTitleCase(blueprint.projectName)}',
        description: ${JSON.stringify(blueprint.description)},
      };

      export default function RootLayout({
        children,
      }: Readonly<{
        children: React.ReactNode;
      }>) {
        return (
          <html lang="en">
            <body
              className={[${headingFont.constName}.variable, ${bodyFont.constName}.variable, 'app-shell'].join(' ')}
            >
              <div className="pointer-events-none fixed inset-0 -z-10 soft-grid opacity-[0.16]" />
              <Navigation />
              <main className="shell-container">{children}</main>
              <footer className="px-4 pb-12 sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-[30px] border border-white/60 bg-white/72 px-6 py-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)] backdrop-blur xl:flex-row xl:items-center xl:justify-between">
                  <div className="space-y-2">
                    <p className="card-label">${designProfile.accentLabel}</p>
                    <h2 className="text-xl font-semibold text-slate-950">${toTitleCase(blueprint.projectName)}</h2>
                    <p className="max-w-2xl text-sm leading-7 text-slate-500">
                      ${escapeForTemplate(blueprint.description)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {footerLinks.map((item: { name: string; route: string }) => (
                      <a
                        key={item.route}
                        href={item.route}
                        className="rounded-full border border-slate-200/80 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950"
                      >
                        {item.name}
                      </a>
                    ))}
                  </div>
                </div>
              </footer>
            </body>
          </html>
        );
      }
    `),
    source: 'template',
    description: 'Generated app layout with dynamic font system',
  };
}

function generateNavigation(blueprint: Blueprint, designProfile: DesignProfile): GeneratedFile {
  const navigationLinks = serializeValue(getPreferredPageLinks(blueprint.pages).slice(0, 6));
  const firstAction = getPrimaryActionLink(blueprint.pages);
  const secondaryAction = getSecondaryActionLink(blueprint.pages, firstAction.route);

  return {
    path: 'src/components/Navigation.tsx',
    content: dedent(`
      import Link from 'next/link';

      const navigationLinks = ${navigationLinks};

      export function Navigation() {
        return (
          <header className="px-4 pt-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-[34px] border border-white/70 bg-white/70 px-4 py-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur xl:flex-row xl:items-center xl:justify-between xl:px-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                <Link href="/" className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-[0_14px_30px_rgba(15,23,42,0.2)]" style={{ background: 'linear-gradient(135deg, var(--accent), var(--secondary))' }}>
                    ${getMonogram(blueprint.projectName)}
                  </span>
                  <div className="space-y-1">
                    <p className="card-label">${designProfile.accentLabel}</p>
                    <p className="text-lg font-semibold text-slate-950">${toTitleCase(blueprint.projectName)}</p>
                  </div>
                </Link>

                <nav className="flex gap-2 overflow-x-auto pb-1 xl:pb-0 xl:pl-6">
                  {navigationLinks.map((item: { name: string; route: string }) => (
                    <Link
                      key={item.route}
                      href={item.route}
                      className="whitespace-nowrap rounded-full border border-slate-200/80 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950"
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="hidden items-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 py-2 text-sm text-slate-500 sm:flex">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                  ${blueprint.features.length} features · ${blueprint.dataModels.length} models
                </div>
                <Link href="${secondaryAction.route}" className="secondary-action">
                  ${secondaryAction.label}
                </Link>
                <Link href="${firstAction.route}" className="primary-action">
                  ${firstAction.label}
                </Link>
              </div>
            </div>
          </header>
        );
      }
    `),
    source: 'template',
    description: 'Generated responsive navigation',
  };
}

function generateSharedTypes(blueprint: Blueprint): GeneratedFile {
  const modelInterfaces = blueprint.dataModels.map((model) => {
    const fields = model.fields.map((field) => {
      const optionalSuffix =
        field.required || ['id', 'createdAt', 'updatedAt'].includes(field.name) ? '' : '?';
      return `  ${field.name}${optionalSuffix}: ${blueprintFieldToTs(field)};`;
    });

    return joinBlocks(
      `export interface ${model.name}Record {`,
      fields.join('\n'),
      '}'
    );
  });

  return {
    path: 'src/types/index.ts',
    content: joinBlocks(
      `export interface CollectionFieldMeta {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'relation';
  required: boolean;
}`,
      `export interface RouteLink {
  name: string;
  route: string;
}`,
      `export interface CollectionPayload<T> {
  success: boolean;
  data: {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  error?: string;
}`,
      ...modelInterfaces
    ),
    source: 'template',
    description: 'Generated shared frontend types',
  };
}

function generateLoadingStateComponent(): GeneratedFile {
  return {
    path: 'src/components/LoadingState.tsx',
    content: dedent(`
      interface LoadingStateProps {
        title?: string;
        description?: string;
        compact?: boolean;
      }

      export function LoadingState({
        title = 'Loading workspace data',
        description = 'Preparing the latest records and connected endpoints.',
        compact = false,
      }: LoadingStateProps) {
        return (
          <div
            className={[
              'surface-panel rounded-[28px] border border-white/70 text-center',
              compact ? 'px-5 py-6' : 'px-6 py-10',
            ].join(' ')}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)]">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[var(--accent)]" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-950">{title}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">{description}</p>
          </div>
        );
      }
    `),
    source: 'template',
    description: 'Generated loading state component',
  };
}

function generateEmptyStateComponent(): GeneratedFile {
  return {
    path: 'src/components/EmptyState.tsx',
    content: dedent(`
      import Link from 'next/link';

      interface EmptyStateProps {
        title: string;
        description: string;
        actionLabel?: string;
        actionHref?: string;
      }

      export function EmptyState({
        title,
        description,
        actionLabel,
        actionHref,
      }: EmptyStateProps) {
        return (
          <div className="empty-panel">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent-strong)]">
              0
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-950">{title}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">{description}</p>
            {actionLabel && actionHref ? (
              <div className="mt-6">
                <Link href={actionHref} className="primary-action">
                  {actionLabel}
                </Link>
              </div>
            ) : null}
          </div>
        );
      }
    `),
    source: 'template',
    description: 'Generated empty state component',
  };
}

function generateCollectionExplorerComponent(): GeneratedFile {
  return {
    path: 'src/components/CollectionExplorer.tsx',
    content: dedent(`
      'use client';

      import Link from 'next/link';
      import { startTransition, useDeferredValue, useEffect, useState } from 'react';
      import { EmptyState } from '@/components/EmptyState';
      import { LoadingState } from '@/components/LoadingState';
      import type { CollectionFieldMeta } from '@/types';

      interface CollectionExplorerProps {
        title: string;
        description: string;
        endpoint: string;
        fields: CollectionFieldMeta[];
        primaryField: string;
        secondaryField?: string;
        accentLabel?: string;
        searchPlaceholder?: string;
        relatedRoutes?: Array<{ name: string; route: string }>;
      }

      interface ExplorerMeta {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
      }

      const INITIAL_META: ExplorerMeta = {
        total: 0,
        page: 1,
        pageSize: 8,
        totalPages: 1,
      };

      export function CollectionExplorer({
        title,
        description,
        endpoint,
        fields,
        primaryField,
        secondaryField,
        accentLabel = 'Live collection',
        searchPlaceholder = 'Search records',
        relatedRoutes = [],
      }: CollectionExplorerProps) {
        const [search, setSearch] = useState('');
        const deferredSearch = useDeferredValue(search);
        const [page, setPage] = useState(1);
        const [reloadKey, setReloadKey] = useState(0);
        const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
        const [meta, setMeta] = useState<ExplorerMeta>(INITIAL_META);
        const [isLoading, setIsLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);

        useEffect(() => {
          const controller = new AbortController();

          async function loadData() {
            setIsLoading(true);
            setError(null);

            try {
              const params = new URLSearchParams({
                page: String(page),
                pageSize: String(INITIAL_META.pageSize),
              });

              if (deferredSearch.trim()) {
                params.set('search', deferredSearch.trim());
              }

              const response = await fetch(endpoint + '?' + params.toString(), {
                signal: controller.signal,
                cache: 'no-store',
              });

              if (!response.ok) {
                throw new Error('Failed to load collection data.');
              }

              const payload = await response.json();
              const inner = payload?.data ?? {};
              const items = Array.isArray(inner.data) ? inner.data : [];

              setRows(items);
              setMeta({
                total: Number(inner.total ?? items.length ?? 0),
                page: Number(inner.page ?? page),
                pageSize: Number(inner.pageSize ?? INITIAL_META.pageSize),
                totalPages: Number(inner.totalPages ?? 1),
              });
            } catch (loadError) {
              if (controller.signal.aborted) {
                return;
              }

              setRows([]);
              setError(loadError instanceof Error ? loadError.message : 'Failed to load collection data.');
            } finally {
              if (!controller.signal.aborted) {
                setIsLoading(false);
              }
            }
          }

          loadData();

          return () => controller.abort();
        }, [endpoint, deferredSearch, page, reloadKey]);

        const visibleFields = fields.slice(0, 5);

        return (
          <section className="surface-panel-strong rounded-[32px] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="space-y-3">
                <span className="stat-pill">{accentLabel}</span>
                <div>
                  <h2 className="section-heading !text-2xl sm:!text-3xl">{title}</h2>
                  <p className="section-copy max-w-2xl">{description}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="input-shell min-w-[260px]">
                  <input
                    value={search}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setSearch(nextValue);
                      startTransition(() => {
                        setPage(1);
                      });
                    }}
                    placeholder={searchPlaceholder}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    startTransition(() => {
                      setReloadKey((current) => current + 1);
                    });
                  }}
                  className="secondary-action"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.75fr)]">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="metric-card">
                  <p className="card-label">Records</p>
                  <p className="mt-3 text-3xl font-bold text-slate-950">{formatNumber(meta.total)}</p>
                  <p className="mt-2 text-sm text-slate-500">Live records fetched from the generated API.</p>
                </div>
                <div className="metric-card">
                  <p className="card-label">Endpoint</p>
                  <p className="mt-3 text-lg font-semibold text-slate-950">{endpoint}</p>
                  <p className="mt-2 text-sm text-slate-500">Search, pagination, and create/update support stay connected.</p>
                </div>
                <div className="metric-card">
                  <p className="card-label">Fields shown</p>
                  <p className="mt-3 text-3xl font-bold text-slate-950">{visibleFields.length}</p>
                  <p className="mt-2 text-sm text-slate-500">Optimized for fast scanning on desktop and mobile.</p>
                </div>
              </div>

              <div className="feature-card">
                <p className="card-label">Related routes</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {relatedRoutes.length > 0 ? (
                    relatedRoutes.map((route) => (
                      <Link
                        key={route.route}
                        href={route.route}
                        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:text-slate-950"
                      >
                        {route.name}
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">Use this workspace as the primary source of truth for this model.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              {isLoading ? (
                <LoadingState compact title="Loading live collection" description="Querying the generated API route and preparing responsive table rows." />
              ) : error ? (
                <div className="empty-panel !text-left">
                  <h3 className="text-lg font-semibold text-slate-950">Connection issue</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">{error}</p>
                  <button
                    type="button"
                    onClick={() => {
                      startTransition(() => {
                        setReloadKey((current) => current + 1);
                      });
                    }}
                    className="primary-action mt-6"
                  >
                    Try again
                  </button>
                </div>
              ) : rows.length === 0 ? (
                <EmptyState
                  title="No records yet"
                  description="This collection is ready, but it does not have rows yet. Seed some data or create a record through the generated API."
                />
              ) : (
                <div className="space-y-5">
                  <div className="table-shell hidden overflow-x-auto lg:block">
                    <table className="data-table">
                      <thead>
                        <tr>
                          {visibleFields.map((field) => (
                            <th key={field.name}>{field.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/80">
                        {rows.map((row, rowIndex) => (
                          <tr key={String(row.id ?? rowIndex)}>
                            {visibleFields.map((field) => (
                              <td key={field.name}>
                                <div className="font-medium text-slate-700">
                                  {formatCellValue(row[field.name], field)}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid gap-4 lg:hidden">
                    {rows.map((row, rowIndex) => (
                      <article key={String(row.id ?? rowIndex)} className="record-card">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-base font-semibold text-slate-950">
                              {formatPrimaryValue(row[primaryField])}
                            </p>
                            {secondaryField ? (
                              <p className="mt-1 text-sm text-slate-500">
                                {formatPrimaryValue(row[secondaryField])}
                              </p>
                            ) : null}
                          </div>
                          <span className="stat-pill">{String(row.id ?? rowIndex).slice(0, 8)}</span>
                        </div>
                        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                          {visibleFields.map((field) => (
                            <div key={field.name}>
                              <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                {field.label}
                              </dt>
                              <dd className="mt-1 text-sm text-slate-600">
                                {formatCellValue(row[field.name], field)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </article>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                      Page {meta.page} of {meta.totalPages} · {formatNumber(meta.total)} total records
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          startTransition(() => {
                            setPage((current) => Math.max(1, current - 1));
                          });
                        }}
                        disabled={meta.page <= 1}
                        className="secondary-action disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          startTransition(() => {
                            setPage((current) => Math.min(meta.totalPages, current + 1));
                          });
                        }}
                        disabled={meta.page >= meta.totalPages}
                        className="secondary-action disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        );
      }

      function formatCellValue(value: unknown, field: CollectionFieldMeta) {
        if (value === null || value === undefined || value === '') {
          return '—';
        }

        if (field.type === 'boolean') {
          return value ? 'Yes' : 'No';
        }

        if (field.type === 'date') {
          const date = new Date(String(value));
          return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
        }

        if (Array.isArray(value)) {
          return value.join(', ');
        }

        if (typeof value === 'object') {
          return JSON.stringify(value);
        }

        return String(value);
      }

      function formatPrimaryValue(value: unknown) {
        if (value === null || value === undefined || value === '') {
          return 'Untitled record';
        }

        return String(value);
      }

      function formatNumber(value: number) {
        return new Intl.NumberFormat().format(value);
      }
    `),
    source: 'template',
    description: 'Generated live collection explorer',
  };
}

function generateDashboardComponent(
  blueprint: Blueprint,
  designProfile: DesignProfile
): GeneratedFile {
  const preferredPageLinks = getPreferredPageLinks(blueprint.pages);
  const metrics = serializeValue(
    blueprint.dataModels.map((model) => ({
      title: model.name,
      endpoint: getCollectionApiPath(model, blueprint),
      description: buildModelDescription(model),
      route:
        preferredPageLinks.find((page) => matchesPageToModelRoute(page, model))?.route ??
        normalizeRoutePath(blueprint.pages.find((page) => normalizeRoutePath(page.route) === '/')?.route ?? '/'),
    }))
  );
  const featureCards = serializeValue(serializeFeatureCards(blueprint.features).slice(0, 4));
  const routeCards = serializeValue(preferredPageLinks.slice(0, 6));

  return {
    path: 'src/components/Dashboard.tsx',
    content: dedent(`
      'use client';

      import Link from 'next/link';
      import { startTransition, useEffect, useState } from 'react';
      import { LoadingState } from '@/components/LoadingState';

      const metrics = ${metrics};
      const featureCards = ${featureCards};
      const routeCards = ${routeCards};

      export default function Dashboard() {
        const [refreshKey, setRefreshKey] = useState(0);
        const [counts, setCounts] = useState<Record<string, number>>({});
        const [isLoading, setIsLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);

        useEffect(() => {
          let cancelled = false;

          async function loadCounts() {
            setIsLoading(true);
            setError(null);

            try {
              const results = await Promise.all(
                metrics.map(async (metric: { title: string; endpoint: string }) => {
                  const response = await fetch(metric.endpoint + '?page=1&pageSize=1', {
                    cache: 'no-store',
                  });

                  if (!response.ok) {
                    throw new Error('Failed to load dashboard metrics.');
                  }

                  const payload = await response.json();
                  const total = Number(payload?.data?.total ?? payload?.data?.data?.length ?? 0);
                  return [metric.title, total] as const;
                })
              );

              if (!cancelled) {
                setCounts(Object.fromEntries(results));
              }
            } catch (loadError) {
              if (!cancelled) {
                setError(loadError instanceof Error ? loadError.message : 'Failed to load dashboard metrics.');
              }
            } finally {
              if (!cancelled) {
                setIsLoading(false);
              }
            }
          }

          loadCounts();

          return () => {
            cancelled = true;
          };
        }, [refreshKey]);

        if (isLoading) {
          return (
            <LoadingState
              title="Loading command view"
              description="Pulling live counts from the generated API routes and preparing the operating overview."
            />
          );
        }

        return (
          <div className="space-y-6">
            <section className="hero-shell fade-in-up">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl space-y-4">
                  <span className="eyebrow">${designProfile.accentLabel}</span>
                  <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
                    Real-time workspace visibility for ${toTitleCase(blueprint.projectName)}
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
                    Monitor core collections, jump into the most important routes, and keep the generated product operating with confidence.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    startTransition(() => {
                      setRefreshKey((current) => current + 1);
                    });
                  }}
                  className="secondary-action"
                >
                  Refresh metrics
                </button>
              </div>
            </section>

            {error ? (
              <div className="empty-panel !text-left">
                <h2 className="text-lg font-semibold text-slate-950">Could not load dashboard metrics</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">{error}</p>
              </div>
            ) : null}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric: { title: string; endpoint: string; description: string; route: string }) => (
                <article key={metric.title} className="metric-card">
                  <p className="card-label">{metric.title}</p>
                  <p className="mt-3 text-4xl font-bold text-slate-950">
                    {new Intl.NumberFormat().format(counts[metric.title] ?? 0)}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-500">{metric.description}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link href={metric.route} className="secondary-action !px-4 !py-2">
                      Open page
                    </Link>
                    <Link href={metric.endpoint} className="secondary-action !px-4 !py-2">
                      View API
                    </Link>
                  </div>
                </article>
              ))}
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              <section className="surface-panel rounded-[32px] px-6 py-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="card-label">Operational focus</p>
                    <h2 className="mt-3 text-2xl font-semibold text-slate-950">What this product is optimized to do</h2>
                  </div>
                  <span className="stat-pill">${blueprint.features.length} capabilities</span>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {featureCards.map((feature: { name: string; description: string; priority: string }) => (
                    <article key={feature.name} className="feature-card">
                      <p className="card-label">{feature.priority}</p>
                      <h3 className="mt-3 text-lg font-semibold text-slate-950">{feature.name}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-500">{feature.description}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="surface-panel-strong rounded-[32px] px-6 py-6">
                <p className="card-label">Workspace routes</p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-950">Move through the generated experience</h2>
                <div className="mt-6 space-y-3">
                  {routeCards.map((route: { name: string; route: string; description: string }, index: number) => (
                    <Link
                      key={route.route}
                      href={route.route}
                      className="flex items-start justify-between rounded-[24px] border border-slate-200/80 bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:border-slate-300"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{route.name}</p>
                        <p className="mt-1 text-sm leading-7 text-slate-500">{route.description}</p>
                      </div>
                      <span className="stat-pill">0{index + 1}</span>
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </div>
        );
      }
    `),
    source: 'template',
    description: 'Generated operational dashboard component',
  };
}

function generatePageFile(
  page: BlueprintPage,
  blueprint: Blueprint,
  designProfile: DesignProfile
): GeneratedFile {
  const route = normalizeRoutePath(page.route);
  const path = getPageFilePath(route);

  let content: string;
  if (route === '/') {
    content = generateHomePage(page, blueprint, designProfile);
  } else if (isDashboardLikePage(page)) {
    content = generateDashboardPage(page, blueprint);
  } else {
    const relatedModel = findRelatedModel(page, blueprint);
    content = relatedModel
      ? generateCollectionPage(page, relatedModel, blueprint, designProfile)
      : generateGenericPage(page, blueprint, designProfile);
  }

  return {
    path,
    content,
    source: 'template',
    description: `Generated page for ${route}`,
  };
}

function generateHomePage(
  _page: BlueprintPage,
  blueprint: Blueprint,
  designProfile: DesignProfile
) {
  const pageLinks = serializeValue(
    getPreferredPageLinks(blueprint.pages).filter((page) => page.route !== '/')
  );
  const featureCards = serializeValue(serializeFeatureCards(blueprint.features).slice(0, 6));
  const modelCards = serializeValue(serializeModelCards(blueprint.dataModels).slice(0, 4));
  const endpointCards = serializeValue(serializeEndpointCards(blueprint.apiEndpoints).slice(0, 6));
  const primaryAction = getPrimaryActionLink(blueprint.pages);
  const secondaryAction = getSecondaryActionLink(blueprint.pages, primaryAction.route);

  return dedent(`
    import Link from 'next/link';

    const pageLinks = ${pageLinks};
    const featureCards = ${featureCards};
    const modelCards = ${modelCards};
    const endpointCards = ${endpointCards};

    export default function HomePage() {
      return (
        <div className="page-shell fade-in-up">
          ${generateHomeLayout(
            designProfile.homeVariant,
            blueprint,
            primaryAction,
            secondaryAction
          )}
        </div>
      );
    }
  `);
}

function generateDashboardPage(page: BlueprintPage, blueprint: Blueprint) {
  const siblingPages = serializeValue(
    getPreferredPageLinks(blueprint.pages)
      .filter((item) => item.route !== normalizeRoutePath(page.route))
      .slice(0, 4)
  );

  return dedent(`
    import Link from 'next/link';
    import Dashboard from '@/components/Dashboard';

    const siblingPages = ${siblingPages};

    export default function ${getPageComponentName(page)}Page() {
      return (
        <div className="page-shell fade-in-up">
          <section className="page-header">
            <p className="card-label">Command center</p>
            <h1 className="page-title">${escapeForTemplate(page.name)}</h1>
            <p className="page-description">${escapeForTemplate(page.description)}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {siblingPages.map((item: { name: string; route: string }) => (
                <Link key={item.route} href={item.route} className="secondary-action !px-4 !py-2">
                  {item.name}
                </Link>
              ))}
            </div>
          </section>
          <Dashboard />
        </div>
      );
    }
  `);
}

function generateCollectionPage(
  page: BlueprintPage,
  model: BlueprintDataModel,
  blueprint: Blueprint,
  designProfile: DesignProfile
) {
  const fields = serializeValue(serializeCollectionFields(model));
  const relatedRoutes = serializeValue(
    getPreferredPageLinks(blueprint.pages)
      .filter(
        (item) =>
          item.route !== normalizeRoutePath(page.route) &&
          (matchesPageToModelRoute(item, model) || item.route === '/')
      )
      .slice(0, 4)
  );
  const endpointCards = serializeValue(
    serializeEndpointCards(getEndpointsForModel(model, blueprint)).slice(0, 4)
  );
  const relatedFeatures = serializeValue(
    serializeFeatureCards(getRelatedFeatures(model, blueprint.features)).slice(0, 4)
  );
  const collectionApiPath = getCollectionApiPath(model, blueprint);
  const primaryField = getPrimaryFieldName(model);
  const secondaryField = getSecondaryFieldName(model, primaryField);
  const searchPlaceholder = buildSearchPlaceholder(model, primaryField);

  return dedent(`
    import Link from 'next/link';
    import { CollectionExplorer } from '@/components/CollectionExplorer';

    const fields = ${fields};
    const relatedRoutes = ${relatedRoutes};
    const endpointCards = ${endpointCards};
    const relatedFeatures = ${relatedFeatures};

    export default function ${getPageComponentName(page)}Page() {
      return (
        <div className="page-shell fade-in-up">
          <section className="page-header">
            <p className="card-label">${designProfile.accentLabel}</p>
            <h1 className="page-title">${escapeForTemplate(page.name)}</h1>
            <p className="page-description">${escapeForTemplate(page.description)}</p>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.85fr)]">
            <div className="surface-panel rounded-[32px] px-6 py-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="card-label">Experience focus</p>
                  <h2 className="mt-3 text-2xl font-semibold text-slate-950">What this page should make effortless</h2>
                </div>
                <span className="stat-pill">${model.name}</span>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {relatedFeatures.map((feature: { name: string; description: string; priority: string }) => (
                  <article key={feature.name} className="feature-card">
                    <p className="card-label">{feature.priority}</p>
                    <h3 className="mt-3 text-lg font-semibold text-slate-950">{feature.name}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-500">{feature.description}</p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="surface-panel-strong rounded-[32px] px-6 py-6">
              <p className="card-label">Connected endpoints</p>
              <div className="mt-5 space-y-3">
                {endpointCards.map((endpoint: { method: string; path: string; description: string }, index: number) => (
                  <div key={endpoint.path + index} className="rounded-[24px] border border-slate-200/80 bg-white px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="stat-pill">{endpoint.method}</span>
                      <p className="text-sm font-semibold text-slate-950">{endpoint.path}</p>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-slate-500">{endpoint.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {relatedRoutes.map((item: { name: string; route: string }) => (
                  <Link key={item.route} href={item.route} className="secondary-action !px-4 !py-2">
                    {item.name}
                  </Link>
                ))}
              </div>
            </aside>
          </section>

          <CollectionExplorer
            title="${escapeForTemplate(page.name)}"
            description="${escapeForTemplate(buildCollectionDescription(page, model))}"
            endpoint="${collectionApiPath}"
            fields={fields}
            primaryField="${primaryField}"
            ${secondaryField ? `secondaryField="${secondaryField}"` : ''}
            accentLabel="${escapeForTemplate(model.name + ' collection')}"
            searchPlaceholder="${escapeForTemplate(searchPlaceholder)}"
            relatedRoutes={relatedRoutes}
          />
        </div>
      );
    }
  `);
}

function generateGenericPage(
  page: BlueprintPage,
  blueprint: Blueprint,
  designProfile: DesignProfile
) {
  const relevantFeatures = serializeValue(
    serializeFeatureCards(getFeaturesForPage(page, blueprint.features)).slice(0, 4)
  );
  const relevantEndpoints = serializeValue(
    serializeEndpointCards(getEndpointsForPage(page, blueprint.apiEndpoints)).slice(0, 4)
  );
  const siblingPages = serializeValue(
    getPreferredPageLinks(blueprint.pages)
      .filter((item) => item.route !== normalizeRoutePath(page.route))
      .slice(0, 6)
  );
  const pageComponents = serializeValue(page.components);

  return dedent(`
    import Link from 'next/link';

    const relevantFeatures = ${relevantFeatures};
    const relevantEndpoints = ${relevantEndpoints};
    const siblingPages = ${siblingPages};
    const pageComponents = ${pageComponents};

    export default function ${getPageComponentName(page)}Page() {
      return (
        <div className="page-shell fade-in-up">
          <section className="page-header">
            <p className="card-label">${designProfile.accentLabel}</p>
            <h1 className="page-title">${escapeForTemplate(page.name)}</h1>
            <p className="page-description">${escapeForTemplate(page.description)}</p>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
            <div className="surface-panel rounded-[32px] px-6 py-6">
              <p className="card-label">What ships on this screen</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {relevantFeatures.map((feature: { name: string; description: string; priority: string }) => (
                  <article key={feature.name} className="feature-card">
                    <p className="card-label">{feature.priority}</p>
                    <h2 className="mt-3 text-xl font-semibold text-slate-950">{feature.name}</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-500">{feature.description}</p>
                  </article>
                ))}
              </div>

              <div className="mt-6 rounded-[28px] border border-slate-200/80 bg-white px-5 py-5">
                <p className="card-label">Suggested interface blocks</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {pageComponents.map((component: string) => (
                    <span key={component} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                      {component}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <aside className="surface-panel-strong rounded-[32px] px-6 py-6">
              <p className="card-label">Connected routes and APIs</p>
              <div className="mt-5 space-y-3">
                {relevantEndpoints.map((endpoint: { method: string; path: string; description: string }, index: number) => (
                  <div key={endpoint.path + index} className="rounded-[24px] border border-slate-200/80 bg-white px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="stat-pill">{endpoint.method}</span>
                      <p className="text-sm font-semibold text-slate-950">{endpoint.path}</p>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-slate-500">{endpoint.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {siblingPages.map((item: { name: string; route: string }) => (
                  <Link key={item.route} href={item.route} className="secondary-action !px-4 !py-2">
                    {item.name}
                  </Link>
                ))}
              </div>
            </aside>
          </section>
        </div>
      );
    }
  `);
}

function generateHomeLayout(
  variant: DesignProfile['homeVariant'],
  blueprint: Blueprint,
  primaryAction: { label: string; route: string },
  secondaryAction: { label: string; route: string }
) {
  const headline = getHomeHeadline(blueprint, variant);
  const summary = escapeForTemplate(blueprint.description);

  switch (variant) {
    case 'editorial':
      return generateEditorialHomeLayout(blueprint, headline, summary, primaryAction, secondaryAction);
    case 'workspace':
      return generateWorkspaceHomeLayout(blueprint, headline, summary, primaryAction, secondaryAction);
    case 'showcase':
      return generateShowcaseHomeLayout(blueprint, headline, summary, primaryAction, secondaryAction);
    case 'spotlight':
    default:
      return generateSpotlightHomeLayout(blueprint, headline, summary, primaryAction, secondaryAction);
  }
}

function generateEditorialHomeLayout(
  blueprint: Blueprint,
  headline: string,
  summary: string,
  primaryAction: { label: string; route: string },
  secondaryAction: { label: string; route: string }
) {
  return dedent(`
    <>
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="surface-panel-strong rounded-[34px] px-6 py-8 sm:px-8">
          <span className="stat-pill">Editorial product layout</span>
          <h1 className="mt-5 max-w-4xl text-balance text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            ${headline}
          </h1>
          <p className="section-copy max-w-2xl text-base">${summary}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="${primaryAction.route}" className="primary-action">${primaryAction.label}</Link>
            <Link href="${secondaryAction.route}" className="secondary-action">${secondaryAction.label}</Link>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <article className="feature-card">
              <p className="card-label">Features</p>
              <p className="mt-3 text-4xl font-bold text-slate-950">${blueprint.features.length}</p>
              <p className="mt-2 text-sm leading-7 text-slate-500">Core product capabilities already mapped into the workspace.</p>
            </article>
            <article className="feature-card">
              <p className="card-label">Pages</p>
              <p className="mt-3 text-4xl font-bold text-slate-950">${blueprint.pages.length}</p>
              <p className="mt-2 text-sm leading-7 text-slate-500">Purpose-built screens that connect product flow, data, and operations.</p>
            </article>
            <article className="feature-card">
              <p className="card-label">Models</p>
              <p className="mt-3 text-4xl font-bold text-slate-950">${blueprint.dataModels.length}</p>
              <p className="mt-2 text-sm leading-7 text-slate-500">Structured collections ready for Prisma schema, APIs, and UI lists.</p>
            </article>
          </div>
        </div>

        <aside className="surface-panel rounded-[34px] px-6 py-6">
          <p className="card-label">Product runway</p>
          <div className="mt-5 space-y-4">
            {pageLinks.slice(0, 4).map((page: { name: string; route: string; description: string }, index: number) => (
              <Link
                key={page.route}
                href={page.route}
                className="block rounded-[26px] border border-slate-200/80 bg-white px-5 py-5 transition hover:-translate-y-0.5 hover:border-slate-300"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-slate-950">{page.name}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-500">{page.description}</p>
                  </div>
                  <span className="stat-pill">0{index + 1}</span>
                </div>
              </Link>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {featureCards.map((feature: { name: string; description: string; priority: string }) => (
          <article key={feature.name} className="feature-card">
            <p className="card-label">{feature.priority}</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">{feature.name}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">{feature.description}</p>
          </article>
        ))}
      </section>
    </>
  `);
}

function generateSpotlightHomeLayout(
  blueprint: Blueprint,
  headline: string,
  summary: string,
  primaryAction: { label: string; route: string },
  secondaryAction: { label: string; route: string }
) {
  return dedent(`
    <>
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(330px,0.9fr)]">
        <div className="hero-shell">
          <span className="eyebrow">Launch-ready product build</span>
          <h1 className="mt-5 max-w-4xl text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            ${headline}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/78">${summary}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="${primaryAction.route}" className="primary-action">${primaryAction.label}</Link>
            <Link href="${secondaryAction.route}" className="secondary-action">${secondaryAction.label}</Link>
          </div>
        </div>

        <aside className="surface-panel-strong rounded-[34px] px-6 py-6">
          <p className="card-label">Launch map</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950">From idea to working workspace</h2>
          <div className="mt-6 space-y-3">
            {pageLinks.slice(0, 4).map((page: { name: string; route: string; description: string }, index: number) => (
              <Link
                key={page.route}
                href={page.route}
                className="flex items-start justify-between rounded-[24px] border border-slate-200/80 bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:border-slate-300"
              >
                <div>
                  <p className="font-semibold text-slate-950">{page.name}</p>
                  <p className="mt-1 text-sm leading-7 text-slate-500">{page.description}</p>
                </div>
                <span className="stat-pill">0{index + 1}</span>
              </Link>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {featureCards.map((feature: { name: string; description: string; priority: string }) => (
          <article key={feature.name} className="feature-card">
            <p className="card-label">{feature.priority}</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">{feature.name}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">{feature.description}</p>
          </article>
        ))}
      </section>
    </>
  `);
}

function generateWorkspaceHomeLayout(
  blueprint: Blueprint,
  headline: string,
  summary: string,
  primaryAction: { label: string; route: string },
  secondaryAction: { label: string; route: string }
) {
  return dedent(`
    <>
      <section className="hero-shell">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
          <div className="space-y-6">
            <span className="eyebrow">Operational workspace</span>
            <h1 className="max-w-4xl text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              ${headline}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-white/78">${summary}</p>
            <div className="flex flex-wrap gap-3">
              <Link href="${primaryAction.route}" className="primary-action">${primaryAction.label}</Link>
              <Link href="${secondaryAction.route}" className="secondary-action">${secondaryAction.label}</Link>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="rounded-[28px] border border-white/12 bg-white/10 px-5 py-5 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Coverage</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-4xl font-bold text-white">${blueprint.features.length}</p>
                  <p className="mt-2 text-sm text-white/68">Capabilities mapped into the product workflow.</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-white">${blueprint.apiEndpoints.length}</p>
                  <p className="mt-2 text-sm text-white/68">API routes backing the generated experience.</p>
                </div>
              </div>
            </div>
            <div className="rounded-[28px] border border-white/12 bg-black/15 px-5 py-5 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Launch order</p>
              <div className="mt-4 space-y-3">
                {pageLinks.slice(0, 3).map((page: { name: string; route: string; description: string }, index: number) => (
                  <Link
                    key={page.route}
                    href={page.route}
                    className="flex items-start justify-between rounded-[22px] border border-white/10 bg-white/6 px-4 py-4 transition hover:bg-white/12"
                  >
                    <div>
                      <p className="font-semibold text-white">{page.name}</p>
                      <p className="mt-1 text-sm leading-6 text-white/65">{page.description}</p>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">0{index + 1}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {featureCards.slice(0, 3).map((feature: { name: string; description: string; priority: string }) => (
          <article key={feature.name} className="feature-card">
            <p className="card-label">{feature.priority}</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">{feature.name}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">{feature.description}</p>
          </article>
        ))}
      </section>
    </>
  `);
}

function generateShowcaseHomeLayout(
  blueprint: Blueprint,
  headline: string,
  summary: string,
  primaryAction: { label: string; route: string },
  secondaryAction: { label: string; route: string }
) {
  return dedent(`
    <>
      <section className="hero-shell text-center">
        <div className="mx-auto max-w-4xl space-y-6">
          <span className="eyebrow">Product showcase layout</span>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            ${headline}
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-8 text-white/78">${summary}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="${primaryAction.route}" className="primary-action">${primaryAction.label}</Link>
            <Link href="${secondaryAction.route}" className="secondary-action">${secondaryAction.label}</Link>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[26px] border border-white/12 bg-white/10 px-5 py-5 text-left backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Features</p>
            <p className="mt-3 text-4xl font-bold text-white">${blueprint.features.length}</p>
          </article>
          <article className="rounded-[26px] border border-white/12 bg-white/10 px-5 py-5 text-left backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Pages</p>
            <p className="mt-3 text-4xl font-bold text-white">${blueprint.pages.length}</p>
          </article>
          <article className="rounded-[26px] border border-white/12 bg-white/10 px-5 py-5 text-left backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Data models</p>
            <p className="mt-3 text-4xl font-bold text-white">${blueprint.dataModels.length}</p>
          </article>
          <article className="rounded-[26px] border border-white/12 bg-white/10 px-5 py-5 text-left backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Endpoints</p>
            <p className="mt-3 text-4xl font-bold text-white">${blueprint.apiEndpoints.length}</p>
          </article>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="grid gap-4 md:grid-cols-2">
          {featureCards.slice(0, 4).map((feature: { name: string; description: string; priority: string }) => (
            <article key={feature.name} className="feature-card">
              <p className="card-label">{feature.priority}</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">{feature.name}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">{feature.description}</p>
            </article>
          ))}
        </div>
        <aside className="surface-panel rounded-[34px] px-6 py-6">
          <p className="card-label">Product path</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950">Jump into the routes that matter</h2>
          <div className="mt-6 space-y-3">
            {pageLinks.slice(0, 5).map((page: { name: string; route: string; description: string }, index: number) => (
              <Link
                key={page.route}
                href={page.route}
                className="flex items-start justify-between rounded-[24px] border border-slate-200/80 bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:border-slate-300"
              >
                <div>
                  <p className="font-semibold text-slate-950">{page.name}</p>
                  <p className="mt-1 text-sm leading-7 text-slate-500">{page.description}</p>
                </div>
                <span className="stat-pill">0{index + 1}</span>
              </Link>
            ))}
          </div>
        </aside>
      </section>
    </>
  `);
}

function serializePageLinks(pages: Array<BlueprintPage | SerializedPageLink>): SerializedPageLink[] {
  return pages.map((page) => ({
    name: page.name,
    route: normalizeRoutePath(page.route),
    description: page.description,
  }));
}

function getPreferredPageLinks(pages: Array<BlueprintPage | SerializedPageLink>) {
  const serialized = serializePageLinks(pages);
  const staticRoutes = serialized.filter((page) => !isDynamicGeneratedRoute(page.route));
  return staticRoutes.length > 0 ? staticRoutes : serialized;
}

function serializeFeatureCards(features: BlueprintFeature[]): SerializedFeatureCard[] {
  return features.map((feature) => ({
    name: feature.name,
    description: feature.description,
    priority: feature.priority.replace(/-/g, ' '),
  }));
}

function serializeModelCards(models: BlueprintDataModel[]): SerializedModelCard[] {
  return models.map((model) => ({
    name: model.name,
    fieldCount: model.fields.length,
    fields: model.fields
      .filter((field) => !['id', 'createdAt', 'updatedAt'].includes(field.name))
      .slice(0, 5)
      .map((field) => ({
        name: field.name,
        type: field.type,
        required: field.required,
      })),
    description: buildModelDescription(model),
  }));
}

function serializeEndpointCards(endpoints: BlueprintApiEndpoint[]): SerializedEndpointCard[] {
  return endpoints.map((endpoint) => ({
    method: endpoint.method,
    path: endpoint.path,
    description: endpoint.description,
    relatedModel: endpoint.relatedModel,
  }));
}

function serializeCollectionFields(model: BlueprintDataModel) {
  return getVisibleFields(model).map((field) => ({
    name: field.name,
    label: toTitleCase(field.name),
    type: field.type,
    required: field.required,
  }));
}

function getVisibleFields(model: BlueprintDataModel) {
  const preferred = model.fields.filter(
    (field) =>
      !['id', 'createdAt', 'updatedAt'].includes(field.name) &&
      !field.name.toLowerCase().includes('password')
  );

  return (preferred.length > 0 ? preferred : model.fields).slice(0, 5);
}

function findRelatedModel(page: BlueprintPage, blueprint: Blueprint) {
  return (
    blueprint.dataModels.find((model) => matchesPageToModelRoute(page, model)) ??
    blueprint.dataModels.find((model) => {
      const pageText = normalizeForMatch([page.name, page.route, page.description, ...page.components].join(' '));
      const modelName = normalizeForMatch(model.name);
      return pageText.includes(modelName) || pageText.includes(pluralize(modelName));
    }) ??
    null
  );
}

function matchesPageToModelRoute(
  page: { name: string; route: string; description?: string; components?: string[] },
  model: BlueprintDataModel
) {
  const normalizedRoute = normalizeRoutePath(page.route);
  const routeFragments = normalizedRoute.split('/').filter(Boolean);
  const modelSlug = toKebabCase(model.name);
  const modelPlural = pluralize(modelSlug);
  const modelLabel = normalizeForMatch(model.name);
  const pageText = normalizeForMatch(
    [page.name, page.description ?? '', ...(page.components ?? []), normalizedRoute].join(' ')
  );

  return (
    routeFragments.includes(modelSlug) ||
    routeFragments.includes(modelPlural) ||
    pageText.includes(modelLabel) ||
    pageText.includes(pluralize(modelLabel))
  );
}

function getEndpointsForModel(model: BlueprintDataModel, blueprint: Blueprint) {
  return blueprint.apiEndpoints.filter((endpoint) => {
    const relatedModel = normalizeForMatch(endpoint.relatedModel);
    const pathText = normalizeForMatch(endpoint.path);
    const modelName = normalizeForMatch(model.name);
    return (
      relatedModel === modelName ||
      pathText.includes(toKebabCase(model.name)) ||
      pathText.includes(pluralize(toKebabCase(model.name)))
    );
  });
}

function getEndpointsForPage(page: BlueprintPage, endpoints: BlueprintApiEndpoint[]) {
  const pageText = normalizeForMatch([page.name, page.description, page.route].join(' '));

  return endpoints.filter((endpoint) => {
    const endpointText = normalizeForMatch(
      [endpoint.path, endpoint.description, endpoint.relatedModel].join(' ')
    );
    return (
      endpointText.includes(normalizeForMatch(page.name)) ||
      endpointText.includes(normalizeForMatch(page.route)) ||
      pageText.split(' ').some((fragment) => fragment.length > 3 && endpointText.includes(fragment))
    );
  });
}

function getRelatedFeatures(model: BlueprintDataModel, features: BlueprintFeature[]) {
  const modelText = normalizeForMatch(model.name);
  const matched = features.filter((feature) => {
    const featureText = normalizeForMatch([feature.name, feature.description].join(' '));
    return (
      featureText.includes(modelText) ||
      featureText.includes(pluralize(modelText)) ||
      model.fields.some((field) => featureText.includes(normalizeForMatch(field.name)))
    );
  });

  return matched.length > 0 ? matched : features;
}

function getFeaturesForPage(page: BlueprintPage, features: BlueprintFeature[]) {
  const pageText = normalizeForMatch([page.name, page.description, ...page.components].join(' '));
  const matched = features.filter((feature) => {
    const featureText = normalizeForMatch([feature.name, feature.description].join(' '));
    return pageText.split(' ').some((fragment) => fragment.length > 3 && featureText.includes(fragment));
  });

  return matched.length > 0 ? matched : features;
}

function getCollectionApiPath(model: BlueprintDataModel, blueprint: Blueprint) {
  const matchingGet = blueprint.apiEndpoints.find((endpoint) => {
    const methodMatches = endpoint.method === 'GET';
    const modelMatches =
      normalizeForMatch(endpoint.relatedModel) === normalizeForMatch(model.name) ||
      normalizeForMatch(endpoint.path).includes(toKebabCase(model.name)) ||
      normalizeForMatch(endpoint.path).includes(pluralize(toKebabCase(model.name)));
    const isCollection = !/[/:[]id/.test(endpoint.path);
    return methodMatches && modelMatches && isCollection;
  });

  if (matchingGet) {
    return matchingGet.path;
  }

  const matchingAny = blueprint.apiEndpoints.find((endpoint) => {
    return normalizeForMatch(endpoint.relatedModel) === normalizeForMatch(model.name);
  });

  if (matchingAny) {
    return matchingAny.path.replace(/\/?(:\w+|\[\w+\]|id)$/i, '');
  }

  return '/api/' + pluralize(toKebabCase(model.name));
}

function getPrimaryFieldName(model: BlueprintDataModel) {
  const priorities = ['name', 'title', 'fullName', 'displayName', 'email', 'subject', 'label'];
  const match = priorities.find((fieldName) => model.fields.some((field) => field.name === fieldName));
  return match ?? getVisibleFields(model)[0]?.name ?? 'id';
}

function getSecondaryFieldName(model: BlueprintDataModel, primaryField: string) {
  const priorities = ['description', 'status', 'email', 'category', 'role', 'phone', 'createdAt'];
  const match = priorities.find(
    (fieldName) =>
      fieldName !== primaryField && model.fields.some((field) => field.name === fieldName)
  );

  return match ?? getVisibleFields(model).find((field) => field.name !== primaryField)?.name ?? null;
}

function buildSearchPlaceholder(model: BlueprintDataModel, primaryField: string) {
  return `Search ${pluralize(toTitleCase(model.name).toLowerCase())} by ${toTitleCase(primaryField).toLowerCase()}`;
}

function buildCollectionDescription(page: BlueprintPage, model: BlueprintDataModel) {
  return `${page.description} This workspace is connected to the ${model.name} collection and supports live browsing, search, and pagination through the generated API routes.`;
}

function buildModelDescription(model: BlueprintDataModel) {
  const summaryFields = getVisibleFields(model)
    .slice(0, 3)
    .map((field) => toTitleCase(field.name).toLowerCase())
    .join(', ');
  return `Built around ${summaryFields || 'core operational data'} so the product can stay functional and structured.`;
}

function isDashboardLikePage(page: BlueprintPage) {
  const text = normalizeForMatch([page.name, page.route, page.description, ...page.components].join(' '));
  return ['dashboard', 'overview', 'analytics', 'admin', 'reports', 'insights'].some((keyword) =>
    text.includes(keyword)
  );
}

function getPageFilePath(route: string) {
  return getGeneratedPageFilePath(route);
}

function getPageComponentName(page: BlueprintPage) {
  const value = normalizeRoutePath(page.route) === '/' ? 'Home' : page.name || page.route;
  return toPascalCase(value.replace(/\//g, ' '));
}

function getHomeHeadline(
  blueprint: Blueprint,
  variant: DesignProfile['homeVariant']
) {
  const productName = toTitleCase(blueprint.projectName);

  switch (variant) {
    case 'editorial':
      return `${productName} turns a clear concept into a polished product system with structure, depth, and momentum.`;
    case 'workspace':
      return `Operate ${productName} like a modern product workspace from the very first build.`;
    case 'showcase':
      return `Launch ${productName} with a sharp interface, credible workflows, and a working backend foundation.`;
    case 'spotlight':
    default:
      return `Turn ${productName} into a professional website and product workspace that actually feels launch-ready.`;
  }
}

function blueprintFieldToTs(field: BlueprintField) {
  switch (field.type) {
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'date':
      return 'string';
    case 'relation':
      return field.relation ? `${field.relation}Record | string | null` : 'string | null';
    case 'string':
    default:
      return 'string';
  }
}

function normalizeRoutePath(route: string) {
  return normalizeGeneratedRoute(route);
}

function normalizeForMatch(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function toKebabCase(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toLowerCase();
}

function toPascalCase(value: string) {
  return value
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
}

function toTitleCase(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function pluralize(value: string) {
  if (value.endsWith('y')) {
    return `${value.slice(0, -1)}ies`;
  }

  if (value.endsWith('s')) {
    return `${value}es`;
  }

  return `${value}s`;
}

function getPrimaryActionLink(pages: BlueprintPage[]) {
  const preferredPages = getPreferredPageLinks(pages);
  const target = preferredPages.find((page) => page.route !== '/') ?? preferredPages[0];
  return {
    label: target ? `Open ${target.name}` : 'Explore workspace',
    route: normalizeRoutePath(target?.route ?? '/'),
  };
}

function getSecondaryActionLink(pages: BlueprintPage[], excludedRoute: string) {
  const preferredPages = getPreferredPageLinks(pages);
  const target =
    preferredPages.find((page) => page.route !== '/' && page.route !== excludedRoute) ??
    preferredPages.find((page) => page.route === '/') ??
    preferredPages[0];

  return {
    label: target ? `Visit ${target.name}` : 'View home',
    route: normalizeRoutePath(target?.route ?? '/'),
  };
}

function serializeValue(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function getMonogram(projectName: string) {
  return toTitleCase(projectName)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

function escapeForTemplate(value: string) {
  return value.replace(/`/g, '\\`');
}

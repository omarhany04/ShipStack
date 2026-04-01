'use client';

import { useEffect, useMemo, useState } from 'react';

interface ProjectFileLike {
  path: string;
  content: string;
}

interface BlueprintLike {
  projectName: string;
  description: string;
  dataModels: Array<{
    name: string;
    fields: Array<{
      name: string;
      type: string;
      required: boolean;
      relation?: string;
    }>;
  }>;
  apiEndpoints: Array<{
    method: string;
    path: string;
    description: string;
    relatedModel: string;
  }>;
  techStack: {
    frontend: string;
    backend: string;
    database: string;
    auth: string;
  };
}

interface ProjectDatabasePanelProps {
  projectName: string;
  blueprint: BlueprintLike | null;
  files: ProjectFileLike[];
}

interface DatabaseTable {
  name: string;
  fields: DatabaseField[];
  source: 'prisma' | 'blueprint';
}

interface DatabaseField {
  name: string;
  type: string;
  required: boolean;
  isRelation: boolean;
  relation?: string;
  modifiers: string[];
}

type PanelTab = 'tables' | 'schema';

const SCALAR_TYPES = new Set([
  'String',
  'Int',
  'Float',
  'Decimal',
  'Boolean',
  'DateTime',
  'Json',
  'Bytes',
  'BigInt',
  'Unsupported',
]);

export default function ProjectDatabasePanel({
  projectName,
  blueprint,
  files,
}: ProjectDatabasePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PanelTab>('tables');
  const schemaFile = useMemo(
    () => files.find((file) => file.path === 'prisma/schema.prisma')?.content ?? null,
    [files]
  );

  const tables = useMemo(() => {
    const parsed = schemaFile ? parsePrismaTables(schemaFile) : [];
    if (parsed.length > 0) {
      return parsed;
    }

    return blueprint ? convertBlueprintModels(blueprint) : [];
  }, [blueprint, schemaFile]);

  const [selectedTableName, setSelectedTableName] = useState<string | null>(tables[0]?.name ?? null);

  useEffect(() => {
    setSelectedTableName((current) => {
      if (current && tables.some((table) => table.name === current)) {
        return current;
      }

      return tables[0]?.name ?? null;
    });
  }, [tables]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const selectedTable = tables.find((table) => table.name === selectedTableName) ?? tables[0] ?? null;
  const totalFields = tables.reduce((sum, table) => sum + table.fields.length, 0);
  const relationCount = tables.reduce(
    (sum, table) => sum + table.fields.filter((field) => field.isRelation).length,
    0
  );
  const routesForSelected = selectedTable
    ? (blueprint?.apiEndpoints ?? []).filter(
        (endpoint) =>
          endpoint.relatedModel.toLowerCase() === selectedTable.name.toLowerCase()
      )
    : [];

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50"
      >
        <DatabaseGlyph />
        Project Database
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="Close project database panel"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
          />

          <aside className="absolute inset-y-0 right-0 flex w-full max-w-[560px] flex-col border-l border-slate-200 bg-white shadow-[0_0_80px_rgba(15,23,42,0.18)]">
            <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.18),_transparent_34%),linear-gradient(180deg,_rgba(248,250,252,0.96),_rgba(255,255,255,0.98))] px-6 py-6">
              <div className="flex items-start justify-between gap-4">
                <div className="max-w-md">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
                    Generated App Database
                  </p>
                  <h2 className="mt-3 text-2xl font-bold text-slate-950">{projectName}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Explore the generated tables, fields, relations, and the live Prisma schema for this project.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
                >
                  <CloseGlyph />
                </button>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <TopStat label="Tables" value={String(tables.length)} />
                <TopStat label="Fields" value={String(totalFields)} />
                <TopStat label="Relations" value={String(relationCount)} />
              </div>

              <div className="mt-5 inline-flex rounded-full border border-slate-200 bg-white p-1">
                <TabButton
                  label="Tables"
                  active={activeTab === 'tables'}
                  onClick={() => setActiveTab('tables')}
                />
                <TabButton
                  label="schema.prisma"
                  active={activeTab === 'schema'}
                  onClick={() => setActiveTab('schema')}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {activeTab === 'tables' ? (
                tables.length === 0 ? (
                  <EmptyState
                    title="No database schema found"
                    description="This generated project does not currently include a Prisma schema or blueprint data models."
                  />
                ) : (
                  <div className="space-y-5">
                    <div className="flex flex-wrap gap-2">
                      {tables.map((table) => (
                        <button
                          key={table.name}
                          type="button"
                          onClick={() => setSelectedTableName(table.name)}
                          className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                            selectedTable?.name === table.name
                              ? 'border-orange-300 bg-orange-50 text-orange-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {table.name}
                        </button>
                      ))}
                    </div>

                    {selectedTable ? (
                      <>
                        <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-bold text-slate-950">{selectedTable.name}</h3>
                            <SourcePill source={selectedTable.source} />
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                              {selectedTable.fields.length} columns
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-7 text-slate-600">
                            {routesForSelected.length > 0
                              ? `${routesForSelected.length} API route${routesForSelected.length === 1 ? '' : 's'} are mapped to this table.`
                              : 'No explicit API route mapping was found for this table in the blueprint.'}
                          </p>
                        </section>

                        <section className="space-y-3">
                          {selectedTable.fields.map((field) => (
                            <div
                              key={`${selectedTable.name}-${field.name}`}
                              className="rounded-[24px] border border-slate-200 bg-white p-4"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-slate-950">{field.name}</p>
                                <FieldTypePill>{field.type}</FieldTypePill>
                                {field.required ? (
                                  <SmallPill tone="dark">Required</SmallPill>
                                ) : (
                                  <SmallPill tone="soft">Optional</SmallPill>
                                )}
                                {field.isRelation && field.relation ? (
                                  <SmallPill tone="accent">Relates to {field.relation}</SmallPill>
                                ) : null}
                              </div>
                              {field.modifiers.length > 0 ? (
                                <p className="mt-2 text-xs leading-6 text-slate-400">
                                  {field.modifiers.join(' ')}
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </section>

                        <section className="rounded-[28px] border border-slate-200 bg-white p-5">
                          <h4 className="text-sm font-semibold text-slate-900">Connected API routes</h4>
                          {routesForSelected.length > 0 ? (
                            <div className="mt-3 space-y-3">
                              {routesForSelected.map((endpoint) => (
                                <div
                                  key={`${endpoint.method}-${endpoint.path}`}
                                  className="rounded-2xl bg-slate-50 px-4 py-3"
                                >
                                  <p className="text-sm font-semibold text-slate-900">
                                    {endpoint.method} {endpoint.path}
                                  </p>
                                  <p className="mt-1 text-sm text-slate-600">
                                    {endpoint.description}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-3 text-sm leading-7 text-slate-500">
                              No blueprint endpoints explicitly reference this model.
                            </p>
                          )}
                        </section>

                        {blueprint ? (
                          <section className="rounded-[28px] border border-slate-200 bg-white p-5">
                            <h4 className="text-sm font-semibold text-slate-900">Database stack</h4>
                            <div className="mt-3 space-y-2 text-sm text-slate-600">
                              <p>Database: {blueprint.techStack.database}</p>
                              <p>Backend: {blueprint.techStack.backend}</p>
                              <p>Auth: {blueprint.techStack.auth}</p>
                            </div>
                          </section>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                )
              ) : schemaFile ? (
                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950">
                  <div className="border-b border-slate-800 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    prisma/schema.prisma
                  </div>
                  <pre className="max-h-[calc(100vh-260px)] overflow-auto p-4 text-xs leading-6 text-slate-300">
                    <code>{schemaFile}</code>
                  </pre>
                </div>
              ) : (
                <EmptyState
                  title="No schema.prisma file found"
                  description="The generated project did not include a Prisma schema file, so this tab is unavailable."
                />
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

function convertBlueprintModels(blueprint: BlueprintLike): DatabaseTable[] {
  return blueprint.dataModels.map((model) => ({
    name: model.name,
    source: 'blueprint',
    fields: model.fields.map((field) => ({
      name: field.name,
      type: field.type === 'relation' ? field.relation ?? 'Relation' : field.type,
      required: field.required,
      isRelation: field.type === 'relation',
      relation: field.relation,
      modifiers: field.required ? ['required'] : ['optional'],
    })),
  }));
}

function parsePrismaTables(schema: string): DatabaseTable[] {
  const lines = schema.split(/\r?\n/);
  const tables: DatabaseTable[] = [];
  let activeTable: DatabaseTable | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!activeTable) {
      const modelMatch = line.match(/^model\s+(\w+)\s+\{$/);
      if (modelMatch) {
        activeTable = {
          name: modelMatch[1],
          source: 'prisma',
          fields: [],
        };
      }
      continue;
    }

    if (line === '}') {
      tables.push(activeTable);
      activeTable = null;
      continue;
    }

    if (!line || line.startsWith('//') || line.startsWith('@@')) {
      continue;
    }

    const parts = line.split(/\s+/);
    if (parts.length < 2) {
      continue;
    }

    const [fieldName, rawType, ...modifiers] = parts;
    const normalizedType = rawType.replace(/[?\[\]]/g, '');
    const isRelation = !SCALAR_TYPES.has(normalizedType);

    activeTable.fields.push({
      name: fieldName,
      type: normalizedType,
      required: !rawType.includes('?') && !rawType.includes('[]'),
      isRelation,
      relation: isRelation ? normalizedType : undefined,
      modifiers,
    });
  }

  return tables;
}

function TopStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  );
}

function SourcePill({ source }: { source: 'prisma' | 'blueprint' }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
        source === 'prisma'
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-sky-100 text-sky-700'
      }`}
    >
      {source === 'prisma' ? 'From prisma/schema.prisma' : 'From blueprint'}
    </span>
  );
}

function FieldTypePill({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
      {children}
    </span>
  );
}

function SmallPill({
  children,
  tone,
}: {
  children: string;
  tone: 'dark' | 'soft' | 'accent';
}) {
  const toneClass =
    tone === 'dark'
      ? 'bg-slate-900 text-white'
      : tone === 'accent'
      ? 'bg-orange-100 text-orange-700'
      : 'bg-slate-100 text-slate-500';

  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneClass}`}>
      {children}
    </span>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      <p className="mt-3 text-sm leading-7 text-slate-500">{description}</p>
    </div>
  );
}

function DatabaseGlyph() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75C3.75 5.093 7.444 3.75 12 3.75s8.25 1.343 8.25 3-3.694 3-8.25 3-8.25-1.343-8.25-3Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75v4.5c0 1.657 3.694 3 8.25 3s8.25-1.343 8.25-3v-4.5M3.75 11.25v6c0 1.657 3.694 3 8.25 3s8.25-1.343 8.25-3v-6"
      />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

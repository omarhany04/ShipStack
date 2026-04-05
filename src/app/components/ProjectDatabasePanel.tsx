'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

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
  source: 'prisma' | 'blueprint';
  fields: DatabaseField[];
  attributes: string[];
}

interface DatabaseField {
  name: string;
  type: string;
  required: boolean;
  isRelation: boolean;
  relation?: string;
  isList: boolean;
  modifiers: string[];
}

interface SchemaEndpoint {
  method: string;
  path: string;
  description: string;
  relatedModel: string;
}

type PanelTab = 'overview' | 'tables' | 'schema';

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
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PanelTab>('overview');
  const [selectedTableName, setSelectedTableName] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [copiedSchema, setCopiedSchema] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const schemaFile = useMemo(() => findSchemaFile(files), [files]);

  const tables = useMemo(() => {
    const parsedTables = schemaFile ? parsePrismaTables(schemaFile) : [];
    if (parsedTables.length > 0) {
      return parsedTables;
    }

    return blueprint ? convertBlueprintModels(blueprint) : [];
  }, [blueprint, schemaFile]);

  const schemaText = useMemo(() => {
    if (schemaFile) {
      return schemaFile;
    }

    return blueprint ? createBlueprintSchemaPreview(blueprint) : null;
  }, [blueprint, schemaFile]);

  const visibleTables = useMemo(() => {
    const query = normalizeForSearch(deferredSearch);
    if (!query) {
      return tables;
    }

    return tables.filter((table) => {
      const tableName = normalizeForSearch(table.name);
      const fieldMatch = table.fields.some((field) => {
        const fieldText = normalizeForSearch(
          `${field.name} ${field.type} ${field.relation ?? ''} ${field.modifiers.join(' ')}`
        );
        return fieldText.includes(query);
      });

      return tableName.includes(query) || fieldMatch;
    });
  }, [deferredSearch, tables]);

  useEffect(() => {
    setSelectedTableName((current) => {
      if (current && tables.some((table) => table.name === current)) {
        return current;
      }

      return tables[0]?.name ?? null;
    });
  }, [tables]);

  useEffect(() => {
    if (!visibleTables.length) {
      return;
    }

    setSelectedTableName((current) => {
      if (current && visibleTables.some((table) => table.name === current)) {
        return current;
      }

      return visibleTables[0]?.name ?? null;
    });
  }, [visibleTables]);

  useEffect(() => {
    setIsMounted(true);

    return () => {
      setIsMounted(false);
    };
  }, []);

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

  useEffect(() => {
    if (!copiedSchema) {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopiedSchema(false), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [copiedSchema]);

  const selectedTable =
    visibleTables.find((table) => table.name === selectedTableName) ??
    tables.find((table) => table.name === selectedTableName) ??
    visibleTables[0] ??
    tables[0] ??
    null;

  const totalFields = tables.reduce((sum, table) => sum + table.fields.length, 0);
  const relationCount = tables.reduce(
    (sum, table) => sum + table.fields.filter((field) => field.isRelation).length,
    0
  );
  const optionalFieldCount = tables.reduce(
    (sum, table) => sum + table.fields.filter((field) => !field.required).length,
    0
  );
  const tableSource = schemaFile
    ? 'prisma/schema.prisma'
    : blueprint
      ? 'Blueprint models'
      : 'No schema source';
  const endpoints = blueprint?.apiEndpoints ?? [];
  const connectedEndpoints = selectedTable ? getEndpointsForTable(endpoints, selectedTable.name) : [];
  const relationshipPairs = uniqueStrings(
    tables.flatMap((table) =>
      table.fields
        .filter((field) => field.isRelation && field.relation)
        .map((field) => `${table.name} -> ${field.relation}`)
    )
  );

  async function handleCopySchema() {
    if (!schemaText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(schemaText);
      setCopiedSchema(true);
    } catch {
      setCopiedSchema(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="theme-button-secondary inline-flex items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold shadow-[0_14px_36px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5"
      >
        <span className="theme-icon-badge inline-flex h-9 w-9 items-center justify-center rounded-full">
          <DatabaseGlyph />
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span>Project database</span>
          <span className="text-xs font-medium text-slate-400">
            {tables.length > 0 ? `${tables.length} tables mapped` : 'Inspect generated schema'}
          </span>
        </span>
      </button>

      {isOpen && isMounted
        ? createPortal(
            <div className="fixed inset-0 z-[120]">
          <button
            type="button"
            aria-label="Close project database panel"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-slate-950/38 backdrop-blur-[3px]"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label={`${projectName} project database`}
            className="absolute inset-y-0 right-0 flex h-full w-full max-w-[960px] flex-col border-l border-white/40 bg-[linear-gradient(180deg,_rgba(248,245,239,0.98),_rgba(241,246,250,0.98))] shadow-[-24px_0_80px_rgba(15,23,42,0.16)]"
          >
            <div className="theme-dark-panel border-b border-slate-200 px-6 py-6 text-white sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#eadbcb]">
                    Generated schema studio
                  </div>
                  <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{projectName}</h2>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-slate-200">
                    Review the generated data model, inspect relationships, and open the raw Prisma
                    schema without leaving the workspace.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-slate-200 transition hover:bg-white/15 hover:text-white"
                >
                  <CloseGlyph />
                </button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <HeroStat label="Tables" value={String(tables.length)} helper="Detected entities" />
                <HeroStat label="Fields" value={String(totalFields)} helper="Columns across all tables" />
                <HeroStat label="Relations" value={String(relationCount)} helper="Linked model references" />
                <HeroStat label="Optional" value={String(optionalFieldCount)} helper="Nullable or list fields" />
                <HeroStat
                  label="Source"
                  value={schemaFile ? 'Prisma' : blueprint ? 'Blueprint' : 'None'}
                  helper={tableSource}
                />
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <TabButton
                  label="Overview"
                  active={activeTab === 'overview'}
                  onClick={() => setActiveTab('overview')}
                />
                <TabButton
                  label="Tables"
                  active={activeTab === 'tables'}
                  onClick={() => setActiveTab('tables')}
                />
                <TabButton
                  label="Schema"
                  active={activeTab === 'schema'}
                  onClick={() => setActiveTab('schema')}
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              {activeTab === 'overview' ? (
                <div className="h-full min-h-0 overflow-y-auto px-6 py-6 sm:px-8">
                  {tables.length === 0 ? (
                    <EmptyState
                      title="No generated database schema found"
                      description="This project does not currently include Prisma models or blueprint data models to inspect."
                    />
                  ) : (
                    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                      <section className="space-y-6">
                        <SurfaceCard
                          eyebrow="Database profile"
                          title="Schema snapshot"
                          description="A quick read on the generated data layer so you can judge whether the app structure feels complete."
                        >
                          <div className="grid gap-3 sm:grid-cols-2">
                            <MetricTile label="Database" value={blueprint?.techStack.database ?? 'Prisma-compatible'} />
                            <MetricTile label="Backend" value={blueprint?.techStack.backend ?? 'Generated API'} />
                            <MetricTile label="Auth" value={blueprint?.techStack.auth ?? 'Not specified'} />
                            <MetricTile label="API routes" value={String(endpoints.length)} />
                          </div>
                        </SurfaceCard>

                        <SurfaceCard
                          eyebrow="Entity map"
                          title="Tables in this project"
                          description="Each entity below is normalized from the generated Prisma schema when available, otherwise from the blueprint models."
                        >
                          <div className="grid gap-3 md:grid-cols-2">
                            {tables.map((table) => (
                              <div
                                key={table.name}
                                className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)]"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-base font-semibold text-slate-950">{table.name}</p>
                                    <p className="mt-1 text-xs text-slate-400">
                                      {countRelations(table.fields)} relations · {table.fields.length} fields
                                    </p>
                                  </div>
                                  <SourcePill source={table.source} />
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {table.fields.slice(0, 4).map((field) => (
                                    <InlineChip key={`${table.name}-${field.name}`}>
                                      {field.name}
                                    </InlineChip>
                                  ))}
                                  {table.fields.length > 4 ? (
                                    <InlineChip>+{table.fields.length - 4} more</InlineChip>
                                  ) : null}
                                </div>
                              </div>
                            ))}
                          </div>
                        </SurfaceCard>
                      </section>

                      <section className="space-y-6">
                        <SurfaceCard
                          eyebrow="Relationships"
                          title="How the models connect"
                          description={
                            relationshipPairs.length > 0
                              ? 'Generated relation fields detected across the schema.'
                              : 'No explicit model-to-model relations were detected.'
                          }
                        >
                          {relationshipPairs.length > 0 ? (
                            <div className="space-y-3">
                              {relationshipPairs.map((pair) => (
                                <div
                                  key={pair}
                                  className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
                                >
                                  {pair}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm leading-7 text-slate-500">
                              The current schema looks mostly flat. If you expected connected data,
                              consider adding relations from the blueprint editor and regenerating.
                            </p>
                          )}
                        </SurfaceCard>

                        <SurfaceCard
                          eyebrow="API coverage"
                          title="Routes tied to the data model"
                          description="These endpoints come from the generated blueprint and help you verify that the schema and API surface line up."
                        >
                          {endpoints.length > 0 ? (
                            <div className="space-y-3">
                              {endpoints.slice(0, 8).map((endpoint) => (
                                <EndpointRow
                                  key={`${endpoint.method}-${endpoint.path}`}
                                  endpoint={endpoint}
                                />
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm leading-7 text-slate-500">
                              No blueprint endpoints were attached to this project snapshot.
                            </p>
                          )}
                        </SurfaceCard>
                      </section>
                    </div>
                  )}
                </div>
              ) : null}

              {activeTab === 'tables' ? (
                tables.length === 0 ? (
                  <div className="h-full overflow-y-auto px-6 py-6 sm:px-8">
                    <EmptyState
                      title="No database tables available"
                      description="Generate or save a project with data models to inspect the schema in detail."
                    />
                  </div>
                ) : (
                  <div className="grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden xl:grid-cols-[300px_1fr] xl:grid-rows-1">
                    <div className="flex min-h-0 flex-col border-b border-slate-200 bg-white px-6 py-5 xl:border-b-0 xl:border-r xl:px-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">Tables</p>
                          <p className="mt-1 text-xs text-slate-400">
                            Search by model, field, type, or relation
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
                          {visibleTables.length}/{tables.length}
                        </span>
                      </div>

                      <label className="mt-4 block">
                        <span className="sr-only">Search tables</span>
                        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                          <SearchGlyph />
                          <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search tables or fields"
                            className="w-full border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                          />
                        </div>
                      </label>

                      <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                        {visibleTables.length > 0 ? (
                          visibleTables.map((table) => (
                            <button
                              key={table.name}
                              type="button"
                              onClick={() => setSelectedTableName(table.name)}
                              className={`w-full rounded-[22px] border px-4 py-4 text-left transition ${
                                selectedTable?.name === table.name
                                  ? 'border-orange-300 bg-orange-50 shadow-[0_14px_36px_rgba(249,115,22,0.12)]'
                                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-slate-950">{table.name}</p>
                                  <p className="mt-1 text-xs text-slate-400">
                                    {table.fields.length} fields · {countRelations(table.fields)} relations
                                  </p>
                                </div>
                                <SourcePill source={table.source} compact />
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                            No matching tables for “{search.trim()}”.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="min-h-0 overflow-y-auto px-6 py-6 sm:px-8">
                      {selectedTable ? (
                        <div className="space-y-6">
                          <div className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-2xl font-bold text-slate-950">{selectedTable.name}</h3>
                                  <SourcePill source={selectedTable.source} />
                                  <InfoBadge>{selectedTable.fields.length} columns</InfoBadge>
                                </div>
                                <p className="mt-3 text-sm leading-7 text-slate-600">
                                  {connectedEndpoints.length > 0
                                    ? `${connectedEndpoints.length} generated endpoint${connectedEndpoints.length === 1 ? '' : 's'} appear to reference this model.`
                                    : 'No explicit blueprint endpoint was matched to this model, but the schema can still be used by the generated app.'}
                                </p>
                              </div>

                              <div className="grid min-w-[220px] gap-3 sm:grid-cols-3 md:min-w-[320px]">
                                <CompactMetric
                                  label="Required"
                                  value={String(selectedTable.fields.filter((field) => field.required).length)}
                                />
                                <CompactMetric
                                  label="Optional"
                                  value={String(selectedTable.fields.filter((field) => !field.required).length)}
                                />
                                <CompactMetric
                                  label="Relations"
                                  value={String(countRelations(selectedTable.fields))}
                                />
                              </div>
                            </div>

                            {selectedTable.attributes.length > 0 ? (
                              <div className="mt-4 flex flex-wrap gap-2">
                                {selectedTable.attributes.map((attribute) => (
                                  <InlineChip key={`${selectedTable.name}-${attribute}`}>
                                    {attribute}
                                  </InlineChip>
                                ))}
                              </div>
                            ) : null}
                          </div>

                          <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                            <div className="border-b border-slate-200 px-5 py-4">
                              <p className="text-sm font-semibold text-slate-950">Fields and constraints</p>
                              <p className="mt-1 text-xs text-slate-400">
                                Type, optionality, relations, and Prisma modifiers
                              </p>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                  <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    <th className="px-5 py-3">Field</th>
                                    <th className="px-5 py-3">Type</th>
                                    <th className="px-5 py-3">Required</th>
                                    <th className="px-5 py-3">Relation</th>
                                    <th className="px-5 py-3">Modifiers</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {selectedTable.fields.map((field) => (
                                    <tr
                                      key={`${selectedTable.name}-${field.name}`}
                                      className="align-top transition hover:bg-slate-50/70"
                                    >
                                      <td className="px-5 py-4">
                                        <p className="text-sm font-semibold text-slate-950">{field.name}</p>
                                      </td>
                                      <td className="px-5 py-4">
                                        <FieldTypePill>{field.type}{field.isList ? '[]' : ''}</FieldTypePill>
                                      </td>
                                      <td className="px-5 py-4">
                                        <SmallPill tone={field.required ? 'dark' : 'soft'}>
                                          {field.required ? 'Required' : 'Optional'}
                                        </SmallPill>
                                      </td>
                                      <td className="px-5 py-4">
                                        {field.isRelation && field.relation ? (
                                          <SmallPill tone="accent">Relates to {field.relation}</SmallPill>
                                        ) : (
                                          <span className="text-sm text-slate-400">—</span>
                                        )}
                                      </td>
                                      <td className="px-5 py-4">
                                        {field.modifiers.length > 0 ? (
                                          <div className="flex flex-wrap gap-2">
                                            {field.modifiers.map((modifier) => (
                                              <InlineChip
                                                key={`${selectedTable.name}-${field.name}-${modifier}`}
                                              >
                                                {modifier}
                                              </InlineChip>
                                            ))}
                                          </div>
                                        ) : (
                                          <span className="text-sm text-slate-400">None</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </section>

                          <div className="grid gap-6 lg:grid-cols-2">
                            <SurfaceCard
                              eyebrow="Connected routes"
                              title="API alignment"
                              description="Endpoints detected from the blueprint that reference this model."
                              compact
                            >
                              {connectedEndpoints.length > 0 ? (
                                <div className="space-y-3">
                                  {connectedEndpoints.map((endpoint) => (
                                    <EndpointRow
                                      key={`${endpoint.method}-${endpoint.path}`}
                                      endpoint={endpoint}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm leading-7 text-slate-500">
                                  No explicit endpoint mapping was found for this entity.
                                </p>
                              )}
                            </SurfaceCard>

                            <SurfaceCard
                              eyebrow="Implementation notes"
                              title="Data-layer summary"
                              description="A quick practical read of what this table is doing in the generated app."
                              compact
                            >
                              <ul className="space-y-3 text-sm leading-7 text-slate-600">
                                <li>
                                  {selectedTable.fields.filter((field) => field.required).length} required fields
                                  suggest the minimum data needed for each record.
                                </li>
                                <li>
                                  {countRelations(selectedTable.fields)} relation field
                                  {countRelations(selectedTable.fields) === 1 ? '' : 's'} connect this model to the rest of the app.
                                </li>
                                <li>
                                  {selectedTable.attributes.length > 0
                                    ? `Table-level constraints detected: ${selectedTable.attributes.join(', ')}.`
                                    : 'No table-level indexes or constraints were detected in the current snapshot.'}
                                </li>
                              </ul>
                            </SurfaceCard>
                          </div>
                        </div>
                      ) : (
                        <EmptyState
                          title="Select a table to inspect"
                          description="Choose a generated model from the left to view its fields, relationships, and connected routes."
                        />
                      )}
                    </div>
                  </div>
                )
              ) : null}

              {activeTab === 'schema' ? (
                <div className="h-full min-h-0 overflow-y-auto px-6 py-6 sm:px-8">
                  {schemaText ? (
                    <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-slate-950 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
                      <div className="flex flex-col gap-3 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">Schema source</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {schemaFile
                              ? 'Loaded from prisma/schema.prisma in the generated project.'
                              : 'Generated preview from the saved blueprint because no Prisma file was stored.'}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => void handleCopySchema()}
                          className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 transition hover:bg-white/15 hover:text-white"
                        >
                          {copiedSchema ? 'Copied' : 'Copy schema'}
                        </button>
                      </div>

                      <pre className="max-h-[calc(100vh-280px)] overflow-auto px-5 py-5 text-xs leading-7 text-slate-300">
                        <code>{schemaText}</code>
                      </pre>
                    </div>
                  ) : (
                    <EmptyState
                      title="No schema source available"
                      description="This project snapshot did not include a Prisma file or enough blueprint model data to render a schema preview."
                    />
                  )}
                </div>
              ) : null}
            </div>
          </aside>
        </div>,
            document.body
          )
        : null}
    </>
  );
}

function findSchemaFile(files: ProjectFileLike[]) {
  return (
    files.find((file) => normalizePath(file.path) === 'prisma/schema.prisma')?.content ??
    files.find((file) => normalizePath(file.path).endsWith('schema.prisma'))?.content ??
    null
  );
}

function normalizePath(path: string) {
  return path.replace(/\\/g, '/').replace(/^\/+/, '').toLowerCase();
}

function convertBlueprintModels(blueprint: BlueprintLike): DatabaseTable[] {
  return blueprint.dataModels.map((model) => ({
    name: model.name,
    source: 'blueprint',
    attributes: [],
    fields: model.fields.map((field) => {
      const rawType = field.type === 'relation' ? field.relation ?? 'Relation' : field.type;
      const isList = rawType.endsWith('[]');
      const normalizedType = rawType.replace(/\[\]$/, '');
      const isRelation = field.type === 'relation' || !SCALAR_TYPES.has(normalizedType);

      return {
        name: field.name,
        type: normalizedType || 'String',
        required: field.required,
        isRelation,
        relation: field.relation,
        isList,
        modifiers: buildBlueprintModifiers(field),
      };
    }),
  }));
}

function buildBlueprintModifiers(field: BlueprintLike['dataModels'][number]['fields'][number]) {
  const modifiers = [field.required ? 'required' : 'optional'];
  if (field.type === 'relation' && field.relation) {
    modifiers.push(`@relation(${field.relation})`);
  }
  return modifiers;
}

function parsePrismaTables(schema: string): DatabaseTable[] {
  const lines = schema.split(/\r?\n/);
  const tables: DatabaseTable[] = [];
  let activeTable: DatabaseTable | null = null;

  for (const rawLine of lines) {
    const line = removeInlineComment(rawLine).trim();

    if (!activeTable) {
      const modelMatch = line.match(/^model\s+(\w+)\s+\{$/);
      if (modelMatch) {
        activeTable = {
          name: modelMatch[1],
          source: 'prisma',
          fields: [],
          attributes: [],
        };
      }
      continue;
    }

    if (!line) {
      continue;
    }

    if (line === '}') {
      tables.push(activeTable);
      activeTable = null;
      continue;
    }

    if (line.startsWith('@@')) {
      activeTable.attributes.push(line);
      continue;
    }

    const fieldMatch = line.match(/^(\w+)\s+([^\s]+)\s*(.*)$/);
    if (!fieldMatch) {
      continue;
    }

    const [, fieldName, rawType, rest] = fieldMatch;
    const baseType = rawType.replace(/\?|\[\]/g, '');
    const isList = rawType.includes('[]');
    const isRelation = !SCALAR_TYPES.has(baseType);
    const modifiers = extractPrismaAttributes(rest);

    activeTable.fields.push({
      name: fieldName,
      type: baseType,
      required: !rawType.includes('?') && !isList,
      isRelation,
      relation: isRelation ? baseType : undefined,
      isList,
      modifiers,
    });
  }

  return tables;
}

function createBlueprintSchemaPreview(blueprint: BlueprintLike) {
  const models = blueprint.dataModels
    .map((model) => {
      const fields = model.fields
        .map((field) => {
          if (field.type === 'relation') {
            const relationType = field.relation ?? 'RelatedModel';
            return `  ${field.name} ${relationType}${field.required ? '' : '?'} @relation`;
          }

          return `  ${field.name} ${normalizeBlueprintScalar(field.type)}${field.required ? '' : '?'}`;
        })
        .join('\n');

      return `model ${model.name} {\n${fields}\n}`;
    })
    .join('\n\n');

  return `// Generated from saved blueprint data\n// This preview is shown because no prisma/schema.prisma file was stored.\n\ngenerator client {\n  provider = "prisma-client-js"\n}\n\ndatasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\n${models}`;
}

function getEndpointsForTable(endpoints: SchemaEndpoint[], tableName: string) {
  const normalizedTable = normalizeForSearch(tableName);
  const singular = normalizedTable.endsWith('s')
    ? normalizedTable.slice(0, -1)
    : normalizedTable;

  return endpoints.filter((endpoint) => {
    const relatedModel = normalizeForSearch(endpoint.relatedModel);
    const path = normalizeForSearch(endpoint.path);
    return (
      relatedModel === normalizedTable ||
      relatedModel === singular ||
      path.includes(normalizedTable) ||
      path.includes(singular)
    );
  });
}

function normalizeForSearch(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function countRelations(fields: DatabaseField[]) {
  return fields.filter((field) => field.isRelation).length;
}

function removeInlineComment(line: string) {
  const commentIndex = line.indexOf('//');
  if (commentIndex === -1) {
    return line;
  }

  return line.slice(0, commentIndex);
}

function extractPrismaAttributes(modifierBlock: string) {
  return modifierBlock.match(/@\w+(?:\([^)]*\))?/g) ?? [];
}

function normalizeBlueprintScalar(type: string) {
  const normalized = type.replace(/\[\]$/, '');
  if (
    ['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Decimal', 'Bytes', 'BigInt'].includes(
      normalized
    )
  ) {
    return type;
  }

  if (normalized.toLowerCase() === 'number') {
    return 'Int';
  }

  if (normalized.toLowerCase() === 'date') {
    return 'DateTime';
  }

  return 'String';
}

function HeroStat({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-300">{helper}</p>
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
        active
          ? 'bg-white text-slate-950 shadow-[0_10px_30px_rgba(15,23,42,0.14)]'
          : 'border border-white/10 bg-white/10 text-slate-200 hover:bg-white/15'
      }`}
    >
      {label}
    </button>
  );
}

function SurfaceCard({
  eyebrow,
  title,
  description,
  children,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section
      className={`theme-card rounded-[30px] ${
        compact ? 'px-5 py-5' : 'px-5 py-6 sm:px-6'
      }`}
    >
      <p className="theme-eyebrow text-[11px] font-semibold uppercase tracking-[0.18em]">{eyebrow}</p>
      <h3 className="mt-3 text-xl font-bold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="theme-card-muted rounded-[22px] px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-base font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function SourcePill({
  source,
  compact = false,
}: {
  source: 'prisma' | 'blueprint';
  compact?: boolean;
}) {
  return (
    <span
      className={`rounded-full font-semibold uppercase tracking-[0.14em] ${
        compact ? 'px-2.5 py-1 text-[10px]' : 'px-2.5 py-1 text-[11px]'
      } ${
        source === 'prisma'
          ? 'theme-status-success'
          : 'theme-chip-muted'
      }`}
    >
      {source === 'prisma' ? 'Prisma' : 'Blueprint'}
    </span>
  );
}

function InfoBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="theme-chip-muted rounded-full px-3 py-1 text-xs font-semibold">
      {children}
    </span>
  );
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="theme-card-muted rounded-[20px] px-3 py-3 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-950">{value}</p>
    </div>
  );
}

function EndpointRow({ endpoint }: { endpoint: SchemaEndpoint }) {
  return (
    <div className="theme-card rounded-[20px] px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <HttpMethodPill method={endpoint.method} />
        <p className="text-sm font-semibold text-slate-950">{endpoint.path}</p>
      </div>
      <p className="mt-2 text-sm leading-7 text-slate-600">{endpoint.description}</p>
      {endpoint.relatedModel ? (
        <p className="mt-2 text-xs font-medium text-slate-400">
          Related model: <span className="text-slate-500">{endpoint.relatedModel}</span>
        </p>
      ) : null}
    </div>
  );
}

function HttpMethodPill({ method }: { method: string }) {
  const upperMethod = method.toUpperCase();
  const toneClass =
    upperMethod === 'GET'
      ? 'theme-status-success'
      : upperMethod === 'POST'
        ? 'theme-chip-muted'
        : upperMethod === 'PATCH' || upperMethod === 'PUT'
          ? 'theme-status-accent'
          : upperMethod === 'DELETE'
            ? 'theme-status-danger'
            : 'theme-status-default';

  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase ${toneClass}`}>
      {upperMethod}
    </span>
  );
}

function FieldTypePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="theme-chip-muted rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]">
      {children}
    </span>
  );
}

function InlineChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="theme-chip-muted inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium">
      {children}
    </span>
  );
}

function SmallPill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: 'dark' | 'soft' | 'accent';
}) {
  const toneClass =
    tone === 'dark'
      ? 'bg-slate-950 text-white'
      : tone === 'accent'
        ? 'theme-status-accent'
        : 'theme-status-default';

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
    <div className="theme-card rounded-[30px] border-dashed border-slate-300 px-6 py-12 text-center">
      <div className="theme-icon-badge mx-auto inline-flex h-14 w-14 items-center justify-center rounded-[20px]">
        <DatabaseGlyph />
      </div>
      <p className="mt-5 text-lg font-semibold text-slate-950">{title}</p>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500">{description}</p>
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

function SearchGlyph() {
  return (
    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
    </svg>
  );
}

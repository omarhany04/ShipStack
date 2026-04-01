import Link from 'next/link';
import { getDatabaseExplorerData } from '@/lib/services/database-explorer.service';
import { getCurrentUser } from '@/lib/services/session.service';

export const metadata = {
  title: 'ShipStack Database Explorer',
  description:
    'Inspect live ShipStack data, generated schemas, and AI activity from one professional workspace view.',
};

export default async function DatabasePage() {
  try {
    const currentUser = await getCurrentUser();
    const data = await getDatabaseExplorerData(currentUser.id);

    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-soft">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.18),_transparent_36%),linear-gradient(135deg,_#0f172a_0%,_#111827_45%,_#1e293b_100%)] px-6 py-8 text-white sm:px-8 lg:px-10">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-100">
                  Live Prisma + Supabase
                </p>
                <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
                  Database Explorer
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
                  A real product view of the data behind your ShipStack workspace. Review persisted rows, generated schemas, and AI activity without dropping into raw SQL.
                </p>
              </div>

              <div className="grid gap-4 rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur xl:min-w-[320px]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-100">
                    Access scope
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {data.scope === 'admin' ? 'Admin-wide' : 'Workspace-only'}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    {data.scope === 'admin'
                      ? 'You are seeing all platform records.'
                      : 'You are seeing only records tied to your authenticated account.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/"
                    className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-orange-50"
                  >
                    Back to builder
                  </Link>
                  <Link
                    href="/api/usage"
                    target="_blank"
                    className="inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Raw usage JSON
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-t border-slate-200 bg-slate-50/80 p-6 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Rows in scope" value={formatNumber(data.overview.totalRowsInScope)} helper="Across core user, project, schema, generation, deployment, and usage tables." />
            <MetricCard label="Projects" value={formatNumber(data.overview.totalProjects)} helper="Saved project workspaces in the current visibility scope." />
            <MetricCard label="Blueprints" value={formatNumber(data.overview.totalBlueprints)} helper="Stored product plans and generated app schemas." />
            <MetricCard label="Generations" value={formatNumber(data.overview.totalGenerations)} helper="Persisted file bundles created after generation runs." />
            <MetricCard label="Usage events" value={formatNumber(data.overview.totalUsageLogs)} helper="Provider telemetry captured for orchestration calls." />
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
            <SectionIntro
              eyebrow="Account Record"
              title="Current authenticated database identity"
              description="This is the persisted user row the protected product is currently using."
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <KeyValue label="Name" value={data.viewer.name} />
              <KeyValue label="Email" value={data.viewer.email} />
              <KeyValue label="Role" value={data.viewer.role} />
              <KeyValue label="Company" value={data.viewer.company || 'Not set'} />
              <KeyValue label="Password login" value={data.viewer.hasPassword ? 'Enabled' : 'Not set'} />
              <KeyValue label="Email verification" value={data.viewer.emailVerified ? formatDateTime(data.viewer.emailVerified) : 'Pending'} />
              <KeyValue label="Created" value={formatDateTime(data.viewer.createdAt)} />
              <KeyValue label="Last login" value={data.viewer.lastLoginAt ? formatDateTime(data.viewer.lastLoginAt) : 'No logins recorded'} />
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
            <SectionIntro
              eyebrow="Table Inventory"
              title="Live row counts by table"
              description="A real inventory of the Prisma-backed tables currently visible to you."
            />
            <div className="mt-6 grid gap-3">
              {data.tableStats.map((table) => (
                <div key={table.name} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{table.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{table.description}</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-950">{formatNumber(table.rows)}</p>
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                    {table.access}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[30px] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
          <SectionIntro
            eyebrow="Project Table"
            title="Recent saved project rows"
            description="These rows come directly from the persisted Project, Blueprint, Generation, and Deployment records."
          />
          {data.recentProjects.length === 0 ? (
            <EmptyState title="No projects saved yet" description="Generate a project with persistence enabled and it will appear here with its schema and file metadata." className="mt-6" />
          ) : (
            <div className="mt-6 overflow-hidden rounded-[26px] border border-slate-200">
              <div className="hidden grid-cols-[1.1fr_0.7fr_0.7fr_0.8fr_0.8fr] gap-4 bg-slate-50 px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 lg:grid">
                <span>Project</span>
                <span>Status</span>
                <span>Schema</span>
                <span>Output</span>
                <span>Updated</span>
              </div>
              <div className="divide-y divide-slate-200">
                {data.recentProjects.map((project) => (
                  <div key={project.id} className="grid gap-5 px-5 py-5 lg:grid-cols-[1.1fr_0.7fr_0.7fr_0.8fr_0.8fr] lg:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-sm font-semibold text-slate-950">{project.displayName}</p>
                        <Link href={`/api/projects/${project.id}`} target="_blank" className="inline-flex rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-800">
                          Raw row
                        </Link>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{project.description}</p>
                      <p className="mt-3 text-xs text-slate-400">Prompt: {truncate(project.userPrompt, 120)}</p>
                      {data.scope === 'admin' ? (
                        <p className="mt-1 text-xs text-slate-400">
                          Owner: {project.owner.name || 'Unnamed user'} • {project.owner.email || 'No email'}
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <StatusBadge tone={project.status === 'GENERATED' ? 'success' : project.status === 'FAILED' ? 'danger' : 'default'}>
                        {humanize(project.status)}
                      </StatusBadge>
                      <p className="text-xs text-slate-500">Created {formatDateTime(project.createdAt)}</p>
                      <p className="text-xs text-slate-400">
                        {project.deployment ? `Deployment: ${humanize(project.deployment.status)}` : 'No deployment record'}
                      </p>
                    </div>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>{project.blueprint?.modelCount ?? 0} models</p>
                      <p>{project.blueprint?.pageCount ?? 0} pages</p>
                      <p>{project.blueprint?.endpointCount ?? 0} endpoints</p>
                      <p className="text-xs text-slate-400">
                        {project.blueprint?.wasRepaired ? 'Blueprint repaired during validation' : 'Blueprint stored cleanly'}
                      </p>
                    </div>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>{formatNumber(project.totalFiles)} files</p>
                      <p>{formatBytes(project.totalSizeBytes)}</p>
                      <p>{formatDuration(project.generationTimeMs)}</p>
                      <p className="text-xs text-slate-400">
                        Latest run: {project.latestGeneration ? formatDateTime(project.latestGeneration.createdAt) : 'No generation row'}
                      </p>
                    </div>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>{formatDateTime(project.updatedAt)}</p>
                      <p className="text-xs text-slate-400">
                        Providers: {project.latestGeneration?.providersUsed.join(', ') || 'None recorded'}
                      </p>
                      <p className="text-xs text-slate-400">
                        Warnings: {project.latestGeneration?.warnings.length ?? project.blueprint?.warnings.length ?? 0}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
            <SectionIntro
              eyebrow="Schema Catalog"
              title="Database structures generated for your apps"
              description="Review the actual models, fields, pages, and API routes captured in each blueprint."
            />
            {data.schemaCatalog.length === 0 ? (
              <EmptyState title="No stored blueprints yet" description="Once a saved project has a blueprint row, its database schema will show up here." className="mt-6" />
            ) : (
              <div className="mt-6 space-y-4">
                {data.schemaCatalog.map((schema) => (
                  <details key={schema.projectId} className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
                    <summary className="cursor-pointer list-none">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-lg font-semibold text-slate-950">{schema.projectName}</p>
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{schema.description}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 md:max-w-[300px] md:justify-end">
                          <SchemaMeta label="Models" value={String(schema.models.length)} />
                          <SchemaMeta label="Pages" value={String(schema.pages.length)} />
                          <SchemaMeta label="Endpoints" value={String(schema.endpoints.length)} />
                          <SchemaMeta label="Features" value={String(schema.featureCount)} />
                        </div>
                      </div>
                    </summary>
                    <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                      <div className="space-y-4">
                        {schema.models.map((model) => (
                          <div key={model.name} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-950">{model.name}</p>
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                {model.fields.length} fields
                              </span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {model.fields.map((field) => (
                                <FieldPill key={`${model.name}-${field.name}`} label={`${field.name}: ${field.type}${field.required ? '' : ' ?'}${field.relation ? ` → ${field.relation}` : ''}`} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-4">
                        <InfoPanel title="Routes and pages">
                          {schema.pages.map((page) => (
                            <div key={`${schema.projectId}-${page.route}`} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                              <span className="font-medium text-slate-900">{page.name}</span>
                              <span className="text-xs uppercase tracking-[0.14em] text-slate-400">{page.route}</span>
                            </div>
                          ))}
                        </InfoPanel>
                        <InfoPanel title="API endpoints">
                          {schema.endpoints.slice(0, 8).map((endpoint) => (
                            <div key={`${schema.projectId}-${endpoint.method}-${endpoint.path}`} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                              <span className="font-semibold text-slate-900">{endpoint.method}</span> {endpoint.path}
                            </div>
                          ))}
                        </InfoPanel>
                        <InfoPanel title="Tech stack">
                          <p>Frontend: {schema.techStack.frontend}</p>
                          <p>Backend: {schema.techStack.backend}</p>
                          <p>Database: {schema.techStack.database}</p>
                          <p>Auth: {schema.techStack.auth}</p>
                        </InfoPanel>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
              <SectionIntro
                eyebrow="Distribution"
                title="Project and provider breakdown"
                description="Quickly see how your data is distributed across statuses and model providers."
              />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <BreakdownCard title="Project statuses" emptyLabel="No project rows yet" items={data.projectStatusBreakdown.map((item) => ({ label: humanize(item.status), value: item.count }))} />
                <BreakdownCard title="Provider activity" emptyLabel="No usage events logged yet" items={data.providerBreakdown.map((item) => ({ label: item.provider, value: item.count }))} />
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
              <SectionIntro
                eyebrow={data.scope === 'admin' ? 'Users Table' : 'Workspace Summary'}
                title={data.scope === 'admin' ? 'Recent authenticated users' : 'Your current workspace footprint'}
                description={data.scope === 'admin' ? 'A quick view into the latest user rows created on the platform.' : 'A concise snapshot of how much data your account currently owns.'}
              />
              {data.scope === 'admin' ? (
                data.recentUsers.length === 0 ? (
                  <EmptyState title="No user records yet" description="Users will appear here after sign-up or Google sign-in." className="mt-6" />
                ) : (
                  <div className="mt-6 space-y-3">
                    {data.recentUsers.map((user) => (
                      <div key={user.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{user.name || 'Unnamed user'}</p>
                            <p className="mt-1 text-sm text-slate-500">{user.email || 'No email'}</p>
                          </div>
                          <StatusBadge tone={user.isActive ? 'success' : 'danger'}>
                            {user.role} • {user.isActive ? 'Active' : 'Inactive'}
                          </StatusBadge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                          <span>{user.projectCount} projects</span>
                          <span>{user.usageEventCount} usage events</span>
                          <span>Created {formatDateTime(user.createdAt)}</span>
                          <span>Last login {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <MetricCard label="Owned projects" value={formatNumber(data.viewer.projectCount)} helper="Projects currently associated with your account." />
                  <MetricCard label="AI events" value={formatNumber(data.viewer.usageEventCount)} helper="Usage log rows associated with your account." />
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[30px] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
          <SectionIntro
            eyebrow="UsageLog Table"
            title="Recent AI activity rows"
            description="These are the latest persisted provider events visible to your account scope."
          />
          {data.recentUsage.length === 0 ? (
            <EmptyState title="No usage rows yet" description="Generate a project or trigger AI orchestration to populate the usage log." className="mt-6" />
          ) : (
            <div className="mt-6 overflow-hidden rounded-[26px] border border-slate-200">
              <div className="hidden grid-cols-[0.9fr_0.8fr_0.7fr_0.8fr_1fr] gap-4 bg-slate-50 px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 lg:grid">
                <span>Provider</span>
                <span>Task</span>
                <span>Result</span>
                <span>Runtime</span>
                <span>Recorded</span>
              </div>
              <div className="divide-y divide-slate-200">
                {data.recentUsage.map((entry) => (
                  <div key={entry.id} className="grid gap-4 px-5 py-5 lg:grid-cols-[0.9fr_0.8fr_0.7fr_0.8fr_1fr] lg:items-center">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{entry.provider}</p>
                      {data.scope === 'admin' && entry.user ? (
                        <p className="mt-1 text-xs text-slate-400">
                          {entry.user.name || 'Unnamed user'} • {entry.user.email || 'No email'}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-sm text-slate-600">{humanize(entry.task)}</div>
                    <div className="space-y-1">
                      <StatusBadge tone={entry.success ? 'success' : 'danger'}>
                        {entry.success ? 'Success' : 'Failed'}
                      </StatusBadge>
                      <p className="text-xs text-slate-400">
                        {entry.fromCache ? 'Served from cache' : 'Fresh provider request'}
                      </p>
                    </div>
                    <div className="text-sm text-slate-600">
                      <p>{formatDuration(entry.latencyMs)}</p>
                      <p className="text-xs text-slate-400">Tokens: {entry.totalTokens ? formatNumber(entry.totalTokens) : 'Not recorded'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">{formatDateTime(entry.createdAt)}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {entry.errorMessage ? truncate(entry.errorMessage, 90) : 'No error message'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    );
  } catch (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-[30px] border border-rose-200 bg-white p-8 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-500">
            Database Explorer
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">
            We couldn&apos;t load the database view
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            {error instanceof Error ? error.message : 'Something unexpected happened while loading the live database explorer.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/" className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Back to builder
            </Link>
            <Link href="/account" className="inline-flex rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
              Open account settings
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

function SectionIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-950">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{description}</p>
    </div>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{helper}</p>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function StatusBadge({
  children,
  tone = 'default',
}: {
  children: React.ReactNode;
  tone?: 'default' | 'success' | 'danger';
}) {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : tone === 'danger'
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : 'border-slate-200 bg-slate-100 text-slate-700';

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${toneClass}`}>{children}</span>;
}

function SchemaMeta({ label, value }: { label: string; value: string }) {
  return <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}: <span className="text-slate-900">{value}</span></div>;
}

function FieldPill({ label }: { label: string }) {
  return <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">{label}</span>;
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <div className="mt-3 space-y-2 text-sm text-slate-600">{children}</div>
    </div>
  );
}

function BreakdownCard({ title, items, emptyLabel }: { title: string; items: Array<{ label: string; value: number }>; emptyLabel: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">{emptyLabel}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-600">{item.label}</span>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-900">
                {formatNumber(item.value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, description, className = '' }: { title: string; description: string; className?: string }) {
  return (
    <div className={`rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center ${className}`}>
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">{description}</p>
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatBytes(value: number) {
  if (!value) return '0 KB';
  if (value < 1024) return `${value} B`;
  return `${(value / 1024).toFixed(1)} KB`;
}

function formatDuration(value: number) {
  if (!value) return '0 s';
  if (value < 1000) return `${value} ms`;
  return `${(value / 1000).toFixed(1)} s`;
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(value);
}

function humanize(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}

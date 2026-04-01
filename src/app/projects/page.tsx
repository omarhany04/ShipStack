import Link from 'next/link';
import { ProjectService } from '@/lib/services/project.service';
import { getCurrentUser } from '@/lib/services/session.service';

export const metadata = {
  title: 'My Projects | ShipStack',
  description: 'Browse and reopen the projects you have generated with ShipStack.',
};

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  const { projects, total } = await ProjectService.listForUser(user.id, 1, 100);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
              Project Library
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
              Your generated projects
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Reopen any saved project to inspect its live preview, files, blueprint, and generation metadata.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <StatPill label="Projects" value={String(total)} />
            <Link
              href="/"
              className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Generate new project
            </Link>
          </div>
        </div>
      </section>

      {projects.length === 0 ? (
        <section className="mt-8 rounded-[30px] border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
          <p className="text-xl font-semibold text-slate-900">No saved projects yet</p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            Generate a project from the main builder and it will appear here automatically under your account.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Start building
          </Link>
        </section>
      ) : (
        <section className="mt-8 grid gap-6 xl:grid-cols-2">
          {projects.map((project) => (
            <article
              key={project.id}
              className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-soft sm:p-8"
            >
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge tone={project.status === 'GENERATED' ? 'success' : project.status === 'FAILED' ? 'danger' : 'default'}>
                  {humanize(project.status)}
                </StatusBadge>
                <span className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  {formatDate(project.updatedAt)}
                </span>
              </div>

              <h2 className="mt-4 text-2xl font-bold text-slate-950">{project.displayName}</h2>
              <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">
                {project.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <MetaChip label="Files" value={String(project.totalFiles)} />
                <MetaChip label="Size" value={formatBytes(project.totalSizeBytes)} />
                <MetaChip label="Time" value={formatDuration(project.generationTimeMs)} />
                <MetaChip label="Features" value={String(project.blueprint?.featureCount ?? 0)} />
                <MetaChip label="Models" value={String(project.blueprint?.modelCount ?? 0)} />
                <MetaChip label="Pages" value={String(project.blueprint?.pageCount ?? 0)} />
              </div>

              <p className="mt-5 text-xs leading-6 text-slate-400">
                Prompt: {truncate(project.userPrompt, 180)}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/projects/${project.id}`}
                  className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Open workspace
                </Link>
                <Link
                  href={`/api/projects/${project.id}`}
                  target="_blank"
                  className="inline-flex rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Raw JSON
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function StatusBadge({
  children,
  tone = 'default',
}: {
  children: string;
  tone?: 'default' | 'success' | 'danger';
}) {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : tone === 'danger'
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : 'border-slate-200 bg-slate-100 text-slate-700';

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${toneClass}`}
    >
      {children}
    </span>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
      <span className="font-semibold text-slate-900">{value}</span> {label}
    </span>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
      <span className="font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</span>{' '}
      <span className="font-medium text-slate-700">{value}</span>
    </span>
  );
}

function formatBytes(value: number) {
  if (!value) {
    return '0 KB';
  }

  if (value < 1024) {
    return `${value} B`;
  }

  return `${(value / 1024).toFixed(1)} KB`;
}

function formatDuration(value: number) {
  if (!value) {
    return '0 s';
  }

  if (value < 1000) {
    return `${value} ms`;
  }

  return `${(value / 1000).toFixed(1)} s`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(value);
}

function humanize(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

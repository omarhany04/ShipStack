'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import BuilderScrollLink from './BuilderScrollLink';

interface ProjectSummary {
  id: string;
  displayName: string;
  description: string;
  userPrompt: string;
  status: string;
  totalFiles: number;
  totalSizeBytes: number;
  generationTimeMs: number;
  updatedAt: string;
  blueprint: {
    featureCount: number;
    modelCount: number;
    pageCount: number;
  } | null;
}

interface ProjectsLibraryClientProps {
  initialProjects: ProjectSummary[];
}

type FeedbackState =
  | {
      tone: 'success' | 'error';
      message: string;
    }
  | null;

export default function ProjectsLibraryClient({
  initialProjects,
}: ProjectsLibraryClientProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [projects, setProjects] = useState(initialProjects);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<ProjectSummary | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  useEffect(() => {
    setIsMounted(true);

    return () => {
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    if (!projectToDelete) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !deletingId) {
        setProjectToDelete(null);
        setDeleteError(null);
      }
    }

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [deletingId, projectToDelete]);

  function openDeleteDialog(project: ProjectSummary) {
    setProjectToDelete(project);
    setDeleteError(null);
    setFeedback(null);
  }

  function closeDeleteDialog() {
    if (deletingId) {
      return;
    }

    setProjectToDelete(null);
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!projectToDelete) {
      return;
    }

    const project = projectToDelete;

    setDeletingId(project.id);
    setFeedback(null);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });

      const result = (await response.json().catch(() => null)) as
        | {
            success?: boolean;
            error?: string;
          }
        | null;

      if (!response.ok || !result?.success) {
        throw new Error(result?.error ?? 'Failed to delete project.');
      }

      setProjects((current) => current.filter((item) => item.id !== project.id));
      setFeedback({
        tone: 'success',
        message: `"${project.displayName}" was deleted.`,
      });
      setProjectToDelete(null);
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : 'Failed to delete project.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  const generatedCount = projects.filter(
    (project) => project.status === 'GENERATED'
  ).length;

  return (
    <>
      <section className="glass-panel-strong overflow-hidden rounded-[34px] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.24em]">
              Project Library
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Your generated workspaces
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Reopen any saved project to inspect its preview, files, blueprint,
              and generated database. Everything here is tied directly to your
              signed-in workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <StatPill label="Projects" value={String(projects.length)} />
            <StatPill label="Generated" value={String(generatedCount)} />
            <BuilderScrollLink className="theme-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5">
              Generate new project
            </BuilderScrollLink>
          </div>
        </div>
      </section>

      {feedback ? (
        <section
          className={`mt-6 rounded-[24px] px-5 py-4 text-sm ${
            feedback.tone === 'success'
              ? 'theme-status-success'
              : 'theme-status-danger'
          }`}
        >
          {feedback.message}
        </section>
      ) : null}

      {projects.length === 0 ? (
        <section className="glass-panel mt-8 rounded-[32px] px-6 py-16 text-center">
          <div className="theme-icon-badge mx-auto inline-flex h-16 w-16 items-center justify-center rounded-[22px]">
            <ProjectsGlyph />
          </div>
          <p className="mt-6 text-2xl font-bold text-slate-950">
            No saved projects yet
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            Generate your first product from the main builder and it will appear
            here automatically with preview, files, and project database access.
          </p>
          <BuilderScrollLink className="theme-button-primary mt-8 inline-flex rounded-full px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5">
            Start building
          </BuilderScrollLink>
        </section>
      ) : (
        <section className="mt-8 grid gap-6 xl:grid-cols-2">
          {projects.map((project) => {
            const isDeleting = deletingId === project.id;

            return (
              <article
                key={project.id}
                className="glass-panel rounded-[32px] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 sm:p-7"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge
                    tone={
                      project.status === 'GENERATED'
                        ? 'success'
                        : project.status === 'FAILED'
                        ? 'danger'
                        : 'default'
                    }
                  >
                    {humanize(project.status)}
                  </StatusBadge>
                  <span className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    Updated {formatDate(project.updatedAt)}
                  </span>
                </div>

                <h2 className="mt-5 text-2xl font-bold text-slate-950">
                  {project.displayName}
                </h2>
                <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">
                  {project.description}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <MetricCard label="Files" value={String(project.totalFiles)} />
                  <MetricCard
                    label="Size"
                    value={formatBytes(project.totalSizeBytes)}
                  />
                  <MetricCard
                    label="Time"
                    value={formatDuration(project.generationTimeMs)}
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <MetaChip
                    label="Features"
                    value={String(project.blueprint?.featureCount ?? 0)}
                  />
                  <MetaChip
                    label="Models"
                    value={String(project.blueprint?.modelCount ?? 0)}
                  />
                  <MetaChip
                    label="Pages"
                    value={String(project.blueprint?.pageCount ?? 0)}
                  />
                </div>

                <div className="theme-dark-panel mt-5 rounded-[24px] px-4 py-4 text-sm text-slate-300">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Original prompt
                  </p>
                  <p className="mt-2 leading-7 text-slate-200">
                    {truncate(project.userPrompt, 190)}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/projects/${project.id}`}
                    className="theme-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
                  >
                    Open workspace
                  </Link>
                  <button
                    type="button"
                    onClick={() => openDeleteDialog(project)}
                    disabled={isDeleting}
                    className="theme-status-danger inline-flex rounded-full px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete project'}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {projectToDelete && isMounted
        ? createPortal(
            <DeleteProjectDialog
              projectName={projectToDelete.displayName}
              isDeleting={deletingId === projectToDelete.id}
              error={deleteError}
              onClose={closeDeleteDialog}
              onConfirm={() => void confirmDelete()}
            />,
            document.body
          )
        : null}
    </>
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
      ? 'theme-status-success'
      : tone === 'danger'
      ? 'theme-status-danger'
      : 'theme-status-default';

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${toneClass}`}
    >
      {children}
    </span>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="theme-chip-muted rounded-full px-4 py-2 text-sm">
      <span className="font-semibold text-slate-900">{value}</span> {label}
    </span>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="theme-chip-muted rounded-full px-3 py-1.5 text-xs">
      <span className="font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </span>{' '}
      <span className="font-medium text-slate-700">{value}</span>
    </span>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="theme-card rounded-[22px] px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function ProjectsGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6 fill-none stroke-current"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75A2.25 2.25 0 0 1 6 4.5h4.379c.398 0 .779.158 1.06.439l1.622 1.622c.281.281.663.439 1.06.439H18a2.25 2.25 0 0 1 2.25 2.25v7.5A2.25 2.25 0 0 1 18 19.5H6a2.25 2.25 0 0 1-2.25-2.25v-10.5Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 13.5h9M7.5 10.5h5.25" />
    </svg>
  );
}

function DeleteProjectDialog({
  projectName,
  isDeleting,
  error,
  onClose,
  onConfirm,
}: {
  projectName: string;
  isDeleting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[120]">
      <button
        type="button"
        aria-label="Close delete project dialog"
        onClick={onClose}
        disabled={isDeleting}
        className="absolute inset-0 bg-slate-950/42 backdrop-blur-[3px] disabled:cursor-not-allowed"
      />

      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-project-title"
          aria-describedby="delete-project-description"
          className="w-full max-w-xl overflow-hidden rounded-[32px] border border-white/65 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(244,247,250,0.98))] shadow-[0_28px_90px_rgba(15,23,42,0.18)]"
        >
          <div className="theme-dark-panel px-6 py-6 text-white sm:px-7">
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-lg">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#eadbcb]">
                  Confirm deletion
                </div>
                <h2 id="delete-project-title" className="mt-4 text-2xl font-bold tracking-tight">
                  Delete this workspace?
                </h2>
                <p
                  id="delete-project-description"
                  className="mt-3 text-sm leading-7 text-slate-200"
                >
                  <span className="font-semibold text-white">{projectName}</span> will be removed
                  along with its saved preview, generated files, blueprint snapshot, and project
                  history.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-slate-200 transition hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CloseGlyph />
              </button>
            </div>
          </div>

          <div className="space-y-5 px-6 py-6 sm:px-7">
            <div className="theme-status-danger rounded-[24px] px-5 py-4 text-sm leading-7">
              This action cannot be undone.
            </div>

            {error ? (
              <div className="theme-status-danger rounded-[24px] px-5 py-4 text-sm">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="theme-button-secondary inline-flex justify-center rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                Keep project
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isDeleting}
                className="theme-status-danger inline-flex justify-center rounded-full px-5 py-3 text-sm font-semibold transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? 'Deleting...' : 'Delete project'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function humanize(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}...`;
}

function CloseGlyph() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

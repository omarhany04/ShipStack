'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/useAuth';
import { useProjectGenerator } from '@/lib/hooks/useProjectGenerator';
import logoImage from './icon.png';
import PromptInput from './components/PromptInput';
import UserMenu from './components/UserMenu';

const BlueprintEditor = dynamic(() => import('./components/BlueprintEditor'));
const DownloadButton = dynamic(() => import('./components/DownloadButton'));
const FollowUpPrompt = dynamic(() => import('./components/FollowUpPrompt'));
const PreviewPanel = dynamic(() => import('./components/PreviewPanel'));
const ProgressIndicator = dynamic(() => import('./components/ProgressIndicator'));
const ProjectDatabasePanel = dynamic(() => import('./components/ProjectDatabasePanel'));

export default function HomePage() {
  const {
    state,
    generate,
    refineWithPrompt,
    regenerateFromBlueprint,
    cancelGeneration,
    fixPreview,
    download,
    reset,
  } =
    useProjectGenerator();
  const { user } = useAuth();
  const isLoading = !['idle', 'ready', 'error'].includes(state.stage);
  const showResults = state.stage === 'ready' && state.project;
  const showProgress = isLoading || state.stage === 'error';

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(circle_at_top_left,_rgba(185,130,77,0.22),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(83,119,153,0.18),_transparent_26%),linear-gradient(180deg,_rgba(255,255,255,0.82),_transparent)]" />
      <div className="pointer-events-none absolute left-[-90px] top-[160px] -z-10 h-64 w-64 rounded-full bg-[rgba(185,130,77,0.18)] blur-3xl animate-float-soft" />
      <div className="pointer-events-none absolute right-[-70px] top-[280px] -z-10 h-64 w-64 rounded-full bg-[rgba(83,119,153,0.2)] blur-3xl animate-float-soft" />

      <header className="sticky top-0 z-40 border-b border-[rgba(188,199,214,0.68)] bg-white/62 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Image
              src={logoImage}
              alt="ShipStack logo"
              priority
              className="h-12 w-12 rounded-[18px] object-cover shadow-[0_18px_40px_rgba(17,32,54,0.14)] ring-1 ring-white/55"
            />
            <div>
              <p className="theme-eyebrow text-[11px] font-semibold uppercase tracking-[0.28em]">
                ShipStack
              </p>
              <h1 className="mt-1 text-lg font-bold text-slate-950">
                AI startup builder
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {state.stage !== 'idle' && !isLoading ? (
              <button
                type="button"
                onClick={() => void reset()}
                className="theme-button-secondary rounded-full px-4 py-2 text-xs font-semibold transition hover:-translate-y-0.5 disabled:opacity-50"
              >
                New project
              </button>
            ) : null}
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        {(state.stage === 'idle' || state.stage === 'error') ? (
          <section className="animate-fade-up">
            <div className="grid gap-8 xl:grid-cols-[1.12fr_0.88fr] xl:items-start">
              <div className="max-w-4xl">
                {user ? (
                  <div className="theme-chip-muted inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm shadow-sm backdrop-blur">
                    <span className="font-semibold text-slate-900">Welcome back, {user.name}</span>
                    <span className="hidden text-slate-400 sm:inline">Your workspaces are saved automatically.</span>
                  </div>
                ) : null}

                <div className="theme-chip mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em]">
                  Interactive AI product generation
                </div>

                <h2 className="mt-6 max-w-4xl text-balance text-[clamp(2.35rem,5.1vw,4.45rem)] font-bold tracking-[-0.045em] text-slate-950">
                  Build the first version of your startup before the momentum fades
                </h2>

                <p className="mt-5 max-w-3xl text-[17px] leading-8 text-slate-600">
                  Turn a plain-English idea into a blueprint, generated codebase, live preview,
                  and saved workspace, then keep refining it without leaving the flow.
                </p>

              </div>

              <div className="glass-panel-strong overflow-hidden rounded-[36px] border border-white/70 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                <div className="theme-dark-panel border-b border-white/10 px-6 py-6 text-white">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#eadbcb]">
                    Launch path
                  </div>
                  <h3 className="mt-4 text-2xl font-bold tracking-tight">From prompt to workspace</h3>
                  <p className="mt-2 max-w-md text-sm leading-7 text-slate-200">
                    A cleaner three-step flow for getting from a rough idea to something you can inspect, edit, and ship.
                  </p>
                </div>

                <div className="space-y-5 bg-[rgba(251,252,253,0.88)] px-5 py-5 sm:px-6 sm:py-6">
                  <WorkflowStep
                    index="01"
                    title="Generate the first cut"
                    copy="Start with one clear prompt and ShipStack builds the initial blueprint and code."
                  />
                  <WorkflowStep
                    index="02"
                    title="Review the output"
                    copy="Switch between preview, code, and project database tools in the same workspace."
                  />
                  <WorkflowStep
                    index="03"
                    title="Refine and save"
                    copy="Apply follow-up prompts or blueprint edits, then reopen the project anytime."
                    isLast
                  />
                </div>
              </div>
            </div>

            <div className="mt-10">
              <PromptInput onSubmit={generate} isLoading={isLoading} />
            </div>
          </section>
        ) : null}

        {showProgress ? (
          <section className="space-y-6 py-4">
            <ProgressIndicator
              stage={state.stage}
              progress={state.progress}
              message={state.message}
              error={state.error}
              onCancel={isLoading ? cancelGeneration : undefined}
            />

            {state.logs.length > 0 ? (
              <div className="glass-panel mx-auto max-w-5xl overflow-hidden rounded-[28px] shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
                <div className="border-b border-slate-200 bg-white/70 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">Runtime activity</p>
                  <p className="mt-1 text-xs text-slate-400">Recent orchestration and preview events</p>
                </div>
                <div className="max-h-[260px] overflow-y-auto bg-slate-950 px-4 py-4 text-xs text-slate-300">
                  {state.logs.slice(-18).map((log, index) => (
                    <p key={`${index}-${log}`} className="py-1 font-mono leading-6">
                      {log}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {showResults && state.project ? (
          <section className="animate-fade-up space-y-6">
            <div className="glass-panel-strong overflow-hidden rounded-[34px] shadow-[0_28px_90px_rgba(15,23,42,0.1)]">
              <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(185,130,77,0.15),_transparent_34%),radial-gradient(circle_at_right,_rgba(83,119,153,0.12),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.94),_rgba(243,246,250,0.98))] px-5 py-6 sm:px-6">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                  <div className="max-w-3xl">
                    <div className="theme-chip-success inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em]">
                      Generated workspace ready
                    </div>
                    <h3 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                      {state.project.blueprint.projectName}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      Review the live preview, explore files, inspect the generated schema, and keep refining from here.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <ProjectDatabasePanel
                      projectName={state.project.blueprint.projectName}
                      blueprint={state.project.blueprint}
                      files={state.project.files}
                    />
                    <DownloadButton
                      onDownload={download}
                      projectName={state.project.blueprint.projectName}
                      fileCount={state.project.files.length}
                    />
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard label="Files" value={String(state.project.stats?.totalFiles ?? 0)} helper="Generated in the latest run" />
                  <StatCard
                    label="Bundle size"
                    value={
                      state.project.stats?.totalSizeBytes
                        ? `${(state.project.stats.totalSizeBytes / 1024).toFixed(1)} KB`
                        : '0 KB'
                    }
                    helper="Approximate project output size"
                  />
                  <StatCard
                    label="Latency"
                    value={
                      state.project.stats?.totalLatencyMs
                        ? `${(state.project.stats.totalLatencyMs / 1000).toFixed(1)} s`
                        : '0 s'
                    }
                    helper="Time spent generating this version"
                  />
                  <StatCard
                    label="Models"
                    value={String(state.project.blueprint.dataModels.length)}
                    helper="Database entities in the blueprint"
                    highlight
                  />
                </div>
              </div>
            </div>

            {state.project.warnings.length > 0 ? (
              <details className="theme-status-accent rounded-[26px] px-5 py-4 text-sm">
                <summary className="cursor-pointer font-semibold">
                  {state.project.warnings.length} generation warning{state.project.warnings.length === 1 ? '' : 's'}
                </summary>
                <div className="mt-3 space-y-2 leading-7">
                  {state.project.warnings.map((warning, index) => (
                    <p key={`${index}-${warning}`}>{warning}</p>
                  ))}
                </div>
              </details>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
              <FollowUpPrompt onSubmit={refineWithPrompt} isLoading={isLoading} />
              <BlueprintEditor
                blueprint={state.project.blueprint}
                onRegenerate={regenerateFromBlueprint}
                isLoading={isLoading}
              />
            </div>

            <div className="h-[760px]">
              <PreviewPanel
                url={state.previewUrl}
                logs={state.logs}
                isReady={state.stage === 'ready'}
                files={state.project.files}
                onFix={fixPreview}
              />
            </div>

            <BlueprintSummary blueprint={state.project.blueprint} />
          </section>
        ) : null}
      </main>
    </div>
  );
}

function WorkflowStep({
  index,
  title,
  copy,
  isLast = false,
}: {
  index: string;
  title: string;
  copy: string;
  isLast?: boolean;
}) {
  return (
    <div className="relative pl-16">
      {!isLast ? (
        <span className="absolute left-[19px] top-12 h-[calc(100%-1.75rem)] w-px bg-[rgba(132,150,171,0.35)]" />
      ) : null}

      <span className="theme-icon-badge absolute left-0 top-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-bold">
          {index}
      </span>

      <div className="theme-card rounded-[26px] px-5 py-5 transition hover:-translate-y-0.5">
        <p className="text-base font-semibold text-slate-950">{title}</p>
        <p className="mt-2 text-sm leading-7 text-slate-500">{copy}</p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
  highlight,
}: {
  label: string;
  value: string;
  helper: string;
  highlight?: boolean;
}) {
  return (
    <div className="theme-card rounded-[24px] px-4 py-4 transition hover:-translate-y-0.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={`mt-3 text-3xl font-bold ${highlight ? 'theme-link' : 'text-slate-950'}`}>{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{helper}</p>
    </div>
  );
}

function BlueprintSummary({
  blueprint,
}: {
  blueprint: {
    projectName: string;
    description: string;
    features: Array<{ name: string; description: string; priority: string }>;
    dataModels: Array<{ name: string; fields: Array<{ name: string }> }>;
    apiEndpoints: Array<{ method: string; path: string }>;
    pages: Array<{ name: string; route: string }>;
    techStack: { frontend: string; backend: string; database: string; auth: string };
  };
}) {
  return (
    <div className="glass-panel-strong rounded-[32px] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.24em]">Blueprint</p>
          <h3 className="mt-3 text-2xl font-bold text-slate-950 sm:text-3xl">{blueprint.projectName}</h3>
        </div>
        <p className="max-w-3xl text-sm leading-7 text-slate-600">{blueprint.description}</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-4">
        <SummaryColumn
          title={`Features (${blueprint.features.length})`}
          items={blueprint.features.map((feature) => `${feature.name} • ${feature.priority}`)}
        />
        <SummaryColumn
          title={`Models (${blueprint.dataModels.length})`}
          items={blueprint.dataModels.map((model) => `${model.name} • ${model.fields.length} fields`)}
        />
        <SummaryColumn
          title={`Endpoints (${blueprint.apiEndpoints.length})`}
          items={blueprint.apiEndpoints.slice(0, 8).map((endpoint) => `${endpoint.method} ${endpoint.path}`)}
        />
        <SummaryColumn
          title={`Pages (${blueprint.pages.length})`}
          items={[
            ...blueprint.pages.map((page) => `${page.name} • ${page.route}`),
            `Frontend: ${blueprint.techStack.frontend}`,
            `Auth: ${blueprint.techStack.auth}`,
          ]}
        />
      </div>
    </div>
  );
}

function SummaryColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="theme-card rounded-[24px] px-4 py-4">
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      <div className="mt-3 space-y-2 text-sm text-slate-600">
        {items.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </div>
    </div>
  );
}

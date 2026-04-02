'use client';

import { useAuth } from '@/lib/auth/useAuth';
import { useProjectGenerator } from '@/lib/hooks/useProjectGenerator';
import BlueprintEditor from './components/BlueprintEditor';
import DownloadButton from './components/DownloadButton';
import FollowUpPrompt from './components/FollowUpPrompt';
import PreviewPanel from './components/PreviewPanel';
import ProgressIndicator from './components/ProgressIndicator';
import ProjectDatabasePanel from './components/ProjectDatabasePanel';
import PromptInput from './components/PromptInput';
import UserMenu from './components/UserMenu';

const BENEFIT_CARDS = [
  {
    eyebrow: 'Generate',
    title: 'Blueprint, code, and preview in one run',
    copy: 'Describe the product once and get a full architecture, project files, preview sandbox, and downloadable workspace.',
  },
  {
    eyebrow: 'Refine',
    title: 'Iterate with prompts or edit the blueprint directly',
    copy: 'Keep prompting in plain English or open the Smart Blueprint Editor when you want tighter control over pages and data models.',
  },
  {
    eyebrow: 'Reopen',
    title: 'Saved workspaces stay actionable',
    copy: 'Every project can be reopened with its preview, files, database view, downloads, and follow-up history-ready workflow.',
  },
] as const;

export default function HomePage() {
  const { state, generate, refineWithPrompt, regenerateFromBlueprint, download, reset } =
    useProjectGenerator();
  const { user } = useAuth();
  const isLoading = !['idle', 'ready', 'error'].includes(state.stage);
  const showResults = state.stage === 'ready' && state.project;
  const showProgress = isLoading || state.stage === 'error';

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px] bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(20,184,166,0.12),_transparent_22%),linear-gradient(180deg,_rgba(255,255,255,0.9),_transparent)]" />
      <div className="pointer-events-none absolute left-[-90px] top-[160px] -z-10 h-64 w-64 rounded-full bg-orange-200/40 blur-3xl animate-float-soft" />
      <div className="pointer-events-none absolute right-[-70px] top-[280px] -z-10 h-64 w-64 rounded-full bg-teal-200/40 blur-3xl animate-float-soft" />

      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-[18px] bg-slate-950 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
              <BrandGlyph />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-500">
                ShipStack
              </p>
              <h1 className="mt-1 text-lg font-bold text-slate-950">
                AI startup builder
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {state.stage !== 'idle' ? (
              <button
                type="button"
                onClick={() => void reset()}
                disabled={isLoading}
                className="glass-panel rounded-full px-4 py-2 text-xs font-semibold text-slate-700 transition hover:-translate-y-0.5 disabled:opacity-50"
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
            <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-end">
              <div>
                {user ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-sm text-slate-600 shadow-sm">
                    <span className="font-semibold text-slate-900">Welcome back, {user.name}</span>
                    <span className="text-slate-400">Your generated workspaces save automatically.</span>
                  </div>
                ) : null}

                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-orange-700">
                  Interactive AI product generation
                </div>

                <h2 className="mt-6 max-w-4xl text-balance text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl">
                  Build the first version of your startup before the momentum fades
                </h2>

                <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
                  ShipStack turns a plain-English idea into a blueprint, generated codebase,
                  preview, download, and saved workspace. Then it lets you keep iterating with
                  prompts, manual blueprint edits, and a project-aware database view.
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {BENEFIT_CARDS.map((card) => (
                    <div
                      key={card.title}
                      className="glass-panel rounded-[28px] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition hover:-translate-y-1"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-500">
                        {card.eyebrow}
                      </p>
                      <h3 className="mt-3 text-lg font-bold text-slate-950">{card.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{card.copy}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel rounded-[34px] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-600">
                  What happens next
                </p>
                <div className="mt-5 space-y-4">
                  <WorkflowStep
                    index="01"
                    title="Generate the first version"
                    copy="Prompt the builder with your product idea and get a structured blueprint plus project files."
                  />
                  <WorkflowStep
                    index="02"
                    title="Inspect preview and database"
                    copy="Use desktop or mobile preview, skim the file explorer, and open the project database side panel."
                  />
                  <WorkflowStep
                    index="03"
                    title="Refine until it feels right"
                    copy="Apply another prompt or edit the blueprint manually to keep evolving the project."
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
              <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.16),_transparent_34%),linear-gradient(180deg,_rgba(255,255,255,0.94),_rgba(248,250,252,0.98))] px-5 py-6 sm:px-6">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                  <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
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
              <details className="rounded-[26px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
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
}: {
  index: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 transition hover:-translate-y-0.5">
      <div className="flex items-start gap-4">
        <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-xs font-bold text-white">
          {index}
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-950">{title}</p>
          <p className="mt-2 text-sm leading-7 text-slate-500">{copy}</p>
        </div>
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
    <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 transition hover:-translate-y-0.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={`mt-3 text-3xl font-bold ${highlight ? 'text-orange-600' : 'text-slate-950'}`}>{value}</p>
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
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">Blueprint</p>
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
    <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      <div className="mt-3 space-y-2 text-sm text-slate-600">
        {items.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </div>
    </div>
  );
}

function BrandGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5 4.75 7.75v8.5L12 20.5l7.25-4.25v-8.5L12 3.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.5 10.25 3.5 2 3.5-2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.25v4.25" />
    </svg>
  );
}

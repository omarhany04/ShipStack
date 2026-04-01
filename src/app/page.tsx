'use client';

import DownloadButton from './components/DownloadButton';
import FileExplorer from './components/FileExplorer';
import PreviewPanel from './components/PreviewPanel';
import ProgressIndicator from './components/ProgressIndicator';
import PromptInput from './components/PromptInput';
import { useProjectGenerator } from '@/lib/hooks/useProjectGenerator';

export default function HomePage() {
  const { state, generate, download, reset } = useProjectGenerator();
  const isLoading = !['idle', 'ready', 'error'].includes(state.stage);
  const showResults = state.stage === 'ready' && state.project;
  const showProgress = isLoading || state.stage === 'error';

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">ShipStack</p>
            <h1 className="mt-1 text-xl font-bold text-slate-950">AI Auto Startup Builder</h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/api/health"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 sm:inline-flex"
            >
              AI Health
            </a>
            {state.stage !== 'idle' ? (
              <button
                type="button"
                onClick={() => void reset()}
                disabled={isLoading}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 disabled:opacity-50"
              >
                Start Over
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {(state.stage === 'idle' || state.stage === 'error') ? (
          <section className="py-8">
            <div className="mx-auto mb-10 max-w-4xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-orange-700">
                Multi-model orchestration
              </div>
              <h2 className="mt-6 text-balance text-5xl font-bold tracking-tight text-slate-950">
                Turn a plain-English startup idea into a runnable codebase
              </h2>
              <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
                Gemini, Groq, and OpenRouter coordinate blueprint generation, validation, code scaffolding, preview boot, and zip export in one flow.
              </p>
            </div>
            <PromptInput onSubmit={generate} isLoading={isLoading} />
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
              <div className="mx-auto max-w-4xl rounded-[28px] border border-slate-200 bg-slate-950 p-4 text-xs text-slate-300 shadow-soft">
                {state.logs.slice(-16).map((log, index) => (
                  <p key={`${index}-${log}`} className="py-1 font-mono">
                    {log}
                  </p>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {showResults && state.project ? (
          <section className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="grid gap-4 sm:grid-cols-4">
                  <StatCard label="Files" value={String(state.project.stats?.totalFiles ?? 0)} />
                  <StatCard
                    label="Size"
                    value={
                      state.project.stats?.totalSizeBytes
                        ? `${(state.project.stats.totalSizeBytes / 1024).toFixed(1)} KB`
                        : '0 KB'
                    }
                  />
                  <StatCard
                    label="Latency"
                    value={
                      state.project.stats?.totalLatencyMs
                        ? `${(state.project.stats.totalLatencyMs / 1000).toFixed(1)} s`
                        : '0 s'
                    }
                  />
                  <StatCard label="Project" value={state.project.blueprint.projectName} highlight />
                </div>

                <DownloadButton
                  onDownload={download}
                  projectName={state.project.blueprint.projectName}
                  fileCount={state.project.files.length}
                />
              </div>
            </div>

            {state.project.warnings.length > 0 ? (
              <details className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
                <summary className="cursor-pointer font-semibold">
                  {state.project.warnings.length} generation warning{state.project.warnings.length === 1 ? '' : 's'}
                </summary>
                <div className="mt-3 space-y-2">
                  {state.project.warnings.map((warning, index) => (
                    <p key={`${index}-${warning}`}>{warning}</p>
                  ))}
                </div>
              </details>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="h-[680px] lg:col-span-2">
                <PreviewPanel
                  url={state.previewUrl}
                  logs={state.logs}
                  isReady={state.stage === 'ready'}
                />
              </div>
              <div className="h-[680px]">
                <FileExplorer files={state.project.files} />
              </div>
            </div>

            <BlueprintSummary blueprint={state.project.blueprint} />
          </section>
        ) : null}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className={`text-lg font-bold ${highlight ? 'text-orange-600' : 'text-slate-950'}`}>{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
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
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">Blueprint</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-950">{blueprint.projectName}</h3>
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
            `Tech: ${blueprint.techStack.frontend}`,
            `API: ${blueprint.techStack.backend}`,
          ]}
        />
      </div>
    </div>
  );
}

function SummaryColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      <div className="mt-3 space-y-2 text-sm text-slate-600">
        {items.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </div>
    </div>
  );
}

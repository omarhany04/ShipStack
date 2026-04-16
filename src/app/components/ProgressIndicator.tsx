'use client';

import { PipelineStage } from '@/lib/hooks/useProjectGenerator';

interface ProgressIndicatorProps {
  stage: PipelineStage;
  progress: number;
  message: string;
  error: string | null;
  onCancel?: () => void | Promise<void>;
}

const PIPELINE_STEPS: Array<{
  stages: PipelineStage[];
  label: string;
  caption: string;
}> = [
  {
    stages: ['validating', 'generating_blueprint'],
    label: 'Blueprint',
    caption: 'Understanding the product and shaping the architecture',
  },
  {
    stages: ['generating_code'],
    label: 'Code',
    caption: 'Generating screens, APIs, database files, and flows',
  },
  {
    stages: ['building'],
    label: 'Assembly',
    caption: 'Composing the project and validating output quality',
  },
  {
    stages: ['preview_booting', 'preview_installing', 'preview_starting'],
    label: 'Preview',
    caption: 'Preparing the sandboxed app preview and runtime',
  },
  {
    stages: ['ready'],
    label: 'Ready',
    caption: 'Your generated workspace is live and ready to inspect',
  },
] as const;

export default function ProgressIndicator({
  stage,
  progress,
  message,
  error,
  onCancel,
}: ProgressIndicatorProps) {
  if (stage === 'idle') {
    return null;
  }

  const currentStepIndex = PIPELINE_STEPS.findIndex((step) => step.stages.includes(stage));
  const currentStep = PIPELINE_STEPS[currentStepIndex] ?? PIPELINE_STEPS[0];
  const showCancelButton = !error && stage !== 'ready' && Boolean(onCancel);

  return (
    <div className="glass-panel-strong mx-auto w-full max-w-5xl animate-fade-up overflow-hidden rounded-[32px] p-5 shadow-[0_28px_100px_rgba(15,23,42,0.12)] sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.26em]">
            Generation in progress
          </p>
          <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            {message}
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            {currentStep.caption}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatusChip label="Progress" value={`${Math.round(progress)}%`} tone="accent" />
            <StatusChip label="Current stage" value={currentStep.label} />
            <StatusChip label="State" value={error ? 'Needs attention' : 'Running'} tone={error ? 'danger' : 'success'} />
          </div>

          {showCancelButton ? (
            <button
              type="button"
              onClick={() => {
                void onCancel?.();
              }}
              className="theme-status-danger inline-flex rounded-full px-4 py-2 text-sm font-semibold transition hover:bg-rose-100"
            >
              Cancel operation
            </button>
          ) : null}
        </div>
      </div>

      <div className="theme-card-muted mt-6 rounded-[26px] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">Pipeline progress</p>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {PIPELINE_STEPS.length} steps
          </p>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/80">
          <div
            className="animate-shimmer h-full rounded-full bg-[linear-gradient(90deg,#b9824d_0%,#d1ad7f_46%,#537799_100%)] transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          {PIPELINE_STEPS.map((step, index) => {
            const isActive = step.stages.includes(stage);
            const isDone = currentStepIndex > index || stage === 'ready';
            return (
              <div
                key={step.label}
                className={`rounded-[24px] border px-4 py-4 text-left transition ${
                  isActive
                    ? 'theme-status-accent'
                    : isDone
                      ? 'theme-dark-panel border-transparent text-white'
                      : 'theme-card text-slate-700'
                }`}
              >
                <div
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl text-xs font-bold ${
                    isDone
                      ? 'bg-white/10 text-white'
                    : isActive
                        ? 'bg-white text-[color:var(--brand-accent-strong)] shadow-sm'
                        : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isDone ? '✓' : index + 1}
                </div>
                <p className={`mt-3 text-sm font-semibold ${isDone ? 'text-white' : 'text-inherit'}`}>
                  {step.label}
                </p>
                <p
                  className={`mt-2 text-xs leading-6 ${
                    isDone
                      ? 'text-slate-200'
                      : isActive
                        ? 'text-[color:var(--brand-accent-strong)]/80'
                        : 'text-slate-400'
                  }`}
                >
                  {step.caption}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {error ? (
        <div className="theme-status-danger mt-5 whitespace-pre-line rounded-[24px] px-5 py-4 text-sm leading-7">
          {error}
        </div>
      ) : null}
    </div>
  );
}

function StatusChip({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'accent' | 'success' | 'danger';
}) {
  const toneClass =
    tone === 'accent'
      ? 'theme-status-accent'
      : tone === 'success'
        ? 'theme-status-success'
        : tone === 'danger'
          ? 'theme-status-danger'
          : 'theme-status-default';

  return (
    <div className={`rounded-[22px] px-4 py-3 ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

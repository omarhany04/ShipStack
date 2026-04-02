'use client';

import { PipelineStage } from '@/lib/hooks/useProjectGenerator';

interface ProgressIndicatorProps {
  stage: PipelineStage;
  progress: number;
  message: string;
  error: string | null;
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
}: ProgressIndicatorProps) {
  if (stage === 'idle') {
    return null;
  }

  const currentStepIndex = PIPELINE_STEPS.findIndex((step) => step.stages.includes(stage));
  const currentStep = PIPELINE_STEPS[currentStepIndex] ?? PIPELINE_STEPS[0];

  return (
    <div className="glass-panel-strong mx-auto w-full max-w-5xl animate-fade-up overflow-hidden rounded-[32px] p-5 shadow-[0_28px_100px_rgba(15,23,42,0.12)] sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-orange-500">
            Generation in progress
          </p>
          <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            {message}
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            {currentStep.caption}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatusChip label="Progress" value={`${Math.round(progress)}%`} tone="accent" />
          <StatusChip label="Current stage" value={currentStep.label} />
          <StatusChip label="State" value={error ? 'Needs attention' : 'Running'} tone={error ? 'danger' : 'success'} />
        </div>
      </div>

      <div className="mt-6 rounded-[26px] border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">Pipeline progress</p>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {PIPELINE_STEPS.length} steps
          </p>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
          <div
            className="animate-shimmer h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-teal-400 transition-all duration-700"
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
                    ? 'border-orange-200 bg-orange-50'
                    : isDone
                      ? 'border-slate-200 bg-slate-950 text-white'
                      : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <div
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl text-xs font-bold ${
                    isDone
                      ? 'bg-white/10 text-white'
                      : isActive
                        ? 'bg-white text-orange-700 shadow-sm'
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
                    isDone ? 'text-slate-200' : isActive ? 'text-orange-700/80' : 'text-slate-400'
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
        <div className="mt-5 rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm leading-7 text-rose-700">
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
      ? 'border-orange-200 bg-orange-50 text-orange-700'
      : tone === 'success'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : tone === 'danger'
          ? 'border-rose-200 bg-rose-50 text-rose-700'
          : 'border-slate-200 bg-white text-slate-700';

  return (
    <div className={`rounded-[22px] border px-4 py-3 ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

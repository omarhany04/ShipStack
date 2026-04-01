'use client';

import { PipelineStage } from '@/lib/hooks/useProjectGenerator';

interface ProgressIndicatorProps {
  stage: PipelineStage;
  progress: number;
  message: string;
  error: string | null;
}

const PIPELINE_STEPS: Array<{ stages: PipelineStage[]; label: string }> = [
  { stages: ['validating', 'generating_blueprint'], label: 'Blueprint' },
  { stages: ['generating_code'], label: 'Code' },
  { stages: ['building'], label: 'Assembly' },
  { stages: ['preview_booting', 'preview_installing', 'preview_starting'], label: 'Preview' },
  { stages: ['ready'], label: 'Done' },
];

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

  return (
    <div className="mx-auto w-full max-w-4xl rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">Pipeline</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{message}</h3>
        </div>
        <p className="text-sm font-semibold text-slate-600">{Math.round(progress)}%</p>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-sky-500 transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-6 grid grid-cols-5 gap-3">
        {PIPELINE_STEPS.map((step, index) => {
          const isActive = step.stages.includes(stage);
          const isDone = currentStepIndex > index || stage === 'ready';
          return (
            <div key={step.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
              <div
                className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  isDone
                    ? 'bg-slate-900 text-white'
                    : isActive
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-white text-slate-400'
                }`}
              >
                {isDone ? '✓' : index + 1}
              </div>
              <p className="mt-2 text-xs font-medium text-slate-600">{step.label}</p>
            </div>
          );
        })}
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}

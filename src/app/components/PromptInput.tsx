'use client';

import { useEffect, useRef, useState } from 'react';

interface PromptInputProps {
  onSubmit: (idea: string) => void | Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
}

const EXAMPLE_IDEAS = [
  {
    title: 'Operations-heavy SaaS',
    prompt:
      'A field service platform for home repair companies with job scheduling, technician dispatch, route optimization, invoicing, and customer updates.',
  },
  {
    title: 'Marketplace workflow',
    prompt:
      'A B2B marketplace for office suppliers with vendor onboarding, bulk pricing, approvals, recurring reorders, and buyer analytics.',
  },
  {
    title: 'Client portal product',
    prompt:
      'A freelancer CRM with proposals, invoices, client portals, lead tracking, reminders, and project status dashboards.',
  },
  {
    title: 'Creator subscription app',
    prompt:
      'A subscription platform for fitness creators with programs, progress tracking, community posts, billing, and admin reporting.',
  },
] as const;

const OUTPUT_PREVIEWS = [
  'Structured blueprint with features, pages, APIs, and data models',
  'Generated Next.js project with files, preview, and mobile mode',
  'Saved workspace with database view, downloads, and follow-up prompting',
] as const;

export default function PromptInput({ onSubmit, isLoading, disabled }: PromptInputProps) {
  const [idea, setIdea] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 260)}px`;
  }, [idea]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!idea.trim() || isLoading || disabled) {
      return;
    }

    void onSubmit(idea.trim());
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      handleSubmit(event);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl animate-fade-up">
      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <form
          onSubmit={handleSubmit}
          className="glass-panel-strong soft-ring animate-shimmer overflow-hidden rounded-[34px] p-5 sm:p-6"
        >
          <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-orange-500">
                Describe your product
              </p>
              <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Turn an idea into a working product blueprint
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Include the audience, core workflows, standout differentiators, and any must-have
                roles or admin needs. The more concrete the prompt, the better the generated app.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-700">
              <SparkGlyph />
              Guided input
            </div>
          </div>

          <div className="mt-5 rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.94))] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Your idea</p>
                <p className="mt-1 text-xs text-slate-400">
                  Use <span className="font-semibold text-slate-600">Ctrl</span> +{' '}
                  <span className="font-semibold text-slate-600">Enter</span> to generate quickly
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
                {idea.length}/2000
              </span>
            </div>

            <textarea
              ref={textareaRef}
              value={idea}
              onChange={(event) => setIdea(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={5}
              maxLength={2000}
              disabled={isLoading || disabled}
              placeholder="Example: A modern CRM for boutique agencies with deal tracking, proposal approvals, client portals, invoice reminders, and a leadership dashboard for pipeline health."
              className="mt-4 min-h-[180px] w-full resize-none border-none bg-transparent text-[15px] leading-8 text-slate-900 outline-none placeholder:text-slate-400"
            />

            <div className="mt-4 grid gap-3 rounded-[24px] bg-slate-950 px-4 py-4 text-slate-200 sm:grid-cols-3">
              {OUTPUT_PREVIEWS.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm leading-6">
                  <span className="mt-1 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] text-orange-300">
                    ✓
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Prefer browsing first? Tap one of the prepared prompts on the right and tailor it.
            </p>
            <button
              type="submit"
              disabled={!idea.trim() || isLoading || disabled}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Generating project...' : 'Generate startup workspace'}
              <ArrowGlyph />
            </button>
          </div>
        </form>

        <aside className="glass-panel rounded-[34px] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-600">
                Quick starts
              </p>
              <h3 className="mt-3 text-xl font-bold text-slate-950">Prompt ideas that produce richer projects</h3>
            </div>
            <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white sm:inline-flex">
              <CompassGlyph />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {EXAMPLE_IDEAS.map((example, index) => (
              <button
                key={example.title}
                type="button"
                disabled={isLoading || disabled}
                onClick={() => setIdea(example.prompt)}
                className="group block w-full rounded-[26px] border border-slate-200 bg-white px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50/60 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-700 transition group-hover:bg-white">
                      0{index + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{example.title}</span>
                  </div>
                  <ArrowGlyph className="h-4 w-4 text-slate-300 transition group-hover:text-orange-500" />
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-500">{example.prompt}</p>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function SparkGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="m12 2 1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7L12 2Z" />
    </svg>
  );
}

function CompassGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.75 9.25-1.95 4.05-4.05 1.95 1.95-4.05 4.05-1.95Z" />
    </svg>
  );
}

function ArrowGlyph({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.75 12H19.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m13.75 6.75 5.5 5.25-5.5 5.25" />
    </svg>
  );
}

'use client';

import { useState } from 'react';

interface FollowUpPromptProps {
  onSubmit: (prompt: string) => void | Promise<void>;
  isLoading: boolean;
}

const EXAMPLE_REFINEMENTS = [
  {
    title: 'Upgrade the admin layer',
    prompt: 'Add an admin dashboard with audit logs, role management, activity feeds, and moderation tools.',
  },
  {
    title: 'Make the product feel premium',
    prompt: 'Redesign the landing page with more premium visuals, clearer pricing, testimonials, and a stronger conversion flow.',
  },
  {
    title: 'Add collaboration',
    prompt: 'Introduce team workspaces, invitations, approval flows, and role-based access across the product.',
  },
  {
    title: 'Bring in analytics',
    prompt: 'Add analytics charts, KPI summaries, trend views, and weekly email summaries for managers.',
  },
] as const;

export default function FollowUpPrompt({
  onSubmit,
  isLoading,
}: FollowUpPromptProps) {
  const [prompt, setPrompt] = useState('');

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!prompt.trim() || isLoading) {
      return;
    }

    void onSubmit(prompt.trim());
  }

  return (
    <section className="glass-panel rounded-[30px] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5">
        <div className="theme-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em]">
          Continue prompting
        </div>
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-950">
            Ask for the next round of product changes
          </h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Use plain English to refine the current project. ShipStack will update the blueprint
            and regenerate the workspace around your latest instructions.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Example: Add a client billing dashboard, make the navigation more polished, and include an onboarding checklist for new users."
          rows={6}
          disabled={isLoading}
          className="theme-input w-full rounded-[26px] px-4 py-4 text-sm leading-7 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <div className="theme-dark-panel rounded-[24px] px-4 py-4 text-sm text-slate-200">
          <p className="font-semibold text-white">Works best when you mention:</p>
          <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
            <p>Specific screens or pages</p>
            <p>New entities or data models</p>
            <p>Design direction or visual changes</p>
            <p>User roles, permissions, or admin needs</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            The current project stays as your starting point, so you can iterate safely.
          </p>
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="theme-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Applying changes...' : 'Apply follow-up prompt'}
            <ArrowGlyph />
          </button>
        </div>
      </form>

      <div className="mt-5 grid gap-3">
        {EXAMPLE_REFINEMENTS.slice(0, 2).map((example) => (
          <button
            key={example.title}
            type="button"
            disabled={isLoading}
            onClick={() => setPrompt(example.prompt)}
            className="theme-card group flex w-full items-start justify-between gap-4 rounded-[24px] px-4 py-4 text-left transition hover:border-[rgba(83,119,153,0.34)] hover:bg-[rgba(241,246,250,0.94)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">{example.title}</p>
              <p className="mt-2 text-sm leading-7 text-slate-500">{example.prompt}</p>
            </div>
            <ArrowGlyph className="mt-1 h-4 w-4 flex-shrink-0 text-slate-300 transition group-hover:text-[color:var(--brand-accent)]" />
          </button>
        ))}
      </div>
    </section>
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

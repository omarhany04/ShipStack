'use client';

import { useState } from 'react';

interface FollowUpPromptProps {
  onSubmit: (prompt: string) => void | Promise<void>;
  isLoading: boolean;
}

const EXAMPLE_REFINEMENTS = [
  'Add an admin dashboard with audit logs and user management.',
  'Make the landing page feel more premium and add a pricing section.',
  'Introduce team workspaces, invitations, and role-based access.',
  'Add analytics charts and weekly email summary features.',
];

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
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
          Continue Prompting
        </p>
        <h3 className="mt-2 text-2xl font-bold text-slate-950">
          Ask for another round of modifications
        </h3>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          Keep iterating on the generated website with plain-English follow-up requests. We&apos;ll refine the current blueprint, then regenerate the project and preview.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Example: Add a client billing dashboard, make the navigation more polished, and include an onboarding checklist."
          rows={5}
          disabled={isLoading}
          className="w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-900 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">
            Tip: mention the feature, page, workflow, or data model you want changed.
          </p>
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Applying changes...' : 'Apply follow-up prompt'}
          </button>
        </div>
      </form>

      <div className="mt-5 flex flex-wrap gap-2">
        {EXAMPLE_REFINEMENTS.map((example) => (
          <button
            key={example}
            type="button"
            disabled={isLoading}
            onClick={() => setPrompt(example)}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}

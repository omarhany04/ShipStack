'use client';

import { useEffect, useRef, useState } from 'react';

interface PromptInputProps {
  onSubmit: (idea: string) => void | Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
}

const EXAMPLE_IDEAS = [
  'A food delivery app with restaurant management, order tracking, and driver dispatch.',
  'A project management platform with kanban boards, timelines, and team collaboration.',
  'A marketplace for handmade products with seller dashboards and customer reviews.',
  'A fitness coaching app with workouts, progress analytics, and subscriptions.',
];

export default function PromptInput({ onSubmit, isLoading, disabled }: PromptInputProps) {
  const [idea, setIdea] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 220)}px`;
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
    <div className="mx-auto w-full max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-[28px] border border-orange-200/70 bg-white/90 p-5 shadow-soft backdrop-blur">
        <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
          <textarea
            ref={textareaRef}
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={4}
            maxLength={2000}
            disabled={isLoading || disabled}
            placeholder="Describe the startup you want to generate. Mention the users, core features, and anything special about the workflow."
            className="min-h-[140px] w-full resize-none border-none bg-transparent text-base leading-7 text-slate-900 outline-none placeholder:text-slate-400"
          />
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Tip: include who it serves, key flows, and any differentiator.</span>
            <span>{idea.length}/2000</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Submit with <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">Ctrl</span> +{' '}
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">Enter</span>
          </p>
          <button
            type="submit"
            disabled={!idea.trim() || isLoading || disabled}
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Generating...' : 'Generate My Startup'}
          </button>
        </div>
      </form>

      <div className="mt-6 flex flex-wrap gap-2">
        {EXAMPLE_IDEAS.map((example) => (
          <button
            key={example}
            type="button"
            disabled={isLoading || disabled}
            onClick={() => setIdea(example)}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-600 transition hover:border-orange-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}

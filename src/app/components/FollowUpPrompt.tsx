'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Blueprint } from '@/validators/blueprint.validator';

interface FollowUpPromptProps {
  blueprint: Blueprint;
  onSubmit: (prompt: string) => void | Promise<void>;
  isLoading: boolean;
}

interface SuggestedRefinement {
  title: string;
  prompt: string;
}

export default function FollowUpPrompt({
  blueprint,
  onSubmit,
  isLoading,
}: FollowUpPromptProps) {
  const [prompt, setPrompt] = useState('');
  const candidates = useMemo(() => buildProjectSpecificSuggestions(blueprint), [blueprint]);
  const blueprintSignature = useMemo(() => {
    return JSON.stringify({
      projectName: blueprint.projectName,
      features: blueprint.features.map((feature) => feature.name),
      models: blueprint.dataModels.map((model) => model.name),
      pages: blueprint.pages.map((page) => page.route),
      auth: blueprint.techStack.auth,
    });
  }, [blueprint]);
  const [suggestion, setSuggestion] = useState<SuggestedRefinement>(() => candidates[0]);

  useEffect(() => {
    setSuggestion(candidates[Math.floor(Math.random() * candidates.length)] ?? candidates[0]);
  }, [blueprintSignature, candidates]);

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
          placeholder={`Example: ${suggestion.prompt}`}
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

      <div className="mt-5">
        <button
          type="button"
          disabled={isLoading}
          onClick={() => setPrompt(suggestion.prompt)}
          className="theme-card group flex w-full items-start justify-between gap-4 rounded-[24px] px-4 py-4 text-left transition hover:border-[rgba(83,119,153,0.34)] hover:bg-[rgba(241,246,250,0.94)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-accent-strong)]">
              Suggested next move
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{suggestion.title}</p>
            <p className="mt-2 text-sm leading-7 text-slate-500">{suggestion.prompt}</p>
          </div>
          <ArrowGlyph className="mt-1 h-4 w-4 flex-shrink-0 text-slate-300 transition group-hover:text-[color:var(--brand-accent)]" />
        </button>
      </div>
    </section>
  );
}

function buildProjectSpecificSuggestions(blueprint: Blueprint): SuggestedRefinement[] {
  const keyFeature = pickFeature(blueprint);
  const keyModel = blueprint.dataModels[0]?.name ?? 'core data';
  const secondModel = blueprint.dataModels[1]?.name ?? keyModel;
  const keyPage = pickPage(blueprint);
  const authEnabled = blueprint.techStack.auth.toLowerCase() !== 'none';
  const featureFocus = toLowerLead(keyFeature.name);
  const featureSentence = trimSentence(keyFeature.description);
  const pageFocus = keyPage.name;
  const pageRoute = keyPage.route;

  return [
    {
      title: `Deepen the ${pageFocus} workflow`,
      prompt: `Expand the ${pageFocus} experience at ${pageRoute} so it feels complete for ${featureFocus}. Add clearer states, richer actions, and a more polished flow tied to ${keyModel} data. Build in validation, empty states, and success feedback so the workflow feels production-ready.`,
    },
    {
      title: `Turn ${keyModel} into an operator view`,
      prompt: `Create a richer operational dashboard around ${keyModel} and ${secondModel}. Add filters, status views, bulk actions, and timeline context so the team can manage ${featureFocus} without leaving the product.`,
    },
    {
      title: authEnabled ? 'Polish the signed-in journey' : 'Add a stronger onboarding layer',
      prompt: authEnabled
        ? `Make the signed-in experience more intentional after login. Add onboarding steps, role-aware navigation, and guided actions that help users get value quickly from ${featureFocus}, especially around ${pageFocus} and ${keyModel}.`
        : `Add onboarding and account flows that help users start using the product immediately. Introduce sign-up, guided setup, and progress tracking so new users can reach the ${pageFocus} workflow faster and understand how ${keyModel} supports ${featureFocus}.`,
    },
    {
      title: `Add insight loops for ${featureFocus}`,
      prompt: `Introduce analytics and insight surfaces tailored to ${featureFocus}. Add KPI cards, trend summaries, and activity views connected to ${keyModel} so users can understand performance directly inside ${pageFocus}.`,
    },
    {
      title: `Make ${blueprint.projectName} feel more premium`,
      prompt: `Upgrade the overall product experience for ${blueprint.projectName}. Refine the visual hierarchy, add more intentional storytelling around "${featureSentence}", and make ${pageFocus} feel more premium with stronger layout rhythm, trust-building details, and sharper calls to action.`,
    },
  ];
}

function pickFeature(blueprint: Blueprint) {
  return (
    blueprint.features.find((feature) => feature.priority === 'core') ??
    blueprint.features[0] ?? {
      name: blueprint.projectName.replace(/-/g, ' '),
      description: blueprint.description,
      priority: 'important' as const,
    }
  );
}

function pickPage(blueprint: Blueprint) {
  return (
    blueprint.pages.find((page) => page.route !== '/' && page.route !== '/home') ??
    blueprint.pages[0] ?? {
      name: 'main workspace',
      route: '/',
      description: blueprint.description,
      components: [],
    }
  );
}

function toLowerLead(value: string) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toLowerCase() + value.slice(1);
}

function trimSentence(value: string) {
  return value.replace(/\.$/, '');
}

function ArrowGlyph({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.75 12H19.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m13.75 6.75 5.5 5.25-5.5 5.25" />
    </svg>
  );
}

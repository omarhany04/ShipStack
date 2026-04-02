import { Blueprint } from '@/validators/blueprint.validator';
import { DesignProfile } from '../design-system';
import { GeneratedFile } from '../types';
import { dedent } from '../template-engine';

export function generateStyleFiles(
  _blueprint: Blueprint,
  designProfile: DesignProfile
): GeneratedFile[] {
  const { palette } = designProfile;

  return [
    {
      path: 'src/app/globals.css',
      content: dedent(`
        @tailwind base;
        @tailwind components;
        @tailwind utilities;

        @layer base {
          :root {
            --background: ${palette.background};
            --background-secondary: ${palette.backgroundSecondary};
            --surface: ${palette.surface};
            --surface-strong: ${palette.surfaceStrong};
            --panel-border: ${palette.panelBorder};
            --foreground: ${palette.foreground};
            --muted: ${palette.muted};
            --accent: ${palette.accent};
            --accent-strong: ${palette.accentStrong};
            --accent-soft: ${palette.accentSoft};
            --secondary: ${palette.secondary};
            --secondary-soft: ${palette.secondarySoft};
            --hero-from: ${palette.heroFrom};
            --hero-via: ${palette.heroVia};
            --hero-to: ${palette.heroTo};
            --glow-a: ${palette.glowA};
            --glow-b: ${palette.glowB};
          }

          * {
            box-sizing: border-box;
            @apply border-slate-200;
          }

          html {
            scroll-behavior: smooth;
          }

          body {
            margin: 0;
            min-height: 100vh;
            color: var(--foreground);
            font-family: var(--font-body), sans-serif;
            background-image:
              radial-gradient(circle at top left, var(--glow-a), transparent 28%),
              radial-gradient(circle at top right, var(--glow-b), transparent 24%),
              linear-gradient(180deg, var(--background) 0%, var(--background-secondary) 100%);
            background-color: var(--background);
            font-feature-settings: "rlig" 1, "calt" 1;
          }

          h1,
          h2,
          h3,
          h4,
          h5,
          h6 {
            font-family: var(--font-heading), sans-serif;
          }

          a {
            color: inherit;
            text-decoration: none;
          }
        }

        @layer components {
          .app-shell {
            @apply min-h-screen;
          }

          .shell-container {
            @apply mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8;
          }

          .glass-bar {
            background: rgba(255, 255, 255, 0.72);
            backdrop-filter: blur(18px);
            border: 1px solid rgba(255, 255, 255, 0.65);
            box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
          }

          .surface-panel {
            background: var(--surface);
            border: 1px solid var(--panel-border);
            backdrop-filter: blur(20px);
            box-shadow: 0 24px 70px rgba(15, 23, 42, 0.08);
          }

          .surface-panel-strong {
            background: var(--surface-strong);
            border: 1px solid rgba(255, 255, 255, 0.75);
            box-shadow: 0 26px 80px rgba(15, 23, 42, 0.1);
          }

          .hero-shell {
            @apply relative overflow-hidden rounded-[36px] px-6 py-8 text-white sm:px-8 sm:py-10 lg:px-10;
            background:
              radial-gradient(circle at top left, rgba(255,255,255,0.16), transparent 22%),
              linear-gradient(135deg, var(--hero-from), var(--hero-via) 52%, var(--hero-to));
            box-shadow: 0 30px 90px rgba(15, 23, 42, 0.16);
          }

          .eyebrow {
            @apply inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em];
            background: rgba(255, 255, 255, 0.12);
            border: 1px solid rgba(255, 255, 255, 0.16);
            color: rgba(255, 245, 235, 0.95);
          }

          .section-heading {
            @apply text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl;
          }

          .section-copy {
            @apply mt-3 text-sm leading-7;
            color: var(--muted);
          }

          .primary-action {
            @apply inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white transition;
            background: linear-gradient(135deg, var(--accent), var(--accent-strong));
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14);
          }

          .primary-action:hover {
            transform: translateY(-1px);
            filter: brightness(1.02);
          }

          .secondary-action {
            @apply inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition;
            background: rgba(255, 255, 255, 0.72);
            color: var(--foreground);
            border: 1px solid rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(14px);
          }

          .secondary-action:hover {
            transform: translateY(-1px);
            background: rgba(255, 255, 255, 0.9);
          }

          .page-shell {
            @apply space-y-8;
          }

          .page-header {
            @apply rounded-[30px] px-6 py-6 sm:px-8;
            background: linear-gradient(180deg, rgba(255,255,255,0.88), rgba(248,250,252,0.96));
            border: 1px solid var(--panel-border);
            box-shadow: 0 18px 48px rgba(15, 23, 42, 0.06);
          }

          .page-title {
            @apply text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl;
          }

          .page-description {
            @apply mt-3 max-w-3xl text-sm leading-7;
            color: var(--muted);
          }

          .metric-card {
            @apply rounded-[24px] px-4 py-4;
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid var(--panel-border);
            box-shadow: 0 16px 42px rgba(15, 23, 42, 0.05);
          }

          .feature-card {
            @apply rounded-[28px] px-5 py-5;
            background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(248,250,252,0.98));
            border: 1px solid var(--panel-border);
            box-shadow: 0 16px 40px rgba(15, 23, 42, 0.05);
          }

          .card-label {
            @apply text-[11px] font-semibold uppercase tracking-[0.18em];
            color: var(--accent);
          }

          .input-shell {
            @apply flex items-center gap-2 rounded-2xl border bg-white px-4 py-3;
            border-color: rgba(148, 163, 184, 0.28);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
          }

          .input-shell input,
          .input-shell select {
            @apply w-full border-none bg-transparent text-sm text-slate-700 outline-none;
          }

          .table-shell {
            @apply overflow-hidden rounded-[28px] border bg-white;
            border-color: rgba(148, 163, 184, 0.22);
            box-shadow: 0 18px 44px rgba(15, 23, 42, 0.06);
          }

          .data-table {
            @apply min-w-full divide-y divide-slate-200;
          }

          .data-table thead {
            background: rgba(248, 250, 252, 0.9);
          }

          .data-table th {
            @apply px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400;
          }

          .data-table td {
            @apply px-4 py-4 text-sm text-slate-600;
          }

          .record-card {
            @apply rounded-[24px] px-4 py-4;
            background: rgba(255, 255, 255, 0.92);
            border: 1px solid var(--panel-border);
          }

          .empty-panel {
            @apply rounded-[28px] border border-dashed px-6 py-12 text-center;
            border-color: rgba(148, 163, 184, 0.3);
            background: rgba(255, 255, 255, 0.78);
          }

          .stat-pill {
            @apply inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold;
            background: var(--accent-soft);
            color: var(--accent-strong);
          }
        }

        @layer utilities {
          .text-balance {
            text-wrap: balance;
          }

          .fade-in-up {
            animation: fade-in-up 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
          }

          .soft-grid {
            background-image:
              linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px);
            background-size: 24px 24px;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(14px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `),
      source: 'template',
      description: 'Generated global styles',
    },
  ];
}

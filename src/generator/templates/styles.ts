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
            --shadow-soft: 0 18px 54px rgba(15, 23, 42, 0.08);
            --shadow-medium: 0 28px 80px rgba(15, 23, 42, 0.12);
            --shadow-strong: 0 36px 110px rgba(15, 23, 42, 0.16);
            --ease-smooth: cubic-bezier(0.22, 1, 0.36, 1);
            --ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
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
              radial-gradient(circle at 80% 20%, rgba(255,255,255,0.42), transparent 18%),
              linear-gradient(180deg, var(--background) 0%, var(--background-secondary) 100%);
            background-color: var(--background);
            font-feature-settings: "rlig" 1, "calt" 1;
            overflow-x: hidden;
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
            position: relative;
            isolation: isolate;
          }

          .shell-container {
            @apply relative mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8;
            z-index: 1;
          }

          .glass-bar {
            background: rgba(255, 255, 255, 0.72);
            backdrop-filter: blur(18px);
            border: 1px solid rgba(255, 255, 255, 0.65);
            box-shadow: var(--shadow-soft);
            position: relative;
            overflow: hidden;
            transition:
              transform 320ms var(--ease-spring),
              box-shadow 320ms var(--ease-spring),
              border-color 220ms ease;
          }

          .glass-bar::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.48), transparent 45%);
            pointer-events: none;
          }

          .glass-bar:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-medium);
            border-color: rgba(255, 255, 255, 0.8);
          }

          .surface-panel {
            background: var(--surface);
            border: 1px solid var(--panel-border);
            backdrop-filter: blur(20px);
            box-shadow: var(--shadow-soft);
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
              radial-gradient(circle at bottom right, rgba(255,255,255,0.14), transparent 28%),
              linear-gradient(135deg, var(--hero-from), var(--hero-via) 52%, var(--hero-to));
            box-shadow: var(--shadow-strong);
            border: 1px solid rgba(255, 255, 255, 0.14);
            transition:
              transform 420ms var(--ease-spring),
              box-shadow 420ms var(--ease-spring),
              filter 320ms ease;
          }

          .hero-shell::before {
            content: '';
            position: absolute;
            left: -10%;
            top: -12%;
            width: 22rem;
            height: 22rem;
            border-radius: 9999px;
            background: radial-gradient(circle, rgba(255,255,255,0.24), transparent 68%);
            filter: blur(8px);
            animation: drift-orb 18s ease-in-out infinite;
            pointer-events: none;
          }

          .hero-shell::after {
            content: '';
            position: absolute;
            right: -5rem;
            bottom: -7rem;
            width: 20rem;
            height: 20rem;
            border-radius: 9999px;
            background: conic-gradient(
              from 90deg,
              rgba(255,255,255,0.18),
              transparent 28%,
              rgba(255,255,255,0.08) 55%,
              transparent 80%
            );
            opacity: 0.7;
            filter: blur(10px);
            animation: rotate-slow 24s linear infinite;
            pointer-events: none;
          }

          .hero-shell > * {
            position: relative;
            z-index: 1;
          }

          .hero-shell:hover {
            transform: translateY(-4px);
            box-shadow: 0 42px 120px rgba(15, 23, 42, 0.22);
            filter: saturate(1.04);
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

          .primary-action,
          .secondary-action,
          .nav-chip {
            @apply inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white transition;
            position: relative;
            overflow: hidden;
            isolation: isolate;
            will-change: transform;
            transition:
              transform 280ms var(--ease-spring),
              box-shadow 280ms var(--ease-spring),
              border-color 200ms ease,
              background-color 200ms ease,
              color 200ms ease,
              filter 200ms ease;
          }

          .primary-action::after,
          .secondary-action::after,
          .nav-chip::after {
            content: '';
            position: absolute;
            left: -28%;
            top: -90%;
            width: 48%;
            height: 280%;
            transform: rotate(22deg) translateX(-180%);
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.52), transparent);
            opacity: 0;
            pointer-events: none;
            transition:
              transform 680ms var(--ease-smooth),
              opacity 220ms ease;
            z-index: 0;
          }

          .primary-action > *,
          .secondary-action > *,
          .nav-chip > * {
            position: relative;
            z-index: 2;
          }

          .primary-action {
            background: linear-gradient(135deg, var(--accent), var(--accent-strong));
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14);
          }

          .primary-action:hover {
            transform: translateY(-3px) scale(1.01);
            filter: brightness(1.04);
            box-shadow: 0 28px 54px rgba(15, 23, 42, 0.18);
          }

          .primary-action:hover::after,
          .secondary-action:hover::after,
          .nav-chip:hover::after {
            opacity: 1;
            transform: rotate(22deg) translateX(380%);
          }

          .secondary-action {
            background: rgba(255, 255, 255, 0.72);
            color: var(--foreground);
            border: 1px solid rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(14px);
          }

          .secondary-action:hover {
            transform: translateY(-3px);
            background: rgba(255, 255, 255, 0.92);
            border-color: rgba(148, 163, 184, 0.36);
            box-shadow: 0 20px 42px rgba(15, 23, 42, 0.1);
          }

          .nav-chip {
            @apply whitespace-nowrap px-4 py-2 font-medium;
            background: rgba(255, 255, 255, 0.78);
            color: rgb(71 85 105);
            border: 1px solid rgba(226, 232, 240, 0.88);
            box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
          }

          .nav-chip:hover {
            transform: translateY(-3px);
            color: rgb(15 23 42);
            border-color: rgba(148, 163, 184, 0.32);
            box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
          }

          .nav-chip-active {
            color: rgb(15 23 42);
            background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(241,245,249,0.96));
            border-color: rgba(148, 163, 184, 0.34);
            box-shadow: 0 18px 36px rgba(15, 23, 42, 0.09);
          }

          .page-shell {
            @apply space-y-8;
          }

          .page-header {
            @apply rounded-[30px] px-6 py-6 sm:px-8;
            background: linear-gradient(180deg, rgba(255,255,255,0.88), rgba(248,250,252,0.96));
            border: 1px solid var(--panel-border);
            box-shadow: var(--shadow-soft);
          }

          .page-title {
            @apply text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl;
          }

          .page-description {
            @apply mt-3 max-w-3xl text-sm leading-7;
            color: var(--muted);
          }

          .surface-panel,
          .surface-panel-strong,
          .page-header,
          .metric-card,
          .feature-card,
          .detail-card,
          .route-card,
          .hero-stat-card,
          .table-shell,
          .record-card,
          .empty-panel {
            position: relative;
            overflow: hidden;
            transition:
              transform 360ms var(--ease-spring),
              box-shadow 360ms var(--ease-spring),
              border-color 220ms ease,
              background-color 220ms ease,
              filter 220ms ease;
          }

          .surface-panel::before,
          .surface-panel-strong::before,
          .page-header::before,
          .metric-card::before,
          .feature-card::before,
          .detail-card::before,
          .route-card::before,
          .hero-stat-card::before,
          .table-shell::before,
          .record-card::before,
          .empty-panel::before {
            content: '';
            position: absolute;
            inset: 0;
            background:
              radial-gradient(circle at top right, rgba(255,255,255,0.7), transparent 32%),
              linear-gradient(135deg, rgba(255,255,255,0.18), transparent 38%);
            opacity: 0.72;
            pointer-events: none;
            transition:
              opacity 320ms ease,
              transform 420ms var(--ease-spring);
          }

          .surface-panel:hover,
          .surface-panel-strong:hover,
          .page-header:hover,
          .metric-card:hover,
          .feature-card:hover,
          .detail-card:hover,
          .route-card:hover,
          .hero-stat-card:hover,
          .table-shell:hover,
          .record-card:hover,
          .empty-panel:hover {
            transform: translateY(-4px);
            box-shadow: var(--shadow-medium);
            border-color: rgba(148, 163, 184, 0.28);
          }

          .surface-panel:hover::before,
          .surface-panel-strong:hover::before,
          .page-header:hover::before,
          .metric-card:hover::before,
          .feature-card:hover::before,
          .detail-card:hover::before,
          .route-card:hover::before,
          .hero-stat-card:hover::before,
          .table-shell:hover::before,
          .record-card:hover::before,
          .empty-panel:hover::before {
            opacity: 1;
            transform: translate3d(-2%, -2%, 0);
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

          .detail-card {
            @apply rounded-[24px] px-4 py-4;
            background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.98));
            border: 1px solid rgba(226, 232, 240, 0.88);
            box-shadow: 0 14px 34px rgba(15, 23, 42, 0.05);
          }

          .route-card {
            @apply rounded-[24px] border px-4 py-4;
            background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.98));
            border-color: rgba(226, 232, 240, 0.88);
            box-shadow: 0 16px 36px rgba(15, 23, 42, 0.05);
          }

          .route-card-dark {
            background: linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.08));
            border-color: rgba(255, 255, 255, 0.14);
            color: white;
            box-shadow: 0 18px 42px rgba(15, 23, 42, 0.14);
          }

          .route-card-dark::before {
            background:
              radial-gradient(circle at top right, rgba(255,255,255,0.18), transparent 34%),
              linear-gradient(135deg, rgba(255,255,255,0.08), transparent 42%);
          }

          .route-card-dark:hover {
            background: linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.11));
            border-color: rgba(255, 255, 255, 0.22);
          }

          .hero-stat-card {
            @apply rounded-[28px] border px-5 py-5 backdrop-blur;
            border-color: rgba(255, 255, 255, 0.14);
            background: linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.08));
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
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
            box-shadow: 0 14px 32px rgba(15, 23, 42, 0.05);
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
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.48);
          }
        }

        @layer utilities {
          .text-balance {
            text-wrap: balance;
          }

          .fade-in-up {
            animation: fade-in-up 720ms var(--ease-smooth) both;
          }

          .scroll-reveal {
            animation: fade-in-up 760ms var(--ease-smooth) both;
            animation-delay: var(--motion-delay, 0ms);
          }

          .motion-delay-1 {
            --motion-delay: 80ms;
          }

          .motion-delay-2 {
            --motion-delay: 160ms;
          }

          .motion-delay-3 {
            --motion-delay: 240ms;
          }

          .motion-delay-4 {
            --motion-delay: 320ms;
          }

          .motion-delay-5 {
            --motion-delay: 400ms;
          }

          .motion-delay-6 {
            --motion-delay: 480ms;
          }

          .soft-grid {
            background-image:
              linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px);
            background-size: 24px 24px;
          }

          .ambient-noise {
            background-image:
              linear-gradient(0deg, rgba(255,255,255,0.05), rgba(255,255,255,0.05)),
              radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 28%);
            mix-blend-mode: soft-light;
            opacity: 0.5;
          }
        }

        @supports (animation-timeline: view()) {
          .scroll-reveal {
            opacity: 0.001;
            animation-name: reveal-in;
            animation-duration: 1ms;
            animation-fill-mode: both;
            animation-timing-function: linear;
            animation-timeline: view();
            animation-range: entry 12% cover 38%;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.985);
            filter: blur(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes reveal-in {
          from {
            opacity: 0;
            transform: translateY(28px) scale(0.985);
            filter: blur(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes drift-orb {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
          }

          50% {
            transform: translate3d(2.4rem, 1.2rem, 0) scale(1.08);
          }
        }

        @keyframes rotate-slow {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }

          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }

          .scroll-reveal,
          .fade-in-up {
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
          }
        }
      `),
      source: 'template',
      description: 'Generated global styles',
    },
  ];
}

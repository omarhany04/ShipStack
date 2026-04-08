import { Blueprint } from '@/validators/blueprint.validator';

export interface DesignFontDefinition {
  importName: string;
  constName: string;
  variable: string;
  options: string;
}

export interface DesignProfile {
  id: 'nova' | 'editorial' | 'executive' | 'pulse';
  label: string;
  summary: string;
  accentLabel: string;
  homeVariant: 'spotlight' | 'editorial' | 'workspace' | 'showcase';
  fonts: {
    heading: DesignFontDefinition;
    body: DesignFontDefinition;
  };
  palette: {
    background: string;
    backgroundSecondary: string;
    surface: string;
    surfaceStrong: string;
    panelBorder: string;
    foreground: string;
    muted: string;
    accent: string;
    accentStrong: string;
    accentSoft: string;
    secondary: string;
    secondarySoft: string;
    heroFrom: string;
    heroVia: string;
    heroTo: string;
    glowA: string;
    glowB: string;
  };
}

const DESIGN_PROFILES: DesignProfile[] = [
  {
    id: 'nova',
    label: 'Nova Signal',
    summary:
      'A premium launch aesthetic with deep midnight panels, warm orange highlights, sharp typography, and cinematic gradients.',
    accentLabel: 'Launch system',
    homeVariant: 'spotlight',
    fonts: {
      heading: {
        importName: 'Sora',
        constName: 'sora',
        variable: '--font-heading',
        options: "{ subsets: ['latin'], variable: '--font-heading', weight: ['400', '600', '700', '800'] }",
      },
      body: {
        importName: 'Manrope',
        constName: 'manrope',
        variable: '--font-body',
        options: "{ subsets: ['latin'], variable: '--font-body', weight: ['400', '500', '600', '700'] }",
      },
    },
    palette: {
      background: '#fff9f1',
      backgroundSecondary: '#f8fbff',
      surface: 'rgba(255,255,255,0.9)',
      surfaceStrong: '#ffffff',
      panelBorder: 'rgba(148, 163, 184, 0.18)',
      foreground: '#0f172a',
      muted: '#64748b',
      accent: '#f97316',
      accentStrong: '#ea580c',
      accentSoft: 'rgba(249,115,22,0.12)',
      secondary: '#0f172a',
      secondarySoft: 'rgba(15,23,42,0.08)',
      heroFrom: '#0f172a',
      heroVia: '#1e293b',
      heroTo: '#7c2d12',
      glowA: 'rgba(249,115,22,0.22)',
      glowB: 'rgba(56,189,248,0.14)',
    },
  },
  {
    id: 'editorial',
    label: 'Editorial Canvas',
    summary:
      'An editorial product style with cream surfaces, elegant serif headlines, expressive spacing, and warm terracotta contrast.',
    accentLabel: 'Editorial build',
    homeVariant: 'editorial',
    fonts: {
      heading: {
        importName: 'Fraunces',
        constName: 'fraunces',
        variable: '--font-heading',
        options: "{ subsets: ['latin'], variable: '--font-heading', weight: ['500', '600', '700'] }",
      },
      body: {
        importName: 'DM_Sans',
        constName: 'dmSans',
        variable: '--font-body',
        options: "{ subsets: ['latin'], variable: '--font-body', weight: ['400', '500', '700'] }",
      },
    },
    palette: {
      background: '#fcf7f1',
      backgroundSecondary: '#fffdf9',
      surface: 'rgba(255,251,245,0.92)',
      surfaceStrong: '#fffaf3',
      panelBorder: 'rgba(180, 129, 96, 0.18)',
      foreground: '#1f2937',
      muted: '#7c6f64',
      accent: '#c2410c',
      accentStrong: '#9a3412',
      accentSoft: 'rgba(194,65,12,0.12)',
      secondary: '#7c2d12',
      secondarySoft: 'rgba(124,45,18,0.08)',
      heroFrom: '#fff7ed',
      heroVia: '#fef3e2',
      heroTo: '#fde7d3',
      glowA: 'rgba(194,65,12,0.14)',
      glowB: 'rgba(217,119,6,0.12)',
    },
  },
  {
    id: 'executive',
    label: 'Executive Grid',
    summary:
      'A refined SaaS control-room direction with cool neutrals, confident teal accents, structured cards, and enterprise polish.',
    accentLabel: 'Operational suite',
    homeVariant: 'workspace',
    fonts: {
      heading: {
        importName: 'Plus_Jakarta_Sans',
        constName: 'plusJakartaSans',
        variable: '--font-heading',
        options: "{ subsets: ['latin'], variable: '--font-heading', weight: ['500', '600', '700', '800'] }",
      },
      body: {
        importName: 'Public_Sans',
        constName: 'publicSans',
        variable: '--font-body',
        options: "{ subsets: ['latin'], variable: '--font-body', weight: ['400', '500', '600', '700'] }",
      },
    },
    palette: {
      background: '#f5f8fb',
      backgroundSecondary: '#eef4f8',
      surface: 'rgba(255,255,255,0.92)',
      surfaceStrong: '#ffffff',
      panelBorder: 'rgba(148, 163, 184, 0.2)',
      foreground: '#102033',
      muted: '#5f7288',
      accent: '#0f766e',
      accentStrong: '#115e59',
      accentSoft: 'rgba(15,118,110,0.12)',
      secondary: '#1e293b',
      secondarySoft: 'rgba(30,41,59,0.08)',
      heroFrom: '#0f172a',
      heroVia: '#1f2937',
      heroTo: '#134e4a',
      glowA: 'rgba(15,118,110,0.18)',
      glowB: 'rgba(14,165,233,0.12)',
    },
  },
  {
    id: 'pulse',
    label: 'Pulse Motion',
    summary:
      'A high-energy product showcase with bright cobalt, mint highlights, rounded geometry, and demo-forward visual rhythm.',
    accentLabel: 'Product pulse',
    homeVariant: 'showcase',
    fonts: {
      heading: {
        importName: 'Outfit',
        constName: 'outfit',
        variable: '--font-heading',
        options: "{ subsets: ['latin'], variable: '--font-heading', weight: ['500', '600', '700', '800'] }",
      },
      body: {
        importName: 'Inter_Tight',
        constName: 'interTight',
        variable: '--font-body',
        options: "{ subsets: ['latin'], variable: '--font-body', weight: ['400', '500', '600', '700'] }",
      },
    },
    palette: {
      background: '#f8fbff',
      backgroundSecondary: '#eef7ff',
      surface: 'rgba(255,255,255,0.9)',
      surfaceStrong: '#ffffff',
      panelBorder: 'rgba(96, 165, 250, 0.18)',
      foreground: '#0f172a',
      muted: '#60708a',
      accent: '#2563eb',
      accentStrong: '#1d4ed8',
      accentSoft: 'rgba(37,99,235,0.12)',
      secondary: '#0f766e',
      secondarySoft: 'rgba(15,118,110,0.1)',
      heroFrom: '#0f172a',
      heroVia: '#1d4ed8',
      heroTo: '#0f766e',
      glowA: 'rgba(37,99,235,0.22)',
      glowB: 'rgba(20,184,166,0.14)',
    },
  },
];

export function selectDesignProfile(_blueprint: Blueprint) {
  return DESIGN_PROFILES[Math.floor(Math.random() * DESIGN_PROFILES.length)];
}

export function selectStableDesignProfile(blueprint: Blueprint) {
  const key = `${blueprint.projectName}:${blueprint.description}`;
  let hash = 0;

  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  }

  return DESIGN_PROFILES[hash % DESIGN_PROFILES.length];
}

export function summarizeDesignProfile(profile: DesignProfile) {
  return `${profile.label}: ${profile.summary}`;
}

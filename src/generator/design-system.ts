import { Blueprint } from '@/validators/blueprint.validator';

export interface DesignFontDefinition {
  importName: string;
  constName: string;
  variable: string;
  options: string;
}

export interface DesignProfile {
  id: 'nova' | 'editorial' | 'executive' | 'pulse' | 'slate' | 'aurora' | 'field' | 'crimson';
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
  {
    id: 'slate',
    label: 'Monochrome Studio',
    summary:
      'A refined monochrome studio aesthetic with charcoal and graphite tones, crisp grid-driven layouts, and minimal high-contrast accents.',
    accentLabel: 'Studio build',
    homeVariant: 'workspace',
    fonts: {
      heading: {
        importName: 'Space_Grotesk',
        constName: 'spaceGrotesk',
        variable: '--font-heading',
        options: "{ subsets: ['latin'], variable: '--font-heading', weight: ['500', '600', '700'] }",
      },
      body: {
        importName: 'Inter',
        constName: 'inter',
        variable: '--font-body',
        options: "{ subsets: ['latin'], variable: '--font-body', weight: ['400', '500', '600', '700'] }",
      },
    },
    palette: {
      background: '#f4f4f5',
      backgroundSecondary: '#e4e4e7',
      surface: 'rgba(255,255,255,0.92)',
      surfaceStrong: '#ffffff',
      panelBorder: 'rgba(82,82,91,0.18)',
      foreground: '#18181b',
      muted: '#71717a',
      accent: '#27272a',
      accentStrong: '#09090b',
      accentSoft: 'rgba(39,39,42,0.08)',
      secondary: '#52525b',
      secondarySoft: 'rgba(82,82,91,0.08)',
      heroFrom: '#09090b',
      heroVia: '#27272a',
      heroTo: '#52525b',
      glowA: 'rgba(255,255,255,0.08)',
      glowB: 'rgba(148,163,184,0.14)',
    },
  },
  {
    id: 'aurora',
    label: 'Aurora Frame',
    summary:
      'A bold violet-and-indigo product direction with rich gradients, glassy panels, layered depth, and confident contrast.',
    accentLabel: 'Aurora build',
    homeVariant: 'spotlight',
    fonts: {
      heading: {
        importName: 'Lexend',
        constName: 'lexend',
        variable: '--font-heading',
        options: "{ subsets: ['latin'], variable: '--font-heading', weight: ['500', '600', '700', '800'] }",
      },
      body: {
        importName: 'Work_Sans',
        constName: 'workSans',
        variable: '--font-body',
        options: "{ subsets: ['latin'], variable: '--font-body', weight: ['400', '500', '600', '700'] }",
      },
    },
    palette: {
      background: '#f7f6fb',
      backgroundSecondary: '#f1eefb',
      surface: 'rgba(255,255,255,0.92)',
      surfaceStrong: '#ffffff',
      panelBorder: 'rgba(124,58,237,0.16)',
      foreground: '#1e1b2e',
      muted: '#6b6480',
      accent: '#7c3aed',
      accentStrong: '#5b21b6',
      accentSoft: 'rgba(124,58,237,0.12)',
      secondary: '#1e1b4b',
      secondarySoft: 'rgba(30,27,75,0.08)',
      heroFrom: '#150f2e',
      heroVia: '#4c1d95',
      heroTo: '#7c3aed',
      glowA: 'rgba(124,58,237,0.22)',
      glowB: 'rgba(56,189,248,0.12)',
    },
  },
  {
    id: 'field',
    label: 'Field Notes',
    summary:
      'A warm editorial direction with cream surfaces, refined serif headlines, expressive spacing, and grounded emerald-green accents.',
    accentLabel: 'Field build',
    homeVariant: 'editorial',
    fonts: {
      heading: {
        importName: 'Source_Serif_4',
        constName: 'sourceSerif4',
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
      background: '#f6f8f4',
      backgroundSecondary: '#fdfdf9',
      surface: 'rgba(255,253,246,0.92)',
      surfaceStrong: '#fffef8',
      panelBorder: 'rgba(22,101,52,0.16)',
      foreground: '#1f2937',
      muted: '#6b7c6f',
      accent: '#15803d',
      accentStrong: '#166534',
      accentSoft: 'rgba(21,128,61,0.12)',
      secondary: '#14532d',
      secondarySoft: 'rgba(20,83,45,0.08)',
      heroFrom: '#08170d',
      heroVia: '#14532d',
      heroTo: '#15803d',
      glowA: 'rgba(21,128,61,0.2)',
      glowB: 'rgba(132,204,22,0.12)',
    },
  },
  {
    id: 'crimson',
    label: 'Signal Crimson',
    summary:
      'A high-contrast crimson-and-charcoal showcase with bold typography, rounded geometry, and energetic accents.',
    accentLabel: 'Signal build',
    homeVariant: 'showcase',
    fonts: {
      heading: {
        importName: 'Urbanist',
        constName: 'urbanist',
        variable: '--font-heading',
        options: "{ subsets: ['latin'], variable: '--font-heading', weight: ['500', '600', '700', '800'] }",
      },
      body: {
        importName: 'Be_Vietnam_Pro',
        constName: 'beVietnamPro',
        variable: '--font-body',
        options: "{ subsets: ['latin'], variable: '--font-body', weight: ['400', '500', '600', '700'] }",
      },
    },
    palette: {
      background: '#fbf7f7',
      backgroundSecondary: '#fdf0f0',
      surface: 'rgba(255,255,255,0.92)',
      surfaceStrong: '#ffffff',
      panelBorder: 'rgba(220,38,38,0.16)',
      foreground: '#1c1917',
      muted: '#7a716e',
      accent: '#dc2626',
      accentStrong: '#991b1b',
      accentSoft: 'rgba(220,38,38,0.12)',
      secondary: '#1c1917',
      secondarySoft: 'rgba(28,25,23,0.08)',
      heroFrom: '#1a0f0f',
      heroVia: '#7f1d1d',
      heroTo: '#dc2626',
      glowA: 'rgba(220,38,38,0.22)',
      glowB: 'rgba(120,113,108,0.14)',
    },
  },
];

interface PaletteOverride {
  label: string;
  matchers: RegExp[];
  palette: DesignProfile['palette'];
}

const PALETTE_OVERRIDES: PaletteOverride[] = [
  {
    label: 'monochrome grey and black',
    matchers: [
      /\bgrey\s+and\s+black\b/,
      /\bgray\s+and\s+black\b/,
      /\bblack\s+and\s+grey\b/,
      /\bblack\s+and\s+gray\b/,
      /\bblack\s+(?:,|and)\s+white(?:\s+and\s+grey|\s+and\s+gray)?\b/,
      /\bmonochrome\b/,
      /\bgrayscale\b/,
      /\bgreyscale\b/,
      /\bcharcoal\b/,
      /\bgraphite\b/,
      /\bnoir\b/,
    ],
    palette: {
      background: '#f4f4f5',
      backgroundSecondary: '#e4e4e7',
      surface: 'rgba(255,255,255,0.92)',
      surfaceStrong: '#ffffff',
      panelBorder: 'rgba(82,82,91,0.18)',
      foreground: '#18181b',
      muted: '#71717a',
      accent: '#27272a',
      accentStrong: '#09090b',
      accentSoft: 'rgba(39,39,42,0.08)',
      secondary: '#52525b',
      secondarySoft: 'rgba(82,82,91,0.08)',
      heroFrom: '#09090b',
      heroVia: '#27272a',
      heroTo: '#52525b',
      glowA: 'rgba(255,255,255,0.08)',
      glowB: 'rgba(148,163,184,0.14)',
    },
  },
  {
    label: 'navy and blue',
    matchers: [/\bnavy\b/, /\bcobalt\b/, /\broyal\s+blue\b/, /\bblue\b/],
    palette: {
      background: '#f5f8fc',
      backgroundSecondary: '#eaf1f8',
      surface: 'rgba(255,255,255,0.92)',
      surfaceStrong: '#ffffff',
      panelBorder: 'rgba(30,64,175,0.16)',
      foreground: '#0f172a',
      muted: '#5b6b85',
      accent: '#1d4ed8',
      accentStrong: '#1e3a8a',
      accentSoft: 'rgba(29,78,216,0.12)',
      secondary: '#0f172a',
      secondarySoft: 'rgba(15,23,42,0.08)',
      heroFrom: '#0b1226',
      heroVia: '#1e3a8a',
      heroTo: '#1d4ed8',
      glowA: 'rgba(29,78,216,0.2)',
      glowB: 'rgba(56,189,248,0.14)',
    },
  },
  {
    label: 'green and emerald',
    matchers: [/\bgreen\b/, /\bemerald\b/, /\bforest\b/, /\bsage\b/],
    palette: {
      background: '#f5faf6',
      backgroundSecondary: '#eaf6ee',
      surface: 'rgba(255,255,255,0.92)',
      surfaceStrong: '#ffffff',
      panelBorder: 'rgba(22,101,52,0.16)',
      foreground: '#1a2e22',
      muted: '#5d7766',
      accent: '#15803d',
      accentStrong: '#166534',
      accentSoft: 'rgba(21,128,61,0.12)',
      secondary: '#14532d',
      secondarySoft: 'rgba(20,83,45,0.08)',
      heroFrom: '#08170d',
      heroVia: '#14532d',
      heroTo: '#15803d',
      glowA: 'rgba(21,128,61,0.2)',
      glowB: 'rgba(132,204,22,0.12)',
    },
  },
  {
    label: 'purple and violet',
    matchers: [/\bpurple\b/, /\bviolet\b/, /\bindigo\b/, /\blavender\b/, /\bplum\b/],
    palette: {
      background: '#f8f7fc',
      backgroundSecondary: '#f0edfa',
      surface: 'rgba(255,255,255,0.92)',
      surfaceStrong: '#ffffff',
      panelBorder: 'rgba(109,40,217,0.16)',
      foreground: '#1e1b2e',
      muted: '#6b6480',
      accent: '#7c3aed',
      accentStrong: '#5b21b6',
      accentSoft: 'rgba(124,58,237,0.12)',
      secondary: '#1e1b4b',
      secondarySoft: 'rgba(30,27,75,0.08)',
      heroFrom: '#150f2e',
      heroVia: '#4c1d95',
      heroTo: '#7c3aed',
      glowA: 'rgba(124,58,237,0.22)',
      glowB: 'rgba(56,189,248,0.12)',
    },
  },
  {
    label: 'red and crimson',
    matchers: [/\bred\b/, /\bcrimson\b/, /\bburgundy\b/, /\bmaroon\b/, /\bruby\b/, /\bscarlet\b/],
    palette: {
      background: '#fbf7f7',
      backgroundSecondary: '#fdf0f0',
      surface: 'rgba(255,255,255,0.92)',
      surfaceStrong: '#ffffff',
      panelBorder: 'rgba(220,38,38,0.16)',
      foreground: '#1c1917',
      muted: '#7a716e',
      accent: '#dc2626',
      accentStrong: '#991b1b',
      accentSoft: 'rgba(220,38,38,0.12)',
      secondary: '#1c1917',
      secondarySoft: 'rgba(28,25,23,0.08)',
      heroFrom: '#1a0f0f',
      heroVia: '#7f1d1d',
      heroTo: '#dc2626',
      glowA: 'rgba(220,38,38,0.22)',
      glowB: 'rgba(120,113,108,0.14)',
    },
  },
];

function buildPreferenceText(blueprint: Blueprint): string {
  return [blueprint.description, blueprint.designNotes, ...blueprint.features.map((feature) => feature.description)]
    .join(' ')
    .toLowerCase();
}

function findPaletteOverride(blueprint: Blueprint): PaletteOverride | null {
  const haystack = buildPreferenceText(blueprint);
  return PALETTE_OVERRIDES.find((entry) => entry.matchers.some((matcher) => matcher.test(haystack))) ?? null;
}

function applyPaletteOverride(profile: DesignProfile, blueprint: Blueprint): DesignProfile {
  const override = findPaletteOverride(blueprint);
  if (!override) {
    return profile;
  }

  return {
    ...profile,
    palette: override.palette,
    summary: `${profile.summary} Color direction adjusted to match the requested ${override.label} palette - do not introduce unrelated accent colors such as orange.`,
  };
}

export function selectDesignProfile(blueprint: Blueprint) {
  const base = DESIGN_PROFILES[Math.floor(Math.random() * DESIGN_PROFILES.length)];
  return applyPaletteOverride(base, blueprint);
}

export function selectStableDesignProfile(blueprint: Blueprint) {
  const key = `${blueprint.projectName}:${blueprint.description}`;
  let hash = 0;

  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  }

  const base = DESIGN_PROFILES[hash % DESIGN_PROFILES.length];
  return applyPaletteOverride(base, blueprint);
}

export function summarizeDesignProfile(profile: DesignProfile) {
  return `${profile.label}: ${profile.summary}`;
}

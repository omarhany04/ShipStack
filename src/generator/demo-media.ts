import { Blueprint } from '@/validators/blueprint.validator';

export type ProjectImageContextInput =
  | string
  | ResolvedProjectImageContext
  | (Pick<Blueprint, 'projectName' | 'description' | 'features'> & {
      resolvedImages?: ProjectImageSearchResult[];
    })
  | {
      projectName?: string;
      description?: string;
      featureNames?: string[];
      themeHint?: string;
      resolvedImages?: ProjectImageSearchResult[];
    };

export type DemoImageOrientation = 'landscape' | 'portrait' | 'squarish';

export type ProjectImageSlot = 'generic' | 'hero' | 'portrait' | 'gallery';

export interface ProjectImageSearchResult {
  slot: ProjectImageSlot;
  query: string;
  orientation: DemoImageOrientation;
  urls: string[];
}

export interface ResolvedProjectImageContext {
  projectName: string;
  themeHint: string;
  resolvedImages: ProjectImageSearchResult[];
}

const PORTRAIT_IMAGE_HINTS = [
  'avatar',
  'profile',
  'author',
  'user',
  'member',
  'team',
  'person',
  'testimonial',
  'founder',
  'owner',
  'chef',
  'doctor',
  'trainer',
];

const WIDE_IMAGE_HINTS = [
  'hero',
  'banner',
  'cover',
  'header',
  'background',
  'feature',
  'landing',
  'showcase',
];

const DEMO_IMAGE_CATEGORY_KEYWORDS = [
  {
    category: 'food',
    keywords: [
      'food',
      'restaurant',
      'bakery',
      'cafe',
      'coffee',
      'menu',
      'dish',
      'meal',
      'recipe',
      'kitchen',
      'dessert',
      'pizza',
      'burger',
      'grocery',
      'chef',
      'snack',
      'beverage',
      'drink',
    ],
  },
  {
    category: 'travel',
    keywords: [
      'travel',
      'trip',
      'tour',
      'vacation',
      'destination',
      'hotel',
      'flight',
      'adventure',
      'beach',
      'mountain',
      'resort',
      'tourism',
      'outdoor',
    ],
  },
  {
    category: 'wellness',
    keywords: [
      'fitness',
      'workout',
      'gym',
      'yoga',
      'wellness',
      'spa',
      'beauty',
      'skincare',
      'salon',
      'health',
      'meditation',
      'self care',
    ],
  },
  {
    category: 'real-estate',
    keywords: [
      'real estate',
      'property',
      'home',
      'house',
      'apartment',
      'interior',
      'villa',
      'rent',
      'listing',
      'mortgage',
      'residence',
    ],
  },
  {
    category: 'retail',
    keywords: [
      'shop',
      'store',
      'retail',
      'product',
      'catalog',
      'boutique',
      'fashion',
      'clothing',
      'jewelry',
      'cosmetic',
      'ecommerce',
      'marketplace',
    ],
  },
  {
    category: 'technology',
    keywords: [
      'saas',
      'software',
      'tech',
      'technology',
      'startup',
      'app',
      'dashboard',
      'analytics',
      'cloud',
      'developer',
      'ai',
      'automation',
      'platform',
    ],
  },
  {
    category: 'healthcare',
    keywords: [
      'medical',
      'doctor',
      'clinic',
      'hospital',
      'patient',
      'healthcare',
      'therapy',
      'dentist',
      'medicine',
      'pharmacy',
    ],
  },
  {
    category: 'education',
    keywords: [
      'education',
      'school',
      'student',
      'learning',
      'course',
      'class',
      'teacher',
      'academy',
      'university',
      'training',
      'lesson',
    ],
  },
  {
    category: 'automotive',
    keywords: [
      'car',
      'auto',
      'automotive',
      'vehicle',
      'garage',
      'repair',
      'motor',
      'parts',
      'ride',
      'dealership',
    ],
  },
  {
    category: 'events',
    keywords: [
      'event',
      'wedding',
      'party',
      'conference',
      'festival',
      'speaker',
      'ticket',
      'celebration',
      'venue',
      'music',
    ],
  },
] as const;

export type DemoImageCategory =
  | (typeof DEMO_IMAGE_CATEGORY_KEYWORDS)[number]['category']
  | 'workspace';

const UNSPLASH_PORTRAIT_URLS = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&fm=jpg&q=80&w=3000',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&fm=jpg&q=80&w=3000',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&fm=jpg&q=80&w=3000',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&fm=jpg&q=80&w=3000',
  'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&fm=jpg&q=80&w=3000',
];

const THEMED_UNSPLASH_LIBRARIES: Record<DemoImageCategory, string[]> = {
  workspace: [
    'https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&fm=jpg&q=80&w=3000',
    'https://images.unsplash.com/photo-1568992687947-868a62a9f521?auto=format&fit=crop&fm=jpg&q=80&w=3000',
    'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&fm=jpg&q=80&w=3000',
    'https://images.unsplash.com/photo-1502945015378-0e284ca1a5be?auto=format&fit=crop&fm=jpg&q=80&w=3000',
  ],
  food: [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&fm=jpg&q=80&w=3000',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&fm=jpg&q=80&w=3000',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&fm=jpg&q=80&w=3000',
  ],
  travel: [
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&fm=jpg&q=80&w=3000',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&fm=jpg&q=80&w=3000',
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&fm=jpg&q=80&w=3000',
  ],
  wellness: [
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&fm=jpg&q=80&w=3000',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&fm=jpg&q=80&w=3000',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&fm=jpg&q=80&w=3000',
  ],
  'real-estate': [
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&fm=jpg&q=80&w=3000',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&fm=jpg&q=80&w=3000',
    'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&fm=jpg&q=80&w=3000',
  ],
  retail: [
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&fm=jpg&q=80&w=3000',
    'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&fm=jpg&q=80&w=3000',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&fm=jpg&q=80&w=3000',
  ],
  technology: [
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&fm=jpg&q=80&w=3000',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&fm=jpg&q=80&w=3000',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&fm=jpg&q=80&w=3000',
  ],
  healthcare: [
    'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&fm=jpg&q=80&w=3000',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&fm=jpg&q=80&w=3000',
    'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&fm=jpg&q=80&w=3000',
  ],
  education: [
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&fm=jpg&q=80&w=3000',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&fm=jpg&q=80&w=3000',
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&fm=jpg&q=80&w=3000',
  ],
  automotive: [
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&fm=jpg&q=80&w=3000',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&fm=jpg&q=80&w=3000',
    'https://images.unsplash.com/photo-1494976688153-c29cea7eeb0c?auto=format&fit=crop&fm=jpg&q=80&w=3000',
  ],
  events: [
    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&fm=jpg&q=80&w=3000',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&fm=jpg&q=80&w=3000',
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&fm=jpg&q=80&w=3000',
  ],
};

const LEGACY_DEMO_IMAGE_PATHS = new Set(
  [...UNSPLASH_PORTRAIT_URLS, ...Object.values(THEMED_UNSPLASH_LIBRARIES).flat()].map(
    (url) => new URL(url).pathname
  )
);

export function sanitizeProjectName(projectName: string) {
  const cleaned = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return cleaned || 'generated-app';
}

export function normalizeDemoToken(value: unknown, fallback = 'demo-photo') {
  const normalized = coerceDemoString(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || fallback;
}

export function normalizeDemoLabel(value: unknown, fallback = 'Demo Photo') {
  const normalized = coerceDemoString(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return fallback;
  }

  return normalized
    .split(' ')
    .slice(0, 6)
    .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeResolvedProjectImages(input: unknown): ProjectImageSearchResult[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((entry): ProjectImageSearchResult | null => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const slot =
        'slot' in entry && typeof entry.slot === 'string' ? entry.slot.toLowerCase() : 'generic';
      const query = 'query' in entry && typeof entry.query === 'string' ? entry.query.trim() : '';
      const orientation =
        'orientation' in entry && typeof entry.orientation === 'string'
          ? entry.orientation.toLowerCase()
          : 'landscape';
      const urls =
        'urls' in entry && Array.isArray(entry.urls)
          ? entry.urls.filter(
              (value: unknown): value is string =>
                typeof value === 'string' && value.trim().length > 0
            )
          : [];

      if (
        !isProjectImageSlot(slot) ||
        !isDemoImageOrientation(orientation) ||
        urls.length === 0
      ) {
        return null;
      }

      return {
        slot,
        query,
        orientation,
        urls,
      };
    })
    .filter((entry): entry is ProjectImageSearchResult => Boolean(entry));
}

export function resolveProjectImageContext(
  input?: ProjectImageContextInput,
  fallbackProjectName = 'generated-app'
): ResolvedProjectImageContext {
  if (typeof input === 'string') {
    const normalizedName = input.trim() || fallbackProjectName;
    return {
      projectName: sanitizeProjectName(normalizedName),
      themeHint: normalizeHintText(normalizedName) || 'modern product website',
      resolvedImages: [],
    };
  }

  if (
    input &&
    typeof input === 'object' &&
    'themeHint' in input &&
    typeof input.themeHint === 'string' &&
    input.themeHint.trim()
  ) {
    return {
      projectName:
        'projectName' in input && typeof input.projectName === 'string'
          ? sanitizeProjectName(input.projectName.trim() || fallbackProjectName)
          : sanitizeProjectName(fallbackProjectName),
      themeHint: normalizeHintText(input.themeHint) || 'modern product website',
      resolvedImages:
        'resolvedImages' in input ? normalizeResolvedProjectImages(input.resolvedImages) : [],
    };
  }

  const projectName =
    input &&
    typeof input === 'object' &&
    'projectName' in input &&
    typeof input.projectName === 'string'
      ? input.projectName.trim() || fallbackProjectName
      : fallbackProjectName;
  const description =
    input &&
    typeof input === 'object' &&
    'description' in input &&
    typeof input.description === 'string'
      ? input.description.trim()
      : '';
  const featureNames =
    input && 'features' in input && Array.isArray(input.features)
      ? input.features.map((feature) => feature.name)
      : input &&
          typeof input === 'object' &&
          'featureNames' in input &&
          Array.isArray(input.featureNames)
        ? input.featureNames
        : [];

  const themeHint = normalizeHintText(
    [projectName, description, ...featureNames.filter(Boolean)].join(' ')
  );

  return {
    projectName: sanitizeProjectName(projectName),
    themeHint: themeHint || normalizeHintText(projectName) || 'modern product website',
    resolvedImages:
      input && typeof input === 'object' && 'resolvedImages' in input
        ? normalizeResolvedProjectImages(input.resolvedImages)
        : [],
  };
}

export function buildProjectImageThemeHint(input?: ProjectImageContextInput) {
  return resolveProjectImageContext(input).themeHint;
}

export function buildStaticDemoImageUrl(
  seedSource: string,
  labelSource: string,
  projectContext: ResolvedProjectImageContext
) {
  const seed = normalizeDemoToken(`${seedSource}-${labelSource}`, projectContext.projectName);
  const context = normalizeHintText(
    [projectContext.themeHint, seed, normalizeDemoLabel(labelSource).toLowerCase()].join(' ')
  );
  const size = pickDemoImageSize(context);
  const baseUrl = pickResolvedProjectImageUrl(context, projectContext) ?? pickDemoImageBaseUrl(context);

  return formatUnsplashUrl(baseUrl, size.width, size.height);
}

export function replaceLegacyDemoImageUrls(
  content: string,
  projectContext: ResolvedProjectImageContext,
  seedSource: string,
  labelSource: string
) {
  const unsplashPattern = /https?:\/\/images\.unsplash\.com\/photo-[^'"`\s)]+/gi;
  let replacementIndex = 0;

  return content.replace(unsplashPattern, (rawUrl) => {
    try {
      if (!LEGACY_DEMO_IMAGE_PATHS.has(new URL(rawUrl).pathname)) {
        return rawUrl;
      }

      replacementIndex += 1;
      return buildStaticDemoImageUrl(
        `${seedSource}-${replacementIndex}`,
        labelSource,
        projectContext
      );
    } catch {
      return rawUrl;
    }
  });
}

export function buildDemoMediaModule(projectContext: ResolvedProjectImageContext) {
  return `type DemoImageOrientation = 'landscape' | 'portrait' | 'squarish';
type DemoImageCategory =
  | 'food'
  | 'travel'
  | 'wellness'
  | 'real-estate'
  | 'retail'
  | 'technology'
  | 'healthcare'
  | 'education'
  | 'automotive'
  | 'events'
  | 'workspace';
type ProjectImageSlot = 'generic' | 'hero' | 'portrait' | 'gallery';
type ProjectImageSearchResult = {
  slot: ProjectImageSlot;
  query: string;
  orientation: DemoImageOrientation;
  urls: string[];
};

const PROJECT_THEME_HINT = ${JSON.stringify(projectContext.themeHint)};

const PORTRAIT_IMAGE_HINTS: string[] = ${JSON.stringify(PORTRAIT_IMAGE_HINTS, null, 2)};

const WIDE_IMAGE_HINTS: string[] = ${JSON.stringify(WIDE_IMAGE_HINTS, null, 2)};

const DEMO_IMAGE_CATEGORY_KEYWORDS: Array<{ category: DemoImageCategory; keywords: string[] }> = ${JSON.stringify(
    DEMO_IMAGE_CATEGORY_KEYWORDS,
    null,
    2
  )};

const UNSPLASH_PORTRAIT_URLS: string[] = ${JSON.stringify(UNSPLASH_PORTRAIT_URLS, null, 2)};

const THEMED_UNSPLASH_LIBRARIES: Record<DemoImageCategory, string[]> = ${JSON.stringify(
    THEMED_UNSPLASH_LIBRARIES,
    null,
    2
  )};

const RESOLVED_PROJECT_IMAGES: ProjectImageSearchResult[] = ${JSON.stringify(
    projectContext.resolvedImages,
    null,
    2
  )};

function coerceDemoString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => coerceDemoString(entry))
      .filter(Boolean)
      .join(' ');
  }

  if (typeof value === 'object') {
    try {
      const serialized = JSON.stringify(value);
      return typeof serialized === 'string' ? serialized : '';
    } catch {
      return '';
    }
  }

  return '';
}

export function normalizeDemoToken(value: unknown, fallback = 'demo-photo') {
  const normalized = coerceDemoString(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || fallback;
}

export function normalizeDemoLabel(value: unknown, fallback = 'Demo Photo') {
  const normalized = coerceDemoString(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim();

  if (!normalized) {
    return fallback;
  }

  return normalized
    .split(' ')
    .slice(0, 6)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getDemoImageUrl(seed: string, label = 'Demo Photo', _variant?: string) {
  const normalizedSeed = normalizeDemoToken(seed);
  const normalizedLabel = normalizeDemoLabel(label).toLowerCase();
  const context = [PROJECT_THEME_HINT, normalizedSeed, normalizedLabel].filter(Boolean).join(' ');
  const size = pickDemoImageSize(context);
  const baseUrl = pickResolvedProjectImageUrl(context) ?? pickDemoImageBaseUrl(context);

  return formatUnsplashUrl(baseUrl, size.width, size.height);
}

function pickDemoImageSize(context: string) {
  if (PORTRAIT_IMAGE_HINTS.some((hint) => context.includes(hint))) {
    return { width: 640, height: 640 };
  }

  if (WIDE_IMAGE_HINTS.some((hint) => context.includes(hint))) {
    return { width: 1600, height: 900 };
  }

  return { width: 1200, height: 900 };
}

function pickDemoImageBaseUrl(context: string) {
  if (PORTRAIT_IMAGE_HINTS.some((hint) => context.includes(hint))) {
    return UNSPLASH_PORTRAIT_URLS[hashString(context) % UNSPLASH_PORTRAIT_URLS.length];
  }

  const category = detectDemoImageCategory(context);
  const library = THEMED_UNSPLASH_LIBRARIES[category] ?? THEMED_UNSPLASH_LIBRARIES.workspace;

  return library[hashString(context) % library.length];
}

function pickResolvedProjectImageUrl(context: string) {
  if (!Array.isArray(RESOLVED_PROJECT_IMAGES) || RESOLVED_PROJECT_IMAGES.length === 0) {
    return null;
  }

  const slot = detectProjectImageSlot(context);
  const slotOrder = getResolvedImageSlotOrder(slot);

  for (const nextSlot of slotOrder) {
    const matches = RESOLVED_PROJECT_IMAGES.filter((entry) => entry.slot === nextSlot);
    if (matches.length === 0) {
      continue;
    }

    const urls = matches.flatMap((entry) => Array.isArray(entry.urls) ? entry.urls : []).filter(Boolean);
    if (urls.length === 0) {
      continue;
    }

    return urls[hashString(context + ':' + nextSlot) % urls.length];
  }

  return null;
}

function detectProjectImageSlot(context: string) {
  if (PORTRAIT_IMAGE_HINTS.some((hint) => context.includes(hint))) {
    return 'portrait';
  }

  if (WIDE_IMAGE_HINTS.some((hint) => context.includes(hint))) {
    return 'hero';
  }

  if (
    [
      'gallery',
      'product',
      'menu',
      'listing',
      'thumbnail',
      'card',
      'detail',
      'interior',
      'vehicle',
      'property',
      'dish',
    ].some((hint) => context.includes(hint))
  ) {
    return 'gallery';
  }

  return 'generic';
}

function getResolvedImageSlotOrder(slot: ProjectImageSlot): ProjectImageSlot[] {
  switch (slot) {
    case 'hero':
      return ['hero', 'gallery', 'generic'];
    case 'portrait':
      return ['portrait', 'generic', 'hero'];
    case 'gallery':
      return ['gallery', 'hero', 'generic'];
    case 'generic':
    default:
      return ['generic', 'hero', 'gallery'];
  }
}

function detectDemoImageCategory(context: string): DemoImageCategory {
  const normalizedContext = normalizeHintText(context);
  for (const entry of DEMO_IMAGE_CATEGORY_KEYWORDS) {
    if (entry.keywords.some((keyword) => normalizedContext.includes(keyword))) {
      return entry.category;
    }
  }

  return 'workspace';
}

function normalizeHintText(value: string) {
  return value
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim();
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function formatUnsplashUrl(rawUrl: string, width: number, height: number) {
  const url = new URL(rawUrl);
  url.searchParams.set('auto', 'format');
  url.searchParams.set('fit', 'crop');
  url.searchParams.set('fm', 'jpg');
  url.searchParams.set('q', '80');
  url.searchParams.set('w', String(width));
  url.searchParams.set('h', String(height));
  return url.toString();
}
`;
}

function normalizeHintText(value: string) {
  return value
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function coerceDemoString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => coerceDemoString(entry))
      .filter(Boolean)
      .join(' ');
  }

  if (typeof value === 'object') {
    try {
      const serialized = JSON.stringify(value);
      return typeof serialized === 'string' ? serialized : '';
    } catch {
      return '';
    }
  }

  return '';
}

function pickDemoImageSize(context: string) {
  if (PORTRAIT_IMAGE_HINTS.some((hint) => context.includes(hint))) {
    return { width: 640, height: 640 };
  }

  if (WIDE_IMAGE_HINTS.some((hint) => context.includes(hint))) {
    return { width: 1600, height: 900 };
  }

  return { width: 1200, height: 900 };
}

function pickDemoImageBaseUrl(context: string) {
  if (PORTRAIT_IMAGE_HINTS.some((hint) => context.includes(hint))) {
    return UNSPLASH_PORTRAIT_URLS[hashString(context) % UNSPLASH_PORTRAIT_URLS.length];
  }

  const category = detectDemoImageCategory(context);
  const library = THEMED_UNSPLASH_LIBRARIES[category] ?? THEMED_UNSPLASH_LIBRARIES.workspace;

  return library[hashString(context) % library.length];
}

function pickResolvedProjectImageUrl(
  context: string,
  projectContext: ResolvedProjectImageContext
) {
  if (projectContext.resolvedImages.length === 0) {
    return null;
  }

  const slot = detectProjectImageSlot(context);
  const slotOrder = getResolvedImageSlotOrder(slot);

  for (const nextSlot of slotOrder) {
    const matches = projectContext.resolvedImages.filter((entry) => entry.slot === nextSlot);
    if (matches.length === 0) {
      continue;
    }

    const urls = matches.flatMap((entry) => entry.urls).filter(Boolean);
    if (urls.length === 0) {
      continue;
    }

    return urls[hashString(`${context}:${nextSlot}`) % urls.length];
  }

  return null;
}

function detectProjectImageSlot(context: string): ProjectImageSlot {
  if (PORTRAIT_IMAGE_HINTS.some((hint) => context.includes(hint))) {
    return 'portrait';
  }

  if (WIDE_IMAGE_HINTS.some((hint) => context.includes(hint))) {
    return 'hero';
  }

  if (
    [
      'gallery',
      'product',
      'menu',
      'listing',
      'thumbnail',
      'card',
      'detail',
      'interior',
      'vehicle',
      'property',
      'dish',
    ].some((hint) => context.includes(hint))
  ) {
    return 'gallery';
  }

  return 'generic';
}

function getResolvedImageSlotOrder(slot: ProjectImageSlot): ProjectImageSlot[] {
  switch (slot) {
    case 'hero':
      return ['hero', 'gallery', 'generic'];
    case 'portrait':
      return ['portrait', 'generic', 'hero'];
    case 'gallery':
      return ['gallery', 'hero', 'generic'];
    case 'generic':
    default:
      return ['generic', 'hero', 'gallery'];
  }
}

export function detectDemoImageCategory(context: string): DemoImageCategory {
  const normalizedContext = normalizeHintText(context);
  for (const entry of DEMO_IMAGE_CATEGORY_KEYWORDS) {
    if (entry.keywords.some((keyword) => normalizedContext.includes(keyword))) {
      return entry.category;
    }
  }

  return 'workspace';
}

function isProjectImageSlot(value: string): value is ProjectImageSlot {
  return ['generic', 'hero', 'portrait', 'gallery'].includes(value);
}

function isDemoImageOrientation(value: string): value is DemoImageOrientation {
  return ['landscape', 'portrait', 'squarish'].includes(value);
}

function formatUnsplashUrl(rawUrl: string, width: number, height: number) {
  const url = new URL(rawUrl);
  url.searchParams.set('auto', 'format');
  url.searchParams.set('fit', 'crop');
  url.searchParams.set('fm', 'jpg');
  url.searchParams.set('q', '80');
  url.searchParams.set('w', String(width));
  url.searchParams.set('h', String(height));
  return url.toString();
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

import { aiLogger } from '@/ai/logger';
import { Blueprint } from '@/validators/blueprint.validator';
import {
  buildProjectImageThemeHint,
  detectDemoImageCategory,
  type DemoImageCategory,
  type DemoImageOrientation,
  type ProjectImageSearchResult,
  type ProjectImageSlot,
} from './demo-media';
import { GeneratedFile } from './types';

const UNSPLASH_API_BASE_URL =
  process.env.UNSPLASH_API_BASE_URL?.trim() || 'https://api.unsplash.com';
const UNSPLASH_REQUEST_TIMEOUT_MS = 8_000;
const UNSPLASH_RESULT_COUNT = 4;

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'app',
  'application',
  'build',
  'built',
  'business',
  'by',
  'for',
  'from',
  'generate',
  'generated',
  'help',
  'in',
  'into',
  'modern',
  'of',
  'on',
  'online',
  'platform',
  'product',
  'professional',
  'service',
  'solution',
  'startup',
  'system',
  'that',
  'the',
  'this',
  'tool',
  'website',
  'with',
]);

const VISUAL_NOISE_TOKENS = new Set([
  'account',
  'accounts',
  'admin',
  'admins',
  'analytics',
  'app',
  'apps',
  'auth',
  'booking',
  'bookings',
  'cart',
  'checkout',
  'client',
  'clients',
  'customer',
  'customers',
  'dashboard',
  'dashboards',
  'data',
  'delivery',
  'login',
  'member',
  'members',
  'management',
  'manager',
  'managers',
  'operation',
  'operations',
  'order',
  'orders',
  'platform',
  'profile',
  'profiles',
  'report',
  'reports',
  'reservation',
  'reservations',
  'service',
  'services',
  'settings',
  'signup',
  'system',
  'table',
  'tables',
  'team',
  'teams',
  'user',
  'users',
  'workflow',
  'workflows',
]);

const PERSON_ROLE_TOKENS = new Set([
  'agent',
  'author',
  'chef',
  'customer',
  'doctor',
  'founder',
  'guide',
  'instructor',
  'member',
  'owner',
  'patient',
  'person',
  'profile',
  'speaker',
  'staff',
  'student',
  'teacher',
  'team',
  'trainer',
  'user',
]);

const CATEGORY_ANCHOR_KEYWORDS: Record<DemoImageCategory, string[]> = {
  workspace: ['brand', 'studio', 'service', 'product'],
  food: ['food', 'meal', 'dish', 'restaurant'],
  travel: ['travel', 'destination', 'hotel', 'scenic'],
  wellness: ['wellness', 'spa', 'fitness', 'self-care'],
  'real-estate': ['property', 'interior', 'home', 'architecture'],
  retail: ['product', 'catalog', 'retail', 'storefront'],
  technology: ['software', 'interface', 'device', 'technology'],
  healthcare: ['medical', 'clinic', 'care', 'healthcare'],
  education: ['learning', 'classroom', 'study', 'education'],
  automotive: ['vehicle', 'automotive', 'showroom', 'transport'],
  events: ['venue', 'event', 'celebration', 'stage'],
};

const CATEGORY_SEARCH_HINTS: Record<
  DemoImageCategory,
  Record<ProjectImageSlot, string>
> = {
  workspace: {
    hero: 'brand lifestyle professional',
    generic: 'service still life studio editorial',
    gallery: 'product detail still life editorial',
    portrait: 'professional founder portrait',
  },
  food: {
    hero: 'restaurant signature dishes dining ambience',
    generic: 'prepared meal food still life ingredients',
    gallery: 'dish close up plated meal food photography',
    portrait: 'chef portrait',
  },
  travel: {
    hero: 'travel destination landscape hospitality',
    generic: 'destination hotel suite scenic travel',
    gallery: 'travel detail scenic hotel interior editorial',
    portrait: 'travel guide portrait',
  },
  wellness: {
    hero: 'wellness studio healthy lifestyle',
    generic: 'wellness self care spa detail',
    gallery: 'spa skincare wellness product detail',
    portrait: 'trainer portrait',
  },
  'real-estate': {
    hero: 'modern home interior exterior architecture',
    generic: 'residential property interior design detail',
    gallery: 'interior design room detail home',
    portrait: 'real estate agent portrait',
  },
  retail: {
    hero: 'retail storefront premium product showcase',
    generic: 'product still life catalog studio',
    gallery: 'product close up catalog detail editorial',
    portrait: 'fashion founder portrait',
  },
  technology: {
    hero: 'technology product showcase innovation interface',
    generic: 'software dashboard device product detail',
    gallery: 'device interface technology detail close up',
    portrait: 'startup founder portrait',
  },
  healthcare: {
    hero: 'healthcare clinic patient care medical',
    generic: 'medical clinic care equipment',
    gallery: 'medical equipment clinic detail',
    portrait: 'doctor portrait',
  },
  education: {
    hero: 'education campus learning classroom',
    generic: 'learning classroom books study materials',
    gallery: 'books desk study detail learning',
    portrait: 'teacher portrait',
  },
  automotive: {
    hero: 'automotive vehicle road showroom',
    generic: 'vehicle showroom automotive detail',
    gallery: 'vehicle interior exterior detail',
    portrait: 'mechanic portrait',
  },
  events: {
    hero: 'event venue celebration audience',
    generic: 'event venue decor stage detail',
    gallery: 'event decor celebration detail',
    portrait: 'speaker portrait',
  },
};

interface ImageSearchRequest {
  slot: ProjectImageSlot;
  query: string;
  orientation: DemoImageOrientation;
  source: 'base' | 'label';
  priority: number;
}

interface ImageSearchResolution {
  resolvedImages: ProjectImageSearchResult[];
  warnings: string[];
}

interface UnsplashPhotoPayload {
  id?: string;
  urls?: {
    raw?: string;
    full?: string;
    regular?: string;
  };
}

interface UnsplashSearchPayload {
  results?: UnsplashPhotoPayload[];
}

export async function resolveProjectInternetImages(
  blueprint: Blueprint,
  files: GeneratedFile[] = []
): Promise<ImageSearchResolution> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY?.trim();
  if (!accessKey) {
    return {
      resolvedImages: [],
      warnings: [],
    };
  }

  const requests = buildImageSearchRequests(blueprint, files);
  const usedPaths = new Set<string>();

  const settled = await Promise.all(
    requests.map(async (request) => {
      try {
        const urls = await fetchUnsplashImageUrls(request, accessKey, usedPaths);
        return {
          request,
          urls,
          warning: null as string | null,
        };
      } catch (error) {
        const message = `Image search failed for "${request.query}": ${
          error instanceof Error ? error.message : 'Unknown error'
        }`;
        aiLogger.warn(message);
        return {
          request,
          urls: [] as string[],
          warning: message,
        };
      }
    })
  );

  const resolvedImages = settled
    .filter((entry) => entry.urls.length > 0)
    .map(
      (entry): ProjectImageSearchResult => ({
        slot: entry.request.slot,
        query: entry.request.query,
        orientation: entry.request.orientation,
        urls: entry.urls,
      })
    );

  return {
    resolvedImages,
    warnings: settled
      .map((entry) => entry.warning)
      .filter((value): value is string => Boolean(value)),
  };
}

function buildImageSearchRequests(blueprint: Blueprint, files: GeneratedFile[]): ImageSearchRequest[] {
  const themeHint = buildProjectImageThemeHint({
    projectName: blueprint.projectName,
    description: blueprint.description,
    features: blueprint.features,
    pages: blueprint.pages,
    dataModels: blueprint.dataModels,
  });
  const category = detectDemoImageCategory(
    [themeHint, blueprint.projectName, blueprint.description].filter(Boolean).join(' ')
  );
  const categoryHints = CATEGORY_SEARCH_HINTS[category] ?? CATEGORY_SEARCH_HINTS.workspace;
  const baseKeywords = buildSearchKeywords(blueprint, themeHint, category);
  const galleryKeywords = buildSearchKeywords(blueprint, themeHint, category, { limit: 4 });
  const portraitKeywords = buildSearchKeywords(blueprint, themeHint, category, {
    allowPeople: true,
    limit: 4,
  });
  const categoryAnchors = CATEGORY_ANCHOR_KEYWORDS[category].join(' ');

  return dedupeImageSearchRequests([
    {
      slot: 'hero',
      orientation: 'landscape',
      query: buildSearchQuery([categoryAnchors, baseKeywords].join(' '), categoryHints.hero),
      source: 'base',
      priority: 100,
    },
    {
      slot: 'generic',
      orientation: 'landscape',
      query: buildSearchQuery([categoryAnchors, baseKeywords].join(' '), categoryHints.generic),
      source: 'base',
      priority: 90,
    },
    {
      slot: 'gallery',
      orientation: 'squarish',
      query: buildSearchQuery([categoryAnchors, galleryKeywords || baseKeywords].join(' '), categoryHints.gallery),
      source: 'base',
      priority: 95,
    },
    {
      slot: 'gallery',
      orientation: 'squarish',
      query: buildSearchQuery(galleryKeywords || baseKeywords, `${categoryHints.gallery} ${categoryAnchors}`),
      source: 'base',
      priority: 92,
    },
    {
      slot: 'portrait',
      orientation: 'portrait',
      query: buildSearchQuery([categoryAnchors, portraitKeywords || baseKeywords].join(' '), categoryHints.portrait),
      source: 'base',
      priority: 80,
    },
    ...extractImageSearchRequestsFromFiles(files, category, categoryAnchors),
  ]).sort((left, right) => right.priority - left.priority);
}

function buildSearchKeywords(
  blueprint: Blueprint,
  themeHint: string,
  category: DemoImageCategory,
  options: {
    allowPeople?: boolean;
    limit?: number;
  } = {}
) {
  const weightedTokens = new Map<string, number>();
  const allowPeople = options.allowPeople === true;
  const limit = Math.max(2, options.limit ?? 6);

  addWeightedTokens(weightedTokens, blueprint.projectName, 8, category, allowPeople);
  addWeightedTokens(weightedTokens, blueprint.description, 7, category, allowPeople);
  addWeightedTokens(weightedTokens, themeHint, 7, category, allowPeople);

  for (const page of blueprint.pages.slice(0, 6)) {
    addWeightedTokens(weightedTokens, page.name, 6, category, allowPeople);
    addWeightedTokens(weightedTokens, page.description, 5, category, allowPeople);
  }

  for (const model of blueprint.dataModels.slice(0, 6)) {
    addWeightedTokens(weightedTokens, model.name, 4, category, allowPeople);
  }

  for (const feature of blueprint.features.slice(0, 8)) {
    addWeightedTokens(weightedTokens, feature.name, 4, category, allowPeople);
  }

  for (const anchor of CATEGORY_ANCHOR_KEYWORDS[category] ?? []) {
    addWeightedTokens(weightedTokens, anchor, 9, category, true);
  }

  return [...weightedTokens.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([token]) => token)
    .join(' ');
}

function buildSearchQuery(baseKeywords: string, slotHint: string) {
  const tokens = normalizeSearchText([baseKeywords, slotHint].join(' '))
    .split(' ')
    .filter((token) => token.length > 1);

  return [...new Set(tokens)].slice(0, 12).join(' ').trim() || 'modern product lifestyle';
}

function addWeightedTokens(
  weightedTokens: Map<string, number>,
  source: string,
  weight: number,
  category: DemoImageCategory,
  allowPeople: boolean
) {
  for (const rawToken of normalizeSearchText(source).split(' ')) {
    const token = singularizeKeyword(rawToken);
    if (token.length < 3 || STOP_WORDS.has(token) || VISUAL_NOISE_TOKENS.has(token)) {
      continue;
    }

    if (!allowPeople && PERSON_ROLE_TOKENS.has(token)) {
      continue;
    }

    let score = weight;
    if ((CATEGORY_ANCHOR_KEYWORDS[category] ?? []).some((anchor) => normalizeSearchText(anchor).includes(token))) {
      score += 6;
    }

    weightedTokens.set(token, (weightedTokens.get(token) ?? 0) + score);
  }
}

function singularizeKeyword(token: string) {
  if (token.endsWith('ies') && token.length > 4) {
    return `${token.slice(0, -3)}y`;
  }

  if (token.endsWith('s') && token.length > 4 && !token.endsWith('ss')) {
    return token.slice(0, -1);
  }

  return token;
}

function dedupeImageSearchRequests(requests: ImageSearchRequest[]) {
  const seen = new Map<string, ImageSearchRequest>();

  for (const request of requests) {
    const key = `${request.slot}:${request.orientation}:${request.query}`;
    if (!request.query) {
      continue;
    }

    const previous = seen.get(key);
    if (!previous || request.priority > previous.priority) {
      seen.set(key, request);
    }
  }

  return [...seen.values()].slice(0, 14);
}

async function fetchUnsplashImageUrls(
  request: ImageSearchRequest,
  accessKey: string,
  usedPaths: Set<string>
) {
  const params = new URLSearchParams({
    query: request.query,
    orientation: request.orientation,
    content_filter: 'high',
    per_page: String(UNSPLASH_RESULT_COUNT),
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UNSPLASH_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${UNSPLASH_API_BASE_URL}/search/photos?${params.toString()}`, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Unsplash API ${response.status}${body ? `: ${body.slice(0, 200)}` : ''}`);
    }

    const payload = (await response.json()) as UnsplashSearchPayload | UnsplashPhotoPayload | UnsplashPhotoPayload[];
    const photos = Array.isArray(payload)
      ? payload
      : 'results' in (payload as UnsplashSearchPayload)
        ? ((payload as UnsplashSearchPayload).results ?? [])
        : [payload as UnsplashPhotoPayload];

    const urls: string[] = [];
    for (const photo of photos) {
      const rawUrl = photo.urls?.raw ?? photo.urls?.full ?? photo.urls?.regular;
      if (!rawUrl) {
        continue;
      }

      let pathname = rawUrl;
      try {
        pathname = new URL(rawUrl).pathname;
      } catch {
        pathname = rawUrl;
      }

      if (usedPaths.has(pathname)) {
        continue;
      }

      usedPaths.add(pathname);
      urls.push(rawUrl);
    }

    return urls;
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractImageSearchRequestsFromFiles(
  files: GeneratedFile[],
  category: DemoImageCategory,
  categoryAnchors: string
): ImageSearchRequest[] {
  const weightedLabels = new Map<
    string,
    {
      slot: ProjectImageSlot;
      orientation: DemoImageOrientation;
      priority: number;
    }
  >();

  for (const file of files) {
    if (!/\.(?:[cm]?[jt]sx?|html)$/i.test(file.path)) {
      continue;
    }

    for (const hint of extractImageHintsFromContent(file.content)) {
      const normalizedLabel = normalizeImageLabel(hint.label);
      if (!normalizedLabel) {
        continue;
      }

      const slot = inferImageSlotFromLabel(normalizedLabel);
      const orientation = getOrientationForSlot(slot);
      const priority = hint.priority + getFilePriorityBoost(file.path);
      const previous = weightedLabels.get(normalizedLabel);

      if (!previous || priority > previous.priority) {
        weightedLabels.set(normalizedLabel, {
          slot,
          orientation,
          priority,
        });
      }
    }
  }

  return [...weightedLabels.entries()]
    .sort((left, right) => right[1].priority - left[1].priority)
    .slice(0, 10)
    .map(([label, meta]) => ({
      slot: meta.slot,
      orientation: meta.orientation,
      query: buildSearchQuery([categoryAnchors, label].join(' '), buildLabelSearchHint(label, category, meta.slot)),
      source: 'label',
      priority: meta.priority,
    }));
}

function extractImageHintsFromContent(content: string) {
  const hints: Array<{ label: string; priority: number }> = [];

  for (const match of content.matchAll(/getDemoImageUrl\s*\(\s*[^,]+,\s*(['"`])([^'"`]+)\1/g)) {
    hints.push({ label: match[2], priority: 120 });
  }

  for (const match of content.matchAll(/\balt\s*=\s*(?:\{)?(['"`])([^'"`]+)\1(?:\})?/g)) {
    hints.push({ label: match[2], priority: 95 });
  }

  for (const match of content.matchAll(/\/api\/demo-image\?[^'"`\s)]*label=([^&"'`\s)]+)/gi)) {
    try {
      hints.push({
        label: decodeURIComponent(match[1].replace(/\+/g, ' ')),
        priority: 110,
      });
    } catch {
      hints.push({ label: match[1], priority: 100 });
    }
  }

  return hints;
}

function normalizeImageLabel(label: string) {
  const normalized = normalizeSearchText(label)
    .split(' ')
    .filter(
      (token) =>
        token.length > 2 &&
        !STOP_WORDS.has(token) &&
        !VISUAL_NOISE_TOKENS.has(token)
    )
    .join(' ');

  return normalized.trim();
}

function inferImageSlotFromLabel(label: string): ProjectImageSlot {
  if (PERSON_ROLE_TOKENS.size > 0 && [...PERSON_ROLE_TOKENS].some((token) => label.includes(token))) {
    if (!/product|dish|meal|menu|catalog|listing|interior|room|vehicle|property|device|detail/.test(label)) {
      return 'portrait';
    }
  }

  if (
    /\b(hero|banner|cover|header|background|landing|showcase)\b/.test(label)
  ) {
    return 'hero';
  }

  if (
    /\b(product|products|dish|meal|menu|catalog|listing|thumbnail|gallery|detail|interior|room|suite|property|vehicle|device|equipment|book)\b/.test(
      label
    )
  ) {
    return 'gallery';
  }

  return 'generic';
}

function getOrientationForSlot(slot: ProjectImageSlot): DemoImageOrientation {
  switch (slot) {
    case 'portrait':
      return 'portrait';
    case 'gallery':
      return 'squarish';
    case 'hero':
    case 'generic':
    default:
      return 'landscape';
  }
}

function buildLabelSearchHint(label: string, category: DemoImageCategory, slot: ProjectImageSlot) {
  const categoryHints = CATEGORY_SEARCH_HINTS[category] ?? CATEGORY_SEARCH_HINTS.workspace;

  switch (slot) {
    case 'portrait':
      return categoryHints.portrait;
    case 'hero':
      return categoryHints.hero;
    case 'gallery':
      return `${categoryHints.gallery} exact subject`;
    case 'generic':
    default:
      return `${categoryHints.generic} exact subject`;
  }
}

function getFilePriorityBoost(filePath: string) {
  if (filePath === 'src/app/page.tsx') {
    return 24;
  }

  if (/\/page\.(?:tsx|jsx)$/i.test(filePath)) {
    return 16;
  }

  if (filePath.startsWith('src/components/')) {
    return 10;
  }

  return 0;
}

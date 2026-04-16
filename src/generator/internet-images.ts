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

const CATEGORY_SEARCH_HINTS: Record<
  DemoImageCategory,
  Record<ProjectImageSlot, string>
> = {
  workspace: {
    hero: 'brand lifestyle professional',
    generic: 'service experience editorial',
    gallery: 'product detail editorial',
    portrait: 'professional founder portrait',
  },
  food: {
    hero: 'restaurant dining interior plated food',
    generic: 'gourmet food restaurant',
    gallery: 'dish close up food photography',
    portrait: 'chef portrait',
  },
  travel: {
    hero: 'travel destination landscape hospitality',
    generic: 'boutique hotel resort travel',
    gallery: 'travel detail scenic editorial',
    portrait: 'travel guide portrait',
  },
  wellness: {
    hero: 'wellness studio healthy lifestyle',
    generic: 'fitness training self care',
    gallery: 'spa skincare wellness detail',
    portrait: 'trainer portrait',
  },
  'real-estate': {
    hero: 'modern home interior exterior architecture',
    generic: 'luxury apartment residence property',
    gallery: 'interior design detail home',
    portrait: 'real estate agent portrait',
  },
  retail: {
    hero: 'retail storefront fashion product showcase',
    generic: 'shopping product editorial',
    gallery: 'product close up editorial',
    portrait: 'fashion founder portrait',
  },
  technology: {
    hero: 'technology innovation product lifestyle',
    generic: 'software team collaboration',
    gallery: 'device product detail technology',
    portrait: 'startup founder portrait',
  },
  healthcare: {
    hero: 'healthcare clinic patient care medical',
    generic: 'medical treatment healthcare',
    gallery: 'medical equipment detail',
    portrait: 'doctor portrait',
  },
  education: {
    hero: 'education campus learning classroom',
    generic: 'student learning study',
    gallery: 'books desk study detail',
    portrait: 'teacher portrait',
  },
  automotive: {
    hero: 'automotive vehicle road showroom',
    generic: 'car transport detail',
    gallery: 'vehicle interior detail',
    portrait: 'mechanic portrait',
  },
  events: {
    hero: 'event venue celebration audience',
    generic: 'conference stage event',
    gallery: 'event decor detail',
    portrait: 'speaker portrait',
  },
};

interface ImageSearchRequest {
  slot: ProjectImageSlot;
  query: string;
  orientation: DemoImageOrientation;
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

export async function resolveProjectInternetImages(
  blueprint: Blueprint
): Promise<ImageSearchResolution> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY?.trim();
  if (!accessKey) {
    return {
      resolvedImages: [],
      warnings: [],
    };
  }

  const requests = buildImageSearchRequests(blueprint);
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

function buildImageSearchRequests(blueprint: Blueprint): ImageSearchRequest[] {
  const themeHint = buildProjectImageThemeHint(blueprint);
  const baseKeywords = buildSearchKeywords(blueprint, themeHint);
  const category = detectDemoImageCategory([themeHint, baseKeywords].filter(Boolean).join(' '));
  const categoryHints = CATEGORY_SEARCH_HINTS[category] ?? CATEGORY_SEARCH_HINTS.workspace;

  return [
    {
      slot: 'hero',
      orientation: 'landscape',
      query: buildSearchQuery(baseKeywords, categoryHints.hero),
    },
    {
      slot: 'generic',
      orientation: 'landscape',
      query: buildSearchQuery(baseKeywords, categoryHints.generic),
    },
    {
      slot: 'gallery',
      orientation: 'squarish',
      query: buildSearchQuery(baseKeywords, categoryHints.gallery),
    },
    {
      slot: 'portrait',
      orientation: 'portrait',
      query: buildSearchQuery(baseKeywords, categoryHints.portrait),
    },
  ];
}

function buildSearchKeywords(blueprint: Blueprint, themeHint: string) {
  const sourceText = [
    blueprint.projectName,
    ...blueprint.pages.slice(0, 4).flatMap((page) => [page.name, page.description]),
    ...blueprint.dataModels.slice(0, 4).map((model) => model.name),
    ...blueprint.features.slice(0, 6).map((feature) => feature.name),
    blueprint.description,
    themeHint,
  ].join(' ');

  const tokens = normalizeSearchText(sourceText)
    .split(' ')
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

  const uniqueTokens = [...new Set(tokens)];
  return uniqueTokens.slice(0, 8).join(' ');
}

function buildSearchQuery(baseKeywords: string, slotHint: string) {
  const tokens = normalizeSearchText([baseKeywords, slotHint].join(' '))
    .split(' ')
    .filter((token) => token.length > 1);

  return [...new Set(tokens)].slice(0, 12).join(' ').trim() || 'modern product lifestyle';
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
    count: String(UNSPLASH_RESULT_COUNT),
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UNSPLASH_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${UNSPLASH_API_BASE_URL}/photos/random?${params.toString()}`, {
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

    const payload = (await response.json()) as UnsplashPhotoPayload | UnsplashPhotoPayload[];
    const photos = Array.isArray(payload) ? payload : [payload];

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

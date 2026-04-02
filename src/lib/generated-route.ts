function toKebabCase(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-zA-Z0-9\[\]-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function normalizeDynamicSegment(value: string, wrapper: 'bracket' | 'catchall' | 'optional-catchall') {
  const normalized = toKebabCase(value.replace(/^\.\.\./, '')) || 'id';

  switch (wrapper) {
    case 'catchall':
      return `[...${normalized}]`;
    case 'optional-catchall':
      return `[[...${normalized}]]`;
    case 'bracket':
    default:
      return `[${normalized}]`;
  }
}

function normalizeRouteSegment(segment: string) {
  const trimmed = segment.trim();
  if (!trimmed) {
    return 'page';
  }

  const optionalCatchallMatch = trimmed.match(/^\[\[\.\.\.([^[\]/]+)\]\]$/);
  if (optionalCatchallMatch) {
    return normalizeDynamicSegment(optionalCatchallMatch[1], 'optional-catchall');
  }

  const catchallMatch = trimmed.match(/^\[\.\.\.([^[\]/]+)\]$/);
  if (catchallMatch) {
    return normalizeDynamicSegment(catchallMatch[1], 'catchall');
  }

  const bracketMatch = trimmed.match(/^\[([^[\]/]+)\]$/);
  if (bracketMatch) {
    return normalizeDynamicSegment(bracketMatch[1], 'bracket');
  }

  const colonMatch = trimmed.match(/^:([^/]+)$/);
  if (colonMatch) {
    return normalizeDynamicSegment(colonMatch[1], 'bracket');
  }

  return toKebabCase(trimmed) || 'page';
}

export function normalizeGeneratedRoute(route: string | null | undefined) {
  if (!route) {
    return '/';
  }

  const trimmed = route.trim().split(/[?#]/, 1)[0];
  if (!trimmed || trimmed === '/') {
    return '/';
  }

  const segments = trimmed
    .replace(/^\/+/, '')
    .replace(/\/+/g, '/')
    .split('/')
    .filter(Boolean)
    .map(normalizeRouteSegment)
    .filter(Boolean);

  return segments.length > 0 ? `/${segments.join('/')}` : '/';
}

export function isDynamicGeneratedRoute(route: string | null | undefined) {
  return normalizeGeneratedRoute(route)
    .split('/')
    .some((segment) => /^\[\[?\.\.\.[^\]]+\]\]$|^\[[^\]]+\]$/.test(segment));
}

export function getGeneratedPageFilePath(route: string) {
  const normalizedRoute = normalizeGeneratedRoute(route);
  if (normalizedRoute === '/') {
    return 'src/app/page.tsx';
  }

  return `src/app/${normalizedRoute.replace(/^\/+/, '')}/page.tsx`;
}

import { aiLogger } from '@/ai/logger';
import { normalizeGeneratedRoute } from '@/lib/generated-route';

export interface BlueprintFeature {
  name: string;
  description: string;
  priority: 'core' | 'important' | 'nice-to-have';
}

export interface BlueprintField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'relation';
  required: boolean;
  relation?: string;
}

export interface BlueprintDataModel {
  name: string;
  fields: BlueprintField[];
}

export interface BlueprintApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  relatedModel: string;
}

export interface BlueprintPage {
  name: string;
  route: string;
  description: string;
  components: string[];
}

export interface BlueprintTechStack {
  frontend: string;
  backend: string;
  database: string;
  auth: string;
}

export interface Blueprint {
  projectName: string;
  description: string;
  features: BlueprintFeature[];
  dataModels: BlueprintDataModel[];
  apiEndpoints: BlueprintApiEndpoint[];
  pages: BlueprintPage[];
  techStack: BlueprintTechStack;
}

export interface BlueprintValidationResult {
  isValid: boolean;
  blueprint: Blueprint | null;
  errors: string[];
  warnings: string[];
  wasRepaired: boolean;
}

const VALID_PRIORITIES = new Set(['core', 'important', 'nice-to-have']);
const VALID_FIELD_TYPES = new Set(['string', 'number', 'boolean', 'date', 'relation']);
const VALID_HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);

export function validateBlueprint(parsed: unknown): BlueprintValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let wasRepaired = false;

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      isValid: false,
      blueprint: null,
      errors: ['Blueprint must be a JSON object.'],
      warnings: [],
      wasRepaired: false,
    };
  }

  const raw = parsed as Record<string, unknown>;
  let projectName = validateString(raw.projectName);
  if (!projectName) {
    projectName = 'generated-app';
    warnings.push('Missing projectName - defaulted to "generated-app".');
    wasRepaired = true;
  } else {
    const normalized = toKebabCase(projectName);
    if (normalized !== projectName) {
      warnings.push(`projectName "${projectName}" normalized to "${normalized}".`);
      projectName = normalized;
      wasRepaired = true;
    }
  }

  let description = validateString(raw.description);
  if (!description) {
    description = `A generated application: ${projectName}`;
    warnings.push('Missing description - generated a default.');
    wasRepaired = true;
  }

  const features = validateFeatures(raw.features, warnings);
  const dataModels = validateDataModels(raw.dataModels, warnings);
  const apiEndpoints = validateApiEndpoints(raw.apiEndpoints, warnings);
  const pages = validatePages(raw.pages, warnings);
  const techStack = validateTechStack(raw.techStack, warnings);

  wasRepaired =
    wasRepaired ||
    features.repaired ||
    dataModels.repaired ||
    apiEndpoints.repaired ||
    pages.repaired;

  if (dataModels.items.length === 0) {
    errors.push('Blueprint must have at least 1 data model.');
  }
  if (apiEndpoints.items.length === 0) {
    errors.push('Blueprint must have at least 1 API endpoint.');
  }
  if (pages.items.length === 0) {
    errors.push('Blueprint must have at least 1 page.');
  }

  const isValid = errors.length === 0;
  const blueprint = isValid
    ? {
        projectName,
        description,
        features: features.items,
        dataModels: dataModels.items,
        apiEndpoints: apiEndpoints.items,
        pages: pages.items,
        techStack,
      }
    : null;

  if (!isValid) {
    aiLogger.warn('Blueprint validation failed', undefined, undefined, {
      errors,
      warnings,
    });
  } else if (wasRepaired) {
    aiLogger.info('Blueprint validated with repairs', undefined, undefined, { warnings });
  }

  return {
    isValid,
    blueprint,
    errors,
    warnings,
    wasRepaired,
  };
}

function validateString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function validateFeatures(raw: unknown, warnings: string[]) {
  let repaired = false;
  if (!Array.isArray(raw)) {
    warnings.push('features is not an array - defaulting to empty.');
    return { items: [] as BlueprintFeature[], repaired: true };
  }

  const items: BlueprintFeature[] = [];
  raw.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      warnings.push(`features[${index}] is not an object - skipped.`);
      repaired = true;
      return;
    }

    const feature = entry as Record<string, unknown>;
    const name = validateString(feature.name);
    if (!name) {
      warnings.push(`features[${index}] missing name - skipped.`);
      repaired = true;
      return;
    }

    const description = validateString(feature.description) ?? name;
    let priority = validateString(feature.priority)?.toLowerCase() ?? 'important';
    if (!VALID_PRIORITIES.has(priority)) {
      priority = 'important';
      repaired = true;
      warnings.push(`features[${index}] invalid priority - defaulted to "important".`);
    }

    items.push({
      name,
      description,
      priority: priority as BlueprintFeature['priority'],
    });
  });

  return { items, repaired };
}

function validateDataModels(raw: unknown, warnings: string[]) {
  let repaired = false;
  if (!Array.isArray(raw)) {
    warnings.push('dataModels is not an array - defaulting to empty.');
    return { items: [] as BlueprintDataModel[], repaired: true };
  }

  const items: BlueprintDataModel[] = [];
  raw.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      warnings.push(`dataModels[${index}] is not an object - skipped.`);
      repaired = true;
      return;
    }

    const model = entry as Record<string, unknown>;
    const rawName = validateString(model.name);
    if (!rawName) {
      warnings.push(`dataModels[${index}] missing name - skipped.`);
      repaired = true;
      return;
    }

    const name = toPascalCase(rawName);
    if (name !== rawName) {
      warnings.push(`dataModels[${index}] name normalized to "${name}".`);
      repaired = true;
    }

    const fieldsResult = validateFields(model.fields, index, warnings);
    if (!fieldsResult.items.some((field) => field.name === 'id')) {
      fieldsResult.items.unshift({ name: 'id', type: 'string', required: true });
      repaired = true;
    }
    if (!fieldsResult.items.some((field) => field.name === 'createdAt')) {
      fieldsResult.items.push({ name: 'createdAt', type: 'date', required: true });
      repaired = true;
    }
    if (!fieldsResult.items.some((field) => field.name === 'updatedAt')) {
      fieldsResult.items.push({ name: 'updatedAt', type: 'date', required: true });
      repaired = true;
    }

    items.push({ name, fields: fieldsResult.items });
    repaired = repaired || fieldsResult.repaired;
  });

  return { items, repaired };
}

function validateFields(raw: unknown, modelIndex: number, warnings: string[]) {
  let repaired = false;
  if (!Array.isArray(raw)) {
    warnings.push(`dataModels[${modelIndex}].fields is not an array - defaulting to empty.`);
    return { items: [] as BlueprintField[], repaired: true };
  }

  const items: BlueprintField[] = [];
  raw.forEach((entry, fieldIndex) => {
    if (!entry || typeof entry !== 'object') {
      warnings.push(`dataModels[${modelIndex}].fields[${fieldIndex}] invalid - skipped.`);
      repaired = true;
      return;
    }

    const field = entry as Record<string, unknown>;
    const rawName = validateString(field.name);
    if (!rawName) {
      warnings.push(`dataModels[${modelIndex}].fields[${fieldIndex}] missing name - skipped.`);
      repaired = true;
      return;
    }

    let type = normalizeFieldType(validateString(field.type)?.toLowerCase() ?? 'string');
    if (!VALID_FIELD_TYPES.has(type)) {
      warnings.push(
        `dataModels[${modelIndex}].fields[${fieldIndex}] invalid type "${type}" - defaulted to "string".`
      );
      type = 'string';
      repaired = true;
    }

    const item: BlueprintField = {
      name: toCamelCase(rawName),
      type: type as BlueprintField['type'],
      required: typeof field.required === 'boolean' ? field.required : true,
    };

    if (type === 'relation' && typeof field.relation === 'string' && field.relation.trim()) {
      item.relation = toPascalCase(field.relation.trim());
    }

    items.push(item);
  });

  return { items, repaired };
}

function validateApiEndpoints(raw: unknown, warnings: string[]) {
  let repaired = false;
  if (!Array.isArray(raw)) {
    warnings.push('apiEndpoints is not an array - defaulting to empty.');
    return { items: [] as BlueprintApiEndpoint[], repaired: true };
  }

  const items: BlueprintApiEndpoint[] = [];
  raw.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      warnings.push(`apiEndpoints[${index}] invalid - skipped.`);
      repaired = true;
      return;
    }

    const endpoint = entry as Record<string, unknown>;
    let method = validateString(endpoint.method)?.toUpperCase() ?? '';
    let path = validateString(endpoint.path) ?? '';
    if (!method) {
      warnings.push(`apiEndpoints[${index}] missing method - skipped.`);
      repaired = true;
      return;
    }

    if (!VALID_HTTP_METHODS.has(method)) {
      method = 'GET';
      warnings.push(`apiEndpoints[${index}] invalid method - defaulted to GET.`);
      repaired = true;
    }

    if (!path) {
      warnings.push(`apiEndpoints[${index}] missing path - skipped.`);
      repaired = true;
      return;
    }

    if (!path.startsWith('/')) {
      path = `/${path}`;
      repaired = true;
    }
    if (!path.startsWith('/api')) {
      path = `/api${path}`;
      repaired = true;
    }

    items.push({
      method: method as BlueprintApiEndpoint['method'],
      path,
      description: validateString(endpoint.description) ?? `${method} ${path}`,
      relatedModel: validateString(endpoint.relatedModel) ?? '',
    });
  });

  return { items, repaired };
}

function validatePages(raw: unknown, warnings: string[]) {
  let repaired = false;
  if (!Array.isArray(raw)) {
    warnings.push('pages is not an array - defaulting to empty.');
    return { items: [] as BlueprintPage[], repaired: true };
  }

  const items: BlueprintPage[] = [];
  const seenRoutes = new Set<string>();
  raw.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      warnings.push(`pages[${index}] invalid - skipped.`);
      repaired = true;
      return;
    }

    const page = entry as Record<string, unknown>;
    const name = validateString(page.name);
    if (!name) {
      warnings.push(`pages[${index}] missing name - skipped.`);
      repaired = true;
      return;
    }

    const inputRoute = validateString(page.route);
    let route = inputRoute ?? `/${toKebabCase(name)}`;
    if (!inputRoute) {
      warnings.push(`pages[${index}] missing route - generated "${route}".`);
      repaired = true;
    }

    const normalizedRoute = normalizeGeneratedRoute(route);
    if (normalizedRoute !== route) {
      warnings.push(`pages[${index}] route normalized from "${route}" to "${normalizedRoute}".`);
      repaired = true;
    }
    route = normalizedRoute;

    if (seenRoutes.has(route)) {
      warnings.push(`pages[${index}] route "${route}" duplicates another page - skipped.`);
      repaired = true;
      return;
    }
    seenRoutes.add(route);

    const components = Array.isArray(page.components)
      ? page.components.filter((value): value is string => typeof value === 'string' && !!value)
      : [];

    items.push({
      name,
      route,
      description: validateString(page.description) ?? name,
      components: components.length > 0 ? components : [`${toPascalCase(name)}View`],
    });
  });

  if (!items.some((page) => page.route === '/' || page.route === '/home')) {
    items.unshift({
      name: 'Home',
      route: '/',
      description: 'Landing / home page',
      components: ['HomeView'],
    });
    warnings.push('No home page detected - added default Home page.');
    repaired = true;
  }

  return { items, repaired };
}

function validateTechStack(raw: unknown, warnings: string[]): BlueprintTechStack {
  const defaults: BlueprintTechStack = {
    frontend: 'Next.js + Tailwind CSS',
    backend: 'Next.js API Routes',
    database: 'PostgreSQL + Prisma',
    auth: 'none',
  };

  if (!raw || typeof raw !== 'object') {
    warnings.push('techStack missing - using defaults.');
    return defaults;
  }

  const value = raw as Record<string, unknown>;
  return {
    frontend: validateString(value.frontend) ?? defaults.frontend,
    backend: validateString(value.backend) ?? defaults.backend,
    database: validateString(value.database) ?? defaults.database,
    auth: validateString(value.auth) ?? defaults.auth,
  };
}

function normalizeFieldType(type: string) {
  const aliases: Record<string, string> = {
    str: 'string',
    text: 'string',
    varchar: 'string',
    int: 'number',
    integer: 'number',
    float: 'number',
    decimal: 'number',
    double: 'number',
    bool: 'boolean',
    datetime: 'date',
    timestamp: 'date',
    reference: 'relation',
    ref: 'relation',
    foreignkey: 'relation',
    fk: 'relation',
  };
  return aliases[type] ?? type;
}

function toKebabCase(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toLowerCase();
}

function toPascalCase(value: string) {
  return value
    .replace(/[-_\s]+(.)?/g, (_match, character: string | undefined) =>
      character ? character.toUpperCase() : ''
    )
    .replace(/^(.)/, (_match, character: string) => character.toUpperCase());
}

function toCamelCase(value: string) {
  const pascal = toPascalCase(value);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

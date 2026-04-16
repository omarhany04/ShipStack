import {
  Blueprint,
  BlueprintApiEndpoint,
  BlueprintDataModel,
  BlueprintField,
} from '@/validators/blueprint.validator';
import { GeneratedFile } from '../types';
import { dedent, joinBlocks } from '../template-engine';

interface EndpointGroup {
  routePath: string;
  appRouterPath: string;
  model: BlueprintDataModel | null;
  modelName: string;
  modelNameLower: string;
  endpoints: BlueprintApiEndpoint[];
  hasPathParam: boolean;
}

export function generateBackendFiles(blueprint: Blueprint): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const routeGroups = groupEndpointsByRoute(blueprint.apiEndpoints, blueprint);

  for (const group of routeGroups) {
    files.push(group.hasPathParam ? generateDynamicRouteFile(group) : generateCollectionRouteFile(group));
  }

  files.push(generateApiHelpers());
  files.push(generateValidationHelpers(blueprint));
  return files;
}

function groupEndpointsByRoute(endpoints: BlueprintApiEndpoint[], blueprint: Blueprint) {
  const groups = new Map<string, EndpointGroup>();

  for (const endpoint of endpoints) {
    const { basePath, hasParam } = parseEndpointPath(endpoint.path);
    const groupKey = hasParam ? `${basePath}/__dynamic` : basePath;

    if (!groups.has(groupKey)) {
      const model = resolveModel(endpoint.relatedModel, blueprint);
      const modelName = model?.name ?? extractModelFromPath(basePath);
      const modelNameLower = modelName.charAt(0).toLowerCase() + modelName.slice(1);
      const appRouterPath = hasParam
        ? `src/app${basePath}/[id]/route.ts`
        : `src/app${basePath}/route.ts`;

      groups.set(groupKey, {
        routePath: endpoint.path,
        appRouterPath,
        model,
        modelName,
        modelNameLower,
        endpoints: [],
        hasPathParam: hasParam,
      });
    }

    groups.get(groupKey)?.endpoints.push(endpoint);
  }

  return Array.from(groups.values());
}

function parseEndpointPath(path: string) {
  const segments = path.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  const hasParam =
    lastSegment?.startsWith(':') || lastSegment?.startsWith('[') || lastSegment === 'id';

  if (hasParam) {
    return {
      basePath: `/${segments.slice(0, -1).join('/')}`,
      hasParam: true,
    };
  }

  return {
    basePath: `/${segments.join('/')}`,
    hasParam: false,
  };
}

function resolveModel(modelName: string, blueprint: Blueprint) {
  if (!modelName) {
    return null;
  }

  return (
    blueprint.dataModels.find((model) => model.name.toLowerCase() === modelName.toLowerCase()) ?? null
  );
}

function extractModelFromPath(basePath: string) {
  const segments = basePath.split('/').filter(Boolean);
  const resource = segments[segments.length - 1] || 'item';
  const singular = resource.endsWith('s') ? resource.slice(0, -1) : resource;
  return singular.charAt(0).toUpperCase() + singular.slice(1);
}

function generateCollectionRouteFile(group: EndpointGroup): GeneratedFile {
  const methods = group.endpoints.map((endpoint) => endpoint.method.toUpperCase());
  const blocks: string[] = [
    dedent(`
      import { NextRequest } from 'next/server';
      import prisma from '@/lib/prisma';
      import { apiError, apiSuccess, handleApiError } from '@/lib/api-helpers';
      import { getDemoImageUrl } from '@/lib/demo-media';
    `),
  ];

  if (methods.includes('GET')) {
    blocks.push(generateGetListHandler(group.modelName, group.modelNameLower, group.model));
  }
  if (methods.includes('POST')) {
    blocks.push(generatePostHandler(group.modelName, group.modelNameLower, group.model));
  }

  return {
    path: group.appRouterPath,
    content: joinBlocks(...blocks),
    source: 'template',
    description: `Generated API route ${group.routePath}`,
  };
}

function generateGetListHandler(
  modelName: string,
  modelNameLower: string,
  model: BlueprintDataModel | null
) {
  return dedent(`
    export async function GET(request: NextRequest) {
      try {
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10));
        const pageSize = Math.min(100, Math.max(1, Number.parseInt(searchParams.get('pageSize') || '20', 10)));
        const search = searchParams.get('search') || '';
        const skip = (page - 1) * pageSize;

        const where: Record<string, unknown> = {};
    ${generateSearchClause(model)}

        const [items, total] = await Promise.all([
          prisma.${modelNameLower}.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.${modelNameLower}.count({ where }),
        ]);

        return apiSuccess({
          data: items,
          total,
          page,
          pageSize,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        });
      } catch (error) {
        return handleApiError(error, 'Failed to fetch ${modelName} list');
      }
    }
  `);
}

function generatePostHandler(
  modelName: string,
  modelNameLower: string,
  model: BlueprintDataModel | null
) {
  const writableFields =
    model?.fields.filter(
      (field) =>
        !['id', 'createdAt', 'updatedAt'].includes(field.name) && field.type !== 'relation'
    ) ?? [];

  const destructure = writableFields.map((field) => field.name).join(', ');
  const validations = writableFields
    .filter((field) => field.required)
    .map(
      (field) =>
        `    if (${getValidationCheck(field)}) {\n      return apiError('Missing required field: ${field.name}', 400);\n    }`
    )
    .join('\n');
  const demoImageDefaults = buildImageDefaultsObject(writableFields, modelName);
  const destructureLine = destructure ? `        const { ${destructure} } = input;` : '';
  const dataBlock = writableFields.map((field) => `        ${field.name},`).join('\n');

  return dedent(`
    export async function POST(request: NextRequest) {
      try {
        const body = await request.json();
        const input = {
          ...body,
${demoImageDefaults || '          // No demo image defaults'}
        };
${destructureLine}

${validations || '        // No required fields to validate'}

        const item = await prisma.${modelNameLower}.create({
          data: {
 ${dataBlock || '            ...input'}
          },
        });

        return apiSuccess(item, 201);
      } catch (error) {
        return handleApiError(error, 'Failed to create ${modelName}');
      }
    }
  `);
}

function generateDynamicRouteFile(group: EndpointGroup): GeneratedFile {
  const methods = group.endpoints.map((endpoint) => endpoint.method.toUpperCase());
  const blocks: string[] = [
    dedent(`
      import { NextRequest } from 'next/server';
      import prisma from '@/lib/prisma';
      import { apiError, apiSuccess, handleApiError } from '@/lib/api-helpers';
      import { getDemoImageUrl } from '@/lib/demo-media';

      interface RouteParams {
        params: { id: string };
      }
    `),
  ];

  if (methods.includes('GET')) {
    blocks.push(generateGetByIdHandler(group.modelName, group.modelNameLower));
  }
  if (methods.includes('PUT') || methods.includes('PATCH')) {
    blocks.push(generatePutHandler(group.modelName, group.modelNameLower, group.model));
  }
  if (methods.includes('DELETE')) {
    blocks.push(generateDeleteHandler(group.modelName, group.modelNameLower));
  }

  return {
    path: group.appRouterPath,
    content: joinBlocks(...blocks),
    source: 'template',
    description: `Generated dynamic API route ${group.routePath}`,
  };
}

function generateGetByIdHandler(modelName: string, modelNameLower: string) {
  return dedent(`
    export async function GET(_request: NextRequest, { params }: RouteParams) {
      try {
        const item = await prisma.${modelNameLower}.findUnique({
          where: { id: params.id },
        });

        if (!item) {
          return apiError('${modelName} not found', 404);
        }

        return apiSuccess(item);
      } catch (error) {
        return handleApiError(error, 'Failed to fetch ${modelName}');
      }
    }
  `);
}

function generatePutHandler(
  modelName: string,
  modelNameLower: string,
  model: BlueprintDataModel | null
) {
  const writableFields =
    model?.fields.filter(
      (field) =>
        !['id', 'createdAt', 'updatedAt'].includes(field.name) && field.type !== 'relation'
    ) ?? [];
  const demoImageDefaults = buildImageDefaultsObject(writableFields, modelName);

  const dataSpread = writableFields
    .map(
      (field) =>
        `          ...(normalizedBody.${field.name} !== undefined && { ${field.name}: normalizedBody.${field.name} }),`
    )
    .join('\n');

  return dedent(`
    export async function PUT(request: NextRequest, { params }: RouteParams) {
      try {
        const existing = await prisma.${modelNameLower}.findUnique({
          where: { id: params.id },
        });

        if (!existing) {
          return apiError('${modelName} not found', 404);
        }

        const body = await request.json();
        const normalizedBody = {
          ...body,
${demoImageDefaults || '          // No demo image defaults'}
        };
        const item = await prisma.${modelNameLower}.update({
          where: { id: params.id },
          data: {
 ${dataSpread || '            ...normalizedBody'}
          },
        });

        return apiSuccess(item);
      } catch (error) {
        return handleApiError(error, 'Failed to update ${modelName}');
      }
    }
  `);
}

function generateDeleteHandler(modelName: string, modelNameLower: string) {
  return dedent(`
    export async function DELETE(_request: NextRequest, { params }: RouteParams) {
      try {
        const existing = await prisma.${modelNameLower}.findUnique({
          where: { id: params.id },
        });

        if (!existing) {
          return apiError('${modelName} not found', 404);
        }

        await prisma.${modelNameLower}.delete({
          where: { id: params.id },
        });

        return apiSuccess({ message: '${modelName} deleted successfully' });
      } catch (error) {
        return handleApiError(error, 'Failed to delete ${modelName}');
      }
    }
  `);
}

function generateApiHelpers(): GeneratedFile {
  return {
    path: 'src/lib/api-helpers.ts',
    content: dedent(`
      import { NextResponse } from 'next/server';

      export function apiSuccess(data: unknown, status = 200) {
        return NextResponse.json({ success: true, data }, { status });
      }

      export function apiError(message: string, status = 500) {
        return NextResponse.json({ success: false, error: message }, { status });
      }

      export function handleApiError(error: unknown, context: string) {
        console.error(\`[API Error] \${context}:\`, error);

        if (isPrismaError(error)) {
          const prismaError = error as { code: string };
          if (prismaError.code === 'P2002') {
            return apiError('A record with this unique value already exists.', 409);
          }
          if (prismaError.code === 'P2025') {
            return apiError('Record not found.', 404);
          }
          if (prismaError.code === 'P2003') {
            return apiError('Related record not found.', 400);
          }
        }

        if (error instanceof SyntaxError && error.message.includes('JSON')) {
          return apiError('Invalid JSON in request body.', 400);
        }

        return apiError(\`\${context}: \${error instanceof Error ? error.message : 'Unknown error'}\`, 500);
      }

      function isPrismaError(error: unknown): boolean {
        return (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          typeof (error as Record<string, unknown>).code === 'string' &&
          String((error as Record<string, unknown>).code).startsWith('P')
        );
      }
    `),
    source: 'template',
    description: 'Generated API helpers',
  };
}

function generateValidationHelpers(blueprint: Blueprint): GeneratedFile {
  const blocks = blueprint.dataModels.map((model) => {
    const checks = model.fields
      .filter((field) => field.required && !['id', 'createdAt', 'updatedAt'].includes(field.name) && field.type !== 'relation')
      .map((field) => `  if (${getTypeCheck(field)}) errors.push('${field.name} is required.');`)
      .join('\n');

    return dedent(`
      export function validate${model.name}Input(data: Record<string, unknown>) {
        const errors: string[] = [];
      ${checks || '  // No required field checks'}
        return {
          valid: errors.length === 0,
          errors,
        };
      }
    `);
  });

  return {
    path: 'src/lib/validators.ts',
    content: joinBlocks('// Auto-generated validators', ...blocks),
    source: 'template',
    description: 'Generated validation helpers',
  };
}

function generateSearchClause(model: BlueprintDataModel | null) {
  if (!model) {
    return '        // No model metadata available';
  }

  const searchableFields = model.fields.filter(
    (field) =>
      field.type === 'string' &&
      !['id', 'createdAt', 'updatedAt'].includes(field.name) &&
      !field.name.toLowerCase().includes('password')
  );

  if (searchableFields.length === 0) {
    return '        // No searchable string fields';
  }

  const conditions = searchableFields
    .map((field) => `            { ${field.name}: { contains: search, mode: 'insensitive' } },`)
    .join('\n');

  return dedent(`
        if (search) {
          where.OR = [
${conditions}
          ];
        }
  `);
}

function getValidationCheck(field: BlueprintField) {
  switch (field.type) {
    case 'string':
      return `!${field.name} || typeof ${field.name} !== 'string'`;
    case 'number':
      return `${field.name} === undefined || typeof ${field.name} !== 'number'`;
    case 'boolean':
      return `${field.name} === undefined || typeof ${field.name} !== 'boolean'`;
    default:
      return `${field.name} === undefined || ${field.name} === null`;
  }
}

function getTypeCheck(field: BlueprintField) {
  switch (field.type) {
    case 'string':
      return `!data.${field.name} || typeof data.${field.name} !== 'string'`;
    case 'number':
      return `data.${field.name} === undefined || typeof data.${field.name} !== 'number'`;
    case 'boolean':
      return `data.${field.name} === undefined || typeof data.${field.name} !== 'boolean'`;
    default:
      return `data.${field.name} === undefined || data.${field.name} === null`;
  }
}

function buildImageDefaultsObject(fields: BlueprintField[], modelName: string) {
  return fields
    .filter((field) => isImageLikeField(field))
    .map((field) => {
      const seed = buildDemoImageSeed(modelName, field.name);
      const label = buildDemoImageLabel(modelName, field.name);
      return `          ...(typeof body.${field.name} === 'string' && body.${field.name}.trim()\n            ? {}\n            : { ${field.name}: getDemoImageUrl('${seed}', '${label}') }),`;
    })
    .join('\n');
}

function isImageLikeField(field: BlueprintField) {
  const normalizedName = field.name.toLowerCase();
  return (
    field.type === 'string' &&
    (normalizedName.includes('image') ||
      normalizedName.includes('photo') ||
      normalizedName.includes('avatar') ||
      normalizedName.includes('thumbnail') ||
      normalizedName.includes('cover') ||
      normalizedName.includes('banner'))
  );
}

function buildDemoImageSeed(modelName: string, fieldName: string) {
  return `${modelName}-${fieldName}`
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function buildDemoImageLabel(modelName: string, fieldName: string) {
  return `${modelName} ${fieldName}`
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

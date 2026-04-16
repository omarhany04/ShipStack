import {
  Blueprint,
  BlueprintDataModel,
  BlueprintField,
} from '@/validators/blueprint.validator';
import { buildStaticDemoImageUrl, resolveProjectImageContext } from '../demo-media';
import { GeneratedFile } from '../types';
import { dedent, joinBlocks } from '../template-engine';

const BLUEPRINT_TO_PRISMA_TYPE: Record<string, string> = {
  string: 'String',
  number: 'Int',
  boolean: 'Boolean',
  date: 'DateTime',
  relation: '__RELATION__',
};

const FIELD_NAME_TYPE_OVERRIDES: Record<string, string> = {
  id: 'String @id @default(cuid())',
  email: 'String @unique',
  price: 'Float',
  amount: 'Float',
  total: 'Float',
  cost: 'Float',
  rating: 'Float',
  latitude: 'Float',
  longitude: 'Float',
  lat: 'Float',
  lng: 'Float',
  createdAt: 'DateTime @default(now())',
  updatedAt: 'DateTime @updatedAt',
};

export function generateDatabaseFiles(blueprint: Blueprint): GeneratedFile[] {
  return [
    generatePrismaSchema(blueprint),
    generatePrismaClient(),
    generateSeedFile(blueprint),
  ];
}

function generatePrismaSchema(blueprint: Blueprint): GeneratedFile {
  const header = dedent(`
    generator client {
      provider = "prisma-client-js"
    }

    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }
  `);

  const modelNames = new Set(blueprint.dataModels.map((model) => model.name));
  const models = blueprint.dataModels.map((model) => generatePrismaModel(model, modelNames));

  return {
    path: 'prisma/schema.prisma',
    content: joinBlocks(header, ...models),
    source: 'template',
    description: 'Generated Prisma schema',
  };
}

function generatePrismaModel(model: BlueprintDataModel, allModelNames: Set<string>) {
  const lines: string[] = [`model ${model.name} {`];
  const addedRelations = new Set<string>();

  for (const field of model.fields) {
    const prismaLine = generatePrismaField(field, model.name, allModelNames, addedRelations);
    if (!prismaLine) {
      continue;
    }

    prismaLine.split('\n').forEach((line) => {
      lines.push(`  ${line}`);
    });
  }

  lines.push('}');
  return lines.join('\n');
}

function generatePrismaField(
  field: BlueprintField,
  modelName: string,
  allModelNames: Set<string>,
  addedRelations: Set<string>
) {
  const { name, type, required } = field;

  if (FIELD_NAME_TYPE_OVERRIDES[name]) {
    return `${name} ${FIELD_NAME_TYPE_OVERRIDES[name]}`;
  }

  if (type === 'relation' && field.relation) {
    const relatedModel = field.relation;
    if (!allModelNames.has(relatedModel)) {
      return `${name} String${required ? '' : '?'}`;
    }

    const relationKey = `${modelName}-${relatedModel}-${name}`;
    if (addedRelations.has(relationKey)) {
      return null;
    }
    addedRelations.add(relationKey);

    const fkField = `${name} String${required ? '' : '?'}`;
    const relationField = `${stripIdSuffix(name)} ${relatedModel}${required ? '' : '?'} @relation(fields: [${name}], references: [id])`;
    return `${fkField}\n${relationField}`;
  }

  const prismaType = BLUEPRINT_TO_PRISMA_TYPE[type] || 'String';
  return `${name} ${prismaType}${required ? '' : '?'}`;
}

function stripIdSuffix(name: string) {
  if (name.endsWith('Id')) {
    return name.slice(0, -2);
  }
  return `${name}Ref`;
}

function generatePrismaClient(): GeneratedFile {
  return {
    path: 'src/lib/prisma.ts',
    content: dedent(`
      import { PrismaClient } from '@prisma/client';

      const globalForPrisma = globalThis as unknown as {
        prisma: PrismaClient | undefined;
      };

      function createPrismaClient() {
        return new PrismaClient({
          log:
            process.env.NODE_ENV === 'development'
              ? ['query', 'error', 'warn']
              : ['error'],
        });
      }

      function getPrismaClient() {
        if (!globalForPrisma.prisma) {
          globalForPrisma.prisma = createPrismaClient();
        }

        return globalForPrisma.prisma;
      }

      export const prisma = new Proxy({} as PrismaClient, {
        get(_target, property) {
          const client = getPrismaClient();
          const value = Reflect.get(client as object, property, client);

          return typeof value === 'function' ? value.bind(client) : value;
        },
      }) as PrismaClient;

      export default prisma;
    `),
    source: 'template',
    description: 'Generated Prisma client singleton',
  };
}

function generateSeedFile(blueprint: Blueprint): GeneratedFile {
  const imports = `import { PrismaClient } from '@prisma/client';\n\nconst prisma = new PrismaClient();`;
  const projectContext = resolveProjectImageContext(blueprint);
  const seedBlocks = blueprint.dataModels
    .filter((model) => !hasRelations(model))
    .slice(0, 3)
    .map((model) => generateSeedBlock(model, projectContext));

  const mainFn = dedent(`
    async function main() {
      console.log('Seeding database...');

    ${seedBlocks.map((block) => `  ${block}`).join('\n\n')}

      console.log('Seeding complete.');
    }

    main()
      .then(async () => {
        await prisma.$disconnect();
      })
      .catch(async (error) => {
        console.error('Seed error:', error);
        await prisma.$disconnect();
        process.exit(1);
      });
  `);

  return {
    path: 'prisma/seed.ts',
    content: joinBlocks(imports, mainFn),
    source: 'template',
    description: 'Generated seed script',
  };
}

function generateSeedBlock(
  model: BlueprintDataModel,
  projectContext: ReturnType<typeof resolveProjectImageContext>
) {
  const varName = model.name.charAt(0).toLowerCase() + model.name.slice(1);
  const sampleFields = model.fields
    .filter((field) => !['id', 'createdAt', 'updatedAt'].includes(field.name) && field.type !== 'relation')
    .map((field) => `      ${field.name}: ${getSampleValue(field, model.name, projectContext)},`)
    .join('\n');

  return dedent(`
    const ${varName} = await prisma.${varName}.create({
      data: {
    ${sampleFields}
      },
    });
    console.log('Created ${model.name}:', ${varName}.id);
  `);
}

function getSampleValue(
  field: BlueprintField,
  modelName: string,
  projectContext: ReturnType<typeof resolveProjectImageContext>
) {
  const name = field.name.toLowerCase();
  if (name.includes('email')) return "'user@example.com'";
  if (name.includes('name')) return `'Sample ${field.name}'`;
  if (name.includes('title')) return "'Sample Title'";
  if (name.includes('description') || name.includes('desc')) return "'A sample description'";
  if (name.includes('phone')) return "'+1234567890'";
  if (name.includes('url') || name.includes('image') || name.includes('avatar')) {
    return `'${buildDemoImagePath(modelName, field.name, projectContext)}'`;
  }
  if (name.includes('address')) return "'123 Main St'";
  if (name.includes('status')) return "'active'";
  if (name.includes('role')) return "'user'";
  if (name.includes('password')) return "'hashed_password_here'";

  switch (field.type) {
    case 'string':
      return `'Sample ${field.name}'`;
    case 'number':
      return '1';
    case 'boolean':
      return 'true';
    case 'date':
      return 'new Date()';
    default:
      return "'sample'";
  }
}

function hasRelations(model: BlueprintDataModel) {
  return model.fields.some((field) => field.type === 'relation');
}

function buildDemoImagePath(
  modelName: string,
  fieldName: string,
  projectContext: ReturnType<typeof resolveProjectImageContext>
) {
  return buildStaticDemoImageUrl(
    `${projectContext.projectName}-${modelName}-${fieldName}`,
    buildDemoImageLabel(modelName, fieldName),
    projectContext
  );
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

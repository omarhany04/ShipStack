import {
  Blueprint,
  BlueprintDataModel,
  BlueprintField,
} from '@/validators/blueprint.validator';
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

const UNSPLASH_PORTRAIT_URLS = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cG9ydHJhaXR8ZW58MHx8MHx8fDA%3D&ixlib=rb-4.1.0&q=60&w=3000',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cG9ydHJhaXR8ZW58MHx8MHx8fDA%3D&ixlib=rb-4.1.0&q=60&w=3000',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cG9ydHJhaXR8ZW58MHx8MHx8fDA%3D&ixlib=rb-4.1.0&q=60&w=3000',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHBvcnRyYWl0fGVufDB8fDB8fHww&ixlib=rb-4.1.0&q=60&w=3000',
  'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fHBvcnRyYWl0fGVufDB8fDB8fHww&ixlib=rb-4.1.0&q=60&w=3000',
];

const UNSPLASH_LANDSCAPE_URLS = [
  'https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8d29ya3NwYWNlfGVufDB8fDB8fHww&ixlib=rb-4.1.0&q=60&w=3000',
  'https://images.unsplash.com/photo-1568992687947-868a62a9f521?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8d29ya3NwYWNlfGVufDB8fDB8fHww&ixlib=rb-4.1.0&q=60&w=3000',
  'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8d29ya3NwYWNlfGVufDB8fDB8fHww&ixlib=rb-4.1.0&q=60&w=3000',
  'https://images.unsplash.com/photo-1502945015378-0e284ca1a5be?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8d29ya3NwYWNlfGVufDB8fDB8fHww&ixlib=rb-4.1.0&q=60&w=3000',
];

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
  const seedBlocks = blueprint.dataModels
    .filter((model) => !hasRelations(model))
    .slice(0, 3)
    .map((model) => generateSeedBlock(model));

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

function generateSeedBlock(model: BlueprintDataModel) {
  const varName = model.name.charAt(0).toLowerCase() + model.name.slice(1);
  const sampleFields = model.fields
    .filter((field) => !['id', 'createdAt', 'updatedAt'].includes(field.name) && field.type !== 'relation')
    .map((field) => `      ${field.name}: ${getSampleValue(field, model.name)},`)
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

function getSampleValue(field: BlueprintField, modelName: string) {
  const name = field.name.toLowerCase();
  if (name.includes('email')) return "'user@example.com'";
  if (name.includes('name')) return `'Sample ${field.name}'`;
  if (name.includes('title')) return "'Sample Title'";
  if (name.includes('description') || name.includes('desc')) return "'A sample description'";
  if (name.includes('phone')) return "'+1234567890'";
  if (name.includes('url') || name.includes('image') || name.includes('avatar')) {
    return `'${buildDemoImagePath(modelName, field.name)}'`;
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

function buildDemoImagePath(modelName: string, fieldName: string) {
  const seed = `${modelName}-${fieldName}`.toLowerCase();
  const { width, height } = getDemoImageSize(fieldName);
  const baseUrl = selectUnsplashDemoUrl(seed, fieldName);
  return formatUnsplashDemoUrl(baseUrl, width, height);
}

function getDemoImageSize(fieldName: string) {
  const normalized = fieldName.toLowerCase();

  if (/(avatar|profile|author|user|member|team|person|testimonial)/.test(normalized)) {
    return { width: 640, height: 640 };
  }

  if (/(hero|banner|cover|header|background|feature|landing|showcase)/.test(normalized)) {
    return { width: 1600, height: 900 };
  }

  return { width: 1200, height: 900 };
}

function selectUnsplashDemoUrl(seed: string, fieldName: string) {
  const library = /(avatar|profile|author|user|member|team|person|testimonial)/.test(
    fieldName.toLowerCase()
  )
    ? UNSPLASH_PORTRAIT_URLS
    : UNSPLASH_LANDSCAPE_URLS;

  return library[hashString(seed) % library.length];
}

function formatUnsplashDemoUrl(rawUrl: string, width: number, height: number) {
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

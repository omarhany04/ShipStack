import { Blueprint } from '@/validators/blueprint.validator';
import { GeneratedFile } from '../types';
import { dedent } from '../template-engine';

export function generateConfigFiles(blueprint: Blueprint): GeneratedFile[] {
  return [
    generatePackageJson(blueprint),
    generateTsConfig(),
    generateNextConfig(),
    generateTailwindConfig(),
    generatePostCssConfig(),
    generateEnvExample(blueprint),
    generateGitignore(),
    generateEslintConfig(),
  ];
}

function generatePackageJson(blueprint: Blueprint): GeneratedFile {
  const pkg = {
    name: blueprint.projectName,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
      'db:generate': 'prisma generate',
      'db:push': 'prisma db push',
      'db:studio': 'prisma studio',
      'db:seed': 'tsx prisma/seed.ts',
    },
    dependencies: {
      next: '^14.2.30',
      react: '^18.3.1',
      'react-dom': '^18.3.1',
      '@prisma/client': '^5.22.0',
      clsx: '^2.1.1',
    } as Record<string, string>,
    devDependencies: {
      typescript: '^5.8.3',
      '@types/node': '^20.17.46',
      '@types/react': '^18.3.18',
      '@types/react-dom': '^18.3.5',
      prisma: '^5.22.0',
      tailwindcss: '^3.4.17',
      postcss: '^8.5.3',
      autoprefixer: '^10.4.20',
      eslint: '^8.57.1',
      'eslint-config-next': '^14.2.30',
      tsx: '^4.19.3',
    },
  };

  if (blueprint.techStack.auth.toLowerCase().includes('nextauth')) {
    pkg.dependencies['next-auth'] = '^4.24.11';
  }

  return {
    path: 'package.json',
    content: JSON.stringify(pkg, null, 2),
    source: 'template',
    description: 'Generated project package.json',
  };
}

function generateTsConfig(): GeneratedFile {
  return {
    path: 'tsconfig.json',
    content: JSON.stringify(
      {
        compilerOptions: {
          target: 'es2022',
          lib: ['dom', 'dom.iterable', 'es2022'],
          allowJs: false,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: 'esnext',
          moduleResolution: 'bundler',
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: 'preserve',
          incremental: true,
          plugins: [{ name: 'next' }],
          baseUrl: '.',
          paths: {
            '@/*': ['./src/*'],
          },
        },
        include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
        exclude: ['node_modules'],
      },
      null,
      2
    ),
    source: 'template',
    description: 'Generated TypeScript configuration',
  };
}

function generateNextConfig(): GeneratedFile {
  return {
    path: 'next.config.js',
    content: dedent(`
      /** @type {import('next').NextConfig} */
      const nextConfig = {
        reactStrictMode: true,
        images: {
          unoptimized: true,
          remotePatterns: [
            {
              protocol: 'https',
              hostname: 'picsum.photos',
            },
          ],
        },
        experimental: {
          serverComponentsExternalPackages: ['@prisma/client'],
        },
      };

      module.exports = nextConfig;
    `),
    source: 'template',
    description: 'Generated Next.js configuration',
  };
}

function generateTailwindConfig(): GeneratedFile {
  return {
    path: 'tailwind.config.ts',
    content: dedent(`
      import type { Config } from 'tailwindcss';

      const config: Config = {
        content: [
          './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
          './src/components/**/*.{js,ts,jsx,tsx,mdx}',
          './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        ],
        theme: {
          extend: {
            colors: {
              primary: {
                50: '#eff6ff',
                100: '#dbeafe',
                200: '#bfdbfe',
                300: '#93c5fd',
                400: '#60a5fa',
                500: '#3b82f6',
                600: '#2563eb',
                700: '#1d4ed8',
                800: '#1e40af',
                900: '#1e3a8a',
              },
            },
          },
        },
        plugins: [],
      };

      export default config;
    `),
    source: 'template',
    description: 'Generated Tailwind configuration',
  };
}

function generatePostCssConfig(): GeneratedFile {
  return {
    path: 'postcss.config.js',
    content: dedent(`
      module.exports = {
        plugins: {
          tailwindcss: {},
          autoprefixer: {},
        },
      };
    `),
    source: 'template',
    description: 'Generated PostCSS configuration',
  };
}

function generateEnvExample(blueprint: Blueprint): GeneratedFile {
  const lines = [
    '# Database',
    `DATABASE_URL="postgresql://user:password@localhost:5432/${blueprint.projectName}?schema=public"`,
    '',
    '# App',
    `NEXT_PUBLIC_APP_NAME="${blueprint.projectName}"`,
    'NEXT_PUBLIC_APP_URL="http://localhost:3000"',
  ];

  if (blueprint.techStack.auth !== 'none') {
    lines.push(
      '',
      '# Auth',
      'NEXTAUTH_SECRET="your-secret-here"',
      'NEXTAUTH_URL="http://localhost:3000"'
    );
  }

  return {
    path: '.env.example',
    content: lines.join('\n'),
    source: 'template',
    description: 'Generated environment template',
  };
}

function generateGitignore(): GeneratedFile {
  return {
    path: '.gitignore',
    content: dedent(`
      node_modules
      .next
      out
      coverage
      .env
      .env*.local
      *.tsbuildinfo
      prisma/*.db
    `),
    source: 'template',
    description: 'Generated gitignore',
  };
}

function generateEslintConfig(): GeneratedFile {
  return {
    path: '.eslintrc.json',
    content: JSON.stringify(
      {
        extends: 'next/core-web-vitals',
      },
      null,
      2
    ),
    source: 'template',
    description: 'Generated ESLint config',
  };
}

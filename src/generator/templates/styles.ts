import { Blueprint } from '@/validators/blueprint.validator';
import { GeneratedFile } from '../types';
import { dedent } from '../template-engine';

export function generateStyleFiles(_blueprint: Blueprint): GeneratedFile[] {
  return [
    {
      path: 'src/app/globals.css',
      content: dedent(`
        @tailwind base;
        @tailwind components;
        @tailwind utilities;

        @layer base {
          :root {
            --background: 0 0% 100%;
            --foreground: 222.2 84% 4.9%;
            --primary: 221.2 83.2% 53.3%;
            --primary-foreground: 210 40% 98%;
            --border: 214.3 31.8% 91.4%;
          }

          * {
            @apply border-gray-200;
          }

          body {
            @apply bg-white text-gray-900 antialiased;
            font-feature-settings: "rlig" 1, "calt" 1;
          }
        }

        @layer components {
          .btn-primary {
            @apply inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50;
          }

          .btn-secondary {
            @apply inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50;
          }

          .card {
            @apply rounded-lg border border-gray-200 bg-white p-6 shadow-sm;
          }

          .input {
            @apply flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50;
          }

          .page-header {
            @apply mb-8 border-b border-gray-200 pb-4;
          }

          .page-title {
            @apply text-3xl font-bold tracking-tight text-gray-900;
          }

          .page-description {
            @apply mt-2 text-sm text-gray-600;
          }
        }

        @layer utilities {
          .animate-fade-in {
            animation: fadeIn 0.3s ease-in-out;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        }
      `),
      source: 'template',
      description: 'Generated global styles',
    },
  ];
}

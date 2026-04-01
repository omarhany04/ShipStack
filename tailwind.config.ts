import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#101321',
        sand: '#f5efe2',
        ember: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12'
        },
        skyline: {
          50: '#eef7ff',
          100: '#d9edff',
          200: '#bdddff',
          300: '#8ec3ff',
          400: '#5aa5ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a'
        }
      },
      boxShadow: {
        soft: '0 18px 40px rgba(16, 19, 33, 0.08)'
      },
      backgroundImage: {
        mesh:
          'radial-gradient(circle at top left, rgba(249, 115, 22, 0.16), transparent 30%), radial-gradient(circle at top right, rgba(59, 130, 246, 0.14), transparent 28%), linear-gradient(180deg, #fffdf7 0%, #ffffff 100%)'
      }
    }
  },
  plugins: []
};

export default config;

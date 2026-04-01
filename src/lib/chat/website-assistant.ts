import { buildWebsiteAssistantPrompt } from '@/ai/prompts';
import { aiLogger } from '@/ai/logger';
import { aiOrchestrator } from '@/ai/orchestrator';
import { AITask } from '@/ai/types';

const MAX_CONVERSATION_MESSAGES = 12;

const DEFAULT_FOLLOW_UP_SUGGESTIONS = [
  'How does project generation work?',
  'How do I edit a blueprint?',
  'Where are my saved projects?',
] as const;

const DOMAIN_REDIRECT_ANSWER =
  'I can help with ShipStack only, including generation, project editing, previews, saved projects, and project database views.';

const DOMAIN_FALLBACK =
  'I can help with ShipStack generation, follow-up prompting, blueprint editing, previews, project databases, saved projects, and account settings.';

const PROVIDER_FAILURE_FALLBACK =
  'I can still help with ShipStack generation, blueprints, previews, saved projects, and account settings. Try asking about a specific feature.';

const SHIPSTACK_CONTEXT = {
  name: 'ShipStack',
  type: 'AI startup builder',
  stack: 'Next.js, Prisma, PostgreSQL, NextAuth.js, and WebContainers',
  specialty:
    'turning product ideas into generated apps with editable blueprints, live preview, saved workspaces, and project-aware database views',
  capabilities: [
    'Generate a blueprint and a runnable project from a plain-English product idea',
    'Continue prompting after generation to refine the output',
    'Edit features, pages, and database models in the Smart Blueprint Editor',
    'Preview generated apps in desktop and mobile modes',
    'Inspect generated tables and schema in the Project Database side panel',
    'Save projects, reopen workspaces, and download zip exports',
    'Manage account settings, avatar, password, and Google sign-in',
    'Review provider health and usage stats',
  ],
  keyRoutes: [
    { path: '/', purpose: 'Generate projects, refine prompts, inspect previews, and edit blueprints' },
    { path: '/projects', purpose: 'Browse saved projects for the signed-in user' },
    { path: '/projects/[id]', purpose: 'Reopen a saved project workspace with preview and files' },
    { path: '/account', purpose: 'Update profile, avatar, and password settings' },
    { path: '/api/health', purpose: 'Inspect current provider health and cache status' },
    { path: '/api/usage', purpose: 'Inspect provider usage and recent errors' },
  ],
} as const;

const safeArray = <T>(value: unknown): T[] => (Array.isArray(value) ? value : []);

const sanitizeText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const collapseWhitespace = (value: unknown): string =>
  sanitizeText(value).replace(/\s+/g, ' ').trim();

const normalizeForMatch = (value: unknown): string =>
  collapseWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

function normalizeMessages(messages: unknown) {
  return safeArray<{ role?: unknown; text?: unknown }>(messages)
    .slice(-MAX_CONVERSATION_MESSAGES)
    .map((message) => ({
      role: message?.role === 'assistant' ? 'assistant' : 'user',
      text: sanitizeText(message?.text),
    }))
    .filter((message) => message.text) as Array<{ role: 'user' | 'assistant'; text: string }>;
}

function getLastUserMessage(messages: Array<{ role: 'user' | 'assistant'; text: string }>) {
  return [...messages].reverse().find((message) => message.role === 'user' && message.text);
}

function buildSuggestions(...groups: Array<string[] | readonly string[] | string>) {
  return unique(
    groups
      .flat()
      .map((value) => sanitizeText(value))
      .filter(Boolean)
  ).slice(0, 3);
}

function describeCurrentPage(pathname: string) {
  if (pathname === '/projects') {
    return 'The user is viewing the saved-projects library.';
  }

  if (pathname.startsWith('/projects/')) {
    return 'The user is viewing a saved project workspace with preview, files, blueprint details, and the project database panel.';
  }

  if (pathname === '/account') {
    return 'The user is viewing account settings including avatar, profile, and password management.';
  }

  if (pathname === '/') {
    return 'The user is on the main generation workspace with prompting, blueprint editing, preview, and project database tools.';
  }

  return 'The user is browsing the authenticated ShipStack application.';
}

function buildContextSummary(currentPath: string) {
  return JSON.stringify(
    {
      product: SHIPSTACK_CONTEXT,
      currentPage: {
        path: currentPath,
        summary: describeCurrentPage(currentPath),
      },
      supportRules: [
        'Only discuss ShipStack features and workflows.',
        'Keep answers practical and concise.',
        'If a feature is not present in context, say so clearly instead of inventing it.',
      ],
    },
    null,
    2
  );
}

function handleKnownShipStackIntent(input: { prompt: string; currentPath: string }) {
  const normalizedPrompt = normalizeForMatch(input.prompt);

  if (!normalizedPrompt) {
    return null;
  }

  const asksGreeting =
    ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'].includes(
      normalizedPrompt
    ) || normalizedPrompt === 'hi shipstack';

  const asksAboutShipStack =
    normalizedPrompt === 'what is shipstack' ||
    normalizedPrompt.includes('about shipstack') ||
    normalizedPrompt.includes('what does shipstack do');

  const asksGeneration =
    normalizedPrompt.includes('generate') ||
    normalizedPrompt.includes('build project') ||
    normalizedPrompt.includes('how does it work') ||
    normalizedPrompt.includes('how do i start');

  const asksRefinement =
    normalizedPrompt.includes('continue prompting') ||
    normalizedPrompt.includes('modify project') ||
    normalizedPrompt.includes('refine project') ||
    normalizedPrompt.includes('make changes');

  const asksBlueprint =
    normalizedPrompt.includes('blueprint editor') ||
    normalizedPrompt.includes('edit blueprint') ||
    normalizedPrompt.includes('edit features') ||
    normalizedPrompt.includes('edit schema') ||
    normalizedPrompt.includes('smart blueprint');

  const asksDatabase =
    normalizedPrompt.includes('database panel') ||
    normalizedPrompt.includes('project database') ||
    normalizedPrompt.includes('schema prisma') ||
    normalizedPrompt.includes('database tables');

  const asksPreview =
    normalizedPrompt.includes('preview') ||
    normalizedPrompt.includes('mobile preview') ||
    normalizedPrompt.includes('desktop preview');

  const asksSavedProjects =
    normalizedPrompt.includes('saved projects') ||
    normalizedPrompt.includes('my projects') ||
    normalizedPrompt.includes('reopen project') ||
    normalizedPrompt.includes('workspace');

  const asksDownload =
    normalizedPrompt.includes('download') ||
    normalizedPrompt.includes('zip');

  const asksAccount =
    normalizedPrompt.includes('account') ||
    normalizedPrompt.includes('password') ||
    normalizedPrompt.includes('avatar') ||
    normalizedPrompt.includes('photo') ||
    normalizedPrompt.includes('google sign') ||
    normalizedPrompt.includes('login');

  const asksHealth =
    normalizedPrompt.includes('health') ||
    normalizedPrompt.includes('provider') ||
    normalizedPrompt.includes('usage stats') ||
    normalizedPrompt.includes('models');

  const asksCurrentPage =
    normalizedPrompt.includes('this page') ||
    normalizedPrompt.includes('current page') ||
    normalizedPrompt.includes('what can i do here');

  const hasDomainKeyword = [
    'shipstack',
    'project',
    'generate',
    'blueprint',
    'preview',
    'database',
    'schema',
    'workspace',
    'saved',
    'download',
    'account',
    'avatar',
    'password',
    'google',
    'provider',
    'health',
    'usage',
  ].some((keyword) => normalizedPrompt.includes(keyword));

  const isClearlyOutOfScope =
    !hasDomainKeyword &&
    !asksGreeting &&
    (/^(who|what|where|when|why|how)\b/.test(normalizedPrompt) ||
      normalizedPrompt.includes('tell me') ||
      normalizedPrompt.includes('write') ||
      normalizedPrompt.includes('solve'));

  if (asksGreeting) {
    return {
      answer:
        'I can help you use ShipStack to generate projects, refine blueprints, inspect previews, reopen saved workspaces, and manage account settings.',
      outOfScope: false,
      followUpSuggestions: buildSuggestions(
        'How does project generation work?',
        'How do I edit a blueprint?',
        'Where are my saved projects?'
      ),
      provider: 'heuristic',
    };
  }

  if (asksCurrentPage) {
    return {
      answer: describeCurrentPage(input.currentPath),
      outOfScope: false,
      followUpSuggestions:
        input.currentPath === '/'
          ? buildSuggestions(
              'How does project generation work?',
              'How do I open the project database?',
              'How do I continue prompting?'
            )
          : input.currentPath === '/projects'
            ? buildSuggestions(
                'How do I reopen a workspace?',
                'How do saved projects work?',
                'How do I download a project?'
              )
            : input.currentPath === '/account'
              ? buildSuggestions(
                  'How do I change my password?',
                  'How do I update my photo?',
                  'How does Google sign-in work?'
                )
              : buildSuggestions(...DEFAULT_FOLLOW_UP_SUGGESTIONS),
      provider: 'heuristic',
    };
  }

  if (asksAboutShipStack) {
    return {
      answer:
        'ShipStack is an AI startup builder that turns a product idea into a blueprint, generated codebase, live preview, downloadable zip, and saved project workspace.',
      outOfScope: false,
      followUpSuggestions: buildSuggestions(
        'How does project generation work?',
        'How do I edit a blueprint?',
        'How do saved projects work?'
      ),
      provider: 'heuristic',
    };
  }

  if (asksGeneration) {
    return {
      answer:
        'Start from the main page, describe your idea, and ShipStack generates a blueprint, codebase, preview, and downloadable project. The result is also saved to your account so you can reopen it later.',
      outOfScope: false,
      followUpSuggestions: buildSuggestions(
        'How do I continue prompting?',
        'How do I edit a blueprint?',
        'How do I open the preview?'
      ),
      provider: 'heuristic',
    };
  }

  if (asksRefinement) {
    return {
      answer:
        'After the first generation, use Continue Prompting to ask for changes in plain English. ShipStack refines the blueprint and regenerates the project from the updated instructions.',
      outOfScope: false,
      followUpSuggestions: buildSuggestions(
        'How do I edit the blueprint manually?',
        'How do I view project database tables?',
        'How do saved projects work?'
      ),
      provider: 'heuristic',
    };
  }

  if (asksBlueprint) {
    return {
      answer:
        'The Smart Blueprint Editor lets you manually edit features, pages, and database models before regenerating the project. It is useful when you want precise control instead of relying only on prompts.',
      outOfScope: false,
      followUpSuggestions: buildSuggestions(
        'How do I regenerate from the blueprint?',
        'How do I view database tables?',
        'How does the preview update?'
      ),
      provider: 'heuristic',
    };
  }

  if (asksDatabase) {
    return {
      answer:
        'Use the Project Database button to open the right-side panel. It shows generated tables, fields, relations, connected routes, and the raw prisma/schema.prisma file when one exists.',
      outOfScope: false,
      followUpSuggestions: buildSuggestions(
        'Can I inspect schema.prisma?',
        'How do I reopen a saved project workspace?',
        'How do I modify database models?'
      ),
      provider: 'heuristic',
    };
  }

  if (asksPreview) {
    return {
      answer:
        'The preview panel can switch between desktop and mobile modes, refresh the iframe, open the app in a new tab, and show runtime logs alongside the generated site.',
      outOfScope: false,
      followUpSuggestions: buildSuggestions(
        'How do I open mobile preview?',
        'How do I inspect files?',
        'How do I download the project?'
      ),
      provider: 'heuristic',
    };
  }

  if (asksSavedProjects) {
    return {
      answer:
        'Open My Projects from the user menu to browse your saved generations. From there you can reopen a workspace with preview, files, blueprint details, and the project database panel.',
      outOfScope: false,
      followUpSuggestions: buildSuggestions(
        'How do I reopen a workspace?',
        'How do I download a saved project?',
        'How do I inspect its database?'
      ),
      provider: 'heuristic',
    };
  }

  if (asksDownload) {
    return {
      answer:
        'Use the Download button in a live generation or saved workspace to export the generated app as a zip file.',
      outOfScope: false,
      followUpSuggestions: buildSuggestions(
        'How do saved projects work?',
        'How do I view the preview?',
        'How do I inspect project files?'
      ),
      provider: 'heuristic',
    };
  }

  if (asksAccount) {
    return {
      answer:
        'ShipStack account settings let you update your profile, upload a rounded avatar, change your password, and sign in with Google if it is configured.',
      outOfScope: false,
      followUpSuggestions: buildSuggestions(
        'How do I change my password?',
        'How do I update my photo?',
        'Where are my saved projects?'
      ),
      provider: 'heuristic',
    };
  }

  if (asksHealth) {
    return {
      answer:
        'ShipStack routes requests across Gemini, OpenRouter, and Groq with health tracking, cooldowns, caching, and usage stats so generation can fall back when a provider fails.',
      outOfScope: false,
      followUpSuggestions: buildSuggestions(
        'Which models are used?',
        'How do usage stats work?',
        'How does fallback work?'
      ),
      provider: 'heuristic',
    };
  }

  if (isClearlyOutOfScope) {
    return {
      answer: DOMAIN_REDIRECT_ANSWER,
      outOfScope: true,
      followUpSuggestions: [...DEFAULT_FOLLOW_UP_SUGGESTIONS],
      provider: 'heuristic',
    };
  }

  return null;
}

function coerceResponseShape(parsed: unknown, provider: string) {
  const data =
    parsed && typeof parsed === 'object'
      ? (parsed as {
          answer?: unknown;
          out_of_scope?: unknown;
          follow_up_suggestions?: unknown;
        })
      : {};

  const suggestions = safeArray<string>(data.follow_up_suggestions)
    .map((entry) => sanitizeText(entry))
    .filter(Boolean)
    .slice(0, 3);

  return {
    answer: sanitizeText(data.answer) || DOMAIN_FALLBACK,
    outOfScope: Boolean(data.out_of_scope),
    followUpSuggestions: suggestions.length ? suggestions : [...DEFAULT_FOLLOW_UP_SUGGESTIONS],
    provider,
  };
}

export interface WebsiteAssistantRequest {
  messages?: Array<{ role?: string; text?: string }>;
  currentPath?: string;
}

export async function handleWebsiteAssistantRequest({
  messages,
  currentPath,
}: WebsiteAssistantRequest) {
  const normalizedMessages = normalizeMessages(messages);
  const latestPrompt = getLastUserMessage(normalizedMessages)?.text ?? '';
  const safePath = sanitizeText(currentPath) || '/';

  const knownIntentResponse = handleKnownShipStackIntent({
    prompt: latestPrompt,
    currentPath: safePath,
  });

  if (knownIntentResponse) {
    return knownIntentResponse;
  }

  const { systemPrompt, prompt } = buildWebsiteAssistantPrompt({
    currentPath: safePath,
    contextSummary: buildContextSummary(safePath),
    messages: normalizedMessages,
  });

  try {
    const response = await aiOrchestrator.execute({
      task: AITask.CHAT_ASSISTANT,
      prompt,
      systemPrompt,
      temperature: 0.35,
      maxTokens: 500,
      expectJson: true,
      context: {
        currentPath: safePath,
        conversationMessages: normalizedMessages.length,
      },
    });

    return coerceResponseShape(response.parsed, response.provider);
  } catch (error) {
    aiLogger.warn('Website assistant providers failed', undefined, AITask.CHAT_ASSISTANT, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      answer: PROVIDER_FAILURE_FALLBACK,
      outOfScope: false,
      followUpSuggestions: [...DEFAULT_FOLLOW_UP_SUGGESTIONS],
      provider: 'fallback',
    };
  }
}

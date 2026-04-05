import { aiLogger } from '@/ai/logger';
import { aiOrchestrator } from '@/ai/orchestrator';
import { buildCodeGenerationPrompt, buildCodeImprovementPrompt } from '@/ai/prompts';
import { AIOrchestrationError, AITask } from '@/ai/types';
import { Blueprint } from '@/validators/blueprint.validator';
import { DesignProfile, summarizeDesignProfile } from './design-system';
import { GeneratedFile } from './types';

interface EnhancementTask {
  description: string;
  targetPath: string;
  prompt: string;
}

const MAX_ENHANCE_FAILURES = 2;

export async function enhanceWithAI(
  files: GeneratedFile[],
  blueprint: Blueprint,
  designProfile: DesignProfile
) {
  const warnings: string[] = [];
  const enhanced = [...files];
  const aiGenerated: GeneratedFile[] = [];
  const tasks = buildEnhancementTasks(blueprint, designProfile);
  let failureCount = 0;

  for (const task of tasks) {
    if (failureCount >= MAX_ENHANCE_FAILURES) {
      warnings.push(`Skipping remaining AI enhancements after ${MAX_ENHANCE_FAILURES} failures.`);
      break;
    }

    try {
      const content = await generateAIFile(task, blueprint);
      if (!content) {
        continue;
      }

      const existingIndex = enhanced.findIndex((file) => file.path === task.targetPath);
      if (existingIndex >= 0) {
        enhanced[existingIndex] = {
          ...enhanced[existingIndex],
          content,
          source: 'hybrid',
        };
      } else {
        const file: GeneratedFile = {
          path: task.targetPath,
          content,
          source: 'ai',
          description: task.description,
        };
        enhanced.push(file);
        aiGenerated.push(file);
      }
    } catch (error) {
      failureCount += 1;
      warnings.push(
        `AI enhancement failed for ${task.targetPath}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  return {
    enhanced,
    aiGenerated,
    warnings,
  };
}

function buildEnhancementTasks(blueprint: Blueprint, designProfile: DesignProfile): EnhancementTask[] {
  const tasks: EnhancementTask[] = [
    {
      description: 'Project README with setup instructions',
      targetPath: 'README.md',
      prompt: buildReadmePrompt(blueprint, designProfile),
    },
    {
      description: 'Distinctive landing page with strong product positioning',
      targetPath: 'src/app/page.tsx',
      prompt: buildLandingPagePrompt(blueprint, designProfile),
    },
  ];

  if (blueprint.dataModels.length >= 3) {
    tasks.push({
      description: 'Dashboard component with statistics cards',
      targetPath: 'src/components/Dashboard.tsx',
      prompt: buildDashboardPrompt(blueprint, designProfile),
    });
  }

  return tasks;
}

async function generateAIFile(task: EnhancementTask, blueprint: Blueprint) {
  try {
    const { systemPrompt, prompt } = buildCodeGenerationPrompt(
      task.description,
      blueprint as unknown as Record<string, unknown>,
      task.prompt
    );

    const response = await aiOrchestrator.execute({
      task: AITask.CODE_GENERATION,
      prompt,
      systemPrompt,
      temperature: 0.6,
      maxTokens: 4096,
      expectJson: false,
    });

    if (!response.raw || response.raw.trim().length < 50) {
      return null;
    }

    return response.raw;
  } catch (error) {
    if (error instanceof AIOrchestrationError) {
      aiLogger.warn(`All providers failed for enhancement: ${task.targetPath}`);
    }
    throw error;
  }
}

function buildReadmePrompt(blueprint: Blueprint, designProfile: DesignProfile) {
  return `Generate a concise and professional README.md for "${blueprint.projectName}".

Description: ${blueprint.description}
Features: ${blueprint.features.map((feature) => feature.name).join(', ')}
Models: ${blueprint.dataModels.map((model) => model.name).join(', ')}
Design direction: ${summarizeDesignProfile(designProfile)}

Include:
- Title and summary
- Tech stack
- Setup steps
- Useful scripts
- Project structure overview
- API endpoint overview
- MIT license note`;
}

function buildLandingPagePrompt(blueprint: Blueprint, designProfile: DesignProfile) {
  return `Generate a production-ready src/app/page.tsx for a Next.js App Router project.

Project: ${blueprint.projectName}
Description: ${blueprint.description}
Top features: ${blueprint.features.slice(0, 6).map((feature) => feature.name).join(', ')}
Pages: ${blueprint.pages.map((page) => `${page.name} (${page.route})`).join(', ')}
Design direction: ${summarizeDesignProfile(designProfile)}
Layout family: ${designProfile.homeVariant}

  Requirements:
  - Make it feel modern, premium, and product-specific rather than generic
  - Include a strong hero, quick navigation/actions, product highlights, and operational credibility sections
  - Use a layout composition that feels distinct for this design direction instead of a safe default hero + three cards pattern
  - Vary the information architecture, spacing, and section rhythm so different runs can look meaningfully different
  - Use Tailwind CSS only
  - Use only built-in Next.js or React imports plus local modules that are guaranteed to exist in the generated app
  - If you use local UI imports, limit them to '@/components/ui/button', '@/components/ui/card', '@/components/ui/badge', '@/components/ui/input', '@/components/ui/textarea', '@/components/ui/label', '@/components/ui/separator', '@/components/ui/sparkles-core', and '@/lib/utils'
  - For any hero image, avatar, product card, testimonial, gallery, or illustration slot, use stable demo image URLs from /api/demo-image?seed=...&label=... or import getDemoImageUrl from '@/lib/demo-media'
  - Never reference missing local image files or leave src/image props empty
  - Do not import Aceternity UI, shadcn/ui modules outside that list, icon packages, animation libraries, or any package that is not already part of a default generated project
  - Prefer inline SVG, text treatments, and Tailwind styling instead of external icon or animation dependencies
  - Keep it fully responsive
  - Use real sections and working links to the generated routes
  - Return ONLY the complete file code.`;
}

function buildDashboardPrompt(blueprint: Blueprint, designProfile: DesignProfile) {
  return `Generate a responsive Next.js client component named Dashboard.

  It should:
  - Render a welcome header
  - Fetch collection counts for these models: ${blueprint.dataModels
    .map((model) => model.name)
    .join(', ')}
  - Display each count in a stats card with a "View all" link
  - Use Tailwind CSS
  - Include loading and error states
  - Match this design direction: ${summarizeDesignProfile(designProfile)}
  - Use only built-in Next.js or React imports plus local modules that are guaranteed to exist in the generated app
  - If you use local UI imports, limit them to '@/components/ui/button', '@/components/ui/card', '@/components/ui/badge', '@/lib/demo-media', and '@/lib/utils'
  - If the dashboard includes avatars, covers, or any image fields, populate them with /api/demo-image URLs or getDemoImageUrl
  - Do not import icon packs, chart libraries, animation libraries, or any package that is not already included in the generated project

  Return ONLY the component code.`;
}

export async function improveCode(code: string, instructions: string) {
  try {
    const { systemPrompt, prompt } = buildCodeImprovementPrompt(code, instructions);
    const response = await aiOrchestrator.execute({
      task: AITask.CODE_IMPROVEMENT,
      prompt,
      systemPrompt,
      temperature: 0.4,
      maxTokens: 4096,
      expectJson: false,
    });

    return response.raw || null;
  } catch {
    return null;
  }
}

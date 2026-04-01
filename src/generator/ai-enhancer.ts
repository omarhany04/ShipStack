import { aiLogger } from '@/ai/logger';
import { aiOrchestrator } from '@/ai/orchestrator';
import { buildCodeGenerationPrompt, buildCodeImprovementPrompt } from '@/ai/prompts';
import { AIOrchestrationError, AITask } from '@/ai/types';
import { Blueprint } from '@/validators/blueprint.validator';
import { GeneratedFile } from './types';

interface EnhancementTask {
  description: string;
  targetPath: string;
  prompt: string;
}

const MAX_ENHANCE_FAILURES = 2;

export async function enhanceWithAI(files: GeneratedFile[], blueprint: Blueprint) {
  const warnings: string[] = [];
  const enhanced = [...files];
  const aiGenerated: GeneratedFile[] = [];
  const tasks = buildEnhancementTasks(blueprint);
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

function buildEnhancementTasks(blueprint: Blueprint): EnhancementTask[] {
  const tasks: EnhancementTask[] = [
    {
      description: 'Project README with setup instructions',
      targetPath: 'README.md',
      prompt: buildReadmePrompt(blueprint),
    },
  ];

  if (blueprint.dataModels.length >= 3) {
    tasks.push({
      description: 'Dashboard component with statistics cards',
      targetPath: 'src/components/Dashboard.tsx',
      prompt: buildDashboardPrompt(blueprint),
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

function buildReadmePrompt(blueprint: Blueprint) {
  return `Generate a concise and professional README.md for "${blueprint.projectName}".

Description: ${blueprint.description}
Features: ${blueprint.features.map((feature) => feature.name).join(', ')}
Models: ${blueprint.dataModels.map((model) => model.name).join(', ')}

Include:
- Title and summary
- Tech stack
- Setup steps
- Useful scripts
- Project structure overview
- API endpoint overview
- MIT license note`;
}

function buildDashboardPrompt(blueprint: Blueprint) {
  return `Generate a responsive Next.js client component named Dashboard.

It should:
- Render a welcome header
- Fetch collection counts for these models: ${blueprint.dataModels
    .map((model) => model.name)
    .join(', ')}
- Display each count in a stats card with a "View all" link
- Use Tailwind CSS
- Include loading and error states

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

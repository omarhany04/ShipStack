import { aiLogger } from '@/ai/logger';
import { aiOrchestrator } from '@/ai/orchestrator';
import { buildBlueprintPrompt } from '@/ai/prompts';
import { AIOrchestrationError, AITask } from '@/ai/types';
import { validateBlueprint, Blueprint, BlueprintValidationResult } from '@/validators/blueprint.validator';
import { validateUserInput } from '@/validators/input.validator';

export interface BlueprintGenerationSuccess {
  success: true;
  blueprint: Blueprint;
  validation: BlueprintValidationResult;
  metadata: {
    userInput: string;
    sanitizedInput: string;
    generationAttempts: number;
    totalLatencyMs: number;
    provider: string;
  };
}

export interface BlueprintGenerationFailure {
  success: false;
  error: string;
  details?: string[];
  stage: 'input_validation' | 'ai_generation' | 'blueprint_validation' | 'unknown';
}

export type BlueprintGenerationResult =
  | BlueprintGenerationSuccess
  | BlueprintGenerationFailure;

const MAX_GENERATION_ATTEMPTS = 3;

export async function generateBlueprint(rawInput: unknown): Promise<BlueprintGenerationResult> {
  const startedAt = Date.now();
  const inputValidation = validateUserInput(rawInput);

  if (!inputValidation.isValid) {
    aiLogger.warn('User input validation failed', undefined, undefined, {
      errors: inputValidation.errors,
    });
    return {
      success: false,
      error: 'Invalid input.',
      details: inputValidation.errors,
      stage: 'input_validation',
    };
  }

  const sanitizedInput = inputValidation.sanitized;
  let lastValidation: BlueprintValidationResult | null = null;
  let lastProvider = '';

  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt += 1) {
    aiLogger.info(
      `Blueprint generation attempt ${attempt}/${MAX_GENERATION_ATTEMPTS}`,
      undefined,
      AITask.BLUEPRINT_GENERATION
    );

    try {
      const { prompt, systemPrompt } = buildBlueprintGenerationPrompt(
        sanitizedInput,
        attempt,
        lastValidation
      );

      const aiResponse = await aiOrchestrator.execute({
        task: AITask.BLUEPRINT_GENERATION,
        prompt,
        systemPrompt,
        temperature: attempt === 1 ? 0.7 : 0.45,
        maxTokens: 8192,
        expectJson: true,
      });

      lastProvider = aiResponse.provider;
      const validation = validateBlueprint(aiResponse.parsed);
      lastValidation = validation;

      if (validation.isValid && validation.blueprint) {
        return {
          success: true,
          blueprint: validation.blueprint,
          validation,
          metadata: {
            userInput: typeof rawInput === 'string' ? rawInput : '',
            sanitizedInput,
            generationAttempts: attempt,
            totalLatencyMs: Date.now() - startedAt,
            provider: aiResponse.provider,
          },
        };
      }
    } catch (error) {
      if (error instanceof AIOrchestrationError && attempt === MAX_GENERATION_ATTEMPTS) {
        return {
          success: false,
          error: 'All AI providers failed to generate a blueprint.',
          details: [error.message],
          stage: 'ai_generation',
        };
      }

      if (!(error instanceof AIOrchestrationError) && attempt === MAX_GENERATION_ATTEMPTS) {
        return {
          success: false,
          error: 'Blueprint generation failed unexpectedly.',
          details: [error instanceof Error ? error.message : 'Unknown error'],
          stage: 'unknown',
        };
      }
    }
  }

  return {
    success: false,
    error: 'Failed to generate a valid blueprint after multiple attempts.',
    details: lastValidation?.errors ?? ['Unknown validation error.'],
    stage: 'blueprint_validation',
  };
}

function buildBlueprintGenerationPrompt(
  userIdea: string,
  attempt: number,
  previousValidation: BlueprintValidationResult | null
) {
  const base = buildBlueprintPrompt(userIdea);
  if (attempt === 1 || !previousValidation) {
    return base;
  }

  const retryAddendum = `

IMPORTANT: A previous generation attempt failed validation. Fix the following issues:

ERRORS:
- ${previousValidation.errors.join('\n- ')}

${
  previousValidation.warnings.length > 0
    ? `WARNINGS:\n- ${previousValidation.warnings.join('\n- ')}\n`
    : ''
}
Ensure the output is ONLY valid JSON matching the exact schema.`;

  return {
    systemPrompt: base.systemPrompt,
    prompt: base.prompt + retryAddendum,
  };
}

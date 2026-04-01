import { AITask } from './types';

const SYSTEM_PROMPTS: Record<AITask, string> = {
  [AITask.BLUEPRINT_GENERATION]: `You are a senior software architect. Convert a startup idea into a precise JSON blueprint.

Return ONLY valid JSON. No markdown, no explanation, no code fences.

Use this exact schema:
{
  "projectName": "string (kebab-case)",
  "description": "string",
  "features": [
    {
      "name": "string",
      "description": "string",
      "priority": "core" | "important" | "nice-to-have"
    }
  ],
  "dataModels": [
    {
      "name": "string (PascalCase)",
      "fields": [
        {
          "name": "string (camelCase)",
          "type": "string" | "number" | "boolean" | "date" | "relation",
          "required": true | false,
          "relation": "ModelName?"
        }
      ]
    }
  ],
  "apiEndpoints": [
    {
      "method": "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
      "path": "string",
      "description": "string",
      "relatedModel": "string"
    }
  ],
  "pages": [
    {
      "name": "string",
      "route": "string",
      "description": "string",
      "components": ["string"]
    }
  ],
  "techStack": {
    "frontend": "Next.js + Tailwind CSS",
    "backend": "Next.js API Routes",
    "database": "PostgreSQL + Prisma",
    "auth": "NextAuth.js" | "none"
  }
}

Focus on MVP scope. Generate 3-6 models, 8-15 endpoints, and 4-8 pages.`,
  [AITask.CODE_GENERATION]: `You are a senior full-stack developer. Generate clean, production-ready TypeScript code.

Rules:
- Use strict TypeScript
- Follow Next.js App Router conventions
- Use Tailwind CSS for styling
- Return complete runnable code
- Include imports and error handling
- Return ONLY code, with no markdown fences or explanation.`,
  [AITask.CODE_IMPROVEMENT]: `You are a senior code reviewer. Improve the provided code.

Rules:
- Fix bugs and syntax issues
- Improve types and error handling
- Keep the original intent
- Return ONLY code, with no markdown fences or explanation.`,
  [AITask.CODE_FIX]: `You are a debugging expert. Fix the supplied code while preserving behavior.

Return ONLY the corrected code. No markdown fences or explanation.`,
};

export function buildBlueprintPrompt(userIdea: string) {
  return {
    systemPrompt: SYSTEM_PROMPTS[AITask.BLUEPRINT_GENERATION],
    prompt: `Convert this startup idea into a detailed JSON blueprint:\n\n"${userIdea}"\n\nReturn ONLY the JSON object.`,
  };
}

export function buildBlueprintRefinementPrompt(
  currentBlueprint: unknown,
  instructions: string
) {
  return {
    systemPrompt: SYSTEM_PROMPTS[AITask.BLUEPRINT_GENERATION],
    prompt: `You are refining an existing application blueprint.

CURRENT BLUEPRINT:
${JSON.stringify(currentBlueprint, null, 2)}

REQUESTED MODIFICATIONS:
${instructions}

Return a complete updated blueprint JSON object.

Rules:
- Keep the existing blueprint structure unless the request explicitly changes it
- Preserve useful details that are still compatible
- Update features, pages, models, endpoints, and tech stack where needed
- Return ONLY valid JSON`,
  };
}

export function buildCodeGenerationPrompt(
  fileDescription: string,
  blueprint: Record<string, unknown>,
  context?: string
) {
  return {
    systemPrompt: SYSTEM_PROMPTS[AITask.CODE_GENERATION],
    prompt: `Generate the following file based on the application blueprint.

FILE TO GENERATE:
${fileDescription}

APPLICATION BLUEPRINT:
${JSON.stringify(blueprint, null, 2)}

${context ? `ADDITIONAL CONTEXT:\n${context}\n` : ''}
Return ONLY the complete file content.`,
  };
}

export function buildCodeImprovementPrompt(code: string, instructions?: string) {
  return {
    systemPrompt: SYSTEM_PROMPTS[AITask.CODE_IMPROVEMENT],
    prompt: `Improve this code:

\`\`\`typescript
${code}
\`\`\`

${instructions ? `SPECIFIC INSTRUCTIONS:\n${instructions}` : 'Apply general improvements.'}

Return ONLY the improved code.`,
  };
}

export function buildCodeFixPrompt(code: string, error: string) {
  return {
    systemPrompt: SYSTEM_PROMPTS[AITask.CODE_FIX],
    prompt: `Fix the following code.

ERROR:
${error}

CODE:
\`\`\`typescript
${code}
\`\`\`

Return ONLY the fixed code.`,
  };
}

export function getSystemPrompt(task: AITask) {
  return SYSTEM_PROMPTS[task];
}

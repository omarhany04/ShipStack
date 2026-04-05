export interface InputValidationResult {
  isValid: boolean;
  sanitized: string;
  errors: string[];
}

const INPUT_CONSTRAINTS = {
  minLength: 10,
  maxLength: 4000,
  minWords: 3,
  maxWords: 650,
} as const;

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(all\s+)?above/i,
  /disregard\s+(all\s+)?previous/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /system\s*:\s*/i,
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /<<SYS>>/i,
  /\beval\s*\(/i,
  /\bexec\s*\(/i,
  /\bimport\s*\(/i,
  /\brequire\s*\(/i,
  /__proto__/i,
  /constructor\s*\[/i,
];

const SIGNAL_WORDS = [
  'app',
  'application',
  'platform',
  'system',
  'tool',
  'website',
  'site',
  'service',
  'dashboard',
  'portal',
  'marketplace',
  'store',
  'shop',
  'tracker',
  'manager',
  'builder',
  'generator',
  'social',
  'network',
  'delivery',
  'booking',
  'scheduling',
  'ecommerce',
  'e-commerce',
  'blog',
  'forum',
  'chat',
  'messaging',
  'crm',
  'erp',
  'saas',
  'want',
  'build',
  'create',
  'make',
  'need',
  'like',
];

export function validateUserInput(raw: unknown): InputValidationResult {
  const errors: string[] = [];

  if (typeof raw !== 'string') {
    return {
      isValid: false,
      sanitized: '',
      errors: ['Input must be a string.'],
    };
  }

  let sanitized = raw
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/<[^>]*>/g, '');

  if (sanitized.length < INPUT_CONSTRAINTS.minLength) {
    errors.push(
      `Input too short. Minimum ${INPUT_CONSTRAINTS.minLength} characters. Please describe your app idea in more detail.`
    );
  }

  if (sanitized.length > INPUT_CONSTRAINTS.maxLength) {
    errors.push(
      `Input too long. Maximum ${INPUT_CONSTRAINTS.maxLength} characters. Please be more concise.`
    );
    sanitized = sanitized.slice(0, INPUT_CONSTRAINTS.maxLength);
  }

  const wordCount = sanitized.split(/\s+/).filter(Boolean).length;
  if (wordCount < INPUT_CONSTRAINTS.minWords) {
    errors.push(
      `Input too brief. Please use at least ${INPUT_CONSTRAINTS.minWords} words to describe your application idea.`
    );
  }

  if (wordCount > INPUT_CONSTRAINTS.maxWords) {
    errors.push(`Input exceeds ${INPUT_CONSTRAINTS.maxWords} words. Please shorten it.`);
  }

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      errors.push('Input contains disallowed patterns.');
      break;
    }
  }

  if (errors.length === 0) {
    const lower = sanitized.toLowerCase();
    const hasSignalWord = SIGNAL_WORDS.some((word) => lower.includes(word));
    if (!hasSignalWord) {
      errors.push(
        'Input does not appear to describe an application. Please describe the app, platform, or tool you want to build.'
      );
    }
  }

  return {
    isValid: errors.length === 0,
    sanitized,
    errors,
  };
}

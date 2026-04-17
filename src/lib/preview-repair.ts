import { Blueprint } from '@/validators/blueprint.validator';

export interface PreviewRepairFile {
  path: string;
  content: string;
  source: 'template' | 'ai' | 'hybrid';
}

interface PreviewRepairResponse {
  success: boolean;
  repaired?: boolean;
  repairedPaths?: string[];
  warnings?: string[];
  files?: PreviewRepairFile[];
  error?: string;
}

interface RequestPreviewRepairOptions {
  aggressive?: boolean;
}

export async function requestPreviewRepair(
  files: PreviewRepairFile[],
  blueprint: Blueprint,
  logs: string[],
  error: string,
  options: RequestPreviewRepairOptions = {}
) {
  const response = await fetch('/api/preview-repair', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files,
      blueprint,
      logs: logs.slice(-160),
      error,
      aggressive: options.aggressive === true,
    }),
  });

  const payload = (await response.json().catch(() => null)) as PreviewRepairResponse | null;
  if (!response.ok || !payload?.success) {
    return null;
  }

  if (!payload.repaired || !Array.isArray(payload.files) || payload.files.length === 0) {
    return null;
  }

  return {
    files: payload.files,
    repairedPaths: payload.repairedPaths ?? [],
    warnings: payload.warnings ?? [],
  };
}

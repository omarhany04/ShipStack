'use client';

import { startTransition, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { buildDisplayTree, buildFileSystemTree, prepareGeneratedFiles, TreeNode } from '@/builder/file-writer';
import { Blueprint } from '@/validators/blueprint.validator';

export type PipelineStage =
  | 'idle'
  | 'validating'
  | 'generating_blueprint'
  | 'generating_code'
  | 'building'
  | 'preview_booting'
  | 'preview_installing'
  | 'preview_starting'
  | 'ready'
  | 'error';

interface ProjectStats {
  totalFiles: number;
  templateGenerated: number;
  aiGenerated: number;
  totalSizeBytes: number;
  totalLatencyMs: number;
}

interface ProjectFile {
  path: string;
  content: string;
  source: string;
}

interface GenerateApiResponse {
  success: boolean;
  projectId: string | null;
  blueprint: Blueprint;
  project: {
    files: ProjectFile[];
    stats: ProjectStats;
    warnings: string[];
    errors: string[];
  };
  metadata: {
    provider?: string;
    generation: ProjectStats;
  };
  error?: string;
  details?: string[];
}

export interface GeneratedProject {
  projectId: string | null;
  blueprint: Blueprint;
  files: ProjectFile[];
  displayTree: TreeNode | null;
  stats: ProjectStats | null;
  warnings: string[];
}

export interface PipelineState {
  stage: PipelineStage;
  progress: number;
  message: string;
  error: string | null;
  project: GeneratedProject | null;
  previewUrl: string | null;
  logs: string[];
}

const STAGE_PROGRESS: Record<PipelineStage, number> = {
  idle: 0,
  validating: 5,
  generating_blueprint: 15,
  generating_code: 50,
  building: 70,
  preview_booting: 78,
  preview_installing: 88,
  preview_starting: 95,
  ready: 100,
  error: 0,
};

const STAGE_MESSAGES: Record<PipelineStage, string> = {
  idle: 'Describe your app idea to begin',
  validating: 'Validating your input...',
  generating_blueprint: 'Designing a structured blueprint...',
  generating_code: 'Generating the application files...',
  building: 'Assembling the project...',
  preview_booting: 'Booting the preview sandbox...',
  preview_installing: 'Installing dependencies...',
  preview_starting: 'Starting the preview server...',
  ready: 'Your app is ready',
  error: 'Something went wrong',
};

interface RunOptions {
  preserveExistingProject?: boolean;
  introLog: string;
  startsWithBlueprint?: boolean;
}

export function useProjectGenerator() {
  const [state, setState] = useState<PipelineState>({
    stage: 'idle',
    progress: 0,
    message: STAGE_MESSAGES.idle,
    error: null,
    project: null,
    previewUrl: null,
    logs: [],
  });

  const teardownRef = useRef<(() => Promise<void>) | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  function setStage(stage: PipelineStage, message?: string) {
    setState((current) => ({
      ...current,
      stage,
      progress: STAGE_PROGRESS[stage],
      message: message ?? STAGE_MESSAGES[stage],
      error: stage === 'error' ? current.error : null,
    }));
  }

  function addLog(message: string) {
    setState((current) => ({
      ...current,
      logs: [...current.logs.slice(-199), message],
    }));
  }

  function setError(message: string) {
    setState((current) => ({
      ...current,
      stage: 'error',
      progress: 0,
      message: 'Generation failed',
      error: message,
    }));
  }

  async function prepareRun(preserveExistingProject = false) {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    if (teardownRef.current) {
      await teardownRef.current();
      teardownRef.current = null;
    }

    setState((current) => ({
      stage: 'validating',
      progress: STAGE_PROGRESS.validating,
      message: STAGE_MESSAGES.validating,
      error: null,
      project: preserveExistingProject ? current.project : null,
      previewUrl: preserveExistingProject ? current.previewUrl : null,
      logs: [],
    }));
  }

  async function runGeneration(
    payload: Record<string, unknown>,
    options: RunOptions
  ) {
    await prepareRun(options.preserveExistingProject);

    try {
      if (options.startsWithBlueprint) {
        setStage('validating', 'Validating your edited blueprint...');
      } else {
        setStage('generating_blueprint');
      }

      addLog(options.introLog);

      const controller = abortRef.current;
      if (!controller) {
        throw new Error('Generation request controller was not initialized.');
      }

      const response = await fetch('/api/generate?mode=full&persist=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enableAI: true,
          ...payload,
        }),
        signal: controller.signal,
      });

      const data = (await response.json().catch(() => null)) as GenerateApiResponse | null;
      if (!response.ok || !data?.success) {
        const errorSummary = data?.error || `Request failed with status ${response.status}`;
        const detailLines = data?.details?.filter(Boolean) ?? [];
        const message =
          detailLines.length > 0
            ? `${errorSummary}\n${detailLines.map((detail) => `- ${detail}`).join('\n')}`
            : errorSummary;
        throw new Error(message);
      }

      setStage('generating_code');
      addLog(`Blueprint ready: ${data.blueprint.projectName}`);
      if (data.metadata.provider) {
        addLog(`Blueprint source: ${data.metadata.provider}`);
      }
      addLog(`Generated ${data.project.stats.totalFiles} files`);

      setStage('building');
      addLog('Preparing file tree and preview state...');

      const preparedFiles = prepareGeneratedFiles(
        data.project.files.map((file) => ({
          path: file.path,
          content: file.content,
          source: file.source as 'template' | 'ai' | 'hybrid',
        })),
        data.blueprint
      );

      const generatedFiles = preparedFiles.map((file) => ({
        path: file.path,
        content: file.content,
        source: file.source,
      }));

      const displayTree = buildDisplayTree(preparedFiles, data.blueprint);

      startTransition(() => {
        setState((current) => ({
          ...current,
          project: {
            projectId: data.projectId ?? current.project?.projectId ?? null,
            blueprint: data.blueprint,
            files: generatedFiles,
            displayTree,
            stats: data.metadata.generation,
            warnings: data.project.warnings ?? [],
          },
        }));
      });

      addLog('Launching live preview...');

      const result = await runPreview(
        preparedFiles,
        data.blueprint,
        setStage,
        addLog,
        setState,
        controller.signal
      );
      teardownRef.current = result.teardown;

      setState((current) => ({
        ...current,
        stage: 'ready',
        progress: 100,
        message: STAGE_MESSAGES.ready,
        previewUrl: result.url,
      }));
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }

      const message = error instanceof Error ? error.message : 'Unexpected error';
      addLog(`Error: ${message}`);
      setError(message);
    }
  }

  async function generate(idea: string) {
    return runGeneration(
      { idea },
      {
        introLog: 'Requesting blueprint from the orchestration layer...',
      }
    );
  }

  async function refineWithPrompt(prompt: string) {
    if (!state.project) {
      return;
    }

    return runGeneration(
      {
        blueprint: state.project.blueprint,
        modificationPrompt: prompt,
        projectId: state.project.projectId,
      },
      {
        introLog: 'Applying your follow-up prompt to the current blueprint...',
        preserveExistingProject: true,
      }
    );
  }

  async function regenerateFromBlueprint(blueprint: Blueprint) {
    if (!state.project) {
      return;
    }

    return runGeneration(
      {
        blueprint,
        projectId: state.project.projectId,
      },
      {
        introLog: 'Validating your edited blueprint and regenerating the project...',
        preserveExistingProject: true,
        startsWithBlueprint: true,
      }
    );
  }

  async function download() {
    if (!state.project) {
      return;
    }

    addLog('Preparing zip download...');
    const preparedFiles = prepareGeneratedFiles(
      state.project.files.map((file) => ({
        path: file.path,
        content: file.content,
        source: file.source as 'template' | 'ai' | 'hybrid',
      })),
      state.project.blueprint
    );
    const files = Object.fromEntries(preparedFiles.map((file) => [file.path, file.content]));
    const response = await fetch('/api/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectName: state.project.blueprint.projectName,
        files,
      }),
    });

    if (!response.ok) {
      addLog('Download failed.');
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${state.project.blueprint.projectName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    addLog('Download started.');
  }

  async function reset() {
    abortRef.current?.abort();
    if (teardownRef.current) {
      await teardownRef.current();
      teardownRef.current = null;
    }

    setState({
      stage: 'idle',
      progress: 0,
      message: STAGE_MESSAGES.idle,
      error: null,
      project: null,
      previewUrl: null,
      logs: [],
    });
  }

  async function cancelGeneration() {
    abortRef.current?.abort();
    abortRef.current = null;

    if (teardownRef.current) {
      await teardownRef.current();
      teardownRef.current = null;
    }

    try {
      const { teardownWebContainer } = await import('@/lib/webcontainer');
      await teardownWebContainer();
    } catch {}

    setState((current) => {
      const hasProject = Boolean(current.project);
      return {
        ...current,
        stage: hasProject ? 'ready' : 'idle',
        progress: hasProject ? 100 : 0,
        message: hasProject
          ? 'Generation canceled. Latest output remains available.'
          : STAGE_MESSAGES.idle,
        error: null,
        previewUrl: null,
        logs: hasProject
          ? [
              ...current.logs.slice(-198),
              'Generation canceled. The latest generated files remain available.',
            ]
          : [],
      };
    });
  }

  async function fixPreview() {
    if (!state.project) {
      return;
    }

    const currentProject = state.project;
    const currentLogs = state.logs;

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const controller = abortRef.current;

    if (!controller) {
      return;
    }

    if (teardownRef.current) {
      await teardownRef.current();
      teardownRef.current = null;
    }

    try {
      const { teardownWebContainer } = await import('@/lib/webcontainer');
      await teardownWebContainer();
    } catch {}

    setState((current) => ({
      ...current,
      stage: 'preview_booting',
      progress: STAGE_PROGRESS.preview_booting,
      message: 'Analyzing preview issues and repairing the generated app...',
      error: null,
      previewUrl: null,
    }));
    addLog('Manual repair requested. Inspecting the latest preview/build issues...');

    try {
      const { requestPreviewRepair } = await import('@/lib/preview-repair');
      const preparedFiles = prepareGeneratedFiles(
        currentProject.files.map((file) => ({
          path: file.path,
          content: file.content,
          source: file.source as 'template' | 'ai' | 'hybrid',
        })),
        currentProject.blueprint
      );

      const repairIntent = [
        'User manually requested preview repair after hitting errors while navigating or interacting with the generated app.',
        'Prioritize a fully functional site: stable routes, scrolling, client interactions, and build/runtime safety.',
      ].join('\n');

      const repairResult = await requestPreviewRepair(
        preparedFiles,
        currentProject.blueprint,
        currentLogs,
        repairIntent
      );

      let filesForRetry = preparedFiles;

      if (repairResult) {
        filesForRetry = repairResult.files;
        addLog(
          `Manual repair updated ${repairResult.repairedPaths.length} file${
            repairResult.repairedPaths.length === 1 ? '' : 's'
          }. Retrying preview...`
        );
        repairResult.warnings.forEach((warning) => addLog(`Repair note: ${warning}`));

        setState((current) => ({
          ...current,
          project: current.project
            ? {
                ...current.project,
                files: filesForRetry,
                displayTree: buildDisplayTree(filesForRetry, currentProject.blueprint),
                warnings: [...current.project.warnings, ...repairResult.warnings],
              }
            : current.project,
        }));
      } else {
        addLog('Manual repair did not change files. Retrying preview with the latest workspace...');
      }

      const result = await runPreview(
        filesForRetry,
        currentProject.blueprint,
        setStage,
        addLog,
        setState,
        controller.signal
      );
      teardownRef.current = result.teardown;

      setState((current) => ({
        ...current,
        stage: 'ready',
        progress: 100,
        message: STAGE_MESSAGES.ready,
        previewUrl: result.url,
      }));
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }

      const message = error instanceof Error ? error.message : 'Preview repair failed';
      addLog(`Manual repair failed: ${message}`);
      setState((current) => ({
        ...current,
        stage: 'ready',
        progress: 100,
        message: 'Project generated (preview unavailable)',
        error: message,
        previewUrl: null,
      }));
    }
  }

  return {
    state,
    generate,
    refineWithPrompt,
    regenerateFromBlueprint,
    cancelGeneration,
    fixPreview,
    download,
    reset,
  };
}

async function runPreview(
  files: Array<{ path: string; content: string; source: 'template' | 'ai' | 'hybrid' }>,
  blueprint: Blueprint,
  setStage: (stage: PipelineStage, message?: string) => void,
  addLog: (message: string) => void,
  setState: Dispatch<SetStateAction<PipelineState>>,
  signal: AbortSignal
) {
  const { runInWebContainer } = await import('@/lib/webcontainer');
  const { requestPreviewRepair } = await import('@/lib/preview-repair');
  let recentLogs: string[] = [];
  let currentFiles = files;
  let lastErrorMessage = '';

  const executePreview = async (
    previewFiles: Array<{ path: string; content: string; source: 'template' | 'ai' | 'hybrid' }>
  ) => {
    if (signal.aborted) {
      throw createAbortError();
    }

    return runInWebContainer(
      buildFileSystemTree(previewFiles, blueprint),
      {
        onStatus(status) {
          if (status === 'booting') setStage('preview_booting');
          if (status === 'installing') setStage('preview_installing');
          if (status === 'starting') setStage('preview_starting');
          if (status === 'ready') setStage('ready');
        },
        onLog(message) {
          recentLogs = [...recentLogs.slice(-199), message];
          addLog(message);
        },
        onUrl(url) {
          setState((current) => ({
            ...current,
            previewUrl: url,
          }));
        },
        onError(message) {
          lastErrorMessage = message;
          addLog(`Preview error: ${message}`);
        },
      },
      { signal }
    );
  };

  try {
    return await executePreview(currentFiles);
  } catch (error) {
    if (signal.aborted || isAbortError(error)) {
      throw createAbortError();
    }

    const failureMessage = error instanceof Error ? error.message : 'Preview failed';
    const repairResult = await requestPreviewRepair(
      currentFiles,
      blueprint,
      recentLogs,
      lastErrorMessage || failureMessage
    );

    if (!repairResult) {
      setState((current) => ({
        ...current,
        stage: 'ready',
        progress: 100,
        message: 'Project generated (preview unavailable)',
      }));
      throw error;
    }

    if (signal.aborted) {
      throw createAbortError();
    }

    currentFiles = repairResult.files;
    recentLogs = [];
    lastErrorMessage = '';
    addLog(
      `Automatic repair updated ${repairResult.repairedPaths.length} file${
        repairResult.repairedPaths.length === 1 ? '' : 's'
      }. Retrying preview...`
    );
    repairResult.warnings.forEach((warning) => addLog(`Repair note: ${warning}`));
    setState((current) => ({
      ...current,
      project: current.project
        ? {
            ...current.project,
            files: currentFiles,
            displayTree: buildDisplayTree(currentFiles, blueprint),
            warnings: [...current.project.warnings, ...repairResult.warnings],
          }
        : current.project,
      previewUrl: null,
    }));

    try {
      return await executePreview(currentFiles);
    } catch (retryError) {
      if (signal.aborted || isAbortError(retryError)) {
        throw createAbortError();
      }

      setState((current) => ({
        ...current,
        stage: 'ready',
        progress: 100,
        message: 'Project generated (preview unavailable)',
      }));
      throw retryError;
    }
  }
}

function createAbortError() {
  return new DOMException('Generation canceled by the user.', 'AbortError');
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

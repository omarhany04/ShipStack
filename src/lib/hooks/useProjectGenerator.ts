'use client';

import { startTransition, useRef, useState } from 'react';
import { buildDisplayTree, TreeNode } from '@/builder/file-writer';
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

export interface GeneratedProject {
  blueprint: Blueprint;
  files: Array<{ path: string; content: string; source: string }>;
  displayTree: TreeNode | null;
  stats: {
    totalFiles: number;
    templateGenerated: number;
    aiGenerated: number;
    totalSizeBytes: number;
    totalLatencyMs: number;
  } | null;
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

  async function generate(idea: string) {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    if (teardownRef.current) {
      await teardownRef.current();
      teardownRef.current = null;
    }

    setState({
      stage: 'validating',
      progress: STAGE_PROGRESS.validating,
      message: STAGE_MESSAGES.validating,
      error: null,
      project: null,
      previewUrl: null,
      logs: [],
    });

    try {
      setStage('generating_blueprint');
      addLog('Requesting blueprint from the orchestration layer...');

      const response = await fetch('/api/generate?mode=full&persist=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idea,
          enableAI: true,
        }),
        signal: abortRef.current.signal,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || `Request failed with status ${response.status}`);
      }

      setStage('generating_code');
      addLog(`Blueprint ready: ${data.blueprint.projectName}`);
      addLog(`Generated ${data.project.stats.totalFiles} files`);

      setStage('building');
      addLog('Preparing file tree and preview state...');

      const generatedFiles = data.project.files.map(
        (file: { path: string; content: string; source: string }) => ({
          path: file.path,
          content: file.content,
          source: file.source,
        })
      );

      const displayTree = buildDisplayTree(
        generatedFiles.map((file: { path: string; content: string; source: string }) => ({
          ...file,
          source: file.source as 'template' | 'ai' | 'hybrid',
        }))
      );

      startTransition(() => {
        setState((current) => ({
          ...current,
          project: {
            blueprint: data.blueprint,
            files: generatedFiles,
            displayTree,
            stats: data.metadata.generation,
            warnings: data.project.warnings ?? [],
          },
        }));
      });

      addLog('Launching live preview...');

      const { buildFileSystemTree } = await import('@/builder/file-writer');
      const { runInWebContainer } = await import('@/lib/webcontainer');
      const fsTree = buildFileSystemTree(
        generatedFiles.map((file: { path: string; content: string; source: string }) => ({
          ...file,
          source: file.source as 'template' | 'ai' | 'hybrid',
        }))
      );

      const result = await runInWebContainer(fsTree, {
        onStatus(status) {
          if (status === 'booting') setStage('preview_booting');
          if (status === 'installing') setStage('preview_installing');
          if (status === 'starting') setStage('preview_starting');
          if (status === 'ready') setStage('ready');
        },
        onLog(message) {
          addLog(message);
        },
        onUrl(url) {
          setState((current) => ({
            ...current,
            previewUrl: url,
          }));
        },
        onError(message) {
          addLog(`Preview error: ${message}`);
          setState((current) => ({
            ...current,
            stage: 'ready',
            progress: 100,
            message: 'Project generated (preview unavailable)',
          }));
        },
      });

      teardownRef.current = result.teardown;
      setState((current) => ({
        ...current,
        stage: 'ready',
        progress: 100,
        message: STAGE_MESSAGES.ready,
        previewUrl: result.url,
      }));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      const message = error instanceof Error ? error.message : 'Unexpected error';
      addLog(`Error: ${message}`);
      setError(message);
    }
  }

  async function download() {
    if (!state.project) {
      return;
    }

    addLog('Preparing zip download...');
    const files = Object.fromEntries(state.project.files.map((file) => [file.path, file.content]));
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

  return {
    state,
    generate,
    download,
    reset,
  };
}

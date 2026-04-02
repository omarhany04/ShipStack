'use client';

import { useEffect, useMemo, useState } from 'react';

export interface FileItem {
  path: string;
  content: string;
  source: string;
}

interface FileExplorerProps {
  files: FileItem[];
  embedded?: boolean;
  title?: string;
  description?: string;
}

interface TreeNodeData {
  name: string;
  path: string;
  isFile: boolean;
  children: TreeNodeData[];
}

const FILE_ICONS: Record<string, string> = {
  tsx: 'TSX',
  ts: 'TS',
  js: 'JS',
  json: 'JSON',
  css: 'CSS',
  prisma: 'DB',
  md: 'MD',
};

const SOURCE_BADGES: Record<string, string> = {
  template: 'bg-sky-100 text-sky-700',
  ai: 'bg-orange-100 text-orange-700',
  hybrid: 'bg-amber-100 text-amber-700',
};

export default function FileExplorer({
  files,
  embedded = false,
  title = 'File Explorer',
  description = 'Inspect the generated codebase and skim file contents quickly.',
}: FileExplorerProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(
    new Set(['src', 'src/app', 'src/app/api', 'src/components', 'src/lib', 'prisma'])
  );

  const tree = useMemo(() => buildTree(files), [files]);
  const selectedFile = files.find((file) => file.path === selectedPath) ?? null;
  const filteredFiles = searchQuery
    ? files.filter((file) => file.path.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  useEffect(() => {
    if (selectedPath && files.some((file) => file.path === selectedPath)) {
      return;
    }

    setSelectedPath(files[0]?.path ?? null);
  }, [files, selectedPath]);

  function toggleDir(path: string) {
    setExpandedDirs((current) => {
      const next = new Set(current);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }

  return (
    <div
      className={
        embedded
          ? 'flex h-full flex-col overflow-hidden bg-transparent'
          : 'glass-panel flex h-full flex-col overflow-hidden rounded-[30px] shadow-[0_22px_80px_rgba(15,23,42,0.08)]'
      }
    >
      <div className="border-b border-slate-200 bg-white/70 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-xs text-slate-400">{description}</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
            {files.length} files
          </span>
        </div>

        <div className="mt-4 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by path or filename"
            className="w-full border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="min-h-0 overflow-y-auto border-b border-slate-200 px-2 py-3 lg:border-b-0 lg:border-r">
          {filteredFiles ? (
            <div className="space-y-1">
              {filteredFiles.map((file) => (
                <FileRow
                  key={file.path}
                  file={file}
                  selected={selectedPath === file.path}
                  onSelect={() => setSelectedPath(file.path)}
                  indentLevel={0}
                />
              ))}
            </div>
          ) : (
            <TreeView
              node={tree}
              files={files}
              depth={0}
              expandedDirs={expandedDirs}
              selectedPath={selectedPath}
              onToggleDir={toggleDir}
              onSelectFile={(path) => setSelectedPath(path)}
            />
          )}
        </div>

        <div className="min-h-0 overflow-hidden bg-slate-950">
          {selectedFile ? (
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{selectedFile.path}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatSize(selectedFile.content)} • {selectedFile.path.split('/').pop()}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                    SOURCE_BADGES[selectedFile.source] ?? 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {selectedFile.source}
                </span>
              </div>

              <pre className="overflow-auto px-4 py-4 text-xs leading-6 text-slate-300">
                <code>{selectedFile.content.slice(0, 4200)}</code>
                {selectedFile.content.length > 4200 ? <span>{'\n\n... truncated ...'}</span> : null}
              </pre>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <div>
                <p className="text-base font-semibold text-white">Choose a file to preview</p>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                  Search the project tree or open a file from the left panel.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildTree(files: FileItem[]): TreeNodeData {
  const root: TreeNodeData = {
    name: '/',
    path: '',
    isFile: false,
    children: [],
  };

  for (const file of files) {
    const segments = file.path.split('/').filter(Boolean);
    let current = root;

    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index];
      const isFile = index === segments.length - 1;
      const currentPath = segments.slice(0, index + 1).join('/');
      let child = current.children.find((item) => item.path === currentPath);

      if (!child) {
        child = {
          name: segment,
          path: currentPath,
          isFile,
          children: [],
        };
        current.children.push(child);
      }

      current = child;
    }
  }

  sortTree(root);
  return root;
}

function sortTree(node: TreeNodeData) {
  node.children.sort((left, right) => {
    if (left.isFile !== right.isFile) {
      return left.isFile ? 1 : -1;
    }
    return left.name.localeCompare(right.name);
  });

  node.children.forEach((child) => sortTree(child));
}

function TreeView({
  node,
  files,
  depth,
  expandedDirs,
  selectedPath,
  onToggleDir,
  onSelectFile,
}: {
  node: TreeNodeData;
  files: FileItem[];
  depth: number;
  expandedDirs: Set<string>;
  selectedPath: string | null;
  onToggleDir: (path: string) => void;
  onSelectFile: (path: string) => void;
}) {
  return (
    <div>
      {node.children.map((child) => {
        if (child.isFile) {
          const file = files.find((entry) => entry.path === child.path);
          if (!file) {
            return null;
          }
          return (
            <FileRow
              key={file.path}
              file={file}
              selected={selectedPath === file.path}
              onSelect={() => onSelectFile(file.path)}
              indentLevel={depth}
            />
          );
        }

        const isExpanded = expandedDirs.has(child.path);
        return (
          <div key={child.path}>
            <button
              type="button"
              onClick={() => onToggleDir(child.path)}
              className="flex w-full items-center gap-2 rounded-2xl px-2 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-white"
              style={{ paddingLeft: `${depth * 16 + 10}px` }}
            >
              <span className="w-4 text-slate-400">{isExpanded ? '▾' : '▸'}</span>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-xl bg-slate-100 text-[10px] font-semibold text-slate-500">
                DIR
              </span>
              <span>{child.name}</span>
            </button>
            {isExpanded ? (
              <TreeView
                node={child}
                files={files}
                depth={depth + 1}
                expandedDirs={expandedDirs}
                selectedPath={selectedPath}
                onToggleDir={onToggleDir}
                onSelectFile={onSelectFile}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function FileRow({
  file,
  selected,
  onSelect,
  indentLevel,
}: {
  file: FileItem;
  selected: boolean;
  onSelect: () => void;
  indentLevel: number;
}) {
  const fileName = file.path.split('/').pop() ?? file.path;
  const extension = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() ?? '' : '';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-2 rounded-2xl px-2 py-2 text-left text-xs transition ${
        selected
          ? 'bg-orange-50 text-orange-700'
          : 'text-slate-600 hover:bg-white'
      }`}
      style={{ paddingLeft: `${indentLevel * 16 + 10}px` }}
    >
      <span
        className={`inline-flex h-6 w-9 items-center justify-center rounded-xl text-[10px] font-semibold ${
          selected ? 'bg-white text-orange-700' : 'bg-slate-100 text-slate-500'
        }`}
      >
        {FILE_ICONS[extension] ?? 'FILE'}
      </span>
      <span className="flex-1 truncate">{fileName}</span>
      <span className="text-[10px] text-slate-400">{formatSize(file.content)}</span>
    </button>
  );
}

function formatSize(content: string) {
  const size = new TextEncoder().encode(content).length;
  return size < 1024 ? `${size} B` : `${(size / 1024).toFixed(1)} KB`;
}

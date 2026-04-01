'use client';

import { useState } from 'react';

interface FileItem {
  path: string;
  content: string;
  source: string;
}

interface FileExplorerProps {
  files: FileItem[];
}

interface TreeNodeData {
  name: string;
  path: string;
  isFile: boolean;
  children: TreeNodeData[];
}

const FILE_ICONS: Record<string, string> = {
  tsx: '⚛',
  ts: 'TS',
  js: 'JS',
  json: '{}',
  css: 'CSS',
  prisma: 'DB',
  md: 'MD',
};

const SOURCE_BADGES: Record<string, string> = {
  template: 'bg-sky-100 text-sky-700',
  ai: 'bg-orange-100 text-orange-700',
  hybrid: 'bg-amber-100 text-amber-700',
};

export default function FileExplorer({ files }: FileExplorerProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(
    new Set(['src', 'src/app', 'src/app/api', 'src/components', 'src/lib', 'prisma'])
  );

  const tree = buildTree(files);
  const selectedFile = files.find((file) => file.path === selectedPath) ?? null;
  const filteredFiles = searchQuery
    ? files.filter((file) => file.path.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

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
    <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-soft">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Project Files</h3>
          <span className="text-xs text-slate-400">{files.length}</span>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search files..."
          className="mt-3 w-full rounded-full border border-slate-200 px-3 py-2 text-xs outline-none ring-0"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
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

      {selectedFile ? (
        <div className="border-t border-slate-200">
          <div className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-3">
            <p className="truncate text-xs font-medium text-slate-700">{selectedFile.path}</p>
            <span
              className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                SOURCE_BADGES[selectedFile.source] ?? 'bg-slate-100 text-slate-600'
              }`}
            >
              {selectedFile.source.toUpperCase()}
            </span>
          </div>
          <pre className="max-h-[220px] overflow-auto bg-slate-950 p-4 text-xs text-slate-300">
            <code>{selectedFile.content.slice(0, 3000)}</code>
            {selectedFile.content.length > 3000 ? <span>{'\n\n... truncated ...'}</span> : null}
          </pre>
        </div>
      ) : null}
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
              className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
              <span className="w-4 text-slate-400">{isExpanded ? '▾' : '▸'}</span>
              <span>📁</span>
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
  const size = new TextEncoder().encode(file.content).length;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-xs ${
        selected ? 'bg-orange-50 text-orange-700' : 'text-slate-600 hover:bg-slate-50'
      }`}
      style={{ paddingLeft: `${indentLevel * 16 + 8}px` }}
    >
      <span className="w-7 text-[10px] font-semibold text-slate-400">
        {FILE_ICONS[extension] ?? 'FILE'}
      </span>
      <span className="flex-1 truncate">{fileName}</span>
      <span className="text-[10px] text-slate-400">{size < 1024 ? `${size} B` : `${(size / 1024).toFixed(1)} KB`}</span>
    </button>
  );
}

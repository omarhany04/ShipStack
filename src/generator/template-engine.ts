export function renderTemplate(template: string, variables: Record<string, unknown>) {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, keyPath: string) => {
    const value = resolveKeyPath(variables, keyPath);
    if (value === undefined || value === null) {
      return match;
    }
    return String(value);
  });
}

function resolveKeyPath(obj: Record<string, unknown>, path: string) {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

export function indent(text: string, spaces: number) {
  const padding = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line.trim() ? `${padding}${line}` : line))
    .join('\n');
}

export function dedent(text: string) {
  const lines = text.split('\n');
  if (lines[0]?.trim() === '') {
    lines.shift();
  }
  if (lines[lines.length - 1]?.trim() === '') {
    lines.pop();
  }

  const minIndent = lines
    .filter((line) => line.trim())
    .reduce((min, line) => {
      const match = line.match(/^(\s*)/);
      const indentSize = match ? match[1].length : 0;
      return Math.min(min, indentSize);
    }, Infinity);

  if (!Number.isFinite(minIndent) || minIndent === 0) {
    return lines.join('\n');
  }

  return lines.map((line) => line.slice(minIndent)).join('\n');
}

export function joinBlocks(...blocks: string[]) {
  return blocks.filter((block) => block.trim()).join('\n\n');
}

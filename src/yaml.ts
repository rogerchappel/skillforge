/** Tiny YAML reader/writer for skillforge's canonical manifest shape. */
export function parseYaml(input: string): any {
  const root: any = {};
  const stack: Array<{ indent: number; value: any }> = [{ indent: -1, value: root }];
  const lines = input.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim() || raw.trimStart().startsWith('#')) continue;
    const indent = raw.match(/^ */)?.[0].length ?? 0;
    const line = raw.trim();
    while (stack.length > 1 && indent <= stack[stack.length - 1]!.indent) stack.pop();
    const parent = stack[stack.length - 1]!.value;
    if (line.startsWith('- ')) {
      if (!Array.isArray(parent)) throw new Error(`YAML list item has non-list parent on line ${i + 1}`);
      parent.push(parseScalar(line.slice(2)));
      continue;
    }
    const idx = line.indexOf(':');
    if (idx < 0) throw new Error(`YAML expected key: value on line ${i + 1}`);
    const key = line.slice(0, idx).trim();
    const rest = line.slice(idx + 1).trim();
    if (rest) {
      parent[key] = parseScalar(rest);
      continue;
    }
    const next = nextContentLine(lines, i + 1);
    const value: any = next?.trim().startsWith('- ') ? [] : {};
    parent[key] = value;
    stack.push({ indent, value });
  }
  return root;
}

function nextContentLine(lines: string[], start: number): string | undefined {
  for (let i = start; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.trim() && !line.trimStart().startsWith('#')) return line;
  }
  return undefined;
}

function parseScalar(value: string): any {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) return value.slice(1, -1);
  if (value.startsWith('[') && value.endsWith(']')) return value.slice(1, -1).split(',').map((v) => parseScalar(v.trim())).filter((v) => v !== '');
  return value;
}

export function stringifyYaml(value: any, indent = 0): string {
  const pad = ' '.repeat(indent);
  if (Array.isArray(value)) return value.map((item) => `${pad}- ${formatScalar(item)}`).join('\n');
  return Object.entries(value).map(([key, val]) => {
    if (Array.isArray(val)) return `${pad}${key}:\n${stringifyYaml(val, indent + 2)}`;
    if (val && typeof val === 'object') return `${pad}${key}:\n${stringifyYaml(val, indent + 2)}`;
    return `${pad}${key}: ${formatScalar(val)}`;
  }).join('\n');
}

function formatScalar(value: any): string {
  if (typeof value === 'string') return /[:#\n]|^\s|\s$/.test(value) ? JSON.stringify(value) : value;
  return String(value);
}

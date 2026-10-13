/** Text helpers used across the note list, editor and export. */

const CHECKBOX_RE = /^\s*[-*]\s*\[( |x|X)\]\s*(.*)$/;

export function wordCountOf(body: string): number {
  const trimmed = body.replace(/[#>*_`~\[\]()!-]/g, ' ').trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function readingTimeOf(body: string): number {
  return Math.max(1, Math.round(wordCountOf(body) / 220));
}

export interface ChecklistStat {
  total: number;
  done: number;
}

export function countChecklist(body: string): ChecklistStat {
  let total = 0;
  let done = 0;
  for (const line of body.split('\n')) {
    const m = CHECKBOX_RE.exec(line);
    if (m) {
      total += 1;
      if (m[1].toLowerCase() === 'x') done += 1;
    }
  }
  return { total, done };
}

export function isChecklistLine(line: string): boolean {
  return CHECKBOX_RE.test(line);
}

export interface ChecklistItem {
  checked: boolean;
  text: string;
  line: number;
}

export function parseChecklist(body: string): ChecklistItem[] {
  const out: ChecklistItem[] = [];
  body.split('\n').forEach((line, i) => {
    const m = CHECKBOX_RE.exec(line);
    if (m) out.push({ checked: m[1].toLowerCase() === 'x', text: m[2], line: i });
  });
  return out;
}

export function toggleChecklistLine(body: string, line: number): string {
  const lines = body.split('\n');
  if (line < 0 || line >= lines.length) return body;
  const m = CHECKBOX_RE.exec(lines[line]);
  if (!m) return body;
  const next = m[1].toLowerCase() === 'x' ? ' ' : 'x';
  lines[line] = lines[line].replace(/\[( |x|X)\]/, `[${next}]`);
  return lines.join('\n');
}

/** Strip markdown syntax down to a clean, single-line preview. */
export function excerptFrom(body: string, max = 140): string {
  const text = body
    .split('\n')
    .map((l) => {
      const cb = CHECKBOX_RE.exec(l);
      if (cb) return cb[2];
      return l;
    })
    .join(' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_>#~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export function tagWords(body: string): string[] {
  const matches = body.match(/#([\p{L}\p{N}_-]+)/gu) ?? [];
  return Array.from(new Set(matches.map((m) => m.slice(1).toLowerCase())));
}

export function titleFromBody(body: string): string {
  const first = body
    .split('\n')
    .map((l) => l.replace(/^#+\s*/, '').trim())
    .find((l) => l.length > 0);
  return (first ?? '').slice(0, 120);
}

export function pluralize(n: number, single: string, plural?: string): string {
  return `${n} ${n === 1 ? single : plural ?? `${single}s`}`;
}

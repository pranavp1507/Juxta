export function toLowerCaseText(s: string): string {
  return s.toLowerCase();
}

export function sortLines(s: string): string {
  if (!s) return '';
  return s
    .split(/\r?\n/)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    .join('\n');
}

export function removeExcessWhitespace(s: string): string {
  if (!s) return '';
  return s
    .split(/\r?\n/)
    .map(line => line.trim().replace(/\s+/g, ' '))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function replaceLineBreaks(s: string, separator: string): string {
  let resolvedSep = separator;
  if (separator === '\\t') resolvedSep = '\t';
  else if (separator === '\\n') resolvedSep = '\n';
  else if (separator === 'space') resolvedSep = ' ';

  if (!s) return '';
  return s.split(/\r?\n/).join(resolvedSep);
}

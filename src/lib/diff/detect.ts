// Pure language detection heuristic extracted from src/App.tsx (lines 407–435).
// No JSX, no React, no DOM — safe to import in any environment.

import type { Lang } from './tokenizer';

export const detectLanguage = (text: string): Lang => {
  const trimmed = text.trim();
  if (!trimmed) return 'plain';

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch (e) {
      if (/"\w+"\s*:/g.test(trimmed)) {
        return 'json';
      }
    }
  }

  if (trimmed.startsWith('<') && (trimmed.includes('</html>') || trimmed.includes('</div>') || trimmed.includes('<!DOCTYPE') || /<\w+[^>]*>/g.test(trimmed))) {
    return 'html';
  }

  if (/(\.[a-zA-Z0-9_-]+|#[a-zA-Z0-9_-]+|[a-zA-Z0-9_-]+)\s*\{([^}]*:[^}]+;?)*\}/s.test(trimmed)) {
    return 'css';
  }

  if (/\b(const|let|var|function|class|import|export|return)\b/.test(trimmed)) {
    return 'ts';
  }

  return 'ts';
};

export interface DiffWord {
  type: 'equal' | 'delete' | 'insert';
  value: string;
}

export interface AlignedDiffRow {
  type: 'equal' | 'delete' | 'insert' | 'modify';
  leftLineNum?: number;
  rightLineNum?: number;
  leftContent?: string;
  rightContent?: string;
  leftWords?: DiffWord[];
  rightWords?: DiffWord[];
}

export type DiffOp =
  | { type: 'equal'; lineLeft: string; lineRight: string; leftIdx: number; rightIdx: number }
  | { type: 'delete'; line: string; leftIdx: number }
  | { type: 'insert'; line: string; rightIdx: number };

/**
 * Tokenizes a line into words, spaces, and punctuation to enable refined diffing.
 */
export function tokenize(line: string): string[] {
  const parts = line.match(/[a-zA-Z0-9_]+|\s+|[^a-zA-Z0-9_\s]/g);
  return parts || [];
}

/**
 * Compares two streams of tokens and outputs insertions/deletions.
 */
export function diffTokens(tokensLeft: string[], tokensRight: string[]): DiffWord[] {
  const n = tokensLeft.length;
  const m = tokensRight.length;

  if (n === 0 && m === 0) return [];
  if (n === 0) return tokensRight.map(v => ({ type: 'insert', value: v }));
  if (m === 0) return tokensLeft.map(v => ({ type: 'delete', value: v }));

  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (tokensLeft[i - 1] === tokensRight[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: DiffWord[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && tokensLeft[i - 1] === tokensRight[j - 1]) {
      result.unshift({ type: 'equal', value: tokensLeft[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'insert', value: tokensRight[j - 1] });
      j--;
    } else {
      result.unshift({ type: 'delete', value: tokensLeft[i - 1] });
      i--;
    }
  }

  return result;
}

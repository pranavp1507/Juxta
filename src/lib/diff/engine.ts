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

/**
 * Perform LCS line-by-line diff.
 * Pre-strips matching prefixes and suffixes to optimize speed for larger files.
 */
export function diffLines(linesLeft: string[], linesRight: string[]): DiffOp[] {
  const n = linesLeft.length;
  const m = linesRight.length;

  // 1. Strip identical prefixes
  let prefixCount = 0;
  while (prefixCount < n && prefixCount < m && linesLeft[prefixCount] === linesRight[prefixCount]) {
    prefixCount++;
  }

  // 2. Strip identical suffixes
  let suffixCount = 0;
  while (suffixCount < n - prefixCount && suffixCount < m - prefixCount &&
         linesLeft[n - 1 - suffixCount] === linesRight[m - 1 - suffixCount]) {
    suffixCount++;
  }

  const midLeft = linesLeft.slice(prefixCount, n - suffixCount);
  const midRight = linesRight.slice(prefixCount, m - suffixCount);

  const nMid = midLeft.length;
  const mMid = midRight.length;

  const midOps: DiffOp[] = [];

  // Safe cap to prevent client freeze (e.g. 3,500 * 3,500 operations max)
  if (nMid > 0 && mMid > 0 && nMid * mMid < 12250000) {
    const dp = Array.from({ length: nMid + 1 }, () => new Int32Array(mMid + 1));

    for (let i = 1; i <= nMid; i++) {
      for (let j = 1; j <= mMid; j++) {
        if (midLeft[i - 1] === midRight[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    let i = nMid;
    let j = mMid;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && midLeft[i - 1] === midRight[j - 1]) {
        midOps.unshift({
          type: 'equal',
          lineLeft: midLeft[i - 1],
          lineRight: midRight[j - 1],
          leftIdx: prefixCount + i - 1,
          rightIdx: prefixCount + j - 1
        });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        midOps.unshift({
          type: 'insert',
          line: midRight[j - 1],
          rightIdx: prefixCount + j - 1
        });
        j--;
      } else {
        midOps.unshift({
          type: 'delete',
          line: midLeft[i - 1],
          leftIdx: prefixCount + i - 1
        });
        i--;
      }
    }
  } else {
    // Large file or size-zero fallback: treat remainder as pure deletions followed by insertions
    for (let i = 0; i < nMid; i++) {
      midOps.push({
        type: 'delete',
        line: midLeft[i],
        leftIdx: prefixCount + i
      });
    }
    for (let j = 0; j < mMid; j++) {
      midOps.push({
        type: 'insert',
        line: midRight[j],
        rightIdx: prefixCount + j
      });
    }
  }

  // Prepend same prefixes
  const prefixOps: DiffOp[] = [];
  for (let i = 0; i < prefixCount; i++) {
    prefixOps.push({
      type: 'equal',
      lineLeft: linesLeft[i],
      lineRight: linesRight[i],
      leftIdx: i,
      rightIdx: i
    });
  }

  // Append same suffixes
  const suffixOps: DiffOp[] = [];
  for (let i = 0; i < suffixCount; i++) {
    const leftIdx = n - suffixCount + i;
    const rightIdx = m - suffixCount + i;
    suffixOps.push({
      type: 'equal',
      lineLeft: linesLeft[leftIdx],
      lineRight: linesRight[rightIdx],
      leftIdx,
      rightIdx
    });
  }

  return [...prefixOps, ...midOps, ...suffixOps];
}

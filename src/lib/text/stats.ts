export interface TextStats {
  lines: number;
  words: number;
  chars: number;
  nonSpaceChars: number;
  readingTime: string;
  charsPerWord: number;
  densityPct: number;
}

export function getStats(text: string): TextStats {
  const lines = text.split(/\r?\n/).length;
  const words = text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const chars = text.length;

  // Character density calculation
  const nonSpaceChars = text ? text.replace(/\s/g, '').length : 0;
  const densityPct = chars > 0 ? Math.round((nonSpaceChars / chars) * 100) : 0;
  const charsPerWord = words > 0 ? parseFloat((nonSpaceChars / words).toFixed(1)) : 0;

  // Reading time (based on average human silent reading speed of 200 WPM)
  let readingTime = '0s';
  if (words > 0) {
    const readingTimeMins = words / 200;
    if (readingTimeMins < 1) {
      const secs = Math.ceil(readingTimeMins * 60);
      readingTime = `${secs}s`;
    } else {
      const mins = Math.floor(readingTimeMins);
      const secs = Math.round((readingTimeMins - mins) * 60);
      readingTime = secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    }
  }

  return { lines, words, chars, nonSpaceChars, readingTime, charsPerWord, densityPct };
}

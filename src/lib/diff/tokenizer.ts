// Pure syntax tokenizer extracted from src/App.tsx (lines 29–154).
// No JSX, no React, no DOM — safe to import in any environment.

export type Lang = 'ts' | 'html' | 'css' | 'json' | 'plain';

export type SegmentType =
  | 'comment'
  | 'string'
  | 'keyword'
  | 'number'
  | 'punctuation'
  | 'function'
  | 'tag'
  | 'attribute'
  | 'property'
  | 'value'
  | 'selector'
  | 'plain';

// --- High-Performance Lightweight Client-Side Tokenizer ---
export const tokenizeLanguage = (text: string, lang: Lang): { text: string; type: SegmentType }[] => {
  if (lang === 'plain') {
    return [{ text, type: 'plain' as const }];
  }

  if (lang === 'json') {
    const jsonRegex = /(\/\/.*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*")(\s*:)?|(\b\d+(?:\.\d+)?\b)|(\b(?:true|false|null)\b)|([{}[\]().,;:?+\-*/%&|^~!=<>]+)/g;
    let lastIndex = 0;
    const segments: { text: string; type: SegmentType }[] = [];

    text.replace(jsonRegex, (match, comment, str, isKeyColon, num, keyword, punct, index) => {
      if (index > lastIndex) {
        segments.push({ text: text.substring(lastIndex, index), type: 'plain' });
      }
      if (comment) segments.push({ text: match, type: 'comment' });
      else if (str) {
        if (isKeyColon) {
          segments.push({ text: str, type: 'keyword' });
          segments.push({ text: isKeyColon, type: 'punctuation' });
        } else {
          segments.push({ text: match, type: 'string' });
        }
      }
      else if (num) segments.push({ text: match, type: 'number' });
      else if (keyword) segments.push({ text: match, type: 'keyword' });
      else if (punct) segments.push({ text: match, type: 'punctuation' });
      else segments.push({ text: match, type: 'plain' });

      lastIndex = index + match.length;
      return match;
    });

    if (lastIndex < text.length) {
      segments.push({ text: text.substring(lastIndex), type: 'plain' });
    }
    return segments;
  }

  if (lang === 'css') {
    const cssRegex = /(\/\*[\s\S]*?\*\/)|([a-zA-Z0-9_ #.:*>-]+)(?=\s*\{)|(\b[a-zA-Z0-9_-]+\b)(?=\s*:)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(#(?:[0-9a-fA-F]{3,8})|\b\d+(?:px|em|rem|%|s|ms|deg|vh|vw|pt)?\b)|([{};,()]+)/g;
    let lastIndex = 0;
    const segments: { text: string; type: SegmentType }[] = [];

    text.replace(cssRegex, (match, comment, selector, propName, str, unitValue, punct, index) => {
      if (index > lastIndex) {
        segments.push({ text: text.substring(lastIndex, index), type: 'plain' });
      }

      if (comment) segments.push({ text: match, type: 'comment' });
      else if (selector) segments.push({ text: match, type: 'selector' });
      else if (propName) segments.push({ text: match, type: 'property' });
      else if (str) segments.push({ text: match, type: 'string' });
      else if (unitValue) segments.push({ text: match, type: 'value' });
      else if (punct) segments.push({ text: match, type: 'punctuation' });
      else segments.push({ text: match, type: 'plain' });

      lastIndex = index + match.length;
      return match;
    });

    if (lastIndex < text.length) {
      segments.push({ text: text.substring(lastIndex), type: 'plain' });
    }
    return segments;
  }

  if (lang === 'html') {
    const htmlRegex = /(<!--[\s\S]*?-->)|((?:<!DOCTYPE|<!doctype)[^>]*>)|(<\/?)([a-zA-Z0-9:-]+)|(\b[a-zA-Z0-9:-]+\b)(?=\s*=)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|([<>=\/]+)/g;
    let lastIndex = 0;
    const segments: { text: string; type: SegmentType }[] = [];

    text.replace(htmlRegex, (match, comment, doctype, tagStart, tagName, attrName, str, punct, index) => {
      if (index > lastIndex) {
        segments.push({ text: text.substring(lastIndex, index), type: 'plain' });
      }

      if (comment) segments.push({ text: match, type: 'comment' });
      else if (doctype) segments.push({ text: match, type: 'keyword' });
      else if (tagStart || tagName) {
        if (tagStart) segments.push({ text: tagStart, type: 'punctuation' });
        if (tagName) segments.push({ text: tagName, type: 'tag' });
      }
      else if (attrName) segments.push({ text: attrName, type: 'attribute' });
      else if (str) segments.push({ text: match, type: 'string' });
      else if (punct) segments.push({ text: match, type: 'punctuation' });
      else segments.push({ text: match, type: 'plain' });

      lastIndex = index + match.length;
      return match;
    });

    if (lastIndex < text.length) {
      segments.push({ text: text.substring(lastIndex), type: 'plain' });
    }
    return segments;
  }

  // Fallback to TS/JS
  const regex = /(\/\/.*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b(?:const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|import|export|from|as|default|class|extends|implements|interface|type|enum|public|private|protected|static|readonly|async|await|try|catch|finally|throw|new|this|typeof|instanceof|void|super|any|string|number|boolean|unknown|never|undefined|null|true|false)\b)|(\b\d+(?:\.\d+)?\b)|([{}[\]().,;:?+\-*/%&|^~!=<>]+)|(\b[a-zA-Z_]\w*(?=\s*\())/g;

  let lastIndex = 0;
  const segments: { text: string; type: SegmentType }[] = [];

  text.replace(regex, (match, comment, str, keyword, num, punct, func, index) => {
    if (index > lastIndex) {
      segments.push({ text: text.substring(lastIndex, index), type: 'plain' });
    }

    if (comment) segments.push({ text: match, type: 'comment' });
    else if (str) segments.push({ text: match, type: 'string' });
    else if (keyword) segments.push({ text: match, type: 'keyword' });
    else if (num) segments.push({ text: match, type: 'number' });
    else if (punct) segments.push({ text: match, type: 'punctuation' });
    else if (func) segments.push({ text: match, type: 'function' });
    else segments.push({ text: match, type: 'plain' });

    lastIndex = index + match.length;
    return match;
  });

  if (lastIndex < text.length) {
    segments.push({ text: text.substring(lastIndex), type: 'plain' });
  }

  return segments;
};

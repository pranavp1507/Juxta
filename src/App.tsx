import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Columns2,
  Rows2,
  Trash2,
  Copy,
  Sun,
  Moon,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  Code,
  ArrowRightLeft,
  RefreshCw,
  Clock,
  Download,
  FileText,
  Keyboard,
  WrapText,
  Search,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { diffLines, alignDiff } from './utils/diff';

// --- High-Performance Lightweight Client-Side Tokenizer ---
const tokenizeLanguage = (text: string, lang: 'ts' | 'html' | 'css' | 'json' | 'plain') => {
  if (lang === 'plain') {
    return [{ text, type: 'plain' as const }];
  }

  if (lang === 'json') {
    const jsonRegex = /(\/\/.*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*")(\s*:)?|(\b\d+(?:\.\d+)?\b)|(\b(?:true|false|null)\b)|([{}[\]().,;:?+\-*/%&|^~!=<>]+)/g;
    let lastIndex = 0;
    const segments: { text: string; type: 'comment' | 'string' | 'keyword' | 'number' | 'punctuation' | 'function' | 'tag' | 'attribute' | 'property' | 'value' | 'selector' | 'plain' }[] = [];
    
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
    const segments: { text: string; type: 'comment' | 'string' | 'keyword' | 'number' | 'punctuation' | 'function' | 'tag' | 'attribute' | 'property' | 'value' | 'selector' | 'plain' }[] = [];

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
    const segments: { text: string; type: 'comment' | 'string' | 'keyword' | 'number' | 'punctuation' | 'function' | 'tag' | 'attribute' | 'property' | 'value' | 'selector' | 'plain' }[] = [];

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
  const segments: { text: string; type: 'comment' | 'string' | 'keyword' | 'number' | 'punctuation' | 'function' | 'tag' | 'attribute' | 'property' | 'value' | 'selector' | 'plain' }[] = [];

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

const renderSegmentWithSearch = (
  text: string,
  type: 'comment' | 'string' | 'keyword' | 'number' | 'punctuation' | 'function' | 'tag' | 'attribute' | 'property' | 'value' | 'selector' | 'plain',
  searchQuery: string,
  showWhitespace: boolean,
  scheme: 'high-contrast' | 'soft' = 'high-contrast'
) => {
  const isSoft = scheme === 'soft';
  let colorClass = 'text-slate-800 dark:text-slate-300';
  if (type === 'comment') colorClass = isSoft ? 'text-slate-400 dark:text-slate-600 italic' : 'text-slate-400 dark:text-slate-550 italic';
  else if (type === 'string') colorClass = isSoft ? 'text-emerald-600/70 dark:text-emerald-400/70 font-normal' : 'text-emerald-600 dark:text-emerald-400 font-medium';
  else if (type === 'keyword') colorClass = isSoft ? 'text-indigo-600/75 dark:text-sky-400/70 font-medium' : 'text-indigo-650 dark:text-sky-400 font-semibold';
  else if (type === 'number') colorClass = isSoft ? 'text-amber-600/75 dark:text-orange-400/75' : 'text-amber-600 dark:text-orange-400';
  else if (type === 'punctuation') colorClass = isSoft ? 'text-slate-400/80 dark:text-slate-500/80' : 'text-slate-500 dark:text-slate-400';
  else if (type === 'function') colorClass = isSoft ? 'text-blue-500/75 dark:text-yellow-300/70 font-medium' : 'text-blue-500 dark:text-yellow-300 font-semibold';
  else if (type === 'tag') colorClass = isSoft ? 'text-rose-500/75 dark:text-rose-400/75 font-medium' : 'text-rose-600 dark:text-rose-400 font-semibold';
  else if (type === 'attribute') colorClass = isSoft ? 'text-violet-500/75 dark:text-violet-400/75 font-normal' : 'text-violet-600 dark:text-violet-400 font-medium';
  else if (type === 'property') colorClass = isSoft ? 'text-amber-600/75 dark:text-orange-300/70 font-normal' : 'text-amber-750 dark:text-orange-350 font-medium';
  else if (type === 'value') colorClass = isSoft ? 'text-sky-500/75 dark:text-sky-305/70' : 'text-sky-600 dark:text-sky-350';
  else if (type === 'selector') colorClass = isSoft ? 'text-blue-500/75 dark:text-yellow-300/75 font-semibold' : 'text-blue-600 dark:text-yellow-405 font-bold';

  const formatText = (str: string) => showWhitespace ? str.replace(/ /g, '·') : str;

  if (!searchQuery) {
    return <span className={colorClass}>{formatText(text)}</span>;
  }

  const parts: React.ReactNode[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = searchQuery.toLowerCase();
  let startIdx = 0;
  let matchIdx = lowerText.indexOf(lowerQuery, startIdx);

  if (matchIdx === -1) {
    return <span className={colorClass}>{formatText(text)}</span>;
  }

  while (matchIdx !== -1) {
    if (matchIdx > startIdx) {
      parts.push(
        <span key={`sub-${startIdx}`} className={colorClass}>
          {formatText(text.substring(startIdx, matchIdx))}
        </span>
      );
    }
    const matchText = text.substring(matchIdx, matchIdx + searchQuery.length);
    parts.push(
      <mark
        key={`match-${matchIdx}`}
        className="bg-amber-200 dark:bg-amber-500/80 text-slate-950 dark:text-slate-900 rounded px-0.5 font-bold shadow-xs border-b border-amber-550"
      >
        {formatText(matchText)}
      </mark>
    );

    startIdx = matchIdx + searchQuery.length;
    matchIdx = lowerText.indexOf(lowerQuery, startIdx);
  }

  if (startIdx < text.length) {
    parts.push(
      <span key={`sub-${startIdx}`} className={colorClass}>
        {formatText(text.substring(startIdx))}
      </span>
    );
  }

  return <>{parts}</>;
};

// --- Default High Quality Demonstration Samples ---
const SAMPLES = {
  code: {
    name: 'Source Code (TypeScript/JS)',
    left: `/**
 * Simple user manager service.
 * Created on 2026-06-15.
 */
class UserService {
  private users: string[] = ["Admin", "Alice", "Charlie"];

  public async findUser(id: number): Promise<string | null> {
    console.log("Locating user in database for id: " + id);
    if (this.users[id]) {
      return this.users[id];
    }
    return null;
  }

  public deleteUser(id: number): boolean {
    if (id < this.users.length) {
      this.users.splice(id, 1);
      return true;
    }
    return false;
  }
}`,
    right: `/**
 * Premium user manager system.
 * Updated: 2026-06-18.
 */
class UserManagementService {
  private users: string[] = ["SuperAdmin", "Alice", "Bob", "Charlie"];

  public async findUser(userId: number): Promise<string | null> {
    console.log(\`Searching database for user ID: \${userId}\`);
    if (this.users[userId]) {
      return this.users[userId];
    }
    return null;
  }

  public removeUser(userId: number): boolean {
    if (userId >= 0 && userId < this.users.length) {
      this.users.splice(userId, 1);
      return true;
    }
    return false;
  }
}`
  },
  prose: {
    name: 'Editorial Prose (English)',
    left: `The revolutionary invention of the printing press during the medieval period catalyzed a dramatic shift in human communication and literature. Prior to Gutenberg, books were meticulously hand-written by dedicated scribes, which was incredibly slow and highly expensive. This restricted access to knowledge exclusively to the nobility and wealthy monasteries. Consequently, literacy levels globally remained low for centuries. However, the introduction of movable type fundamentally democratized information, sparking the massive intellectual explosion known as the Renaissance.`,
    right: `The majestic invention of the movable-type printing press during the fifteenth century caused a dramatic paradigm shift in human communication and global literacy. Before Johannes Gutenberg, books were painstakingly hand-copied by monastic scribes, an effort that was notoriously slow and highly expensive. This restricted information access almost exclusively to the rich nobility and clerical elite. Consequently, public literacy levels remained low for generations. The rapid spread of cheap printed books democratized knowledge, directly fueling the intellectual explosion of the European Renaissance.`
  },
  html: {
    name: 'HTML Document',
    left: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Old Dashboard</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="header bg-slate-100">
    <h1>Welcome to the Old System</h1>
    <p>Status: Active</p>
  </header>
  <main class="content">
    <div id="user-profile">
      <h3>John Doe</h3>
      <button class="btn btn-primary" onclick="alert('Hello')">View Profile</button>
    </div>
  </main>
</body>
</html>`,
    right: `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Modern Analytics Dashboard</title>
  <link rel="stylesheet" href="dist/output.css">
</head>
<body class="bg-zinc-950 text-zinc-550 antialiased">
  <header class="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
    <h1 class="text-xl font-bold font-sans">Analytics Hub</h1>
    <span class="px-2.5 py-1 text-xs bg-emerald-500/10 text-emerald-400 rounded-full">Live</span>
  </header>
  <main class="p-8 max-w-7xl mx-auto space-y-6">
    <div id="user-profile-v2" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
        <h3 class="font-semibold text-zinc-200">Administrator</h3>
        <p class="text-sm text-zinc-400">Pranav Lighthouse</p>
      </div>
      <button class="btn-modern-indigo" onclick="openProfile('admin')">Manage Account</button>
    </div>
  </main>
</body>
</html>`
  },
  css: {
    name: 'CSS Stylesheet',
    left: `.card {
  background: white;
  border: 1px solid #ddd;
  padding: 16px;
  margin-bottom: 20px;
  border-radius: 4px;
}

.btn {
  background-color: #3b82f6;
  color: white;
  padding: 8px 16px;
  border: none;
  cursor: pointer;
}

.btn:hover {
  background-color: #2563eb;
}`,
    right: `.card-modern {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 24px;
  margin-bottom: 24px;
  border-radius: 12px;
  backdrop-filter: blur(12px);
  transition: all 0.2s ease-in-out;
}

.btn-indigo {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: #ffffff;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.btn-indigo:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.3);
}`
  },
  json: {
    name: 'JSON Configuration',
    left: `{
  "name": "metadata-app",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "express": "^4.18.2",
    "react": "^18.2.0"
  },
  "features": {
    "darkMode": false,
    "experimentalApi": true
  }
}`,
    right: `{
  "name": "metadata-app-premium",
  "version": "1.2.0",
  "private": true,
  "dependencies": {
    "express": "^4.20.0",
    "react": "^19.0.0",
    "lucide-react": "^0.400.0"
  },
  "features": {
    "darkMode": true,
    "experimentalApi": false,
    "collaborationMode": true
  }
}`
  }
};;

const detectLanguage = (text: string): 'ts' | 'html' | 'css' | 'json' | 'plain' => {
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

export default function App() {
  // --- Core States ---
  const [textLeft, setTextLeft] = useState<string>('');
  const [textRight, setTextRight] = useState<string>('');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('text-compare-theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark'; // Default to pristine dark mode matching "Sleek Interface" preview
  });

  const [compareMode, setCompareMode] = useState<'split' | 'unified'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('text-compare-compareMode');
      if (saved === 'split' || saved === 'unified') return saved;
    }
    return 'split';
  });

  const [syncScroll, setSyncScroll] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('text-compare-syncScroll');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });

  const [showWhitespace, setShowWhitespace] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('text-compare-showWhitespace');
      if (saved !== null) return saved === 'true';
    }
    return false;
  });

  const [showLineNumbers, setShowLineNumbers] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('text-compare-showLineNumbers');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });

  const [lineWrap, setLineWrap] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('text-compare-lineWrap');
      if (saved !== null) return saved === 'true';
    }
    return false;
  });

  const [highlightMode, setHighlightMode] = useState<'word' | 'char'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('text-compare-highlightMode');
      if (saved === 'word' || saved === 'char') return saved;
    }
    return 'word';
  });

  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [hasCompared, setHasCompared] = useState<boolean>(true); // Keeps panel immediately interactive
  const [isCopiedLeft, setIsCopiedLeft] = useState<boolean>(false);
  const [isCopiedRight, setIsCopiedRight] = useState<boolean>(false);
  const [activeDiffNavIdx, setActiveDiffNavIdx] = useState<number>(-1);

  // --- Advanced Options & Search States ---
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSearchIdx, setActiveSearchIdx] = useState<number>(-1);

  const [syntaxHighlighting, setSyntaxHighlighting] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('text-compare-syntaxHighlighting');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });

  const [syntaxScheme, setSyntaxScheme] = useState<'high-contrast' | 'soft'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('text-compare-syntaxScheme');
      if (saved === 'high-contrast' || saved === 'soft') return saved;
    }
    return 'high-contrast';
  });

  const [responsiveLayout, setResponsiveLayout] = useState<'adaptive' | 'fixed-split'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('text-compare-responsiveLayout');
      if (saved === 'adaptive' || saved === 'fixed-split') return saved;
    }
    return 'adaptive';
  });

  const [autoCompare, setAutoCompare] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('text-compare-autoCompare');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });

  const [languageMode, setLanguageMode] = useState<'auto' | 'ts' | 'html' | 'css' | 'json'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('text-compare-languageMode');
      if (saved === 'auto' || saved === 'ts' || saved === 'html' || saved === 'css' || saved === 'json') return saved as any;
    }
    return 'auto';
  });

  const detectedLanguageLeft = useMemo(() => {
    if (languageMode !== 'auto') return languageMode;
    return detectLanguage(textLeft);
  }, [languageMode, textLeft]);

  const detectedLanguageRight = useMemo(() => {
    if (languageMode !== 'auto') return languageMode;
    return detectLanguage(textRight);
  }, [languageMode, textRight]);

  // --- Text transformation & replacement states ---
  const [showReplaceLeft, setShowReplaceLeft] = useState<boolean>(false);
  const [showReplaceRight, setShowReplaceRight] = useState<boolean>(false);
  const [replaceCharLeft, setReplaceCharLeft] = useState<string>(', ');
  const [replaceCharRight, setReplaceCharRight] = useState<string>(', ');

  // Committed contents to allow manual triggers
  const [committedTextLeft, setCommittedTextLeft] = useState<string>('');
  const [committedTextRight, setCommittedTextRight] = useState<string>('');

  // Sync effect for Auto-Compare
  useEffect(() => {
    if (autoCompare) {
      setCommittedTextLeft(textLeft);
      setCommittedTextRight(textRight);
    }
  }, [textLeft, textRight, autoCompare]);

  // Is text out of sync with compared state? (dirty state)
  const isDirty = textLeft !== committedTextLeft || textRight !== committedTextRight;

  const triggerCompare = () => {
    setCommittedTextLeft(textLeft);
    setCommittedTextRight(textRight);
  };

  // --- Scroll Synchronization Refs ---
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);

  // --- Theme synchronizer effect ---
  useEffect(() => {
    localStorage.setItem('text-compare-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // --- Persistent Settings Syncing Effects ---
  useEffect(() => {
    localStorage.setItem('text-compare-compareMode', compareMode);
  }, [compareMode]);

  useEffect(() => {
    localStorage.setItem('text-compare-syncScroll', String(syncScroll));
  }, [syncScroll]);

  useEffect(() => {
    localStorage.setItem('text-compare-showWhitespace', String(showWhitespace));
  }, [showWhitespace]);

  useEffect(() => {
    localStorage.setItem('text-compare-showLineNumbers', String(showLineNumbers));
  }, [showLineNumbers]);

  useEffect(() => {
    localStorage.setItem('text-compare-lineWrap', String(lineWrap));
  }, [lineWrap]);

  useEffect(() => {
    localStorage.setItem('text-compare-highlightMode', highlightMode);
  }, [highlightMode]);

  useEffect(() => {
    localStorage.setItem('text-compare-syntaxHighlighting', String(syntaxHighlighting));
  }, [syntaxHighlighting]);

  useEffect(() => {
    localStorage.setItem('text-compare-syntaxScheme', syntaxScheme);
  }, [syntaxScheme]);

  useEffect(() => {
    localStorage.setItem('text-compare-responsiveLayout', responsiveLayout);
  }, [responsiveLayout]);

  useEffect(() => {
    localStorage.setItem('text-compare-autoCompare', String(autoCompare));
  }, [autoCompare]);

  useEffect(() => {
    localStorage.setItem('text-compare-languageMode', languageMode);
  }, [languageMode]);

  // --- Scroll Sync Handlers ---
  const syncLeftToRight = () => {
    if (!syncScroll || !leftScrollRef.current || !rightScrollRef.current) return;
    const left = leftScrollRef.current;
    const right = rightScrollRef.current;
    if (right.scrollTop !== left.scrollTop) {
      right.scrollTop = left.scrollTop;
    }
    if (right.scrollLeft !== left.scrollLeft) {
      right.scrollLeft = left.scrollLeft;
    }
  };

  const syncRightToLeft = () => {
    if (!syncScroll || !leftScrollRef.current || !rightScrollRef.current) return;
    const left = leftScrollRef.current;
    const right = rightScrollRef.current;
    if (left.scrollTop !== right.scrollTop) {
      left.scrollTop = right.scrollTop;
    }
    if (left.scrollLeft !== right.scrollLeft) {
      left.scrollLeft = right.scrollLeft;
    }
  };

  // --- Compute Diff Data & Measures parse time ---
  const { diffData, parseTimeMs } = useMemo(() => {
    const start = performance.now();
    const linesLeft = committedTextLeft.split(/\r?\n/);
    const linesRight = committedTextRight.split(/\r?\n/);

    const ops = diffLines(linesLeft, linesRight);
    const alignedRows = alignDiff(ops, highlightMode);

    let additions = 0;
    let deletions = 0;
    let modifications = 0;
    let identicals = 0;

    alignedRows.forEach(row => {
      if (row.type === 'equal') identicals++;
      else if (row.type === 'delete') deletions++;
      else if (row.type === 'insert') additions++;
      else if (row.type === 'modify') modifications++;
    });

    const totalRowsCount = alignedRows.length;
    const maxLinesCount = Math.max(linesLeft.length, linesRight.length);
    let similarityPercentage = 100;
    if (maxLinesCount > 0) {
      similarityPercentage = totalRowsCount > 0 ? Math.round((identicals / totalRowsCount) * 100) : 100;
    }

    const diffIndices = alignedRows
      .map((row, idx) => (row.type !== 'equal' ? idx : -1))
      .filter(idx => idx !== -1);

    const end = performance.now();
    const parseTimeMs = parseFloat((end - start).toFixed(1));

    return {
      diffData: {
        alignedRows,
        additions,
        deletions,
        modifications,
        similarityPercentage,
        diffIndices
      },
      parseTimeMs
    };
  }, [committedTextLeft, committedTextRight, highlightMode]);

  const { alignedRows, additions, deletions, modifications, similarityPercentage, diffIndices } = diffData;

  // --- Search matches computation ---
  const searchMatches = useMemo(() => {
    if (!searchQuery) return [];
    const lowerQuery = searchQuery.toLowerCase();
    const indices: number[] = [];
    alignedRows.forEach((row, idx) => {
      const leftMatch = row.leftContent !== undefined && row.leftContent.toLowerCase().includes(lowerQuery);
      const rightMatch = row.rightContent !== undefined && row.rightContent.toLowerCase().includes(lowerQuery);
      if (leftMatch || rightMatch) {
        indices.push(idx);
      }
    });
    return indices;
  }, [alignedRows, searchQuery]);

  const jumpToSearchMatch = (direction: 'next' | 'prev') => {
    if (searchMatches.length === 0) return;
    
    let nextIdx = 0;
    if (direction === 'next') {
      nextIdx = activeSearchIdx + 1 < searchMatches.length ? activeSearchIdx + 1 : 0;
    } else {
      nextIdx = activeSearchIdx - 1 >= 0 ? activeSearchIdx - 1 : searchMatches.length - 1;
    }
    
    setActiveSearchIdx(nextIdx);
    const targetRowIdx = searchMatches[nextIdx];
    setActiveDiffNavIdx(targetRowIdx);
    
    setTimeout(() => {
      const rowElement = document.getElementById(`diff-row-${targetRowIdx}`);
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  // --- Custom Unified Syntax & Code Renderer with Whitespace and Highlight Overlays ---
  const renderLineCode = (
    text: string | undefined,
    rowType: 'equal' | 'delete' | 'insert' | 'modify',
    side: 'left' | 'right',
    words?: { value: string; type?: 'equal' | 'delete' | 'insert' }[]
  ) => {
    if (text === undefined) {
      return (
        <div className="h-5 select-none bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(0,0,0,0.02)_8px,rgba(0,0,0,0.02)_16px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(255,255,255,0.015)_8px,rgba(255,255,255,0.015)_16px)]" />
      );
    }

    const lowerQuery = searchQuery.toLowerCase();
    const hasSearch = searchQuery.length > 0;

    const highlightSearches = (str: string, baseStyle: string) => {
      const formatted = showWhitespace ? str.replace(/ /g, '·') : str;
      if (!hasSearch) {
        return <span className={baseStyle}>{formatted}</span>;
      }
      const lowerStr = str.toLowerCase();
      let pos = lowerStr.indexOf(lowerQuery);
      if (pos === -1) {
        return <span className={baseStyle}>{formatted}</span>;
      }
      
      const parts: React.ReactNode[] = [];
      let startIdx = 0;
      while (pos !== -1) {
        if (pos > startIdx) {
          parts.push(
            <span key={`p-${startIdx}`} className={baseStyle}>
              {showWhitespace ? str.substring(startIdx, pos).replace(/ /g, '·') : str.substring(startIdx, pos)}
            </span>
          );
        }
        
        const matchText = str.substring(pos, pos + searchQuery.length);
        parts.push(
          <mark key={`m-${pos}`} className="bg-amber-250 dark:bg-amber-500/80 text-slate-950 dark:text-slate-900 px-0.5 py-0.5 rounded font-bold shadow-xs border-b border-amber-550">
            {showWhitespace ? matchText.replace(/ /g, '·') : matchText}
          </mark>
        );
        
        startIdx = pos + searchQuery.length;
        pos = lowerStr.indexOf(lowerQuery, startIdx);
      }
      
      if (startIdx < str.length) {
        parts.push(
          <span key={`p-${startIdx}`} className={baseStyle}>
            {showWhitespace ? str.substring(startIdx).replace(/ /g, '·') : str.substring(startIdx)}
          </span>
        );
      }
      return <>{parts}</>;
    };

    let textStyle = 'text-slate-800 dark:text-slate-300';
    if (rowType === 'delete') textStyle = 'text-rose-900 dark:text-rose-400';
    else if (rowType === 'insert') textStyle = 'text-emerald-900 dark:text-emerald-400';
    else if (rowType === 'modify') {
      textStyle = side === 'left' ? 'text-rose-800 dark:text-rose-400 font-bold' : 'text-emerald-800 dark:text-emerald-400 font-bold';
    }

    if (words) {
      return (
        <span>
          {words.map((word, wIdx) => {
            let wordClass = '';
            const isWordDiffMark = word.type === 'delete' || word.type === 'insert';
            
            if (word.type === 'delete') {
              wordClass = highlightMode === 'char'
                ? 'bg-rose-200/80 dark:bg-rose-950 text-rose-950 dark:text-rose-100 font-bold border-b border-rose-500'
                : 'bg-rose-100 text-rose-950 dark:bg-rose-950 dark:text-rose-100 px-1 py-0.5 rounded shadow-xs font-semibold mx-0.5 inline-block';
            } else if (word.type === 'insert') {
              wordClass = highlightMode === 'char'
                ? 'bg-emerald-250/80 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-100 font-bold border-b border-emerald-500'
                : 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100 px-1 py-0.5 rounded shadow-xs font-semibold mx-0.5 inline-block';
            }

            let formattedWord: React.ReactNode = word.value;
            if (syntaxHighlighting && !isWordDiffMark) {
              const lowerVal = word.value.trim();
              const isSoft = syntaxScheme === 'soft';
              if (/^(const|let|var|function|return|if|else|for|class|import|export|from|interface|type|public|private|async|await)$/.test(lowerVal)) {
                wordClass = isSoft ? 'text-indigo-600/75 dark:text-sky-400/70 font-medium' : 'text-indigo-600 dark:text-sky-400 font-semibold';
              } else if (/^\d+$/.test(lowerVal)) {
                wordClass = isSoft ? 'text-amber-600/75 dark:text-orange-400/75' : 'text-amber-600 dark:text-orange-400';
              } else if (lowerVal.startsWith('//') || lowerVal.startsWith('/*')) {
                wordClass = isSoft ? 'text-slate-400/85 dark:text-slate-600 italic' : 'text-slate-400 dark:text-slate-550 italic';
              } else if (lowerVal.startsWith('"') || lowerVal.startsWith("'") || lowerVal.startsWith('`')) {
                wordClass = isSoft ? 'text-emerald-600/70 dark:text-emerald-400/70 font-mono' : 'text-emerald-600 dark:text-emerald-400 font-mono';
              }
            }

            return (
              <span key={wIdx} className={wordClass || textStyle}>
                {highlightSearches(word.value, wordClass || textStyle)}
              </span>
            );
          })}
        </span>
      );
    }

    if (syntaxHighlighting && rowType === 'equal') {
      const activeLang = side === 'left' ? detectedLanguageLeft : detectedLanguageRight;
      const tokens = tokenizeLanguage(text, activeLang);
      return (
        <span>
          {tokens.map((tok, tIdx) => (
            <span key={tIdx}>
              {renderSegmentWithSearch(tok.text, tok.type, searchQuery, showWhitespace, syntaxScheme)}
            </span>
          ))}
        </span>
      );
    }

    return highlightSearches(text, textStyle);
  };

  const wrapClass = lineWrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre overflow-x-auto';

  // --- Jump to Previous/Next Diff Line ---
  const jumpToDiff = (direction: 'next' | 'prev') => {
    if (diffIndices.length === 0) return;

    let targetIndex = 0;
    if (direction === 'next') {
      const nextIdx = diffIndices.find(idx => idx > activeDiffNavIdx);
      targetIndex = nextIdx !== undefined ? nextIdx : diffIndices[0];
    } else {
      const revIndices = [...diffIndices].reverse();
      const prevIdx = revIndices.find(idx => idx < activeDiffNavIdx);
      targetIndex = prevIdx !== undefined ? prevIdx : diffIndices[diffIndices.length - 1];
    }

    setActiveDiffNavIdx(targetIndex);

    // Smooth scroll the target row into view
    setTimeout(() => {
      const rowElement = document.getElementById(`diff-row-${targetIndex}`);
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  // --- Copy Clipboard Helpers ---
  const copyText = (text: string, type: 'left' | 'right') => {
    navigator.clipboard.writeText(text);
    if (type === 'left') {
      setIsCopiedLeft(true);
      setTimeout(() => setIsCopiedLeft(false), 2000);
    } else {
      setIsCopiedRight(true);
      setTimeout(() => setIsCopiedRight(false), 2000);
    }
  };

  // --- Load sample code / prose / html / css / json ---
  const loadSample = (type: 'code' | 'prose' | 'html' | 'css' | 'json') => {
    setTextLeft(SAMPLES[type].left);
    setTextRight(SAMPLES[type].right);
    setCommittedTextLeft(SAMPLES[type].left);
    setCommittedTextRight(SAMPLES[type].right);
    setHasCompared(true);
    setActiveDiffNavIdx(-1);
  };

  // --- Clear all method ---
  const clearAll = () => {
    setTextLeft('');
    setTextRight('');
    setCommittedTextLeft('');
    setCommittedTextRight('');
    setActiveDiffNavIdx(-1);
  };

  // --- Text editing & transformation options ---
  const swapTexts = () => {
    const tempLeft = textLeft;
    setTextLeft(textRight);
    setTextRight(tempLeft);
    if (!autoCompare) {
      const tempCommittedLeft = committedTextLeft;
      setCommittedTextLeft(committedTextRight);
      setCommittedTextRight(tempCommittedLeft);
    }
    setHasCompared(true);
  };

  const convertToLowercase = (side: 'left' | 'right') => {
    if (side === 'left') {
      setTextLeft(prev => prev.toLowerCase());
    } else {
      setTextRight(prev => prev.toLowerCase());
    }
    setHasCompared(true);
  };

  const sortLines = (side: 'left' | 'right') => {
    if (side === 'left') {
      setTextLeft(prev => {
        if (!prev) return '';
        return prev.split(/\r?\n/).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })).join('\n');
      });
    } else {
      setTextRight(prev => {
        if (!prev) return '';
        return prev.split(/\r?\n/).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })).join('\n');
      });
    }
    setHasCompared(true);
  };

  const removeExcessWhitespace = (side: 'left' | 'right') => {
    if (side === 'left') {
      setTextLeft(prev => {
        if (!prev) return '';
        return prev
          .split(/\r?\n/)
          .map(line => line.trim().replace(/\s+/g, ' '))
          .join('\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      });
    } else {
      setTextRight(prev => {
        if (!prev) return '';
        return prev
          .split(/\r?\n/)
          .map(line => line.trim().replace(/\s+/g, ' '))
          .join('\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      });
    }
    setHasCompared(true);
  };

  const replaceLineBreaks = (side: 'left' | 'right', separator: string) => {
    let resolvedSep = separator;
    if (separator === '\\t') resolvedSep = '\t';
    else if (separator === '\\n') resolvedSep = '\n';
    else if (separator === 'space') resolvedSep = ' ';

    if (side === 'left') {
      setTextLeft(prev => {
        if (!prev) return '';
        return prev.split(/\r?\n/).join(resolvedSep);
      });
      setShowReplaceLeft(false);
    } else {
      setTextRight(prev => {
        if (!prev) return '';
        return prev.split(/\r?\n/).join(resolvedSep);
      });
      setShowReplaceRight(false);
    }
    setHasCompared(true);
  };

  // --- Escape HTML for report export ---
  const escapeHtml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // --- Export Report as HTML / TXT / MD / JSON ---
  const exportReport = (format: 'html' | 'txt' | 'md' | 'json') => {
    let content = '';
    let mimeType = 'text/plain';
    let fileName = `diff-studio-report-${new Date().toISOString().split('T')[0]}`;

    if (format === 'txt') {
      fileName += '.txt';
      mimeType = 'text/plain';
      content = `DIFF STUDIO COMPARISON REPORT\n`;
      content += `Generated on: ${new Date().toLocaleString()}\n`;
      content += `Similarity Index: ${similarityPercentage}%\n`;
      content += `Insertions: ${additions} | Deletions: ${deletions} | Modifications: ${modifications}\n`;
      content += `==========================================\n\n`;

      alignedRows.forEach(row => {
        const leftL = row.leftLineNum ? String(row.leftLineNum).padStart(5, ' ') : '     ';
        const rightL = row.rightLineNum ? String(row.rightLineNum).padStart(5, ' ') : '     ';
        let prefix = ' ';
        if (row.type === 'delete') prefix = '-';
        else if (row.type === 'insert') prefix = '+';
        else if (row.type === 'modify') prefix = '~';

        const leftContent = row.leftContent !== undefined ? row.leftContent : '';
        const rightContent = row.rightContent !== undefined ? row.rightContent : '';

        if (row.type === 'modify') {
          content += `[OLD] L${leftL} - ${leftContent}\n`;
          content += `[NEW] R${rightL} + ${rightContent}\n`;
        } else if (row.type === 'delete') {
          content += `L${leftL} ${prefix} ${leftContent}\n`;
        } else if (row.type === 'insert') {
          content += `R${rightL} ${prefix} ${rightContent}\n`;
        } else {
          content += `L${leftL} R${rightL}   ${leftContent}\n`;
        }
      });
    } else if (format === 'md') {
      fileName += '.md';
      mimeType = 'text/markdown';
      content = `# DiffStudio Comparison Report\n\n`;
      content += `Generated on: **${new Date().toLocaleString()}** (Standard Secured Client)\n\n`;
      content += `### Comparison Summary\n`;
      content += `- **Congruency/Similarity Index**: ${similarityPercentage}%\n`;
      content += `- **Status**: ${similarityPercentage === 100 ? 'Identical files' : 'Differences detected'}\n`;
      content += `- **Insertions (+)**: ${additions}\n`;
      content += `- **Deletions (-)**: ${deletions}\n`;
      content += `- **Modifications (~)**: ${modifications}\n\n`;
      content += `========================================================================\n\n`;
      content += `## Line-by-Line Changes\n\n`;
      content += `| Source (L) | Target (R) | Symbol | Content |\n`;
      content += `| :--- | :--- | :---: | :--- |\n`;

      alignedRows.forEach(row => {
        const leftL = row.leftLineNum ? `${row.leftLineNum}` : ' ';
        const rightL = row.rightLineNum ? `${row.rightLineNum}` : ' ';
        let sym = ' ';
        if (row.type === 'delete') sym = '\\-';
        else if (row.type === 'insert') sym = '\\+';
        else if (row.type === 'modify') sym = '\\~';

        const leftVal = row.leftContent ? row.leftContent.trim() : '';
        const rightVal = row.rightContent ? row.rightContent.trim() : '';

        if (row.type === 'modify') {
          content += `| ${leftL} | | \\- | \`${leftVal}\` |\n`;
          content += `| | ${rightL} | \\+ | \`${rightVal}\` |\n`;
        } else if (row.type === 'delete') {
          content += `| ${leftL} | | \\- | \`${leftVal}\` |\n`;
        } else if (row.type === 'insert') {
          content += `| | ${rightL} | \\+ | \`${rightVal}\` |\n`;
        } else {
          content += `| ${leftL} | ${rightL} | | \`${leftVal}\` |\n`;
        }
      });
    } else if (format === 'json') {
      fileName += '.json';
      mimeType = 'application/json';
      const reportObj = {
        name: "DiffStudio Comparison Report",
        timestamp: new Date().toISOString(),
        analytics: {
          congruencyPercentage: similarityPercentage,
          additions,
          deletions,
          modifications,
          identical: similarityPercentage === 100
        },
        diffData: alignedRows.map(row => ({
          type: row.type,
          leftLine: row.leftLineNum || null,
          rightLine: row.rightLineNum || null,
          leftContent: row.leftContent !== undefined ? row.leftContent : null,
          rightContent: row.rightContent !== undefined ? row.rightContent : null
        }))
      };
      content = JSON.stringify(reportObj, null, 2);
    } else {
      fileName += '.html';
      mimeType = 'text/html';

      const isDark = theme === 'dark';
      const bgColor = isDark ? '#020617' : '#f8fafc';
      const textColor = isDark ? '#f1f5f9' : '#0f172a';
      const cardColor = isDark ? '#0f172a' : '#ffffff';
      const borderColor = isDark ? '#1e293b' : '#e2e8f0';

      const rowStyles = `
        .row-equal { background-color: transparent; }
        .row-delete { background-color: ${isDark ? 'rgba(244, 63, 94, 0.15)' : '#fff1f2'}; border-left: 3px solid #f43f5e; color: ${isDark ? '#fda4af' : '#9f1239'}; }
        .row-insert { background-color: ${isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5'}; border-left: 3px solid #10b981; color: ${isDark ? '#6ee7b7' : '#065f46'}; }
        .row-modify-del { background-color: ${isDark ? 'rgba(244, 63, 94, 0.08)' : '#fff5f5'}; border-left: 3px solid rgba(244, 63, 94, 0.5); color: ${isDark ? '#fda4af' : '#b91c1c'}; }
        .row-modify-ins { background-color: ${isDark ? 'rgba(16, 185, 129, 0.08)' : '#f0fdf4'}; border-left: 3px solid rgba(16, 185, 129, 0.5); color: ${isDark ? '#6ee7b7' : '#15803d'}; }
        .word-delete { background-color: ${isDark ? 'rgba(244, 63, 94, 0.4)' : '#fecdd3'}; font-weight: 500; border-radius: 2px; padding: 0 2px; }
        .word-insert { background-color: ${isDark ? 'rgba(16, 185, 129, 0.4)' : '#a7f3d0'}; font-weight: 500; border-radius: 2px; padding: 0 2px; }
      `;

      let alignedHTMLRows = '';
      alignedRows.forEach((row, idx) => {
        let leftTdNum = showLineNumbers ? `<td class="line-num">${row.leftLineNum || ''}</td>` : '';
        let rightTdNum = showLineNumbers ? `<td class="line-num">${row.rightLineNum || ''}</td>` : '';
        
        let leftTdContent = '';
        let rightTdContent = '';
        let leftClass = 'row-equal';
        let rightClass = 'row-equal';

        if (row.type === 'delete') {
          leftClass = 'row-delete';
          leftTdContent = escapeHtml(row.leftContent || '');
          rightTdContent = '<div class="empty-cell"></div>';
        } else if (row.type === 'insert') {
          rightClass = 'row-insert';
          leftTdContent = '<div class="empty-cell"></div>';
          rightTdContent = escapeHtml(row.rightContent || '');
        } else if (row.type === 'modify') {
          leftClass = 'row-modify-del';
          rightClass = 'row-modify-ins';

          if (row.leftWords) {
            leftTdContent = row.leftWords.map(w => {
              const klass = w.type === 'delete' ? 'word-delete' : '';
              const escVal = escapeHtml(w.value);
              return klass ? `<span class="${klass}">${escVal}</span>` : escVal;
            }).join('');
          } else {
            leftTdContent = escapeHtml(row.leftContent || '');
          }

          if (row.rightWords) {
            rightTdContent = row.rightWords.map(w => {
              const klass = w.type === 'insert' ? 'word-insert' : '';
              const escVal = escapeHtml(w.value);
              return klass ? `<span class="${klass}">${escVal}</span>` : escVal;
            }).join('');
          } else {
            rightTdContent = escapeHtml(row.rightContent || '');
          }
        } else {
          leftTdContent = escapeHtml(row.leftContent || '');
          rightTdContent = escapeHtml(row.rightContent || '');
        }

        alignedHTMLRows += `
          <tr>
            ${leftTdNum}
            <td class="${leftClass} content-cell">${leftTdContent}</td>
            <td class="separator"></td>
            ${rightTdNum}
            <td class="${rightClass} content-cell">${rightTdContent}</td>
          </tr>
        `;
      });

      content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Diff Studio - Code & Prose Comparison Report</title>
  <style>
    body {
      background-color: ${bgColor};
      color: ${textColor};
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 24px;
    }
    .header {
      background: ${cardColor};
      border: 1px solid ${borderColor};
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    h1 { margin-top: 0; font-size: 24px; font-weight: 700; }
    .stats { display: flex; gap: 24px; font-size: 14px; margin-top: 16px; font-family: monospace; }
    .stat-pill { background: rgba(99, 102, 241, 0.1); color: #6366f1; padding: 4px 12px; border-radius: 9999px; font-weight: 600; }
    .stat-add { background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 4px 12px; border-radius: 9999px; font-weight: 600; }
    .stat-del { background: rgba(244, 63, 94, 0.1); color: #f43f5e; padding: 4px 12px; border-radius: 9999px; font-weight: 600; }
    .stat-mod { background: rgba(168, 85, 247, 0.1); color: #a855f7; padding: 4px 12px; border-radius: 9999px; font-weight: 600; }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace;
      font-size: 12px;
      border: 1px solid ${borderColor};
      border-radius: 8px;
      overflow: hidden;
      background: ${cardColor};
    }
    th {
      background: ${isDark ? '#1e293b' : '#f1f5f9'};
      padding: 10px;
      text-align: left;
      font-weight: 600;
      border-bottom: 1px solid ${borderColor};
    }
    td {
      padding: 4px 12px;
      vertical-align: top;
      line-height: 1.5;
    }
    .line-num {
      width: 40px;
      text-align: right;
      color: #94a3b8;
      border-right: 1px solid ${borderColor};
      user-select: none;
      background: ${isDark ? '#0f172a' : '#f8fafc'};
      font-size: 10px;
      padding-right: 8px;
      padding-top: 6px;
    }
    .content-cell {
      white-space: ${lineWrap ? 'pre-wrap' : 'pre'};
      word-break: break-all;
      padding-top: 6px;
    }
    .separator {
      width: 1px;
      background: ${borderColor};
      padding: 0;
    }
    .empty-cell {
      height: 15px;
      background: repeating-linear-gradient(45deg, transparent, transparent  8px, ${isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.015)'} 8px, ${isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.015)'} 16px);
    }
    ${rowStyles}
  </style>
</head>
<body>
  <div class="header">
    <h1>DiffStudio Comparison Report</h1>
    <p style="margin: 0; color: #64748b; font-size: 14px;">Generated on: ${new Date().toLocaleString()}</p>
    <div class="stats">
      <span class="stat-pill">Similarity: ${similarityPercentage}%</span>
      <span class="stat-add">+ ${additions} insertions</span>
      <span class="stat-del">- ${deletions} deletions</span>
      <span class="stat-mod">~ ${modifications} modifications</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        ${showLineNumbers ? '<th style="width: 40px;"></th>' : ''}
        <th>Original Text (Source)</th>
        <th style="width: 1px; padding: 0;"></th>
        ${showLineNumbers ? '<th style="width: 40px;"></th>' : ''}
        <th>Modified Text (Output)</th>
      </tr>
    </thead>
    <tbody>
      ${alignedHTMLRows}
    </tbody>
  </table>
</body>
</html>`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- Keyboard Shortcuts hook ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow Alt keys globally or when not in editable fields
      const isEditable = 
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (isEditable && !e.altKey) return;

      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        jumpToDiff('next');
      } else if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        jumpToDiff('prev');
      } else if (e.altKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        setLineWrap(prev => !prev);
      } else if (e.altKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setShowLineNumbers(prev => !prev);
      } else if (e.altKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setHighlightMode(prev => (prev === 'word' ? 'char' : 'word'));
      } else if (e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
      } else if (e.altKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        exportReport('html');
      } else if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        clearAll();
      } else if (e.altKey && e.key === 'Enter') {
        e.preventDefault();
        triggerCompare();
      } else if (e.altKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        swapTexts();
      } else if (e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        const searchInput = document.getElementById('search-diff-input');
        if (searchInput) {
          searchInput.focus();
          (searchInput as HTMLInputElement).select();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [diffIndices, activeDiffNavIdx, highlightMode, theme, showLineNumbers, lineWrap, textLeft, textRight, autoCompare, committedTextLeft, committedTextRight, swapTexts]);

  // --- Input Stat Calculators ---
  const getStats = (txt: string) => {
    const lines = txt ? txt.split(/\r?\n/).length : 0;
    const words = txt ? txt.trim().split(/\s+/).filter(Boolean).length : 0;
    const chars = txt.length;
    
    // Character Density calculation
    const nonSpaceChars = txt ? txt.replace(/\s/g, '').length : 0;
    const densityPct = chars > 0 ? Math.round((nonSpaceChars / chars) * 100) : 0;
    const charsPerWord = words > 0 ? (nonSpaceChars / words).toFixed(1) : '0';
    
    // Reading time calculation (based on average human silent reading speed of 200 WPM)
    let readingTimeStr = '0s';
    if (words > 0) {
      const readingTimeMins = words / 200;
      if (readingTimeMins < 1) {
        const secs = Math.ceil(readingTimeMins * 60);
        readingTimeStr = `${secs}s`;
      } else {
        const mins = Math.floor(readingTimeMins);
        const secs = Math.round((readingTimeMins - mins) * 60);
        readingTimeStr = secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
      }
    }

    return { 
      lines, 
      words, 
      chars, 
      nonSpaceChars, 
      densityPct, 
      charsPerWord, 
      readingTimeStr 
    };
  };

  const leftStats = getStats(textLeft);
  const rightStats = getStats(textRight);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 flex flex-col">
      
      {/* Navigation Header */}
      <nav className="flex items-center justify-between px-6 sm:px-8 h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ArrowRightLeft className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">DiffStudio</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 ml-2">v2.5.0</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Quick Load sample buttons */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => loadSample('code')}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-medium rounded-md transition"
              id="load-sample-code"
              title="Load TypeScript demonstration sample code"
            >
              <Code className="w-3.5 h-3.5 text-indigo-500" />
              <span>TS Code</span>
            </button>
            <button
              onClick={() => loadSample('html')}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-medium rounded-md transition"
              id="load-sample-html"
              title="Load HTML demonstration document"
            >
              <FileText className="w-3.5 h-3.5 text-orange-500" />
              <span>HTML</span>
            </button>
            <button
              onClick={() => loadSample('css')}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-medium rounded-md transition"
              id="load-sample-css"
              title="Load CSS stylesheet demonstration"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <span>CSS</span>
            </button>
            <button
              onClick={() => loadSample('json')}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-medium rounded-md transition"
              id="load-sample-json"
              title="Load JSON configuration file"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
              <span>JSON</span>
            </button>
            <button
              onClick={() => loadSample('prose')}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-medium rounded-md transition"
              id="load-sample-prose"
              title="Load general editorial prose text"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-500" />
              <span>Prose</span>
            </button>
          </div>

          <button 
            onClick={clearAll}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-sm font-medium transition-all"
            id="btn-clear-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Clear Areas</span>
          </button>

          <button 
            onClick={swapTexts}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/45 dark:hover:bg-indigo-900/60 dark:text-indigo-300 rounded-md text-sm font-medium transition-all"
            id="btn-swap-fields"
            title="Swap text layout fields (Alt + X)"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Swap Fields</span>
          </button>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

          {/* Export suite */}
          <div className="flex items-center gap-1">
            <button 
              onClick={() => exportReport('html')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/45 dark:hover:bg-indigo-900/60 dark:text-indigo-300 rounded-l-md text-xs font-semibold transition shadow-sm border-y border-l border-indigo-200 dark:border-indigo-900/40"
              id="btn-export-report-html"
              title="Export HTML comparison report (Alt + E)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>HTML</span>
            </button>
            <button 
              onClick={() => exportReport('md')}
              className="flex items-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-705 dark:text-slate-300 border-y border-r border-slate-200 dark:border-slate-720 text-xs font-semibold transition"
              id="btn-export-report-md"
              title="Export Markdown comprehensive comparison report"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-300" />
              <span>MD</span>
            </button>
            <button 
              onClick={() => exportReport('json')}
              className="flex items-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-705 dark:text-slate-300 border-y border-r border-slate-200 dark:border-slate-720 text-xs font-semibold transition"
              id="btn-export-report-json"
              title="Export JSON structured diff data"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
              <span>JSON</span>
            </button>
            <button 
              onClick={() => exportReport('txt')}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-r-md text-xs font-semibold transition border-y border-r border-slate-200 dark:border-slate-700"
              id="btn-export-report-txt"
              title="Export Plain Text comparison report"
            >
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>TXT</span>
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

          <button 
            onClick={() => setShowShortcutsModal(true)}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            title="Keyboard Shortcuts Guide (Alt + K)"
            id="btn-keyboard-guide"
          >
            <Keyboard className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            title="Toggle Accessibility dark mode"
            id="theme-toggler"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Main Interactive Editors Workspace */}
      <div className="flex-1 overflow-x-auto">
        <div className={`grid ${responsiveLayout === 'adaptive' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-2 min-w-[760px] lg:min-w-0'} gap-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800`}>
          
          {/* Source Document Side */}
          <div className="flex flex-col border-r border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-6 py-3 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:bg-slate-800/30 dark:border-slate-800">
              <span className="flex items-center gap-2 text-slate-700 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Source Document (Original)
              </span>
              <span className="font-mono text-[11px] text-slate-400 lowercase">Active Workspace</span>
            </div>

            {/* Mini-Stats Badges Row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-6 py-2 bg-slate-100/30 border-b border-slate-200 dark:bg-slate-900/20 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-medium" id="stats-bar-left">
              <span className="flex items-center gap-1 bg-slate-100/60 dark:bg-slate-800/40 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-350">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{leftStats.lines}</span> lines
              </span>
              <span className="flex items-center gap-1 bg-slate-100/60 dark:bg-slate-800/40 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-350" id="left-stat-words">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{leftStats.words}</span> words
              </span>
              <span className="flex items-center gap-1 bg-slate-100/60 dark:bg-slate-800/40 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-350">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{leftStats.chars}</span> chars ({leftStats.nonSpaceChars} visible)
              </span>
              <span className="flex items-center gap-1 bg-slate-100/60 dark:bg-slate-800/40 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-350" title="Expected reading duration at an average rate of 200 words per minute">
                <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                <span>{leftStats.readingTimeStr} read time</span>
              </span>
              <span className="flex items-center gap-1 bg-indigo-50/50 border border-indigo-100/45 dark:bg-indigo-950/20 dark:border-indigo-900/30 px-1.5 py-0.5 rounded text-indigo-700 dark:text-indigo-300" title={`Average Word Length: ${leftStats.charsPerWord} letters (Excluding whitespaces). Text contains ${leftStats.densityPct}% dense non-whitespace content.`}>
                <BarChart3 className="w-3 h-3 text-indigo-400 dark:text-indigo-500" />
                <span>Density: <strong className="font-bold">{leftStats.charsPerWord}</strong> c/w ({leftStats.densityPct}%)</span>
              </span>
            </div>

            {/* Source Side Text Operations Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-1.5 bg-slate-50 border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800" id="original-text-operations-bar">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => convertToLowercase('left')}
                  className="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-350 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded transition shadow-2xs"
                  id="btn-lowercase-left"
                  title="Convert all text to lowercase"
                >
                  a-z lowercase
                </button>
                <button
                  onClick={() => sortLines('left')}
                  className="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-350 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded transition shadow-2xs"
                  id="btn-sort-left"
                  title="Sort lines alphabetically"
                >
                  Sort Lines
                </button>
                <button
                  onClick={() => removeExcessWhitespace('left')}
                  className="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-350 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded transition shadow-2xs"
                  id="btn-whitespace-left"
                  title="Remove excess white space & normalize lines"
                >
                  Trim Workspace
                </button>
                
                {/* Replace line breaks section */}
                <div className="relative inline-block text-left">
                  <button
                    onClick={() => {
                      setShowReplaceLeft(!showReplaceLeft);
                      setShowReplaceRight(false);
                    }}
                    className={`px-2 py-1 text-[11px] font-medium rounded border transition shadow-2xs ${
                      showReplaceLeft 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-900 dark:text-indigo-300' 
                        : 'text-slate-600 dark:text-slate-350 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                    id="btn-replace-breaks-left"
                    title="Replace line breaks with other characters"
                  >
                    Replace Line Breaks
                  </button>
                  
                  {showReplaceLeft && (
                    <div className="absolute left-0 mt-1.5 w-60 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-30">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Replace line breaks with:</p>
                      <div className="grid grid-cols-3 gap-1 mb-2">
                        {[
                          { label: 'Comma', val: ', ' },
                          { label: 'Space', val: 'space' },
                          { label: 'Tab', val: '\\t' },
                          { label: 'Pipe', val: ' | ' },
                          { label: 'Hyphen', val: ' - ' },
                          { label: 'Semicolon', val: '; ' }
                        ].map(preset => (
                          <button
                            key={preset.label}
                            onClick={() => {
                              setReplaceCharLeft(preset.val);
                            }}
                            type="button"
                            className={`px-1.5 py-1 text-[10px] rounded border text-center transition ${
                              replaceCharLeft === preset.val
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-900 dark:text-indigo-300'
                                : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                      <div className="mb-2">
                        <label className="block text-[9px] font-semibold text-slate-400 dark:text-slate-500 mb-1">Custom String:</label>
                        <input
                          type="text"
                          value={replaceCharLeft === 'space' || replaceCharLeft === '\\t' ? '' : replaceCharLeft}
                          onChange={(e) => setReplaceCharLeft(e.target.value)}
                          placeholder="e.g. , "
                          className="w-full px-2 py-1 text-xs bg-slate-50 text-slate-800 dark:text-slate-200 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex gap-1.5 justify-end mt-2">
                        <button
                          onClick={() => setShowReplaceLeft(false)}
                          type="button"
                          className="px-2 py-1 text-[10px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => replaceLineBreaks('left', replaceCharLeft)}
                          type="button"
                          className="px-2 py-1 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex-1 min-h-[220px] relative">
              <textarea
                value={textLeft}
                onChange={(e) => {
                  setTextLeft(e.target.value);
                  setHasCompared(true);
                }}
                className="absolute inset-0 w-full h-full p-6 bg-transparent text-slate-800 dark:text-slate-300 font-mono text-sm leading-relaxed focus:outline-none resize-none overflow-y-auto placeholder-slate-400 dark:placeholder-slate-600 focus:ring-1 focus:ring-indigo-500/10"
                placeholder="Paste or type original document here..."
              />
              
              {textLeft.length === 0 && (
                <div className="absolute bottom-6 right-6 flex items-center gap-2 pointer-events-none select-none">
                  <span className="text-[11px] font-mono text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-950/40 px-2 py-1 rounded">
                    Ctrl + V to client paste
                  </span>
                </div>
              )}
              
              {textLeft.length > 0 && (
                <button
                  onClick={() => copyText(textLeft, 'left')}
                  className="absolute top-4 right-4 p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-755 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded transition"
                  title="Copy input text"
                >
                  {isCopiedLeft ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          {/* Modified Output Side */}
          <div className="flex flex-col bg-slate-50/10 dark:bg-slate-900">
            <div className="flex items-center justify-between px-6 py-3 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:bg-slate-800/30 dark:border-slate-800">
              <span className="flex items-center gap-2 text-slate-700 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Modified Output (Comparison)
              </span>
              <span className="font-mono text-[11px] text-slate-400 lowercase">Active Workspace</span>
            </div>

            {/* Mini-Stats Badges Row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-6 py-2 bg-slate-100/30 border-b border-slate-200 dark:bg-slate-900/20 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-medium" id="stats-bar-right">
              <span className="flex items-center gap-1 bg-slate-100/60 dark:bg-slate-800/40 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-350">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{rightStats.lines}</span> lines
              </span>
              <span className="flex items-center gap-1 bg-slate-100/60 dark:bg-slate-800/40 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-350" id="right-stat-words">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{rightStats.words}</span> words
              </span>
              <span className="flex items-center gap-1 bg-slate-100/60 dark:bg-slate-800/40 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-350">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{rightStats.chars}</span> chars ({rightStats.nonSpaceChars} visible)
              </span>
              <span className="flex items-center gap-1 bg-slate-100/60 dark:bg-slate-800/40 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-350" title="Expected reading duration at an average rate of 200 words per minute">
                <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                <span>{rightStats.readingTimeStr} read time</span>
              </span>
              <span className="flex items-center gap-1 bg-indigo-50/50 border border-indigo-100/45 dark:bg-indigo-950/20 dark:border-indigo-900/30 px-1.5 py-0.5 rounded text-indigo-700 dark:text-indigo-300" title={`Average Word Length: ${rightStats.charsPerWord} letters (Excluding whitespaces). Text contains ${rightStats.densityPct}% dense non-whitespace content.`}>
                <BarChart3 className="w-3 h-3 text-indigo-400 dark:text-indigo-500" />
                <span>Density: <strong className="font-bold">{rightStats.charsPerWord}</strong> c/w ({rightStats.densityPct}%)</span>
              </span>
            </div>

            {/* Modified Side Text Operations Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-1.5 bg-slate-50 border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800" id="modified-text-operations-bar">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => convertToLowercase('right')}
                  className="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-350 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded transition shadow-2xs"
                  id="btn-lowercase-right"
                  title="Convert all text to lowercase"
                >
                  a-z lowercase
                </button>
                <button
                  onClick={() => sortLines('right')}
                  className="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-350 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded transition shadow-2xs"
                  id="btn-sort-right"
                  title="Sort lines alphabetically"
                >
                  Sort Lines
                </button>
                <button
                  onClick={() => removeExcessWhitespace('right')}
                  className="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-350 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded transition shadow-2xs"
                  id="btn-whitespace-right"
                  title="Remove excess white space & normalize lines"
                >
                  Trim Workspace
                </button>
                
                {/* Replace line breaks section */}
                <div className="relative inline-block text-left">
                  <button
                    onClick={() => {
                      setShowReplaceRight(!showReplaceRight);
                      setShowReplaceLeft(false);
                    }}
                    className={`px-2 py-1 text-[11px] font-medium rounded border transition shadow-2xs ${
                      showReplaceRight 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-900 dark:text-indigo-300' 
                        : 'text-slate-600 dark:text-slate-350 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                    id="btn-replace-breaks-right"
                    title="Replace line breaks with other characters"
                  >
                    Replace Line Breaks
                  </button>
                  
                  {showReplaceRight && (
                    <div className="absolute left-0 mt-1.5 w-60 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-30">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Replace line breaks with:</p>
                      <div className="grid grid-cols-3 gap-1 mb-2">
                        {[
                          { label: 'Comma', val: ', ' },
                          { label: 'Space', val: 'space' },
                          { label: 'Tab', val: '\\t' },
                          { label: 'Pipe', val: ' | ' },
                          { label: 'Hyphen', val: ' - ' },
                          { label: 'Semicolon', val: '; ' }
                        ].map(preset => (
                          <button
                            key={preset.label}
                            onClick={() => {
                              setReplaceCharRight(preset.val);
                            }}
                            type="button"
                            className={`px-1.5 py-1 text-[10px] rounded border text-center transition ${
                              replaceCharRight === preset.val
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-900 dark:text-indigo-300'
                                : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                      <div className="mb-2">
                        <label className="block text-[9px] font-semibold text-slate-400 dark:text-slate-500 mb-1">Custom String:</label>
                        <input
                          type="text"
                          value={replaceCharRight === 'space' || replaceCharRight === '\\t' ? '' : replaceCharRight}
                          onChange={(e) => setReplaceCharRight(e.target.value)}
                          placeholder="e.g. , "
                          className="w-full px-2 py-1 text-xs bg-slate-50 text-slate-800 dark:text-slate-200 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex gap-1.5 justify-end mt-2">
                        <button
                          onClick={() => setShowReplaceRight(false)}
                          type="button"
                          className="px-2 py-1 text-[10px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => replaceLineBreaks('right', replaceCharRight)}
                          type="button"
                          className="px-2 py-1 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-[220px] relative">
              <textarea
                value={textRight}
                onChange={(e) => {
                  setTextRight(e.target.value);
                  setHasCompared(true);
                }}
                className="absolute inset-0 w-full h-full p-6 bg-transparent text-slate-800 dark:text-slate-300 font-mono text-sm leading-relaxed focus:outline-none resize-none overflow-y-auto placeholder-slate-400 dark:placeholder-slate-600 focus:ring-1 focus:ring-indigo-500/10"
                placeholder="Paste or type edited document here..."
                id="modified-textarea"
              />

              {textRight.length === 0 && (
                <div className="absolute bottom-6 right-6 flex items-center gap-2 pointer-events-none select-none">
                  <span className="text-[11px] font-mono text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-950/40 px-2 py-1 rounded">
                    Side-by-side matches automatically
                  </span>
                </div>
              )}

              {textRight.length > 0 && (
                <button
                  onClick={() => copyText(textRight, 'right')}
                  className="absolute top-4 right-4 p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-755 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded transition"
                  title="Copy compare text"
                >
                  {isCopiedRight ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Control Navigation & Configuration Bar */}
      <div className="bg-slate-50 border-b border-slate-250 dark:bg-slate-950 dark:border-slate-850 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Layout view settings split/unified */}
          <div className="flex items-center bg-slate-200/60 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setCompareMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 ${
                compareMode === 'split'
                  ? 'bg-white shadow text-slate-900 dark:bg-slate-800 dark:text-white'
                  : 'text-slate-550 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              id="opt-split-mode"
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>
            <button
              onClick={() => setCompareMode('unified')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 ${
                compareMode === 'unified'
                  ? 'bg-white shadow text-slate-900 dark:bg-slate-800 dark:text-white'
                  : 'text-slate-550 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              id="opt-unified-mode"
            >
              <Rows2 className="w-3.5 h-3.5" />
              <span>Unified View</span>
            </button>
          </div>

          {/* Synchronized scroll */}
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={syncScroll}
              onChange={(e) => setSyncScroll(e.target.checked)}
              className="w-4 h-4 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 bg-transparent dark:border-slate-700"
            />
            <span>Synchronized Scroll</span>
          </label>

          {/* Whitespace display indicator */}
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={showWhitespace}
              onChange={(e) => setShowWhitespace(e.target.checked)}
              className="w-4 h-4 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 bg-transparent dark:border-slate-700"
            />
            <span>Show Whitespace (·)</span>
          </label>

          {/* Line numbers display toggle */}
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 select-none cursor-pointer" id="opt-line-numbers">
            <input
              type="checkbox"
              checked={showLineNumbers}
              onChange={(e) => setShowLineNumbers(e.target.checked)}
              className="w-4 h-4 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 bg-transparent dark:border-slate-700"
            />
            <span>Show Line Numbers</span>
          </label>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden lg:block" />

          {/* Line wrap toggle */}
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 select-none cursor-pointer" id="opt-line-wrap">
            <input
              type="checkbox"
              checked={lineWrap}
              onChange={(e) => setLineWrap(e.target.checked)}
              className="w-4 h-4 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 bg-transparent dark:border-slate-700"
            />
            <span className="flex items-center gap-1">
              <WrapText className="w-3.5 h-3.5" />
              Wrap Lines
            </span>
          </label>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden lg:block" />

          {/* Highlight Mode selection */}
          <div className="flex items-center bg-slate-200/60 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setHighlightMode('word')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all duration-150 ${
                highlightMode === 'word'
                  ? 'bg-white shadow text-indigo-600 dark:bg-slate-800 dark:text-indigo-400'
                  : 'text-slate-550 hover:text-slate-900 dark:text-slate-450 dark:hover:text-white'
              }`}
              id="opt-highlight-word"
              title="Highlight modified code word-by-word"
            >
              Word diff
            </button>
            <button
              onClick={() => setHighlightMode('char')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all duration-150 ${
                highlightMode === 'char'
                  ? 'bg-white shadow text-indigo-600 dark:bg-slate-800 dark:text-indigo-400'
                  : 'text-slate-550 hover:text-slate-900 dark:text-slate-450 dark:hover:text-white'
              }`}
              id="opt-highlight-char"
              title="Highlight modified code character-by-character"
            >
              Char diff
            </button>
          </div>
        </div>

        {/* Diff navigators */}
        {diffIndices.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-550 uppercase tracking-wider">
              {activeDiffNavIdx !== -1 ? diffIndices.indexOf(activeDiffNavIdx) + 1 : 0} of {diffIndices.length} differences
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => jumpToDiff('prev')}
                className="p-1.5 text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800 rounded transition"
                title="Jump to previous difference"
                id="btn-prev-diff"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => jumpToDiff('next')}
                className="p-1.5 text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800 rounded transition"
                title="Jump to next difference"
                id="btn-next-diff"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search & Advanced Diff Controls Sub-Bar */}
      <div className="bg-slate-100/60 dark:bg-slate-950/60 border-b border-slate-250 dark:border-slate-850 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Search tool block */}
        <div className="flex items-center gap-2 flex-1 min-w-[280px] max-w-md">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActiveSearchIdx(e.target.value ? 0 : -1);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (e.shiftKey) {
                    jumpToSearchMatch('prev');
                  } else {
                    jumpToSearchMatch('next');
                  }
                }
              }}
              placeholder="Search matches... (Enter for Next, Shift+Enter for Prev)"
              className="w-full pl-9 pr-24 py-1.5 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500"
              id="search-diff-input"
            />
            {searchQuery && (
              <span className="absolute inset-y-0 right-2 flex items-center gap-1.5 pr-1 select-none pointer-events-auto">
                <span className="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  {searchMatches.length > 0 ? `${activeSearchIdx + 1}/${searchMatches.length}` : '0/0'}
                </span>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveSearchIdx(-1);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-semibold px-1"
                  title="Clear search"
                >
                  ✕
                </button>
              </span>
            )}
          </div>
          
          {searchMatches.length > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => jumpToSearchMatch('prev')}
                className="p-1 text-slate-500 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded transition"
                title="Previous match"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => jumpToSearchMatch('next')}
                className="p-1 text-slate-500 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded transition"
                title="Next match"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Feature toggles */}
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Syntax Highlighting toggle */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 select-none cursor-pointer" id="opt-syntax-highlight">
              <input
                type="checkbox"
                checked={syntaxHighlighting}
                onChange={(e) => setSyntaxHighlighting(e.target.checked)}
                className="w-4 h-4 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 bg-transparent dark:border-slate-700"
              />
              <span className="flex items-center gap-1">
                <Code className="w-3.5 h-3.5 text-indigo-500" />
                Syntax Highlight
              </span>
            </label>

            {syntaxHighlighting && (
              <div className="flex flex-wrap items-center gap-2.5 pl-3 border-l border-slate-250 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Lang:</span>
                  <select
                    value={languageMode}
                    onChange={(e) => setLanguageMode(e.target.value as any)}
                    className="px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-250 dark:border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 transition cursor-pointer shadow-sm text-[11px]"
                    id="opt-language-mode"
                  >
                    <option value="auto">Auto-Detect</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="json">JSON</option>
                    <option value="ts">JS / TS / Java</option>
                  </select>
                  {languageMode === 'auto' && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono bg-slate-200/50 dark:bg-slate-900 px-1.5 py-0.5 rounded italic">
                      active: {detectedLanguageLeft.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="hidden sm:block h-3.5 w-px bg-slate-250 dark:bg-slate-800" />

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Scheme:</span>
                  <select
                    value={syntaxScheme}
                    onChange={(e) => setSyntaxScheme(e.target.value as any)}
                    className="px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-250 dark:border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 transition cursor-pointer shadow-sm text-[11px]"
                    id="opt-syntax-scheme"
                  >
                    <option value="high-contrast">High Contrast</option>
                    <option value="soft">Soft</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-slate-250 dark:bg-slate-800" />

          {/* Responsive Layout selection */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              Layout:
            </span>
            <div className="flex items-center bg-slate-200/60 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setResponsiveLayout('adaptive')}
                className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all duration-150 ${
                  responsiveLayout === 'adaptive'
                    ? 'bg-white shadow text-indigo-600 dark:bg-slate-800 dark:text-indigo-400'
                    : 'text-slate-550 hover:text-slate-900 dark:text-slate-450 dark:hover:text-white'
                }`}
                id="opt-layout-adaptive"
                title="Line stack vertically on mobile viewports"
              >
                Auto Stack
              </button>
              <button
                onClick={() => setResponsiveLayout('fixed-split')}
                className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all duration-150 ${
                  responsiveLayout === 'fixed-split'
                    ? 'bg-white shadow text-indigo-600 dark:bg-slate-800 dark:text-indigo-400'
                    : 'text-slate-550 hover:text-slate-900 dark:text-slate-450 dark:hover:text-white'
                }`}
                id="opt-layout-fixed"
                title="Force side-by-side columns on mobile viewport with scroll"
              >
                Force Split
              </button>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-250 dark:bg-slate-800" />

          {/* Auto Compare toggle */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 select-none cursor-pointer" id="opt-auto-compare">
              <input
                type="checkbox"
                checked={autoCompare}
                onChange={(e) => setAutoCompare(e.target.checked)}
                className="w-4 h-4 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 bg-transparent dark:border-slate-700"
              />
              <span className="flex items-center gap-1">
                Auto-Compare
              </span>
            </label>

            {!autoCompare && (
              <button
                onClick={triggerCompare}
                className={`flex items-center gap-1 py-1 px-2.5 rounded-md text-xs font-bold transition-all ${
                  isDirty 
                    ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse shadow-md shadow-amber-500/20 ring-2 ring-amber-400' 
                    : 'bg-slate-250 text-slate-600 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
                id="btn-run-manual-compare"
                title="Trigger text diff matching comparison manually (Alt + Enter)"
              >
                <span>Compare Now</span>
                {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping ml-1" />}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Main Diff Display Area */}
      <div className="p-4 sm:p-8 max-w-[1920px] mx-auto w-full flex-1">
        
        {/* If first time loaded and both are blank, show prompt */}
        {textLeft.length === 0 && textRight.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="inline-flex p-3 bg-indigo-500/10 text-indigo-500 rounded-full">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="font-display font-semibold text-slate-900 dark:text-white text-lg">Compare texts side-by-side instantly</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
              Paste your texts into the original and modified document text fields above. Or click the sample tabs above to see DiffStudio in action!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Split theme comparison columns */}
            {compareMode === 'split' ? (
              <div className="overflow-x-auto w-full">
                <div className={`grid ${responsiveLayout === 'adaptive' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-2 min-w-[760px] lg:min-w-0'} gap-0 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xl`}>
                  
                  {/* Left side (Source Document) Scroll box */}
                  <div className="flex flex-col border-r border-slate-200 dark:border-slate-800">
                    <div className="px-4 py-2 bg-slate-100/50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-805 text-xs font-semibold text-slate-500 uppercase select-none flex items-center justify-between">
                      <span>Source Diff (Original)</span>
                      <span className="font-mono text-[10px] text-slate-400">OLD</span>
                    </div>
                    <div
                      ref={leftScrollRef}
                      onScroll={syncLeftToRight}
                      className="overflow-auto max-h-[550px] min-h-[400px] bg-slate-50/50 dark:bg-slate-950/20"
                    >
                      <table className="w-full border-collapse table-fixed">
                        <tbody>
                          <AnimatePresence initial={false}>
                            {alignedRows.map((row, idx) => {
                              const isRowNavHighlight = idx === activeDiffNavIdx;
                              let bgClass = 'bg-transparent';
                              
                              if (row.type === 'delete') {
                                bgClass = 'bg-rose-50/70 border-l-[3px] border-rose-500 dark:bg-rose-950/20';
                              } else if (row.type === 'modify') {
                                bgClass = 'bg-rose-500/5 border-l-[3px] border-rose-400/70 dark:bg-rose-950/10';
                              } else if (row.type === 'insert') {
                                bgClass = 'bg-slate-100/30 dark:bg-slate-900/30 opacity-30';
                              }

                              return (
                                <motion.tr
                                  key={`left-${idx}-${row.type}-${row.leftLineNum || 'empty'}`}
                                  id={`diff-row-${idx}`}
                                  className={`group font-mono text-xs leading-6 border-b border-slate-100/40 dark:border-slate-850/20 ${bgClass} ${
                                    isRowNavHighlight ? 'ring-2 ring-indigo-500/70 ring-inset' : ''
                                  }`}
                                  initial={{ opacity: 0, x: -6 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -6 }}
                                  transition={{ duration: 0.15, ease: 'easeOut' }}
                                >
                                  {/* Original left line count */}
                                  {showLineNumbers && (
                                    <td className="w-12 text-right pr-2 select-none text-[10px] text-slate-400 dark:text-slate-550 border-r border-slate-200/50 dark:border-slate-800/50 bg-slate-100/30 dark:bg-slate-900/30 align-top pt-1">
                                      {row.leftLineNum || ''}
                                    </td>
                                  )}
                                  
                                  {/* Diff source line code */}
                                  <td className={`pl-4 pr-2 ${wrapClass} align-top text-[12.5px] pt-1`}>
                                    {renderLineCode(row.leftContent, row.type, 'left', row.leftWords)}
                                  </td>
                                </motion.tr>
                              );
                            })}
                          </AnimatePresence>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right side (Modified Output) Scroll box */}
                  <div className="flex flex-col">
                    <div className="px-4 py-2 bg-slate-100/50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-805 text-xs font-semibold text-slate-500 uppercase select-none flex items-center justify-between">
                      <span>Target Output Diff</span>
                      <span className="font-mono text-[10px] text-emerald-400 font-bold">NEW</span>
                    </div>
                    <div
                      ref={rightScrollRef}
                      onScroll={syncRightToLeft}
                      className="overflow-auto max-h-[550px] min-h-[400px] bg-slate-50/50 dark:bg-slate-950/20"
                    >
                      <table className="w-full border-collapse table-fixed">
                        <tbody>
                          <AnimatePresence initial={false}>
                            {alignedRows.map((row, idx) => {
                              const isRowNavHighlight = idx === activeDiffNavIdx;
                              let bgClass = 'bg-transparent';

                              if (row.type === 'insert') {
                                bgClass = 'bg-emerald-50/60 border-l-[3px] border-emerald-500 dark:bg-emerald-950/20';
                              } else if (row.type === 'modify') {
                                bgClass = 'bg-emerald-500/5 border-l-[3px] border-emerald-400/70 dark:bg-emerald-950/10';
                              } else if (row.type === 'delete') {
                                bgClass = 'bg-slate-100/30 dark:bg-slate-900/30 opacity-30';
                              }

                              return (
                                <motion.tr
                                  key={`right-${idx}-${row.type}-${row.rightLineNum || 'empty'}`}
                                  className={`group font-mono text-xs leading-6 border-b border-slate-100/40 dark:border-slate-850/20 ${bgClass} ${
                                    isRowNavHighlight ? 'ring-2 ring-indigo-500/70 ring-inset' : ''
                                  }`}
                                  initial={{ opacity: 0, x: 6 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 6 }}
                                  transition={{ duration: 0.15, ease: 'easeOut' }}
                                >
                                  {/* Modified right line count */}
                                  {showLineNumbers && (
                                    <td className="w-12 text-right pr-2 select-none text-[10px] text-slate-400 dark:text-slate-550 border-r border-slate-200/50 dark:border-slate-800/50 bg-slate-100/30 dark:bg-slate-900/30 align-top pt-1">
                                      {row.rightLineNum || ''}
                                    </td>
                                  )}

                                  {/* Diff modified line code */}
                                  <td className={`pl-4 pr-2 ${wrapClass} align-top text-[12.5px] pt-1`}>
                                    {renderLineCode(row.rightContent, row.type, 'right', row.rightWords)}
                                  </td>
                                </motion.tr>
                              );
                            })}
                          </AnimatePresence>
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              /* --- UNIFIED / CHRONOLOGICAL CASCADE VIEW --- */
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xl">
                <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase select-none flex justify-between">
                  <span>Unified/Inline Chronological View</span>
                  <span className="font-mono text-[10px] tracking-wider text-indigo-500 uppercase">Interactive Stack</span>
                </div>
                <div className="overflow-auto max-h-[600px] bg-slate-50/50 dark:bg-slate-950/20">
                  <table className="w-full border-collapse table-fixed">
                    <tbody>
                      <AnimatePresence initial={false}>
                        {alignedRows.map((row, idx) => {
                          const isRowNavHighlight = idx === activeDiffNavIdx;
                          const isModify = row.type === 'modify';
                          const isDelete = row.type === 'delete';
                          const isInsert = row.type === 'insert';

                          if (isModify) {
                            return (
                              <motion.div
                                key={`unified-${idx}-${row.type}`}
                                id={`diff-row-${idx}`}
                                className={`${isRowNavHighlight ? 'ring-2 ring-indigo-500/80 ring-inset' : ''}`}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                              >
                                
                                {/* Original Line deletion */}
                                <tr className="font-mono text-xs leading-6 bg-rose-50/40 border-l-[3px] border-rose-500/70 dark:bg-rose-950/10 border-b border-slate-100/50 dark:border-slate-900/10">
                                  {showLineNumbers && (
                                    <>
                                      <td className="w-12 text-right pr-2 select-none text-[10px] text-slate-400 border-r border-slate-200/50 bg-slate-100/35 dark:bg-slate-900/35">
                                        {row.leftLineNum}
                                      </td>
                                      <td className="w-12 text-right pr-2 select-none text-[10px] text-rose-500 border-r border-slate-200/50 bg-slate-100/35 dark:bg-slate-900/35">
                                        -
                                      </td>
                                    </>
                                  )}
                                  <td className={`pl-4 pr-2 ${wrapClass} align-top text-rose-900 dark:text-rose-450 pt-1 text-[12.5px]`}>
                                    {renderLineCode(row.leftContent, 'delete', 'left', row.leftWords)}
                                  </td>
                                </tr>
   
                                {/* Target Line insertion */}
                                <tr className="font-mono text-xs leading-6 bg-emerald-50/40 border-l-[3px] border-emerald-500/70 dark:bg-emerald-950/10 border-b border-slate-100/50 dark:border-slate-900/10">
                                  {showLineNumbers && (
                                    <>
                                      <td className="w-12 text-right pr-2 select-none text-[10px] text-emerald-500 border-r border-slate-200/50 bg-slate-100/35 dark:bg-slate-900/35">
                                        +
                                      </td>
                                      <td className="w-12 text-right pr-2 select-none text-[10px] text-slate-400 border-r border-slate-200/50 bg-slate-100/35 dark:bg-slate-900/35">
                                        {row.rightLineNum}
                                      </td>
                                    </>
                                  )}
                                  <td className={`pl-4 pr-2 ${wrapClass} align-top text-emerald-900 dark:text-emerald-450 pt-1 text-[12.5px]`}>
                                    {renderLineCode(row.rightContent, 'insert', 'right', row.rightWords)}
                                  </td>
                                </tr>
                              </motion.div>
                            );
                          }

                          let textClass = 'text-slate-705 dark:text-slate-350';
                          let bgClass = 'bg-transparent';
                          let symbol = ' ';
                          let leftNum = row.leftLineNum as string | number || '';
                          let rightNum = row.rightLineNum as string | number || '';

                          if (isDelete) {
                            textClass = 'text-rose-900 dark:text-rose-450';
                            bgClass = 'bg-rose-50/40 border-l-[3px] border-rose-500/70 dark:bg-rose-950/10';
                            symbol = '-';
                            rightNum = '';
                          } else if (isInsert) {
                            textClass = 'text-emerald-900 dark:text-emerald-450';
                            bgClass = 'bg-emerald-50/40 border-l-[3px] border-emerald-500/70 dark:bg-emerald-950/10';
                            symbol = '+';
                            leftNum = '';
                          }

                          return (
                            <motion.tr
                              key={`unified-row-${idx}-${row.type}-${row.leftLineNum || 'L'}-${row.rightLineNum || 'R'}`}
                              id={`diff-row-${idx}`}
                              className={`font-mono text-xs leading-6 border-b border-slate-100/55 dark:border-slate-850/10 ${bgClass} ${
                                isRowNavHighlight ? 'ring-2 ring-indigo-500/80 ring-inset' : ''
                              }`}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.15, ease: 'easeOut' }}
                            >
                              {showLineNumbers && (
                                <>
                                  <td className="w-12 text-right pr-2 select-none text-[10px] text-slate-400 border-r border-slate-200/50 bg-slate-100/35 dark:bg-slate-900/35 pt-1">
                                    {leftNum}
                                  </td>
                                  <td className="w-12 text-right pr-2 select-none text-[10px] text-slate-400 border-r border-slate-200/50 bg-slate-100/35 dark:bg-slate-900/35 pt-1">
                                    {rightNum}
                                  </td>
                                </>
                              )}
                              <td className="w-8 text-center select-none font-bold font-mono text-[11px] opacity-40 text-slate-500 dark:text-slate-400 align-top pt-1">
                                {symbol}
                              </td>
                              <td className={`pl-4 pr-2 ${wrapClass} align-top ${textClass} pt-1 text-[12.5px]`}>
                                {renderLineCode(
                                  row.leftContent !== undefined ? row.leftContent : row.rightContent,
                                  row.type,
                                  row.leftContent !== undefined ? 'left' : 'right',
                                  row.leftContent !== undefined ? row.leftWords : row.rightWords
                                )}
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Bottom Analytics Bar */}
      <footer className="h-auto md:h-12 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-6 sm:px-8 py-3 md:py-0 flex flex-col md:flex-row items-center justify-between text-slate-700 dark:text-white gap-4 transition shadow-sm">
        <div className="flex flex-wrap gap-4 sm:gap-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>{additions} Insertions</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>{deletions} Deletions</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            <span>{modifications} Modifications</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 font-mono text-[11px] font-normal lowercase">
            &bull; congruency {similarityPercentage}%
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-450 dark:text-slate-500 uppercase font-mono">DIFF ALGORITHM:</span>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 select-all font-mono">MYERS_OPTIMIZED_V2</span>
          </div>
          <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-800"></div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Parsed in {parseTimeMs}ms (secured client-side)</span>
          </div>
        </div>
      </footer>

      {/* Keyboard Shortcuts Guide Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Keyboard className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Keyboard Shortcuts Guide</h3>
              </div>
              <button 
                onClick={() => setShowShortcutsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold dark:hover:text-white transition"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Unlock high-productivity text comparison using these simple, instant shortcuts. Alt modifiers work even while focusing input fields!
              </p>

              <div className="grid grid-cols-1 gap-2">
                {[
                  { keys: ['Alt', 'N'], desc: 'Jump to Next Difference' },
                  { keys: ['Alt', 'P'], desc: 'Jump to Previous Difference' },
                  { keys: ['Alt', 'X'], desc: 'Swap text layout fields' },
                  { keys: ['Alt', 'W'], desc: 'Toggle long lines wrapping toggle' },
                  { keys: ['Alt', 'L'], desc: 'Toggle line numbers' },
                  { keys: ['Alt', 'M'], desc: 'Toggle Word vs. Character Highlight mode' },
                  { keys: ['Alt', 'E'], desc: 'Export HTML report' },
                  { keys: ['Alt', 'C'], desc: 'Clear comparative inputs' },
                  { keys: ['Alt', 'K'], desc: 'Open / Close this helper guide' }
                ].map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-850 last:border-0">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{s.desc}</span>
                    <div className="flex items-center gap-1">
                      {s.keys.map((k, kIdx) => (
                        <kbd key={kIdx} className="px-1.5 py-0.5 text-[10px] font-bold font-mono tracking-wide bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 rounded shadow-2xs">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-850 flex justify-end">
              <button 
                onClick={() => setShowShortcutsModal(false)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-500/10 transition"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

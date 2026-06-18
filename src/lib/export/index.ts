import type { AlignedDiffRow } from '../diff/engine';

export interface DiffStats {
  similarityPercentage: number;
  additions: number;
  deletions: number;
  modifications: number;
}

export interface ReportOptions {
  showLineNumbers?: boolean;
  theme?: 'light' | 'dark';
  lineWrap?: boolean;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function buildTxtReport(
  rows: AlignedDiffRow[],
  stats: DiffStats,
  generatedAt: Date = new Date()
): string {
  let content = `JUXTA COMPARISON REPORT\n`;
  content += `Generated on: ${generatedAt.toLocaleString()}\n`;
  content += `Similarity Index: ${stats.similarityPercentage}%\n`;
  content += `Insertions: ${stats.additions} | Deletions: ${stats.deletions} | Modifications: ${stats.modifications}\n`;
  content += `==========================================\n\n`;

  rows.forEach(row => {
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

  return content;
}

export function buildMdReport(
  rows: AlignedDiffRow[],
  stats: DiffStats,
  generatedAt: Date = new Date()
): string {
  let content = `# Juxta Comparison Report\n\n`;
  content += `Generated on: **${generatedAt.toLocaleString()}** (Standard Secured Client)\n\n`;
  content += `### Comparison Summary\n`;
  content += `- **Congruency/Similarity Index**: ${stats.similarityPercentage}%\n`;
  content += `- **Status**: ${stats.similarityPercentage === 100 ? 'Identical files' : 'Differences detected'}\n`;
  content += `- **Insertions (+)**: ${stats.additions}\n`;
  content += `- **Deletions (-)**: ${stats.deletions}\n`;
  content += `- **Modifications (~)**: ${stats.modifications}\n\n`;
  content += `========================================================================\n\n`;
  content += `## Line-by-Line Changes\n\n`;
  content += `| Source (L) | Target (R) | Symbol | Content |\n`;
  content += `| :--- | :--- | :---: | :--- |\n`;

  rows.forEach(row => {
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

  return content;
}

export function buildJsonReport(
  rows: AlignedDiffRow[],
  stats: DiffStats,
  generatedAt: Date = new Date()
): string {
  const reportObj = {
    name: "Juxta Comparison Report",
    timestamp: generatedAt.toISOString(),
    analytics: {
      congruencyPercentage: stats.similarityPercentage,
      additions: stats.additions,
      deletions: stats.deletions,
      modifications: stats.modifications,
      identical: stats.similarityPercentage === 100
    },
    diffData: rows.map(row => ({
      type: row.type,
      leftLine: row.leftLineNum || null,
      rightLine: row.rightLineNum || null,
      leftContent: row.leftContent !== undefined ? row.leftContent : null,
      rightContent: row.rightContent !== undefined ? row.rightContent : null
    }))
  };
  return JSON.stringify(reportObj, null, 2);
}

export function buildHtmlReport(
  rows: AlignedDiffRow[],
  stats: DiffStats,
  opts: ReportOptions,
  generatedAt: Date = new Date()
): string {
  const showLineNumbers = opts.showLineNumbers ?? false;
  const isDark = opts.theme === 'dark';
  const lineWrap = opts.lineWrap ?? false;

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
  rows.forEach(row => {
    const leftTdNum = showLineNumbers ? `<td class="line-num">${row.leftLineNum || ''}</td>` : '';
    const rightTdNum = showLineNumbers ? `<td class="line-num">${row.rightLineNum || ''}</td>` : '';

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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Juxta - Code &amp; Prose Comparison Report</title>
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
    <h1>Juxta Comparison Report</h1>
    <p style="margin: 0; color: #64748b; font-size: 14px;">Generated on: ${generatedAt.toLocaleString()}</p>
    <div class="stats">
      <span class="stat-pill">Similarity: ${stats.similarityPercentage}%</span>
      <span class="stat-add">+ ${stats.additions} insertions</span>
      <span class="stat-del">- ${stats.deletions} deletions</span>
      <span class="stat-mod">~ ${stats.modifications} modifications</span>
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

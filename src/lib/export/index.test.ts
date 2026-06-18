import { test, expect } from 'bun:test';
import {
  escapeHtml, buildTxtReport, buildMdReport, buildJsonReport, buildHtmlReport
} from './index';
import type { AlignedDiffRow } from '../diff/engine';

const rows: AlignedDiffRow[] = [
  { type: 'equal', leftLineNum: 1, rightLineNum: 1, leftContent: 'same', rightContent: 'same' },
  { type: 'modify', leftLineNum: 2, rightLineNum: 2, leftContent: 'old', rightContent: 'new' }
];
const stats = { similarityPercentage: 50, additions: 0, deletions: 0, modifications: 1 };
const at = new Date('2026-06-18T00:00:00Z');

test('escapeHtml escapes the five entities', () => {
  expect(escapeHtml(`<a href="x" data='y'>&`)).toBe('&lt;a href=&quot;x&quot; data=&#039;y&#039;&gt;&amp;');
});

test('txt report includes the similarity index and content', () => {
  const out = buildTxtReport(rows, stats, at);
  expect(out).toContain('Similarity Index: 50%');
  expect(out).toContain('same');
});

test('md report renders a table and the summary', () => {
  const out = buildMdReport(rows, stats, at);
  expect(out).toContain('# DiffStudio Comparison Report'.replace('DiffStudio', 'Juxta'));
  expect(out).toContain('| Source (L) | Target (R) | Symbol | Content |');
});

test('json report is valid JSON with analytics + diffData', () => {
  const obj = JSON.parse(buildJsonReport(rows, stats, at));
  expect(obj.analytics.congruencyPercentage).toBe(50);
  expect(obj.diffData).toHaveLength(2);
});

test('html report is a full document with escaped content', () => {
  const out = buildHtmlReport(rows, stats, { showLineNumbers: true, theme: 'dark' }, at);
  expect(out.startsWith('<!DOCTYPE html>')).toBe(true);
  expect(out).toContain('row-modify');
});

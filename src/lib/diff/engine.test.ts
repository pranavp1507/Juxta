import { test, expect } from 'bun:test';
import { tokenize, diffTokens, diffLines, alignDiff } from './engine';

test('tokenize splits words, whitespace, and punctuation', () => {
  expect(tokenize('foo = bar()')).toEqual(['foo', ' ', '=', ' ', 'bar', '(', ')']);
});

test('tokenize returns empty array for empty string', () => {
  expect(tokenize('')).toEqual([]);
});

test('diffTokens marks inserts and deletes against equal tokens', () => {
  const result = diffTokens(['a', ' ', 'b'], ['a', ' ', 'c']);
  expect(result).toEqual([
    { type: 'equal', value: 'a' },
    { type: 'equal', value: ' ' },
    { type: 'delete', value: 'b' },
    { type: 'insert', value: 'c' }
  ]);
});

test('diffTokens with empty left is all inserts', () => {
  expect(diffTokens([], ['x', 'y'])).toEqual([
    { type: 'insert', value: 'x' },
    { type: 'insert', value: 'y' }
  ]);
});

test('diffLines returns all-equal ops for identical input', () => {
  const ops = diffLines(['a', 'b'], ['a', 'b']);
  expect(ops.map(o => o.type)).toEqual(['equal', 'equal']);
});

test('diffLines detects a single changed middle line via prefix/suffix strip', () => {
  const ops = diffLines(['a', 'X', 'c'], ['a', 'Y', 'c']);
  expect(ops.map(o => o.type)).toEqual(['equal', 'delete', 'insert', 'equal']);
});

test('diffLines preserves original line indices', () => {
  const ops = diffLines(['a', 'b'], ['a', 'c']);
  const insert = ops.find(o => o.type === 'insert');
  expect(insert).toMatchObject({ type: 'insert', rightIdx: 1 });
});

test('diffLines falls back to deletes-then-inserts above the safety cap', () => {
  const left = Array.from({ length: 3501 }, (_, i) => `L${i}`);
  const right = Array.from({ length: 3501 }, (_, i) => `R${i}`);
  const ops = diffLines(left, right);
  const types = ops.map(o => o.type);
  expect(types.filter(t => t === 'delete').length).toBe(3501);
  expect(types.filter(t => t === 'insert').length).toBe(3501);
  // all deletes precede all inserts
  expect(types.indexOf('insert')).toBeGreaterThan(types.lastIndexOf('delete'));
});

test('alignDiff pairs a delete+insert into a modify row with inline words', () => {
  const rows = alignDiff(diffLines(['hello world'], ['hello there']), 'word');
  expect(rows).toHaveLength(1);
  expect(rows[0].type).toBe('modify');
  expect(rows[0].leftWords?.some(w => w.type === 'delete' && w.value === 'world')).toBe(true);
  expect(rows[0].rightWords?.some(w => w.type === 'insert' && w.value === 'there')).toBe(true);
});

test('alignDiff emits standalone delete and insert rows when unpaired', () => {
  const rows = alignDiff(diffLines(['a'], ['a', 'b']));
  expect(rows.map(r => r.type)).toEqual(['equal', 'insert']);
});

test('alignDiff char mode diffs by character', () => {
  const rows = alignDiff(diffLines(['cat'], ['car']), 'char');
  expect(rows[0].type).toBe('modify');
  expect(rows[0].rightWords?.some(w => w.type === 'insert' && w.value === 'r')).toBe(true);
});

test('alignDiff sets 1-based line numbers', () => {
  const rows = alignDiff(diffLines(['a', 'b'], ['a', 'b']));
  expect(rows[0]).toMatchObject({ leftLineNum: 1, rightLineNum: 1 });
  expect(rows[1]).toMatchObject({ leftLineNum: 2, rightLineNum: 2 });
});

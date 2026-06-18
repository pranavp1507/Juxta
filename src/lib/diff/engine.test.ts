import { test, expect } from 'bun:test';
import { tokenize, diffTokens } from './engine';

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

import { test, expect } from 'bun:test';
import { tokenizeLanguage } from './tokenizer';

test('plain returns a single plain segment', () => {
  expect(tokenizeLanguage('hello', 'plain')).toEqual([{ text: 'hello', type: 'plain' }]);
});

test('ts highlights keywords', () => {
  const segs = tokenizeLanguage('const x = 1', 'ts');
  expect(segs.some(s => s.type === 'keyword' && s.text === 'const')).toBe(true);
  expect(segs.some(s => s.type === 'number' && s.text === '1')).toBe(true);
});

test('json marks keys as keyword and strings as string', () => {
  const segs = tokenizeLanguage('{"a": "b"}', 'json');
  expect(segs.some(s => s.type === 'keyword' && s.text === '"a"')).toBe(true);
  expect(segs.some(s => s.type === 'string' && s.text === '"b"')).toBe(true);
});

test('css marks selectors and properties', () => {
  const segs = tokenizeLanguage('.x { color: red; }', 'css');
  expect(segs.some(s => s.type === 'selector')).toBe(true);
  expect(segs.some(s => s.type === 'property' && s.text === 'color')).toBe(true);
});

test('html marks tags and attributes', () => {
  const segs = tokenizeLanguage('<a href="x">', 'html');
  expect(segs.some(s => s.type === 'tag' && s.text === 'a')).toBe(true);
  expect(segs.some(s => s.type === 'attribute' && s.text === 'href')).toBe(true);
});

test('concatenated segment text reconstructs the original input', () => {
  const input = 'const y = foo(1);';
  expect(tokenizeLanguage(input, 'ts').map(s => s.text).join('')).toBe(input);
});

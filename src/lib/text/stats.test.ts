import { test, expect } from 'bun:test';
import { getStats } from './stats';
test('counts lines, words, chars', () => {
  const s = getStats('hello world\nfoo');
  expect(s.lines).toBe(2);
  expect(s.words).toBe(3);
  expect(s.chars).toBe(15);
});
test('empty string is all zeros', () => {
  const s = getStats('');
  expect(s.lines).toBe(1); // split('\n') of '' is ['']
  expect(s.words).toBe(0);
});

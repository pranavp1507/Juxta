import { test, expect } from 'bun:test';
import { serialize, parseStored } from './persisted';

test('serialize round-trips primitives', () => {
  expect(parseStored(serialize('dark'), 'light')).toBe('dark');
  expect(parseStored(serialize(true), false)).toBe(true);
});

test('parseStored falls back to initial on null', () => {
  expect(parseStored(null, 'auto')).toBe('auto');
});

test('parseStored falls back to initial on malformed JSON', () => {
  expect(parseStored('{not json', 42)).toBe(42);
});

import { test, expect } from 'bun:test';
import { detectLanguage } from './detect';

test('empty string detects plain', () => {
  expect(detectLanguage('   ')).toBe('plain');
});

test('valid object detects json', () => {
  expect(detectLanguage('{"a": 1}')).toBe('json');
});

test('markup detects html', () => {
  expect(detectLanguage('<!DOCTYPE html><html></html>')).toBe('html');
});

test('rule block detects css', () => {
  expect(detectLanguage('.btn { color: red; }')).toBe('css');
});

test('code keywords detect ts', () => {
  expect(detectLanguage('const x = 1;')).toBe('ts');
});

test('unrecognized prose falls through to ts', () => {
  expect(detectLanguage('the quick brown fox jumps')).toBe('ts');
});

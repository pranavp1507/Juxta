import { test, expect } from 'bun:test';
import { toLowerCaseText, sortLines, removeExcessWhitespace, replaceLineBreaks } from './transforms';
test('lowercase', () => { expect(toLowerCaseText('AbC')).toBe('abc'); });
test('sortLines orders case-insensitively', () => {
  expect(sortLines('banana\nApple\ncherry')).toBe('Apple\nbanana\ncherry');
});
test('removeExcessWhitespace trims and collapses', () => {
  expect(removeExcessWhitespace('  a   b  \n\n\n\nc ')).toBe('a b\n\nc');
});
test('replaceLineBreaks resolves special tokens', () => {
  expect(replaceLineBreaks('a\nb', ', ')).toBe('a, b');
  expect(replaceLineBreaks('a\nb', '\\t')).toBe('a\tb');
  expect(replaceLineBreaks('a\nb', 'space')).toBe('a b');
});

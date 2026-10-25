import { expect, it } from 'vitest';
import rawReadme from '../../../README.md?raw';
import { SHORTCUTS } from '../../data/shortcuts';
// @ts-expect-error -- Node ESM tool is JavaScript without a TypeScript declaration.
import { renderShortcutsMarkdown } from '../../../tools/sync-shortcuts.mjs';

// A Windows checkout may hold CRLF line endings; the table is compared as LF.
const readme = rawReadme.replaceAll('\r\n', '\n');

it('readme_generated_matches_table', () => {
  const startMarker = '<!-- shortcuts:start -->';
  const endMarker = '<!-- shortcuts:end -->';
  const start = readme.indexOf(startMarker);
  const end = readme.indexOf(endMarker, start + startMarker.length);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  expect(readme.slice(start + startMarker.length, end)).toBe(renderShortcutsMarkdown(SHORTCUTS));
});

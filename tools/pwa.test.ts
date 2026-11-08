import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';
import { afterEach, describe, expect, it } from 'vitest';
import { buildPwa, crc32, listBuildFiles, makeIcon, serviceWorkerSource } from './pwa';

/** Minimal PNG reader for the encoder's own output (one IDAT, filter 0, RGBA8). */
const readPng = (png: Uint8Array) => {
  const b = Buffer.from(png);
  expect([...b.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const width = b.readUInt32BE(16);
  const height = b.readUInt32BE(20);
  const idatLen = b.readUInt32BE(33);
  expect(b.toString('ascii', 37, 41)).toBe('IDAT');
  const raw = inflateSync(b.subarray(41, 41 + idatLen));
  const at = (x: number, y: number) => {
    const i = y * (width * 4 + 1) + 1 + x * 4;
    return [raw[i], raw[i + 1], raw[i + 2], raw[i + 3]];
  };
  return { width, height, at };
};

describe('PWA icons', () => {
  it('crc32 matches the PNG reference value', () => {
    expect(crc32(Buffer.from('IEND', 'ascii'))).toBe(0xae426082);
  });

  it.each([
    [192, false],
    [512, false],
    [512, true],
  ] as const)('%i px (maskable %s) is an opaque, deterministic PNG with the gold crown', (size, maskable) => {
    const png = makeIcon(size, maskable);
    expect(Buffer.from(makeIcon(size, maskable)).equals(Buffer.from(png))).toBe(true);
    const img = readPng(png);
    expect([img.width, img.height]).toEqual([size, size]);
    expect(img.at(0, 0)).toEqual([0x2a, 0x1a, 0x14, 255]);
    expect(img.at(size / 2, Math.floor(size * 0.3))).toEqual([0xf6, 0xc4, 0x45, 255]); // middle spike
  });

  it('the maskable crown stays inside the central safe circle (radius 40%)', () => {
    const img = readPng(makeIcon(512, true));
    for (let y = 0; y < 512; y += 4)
      for (let x = 0; x < 512; x += 4) {
        const [r] = img.at(x, y);
        if (r !== 0x2a) expect((x - 256) ** 2 + (y - 256) ** 2).toBeLessThanOrEqual((512 * 0.4) ** 2);
      }
  });
});

describe('service worker', () => {
  let dir = '';
  afterEach(() => dir && rmSync(dir, { recursive: true, force: true }));

  it('precaches every build file (nested, sorted, relative), never itself, and changes version with content', () => {
    dir = mkdtempSync(join(tmpdir(), 'ck-pwa-'));
    mkdirSync(join(dir, 'assets/art'), { recursive: true });
    writeFileSync(join(dir, 'index.html'), '<html>');
    writeFileSync(join(dir, 'assets/index-abc123.js'), 'js');
    writeFileSync(join(dir, 'assets/art/a.png'), 'png1');
    writeFileSync(join(dir, 'sw.js'), 'old');
    expect(listBuildFiles(dir)).toEqual(['assets/art/a.png', 'assets/index-abc123.js', 'index.html']);
    const first = buildPwa(dir);
    const sw = readFileSync(join(dir, 'sw.js'), 'utf-8');
    expect(sw).toContain('"./assets/art/a.png"');
    expect(sw).toContain('"./index.html"');
    expect(sw).not.toContain('sw.js"');
    expect(sw).not.toMatch(/"\/assets/); // relative URLs only, so any base path works
    writeFileSync(join(dir, 'assets/art/a.png'), 'png2');
    expect(buildPwa(dir).version).not.toBe(first.version);
  });

  it('installs all-or-nothing, ignores foreign and non-GET requests, never skips waiting on its own', () => {
    const sw = serviceWorkerSource(['index.html'], 'v1');
    expect(sw).toContain('cache.addAll(URLS)');
    expect(sw).toContain("req.method !== 'GET'");
    expect(sw).toContain('origin !== self.location.origin');
    expect(sw).toContain("k.startsWith('ck-') && k !== CACHE");
    expect(sw.match(/self\.skipWaiting\(\)/g)).toHaveLength(1); // only on the page's explicit message
  });
});

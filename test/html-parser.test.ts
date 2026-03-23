import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseHtml } from '../src/crawl/html-parser.js';

const fixtureHtml = readFileSync(
  new URL('./fixtures/sample.html', import.meta.url),
  'utf-8',
);

describe('parseHtml', () => {
  it('extracts script src attributes', () => {
    const results = parseHtml(fixtureHtml, 'https://example.com/');
    const urls = results.map((r) => r.url);

    assert.ok(urls.includes('https://example.com/static/js/main.abc123.js'));
    assert.ok(urls.includes('https://example.com/static/js/vendor.def456.js'));
    assert.ok(urls.includes('https://example.com/static/js/chunk.ghi789.js'));
  });

  it('resolves CDN and external URLs', () => {
    const results = parseHtml(fixtureHtml, 'https://example.com/');
    const urls = results.map((r) => r.url);

    assert.ok(urls.includes('https://cdn.example.com/lib.js'));
  });

  it('resolves protocol-relative URLs', () => {
    const results = parseHtml(fixtureHtml, 'https://example.com/');
    const urls = results.map((r) => r.url);

    assert.ok(urls.includes('https://cdn.example.com/protocol-relative.js'));
  });

  it('resolves relative paths', () => {
    const results = parseHtml(fixtureHtml, 'https://example.com/app/page.html');
    const urls = results.map((r) => r.url);

    assert.ok(urls.includes('https://example.com/shared/utils.js'));
  });

  it('extracts modulepreload links', () => {
    const results = parseHtml(fixtureHtml, 'https://example.com/');
    const urls = results.map((r) => r.url);

    assert.ok(urls.includes('https://example.com/assets/module-a.js'));
  });

  it('extracts preload as=script links', () => {
    const results = parseHtml(fixtureHtml, 'https://example.com/');
    const urls = results.map((r) => r.url);

    assert.ok(urls.includes('https://example.com/assets/preload-b.js'));
  });

  it('does not include non-script preloads', () => {
    const results = parseHtml(fixtureHtml, 'https://example.com/');
    const urls = results.map((r) => r.url);

    assert.ok(!urls.some((u) => u.includes('styles.css')));
    assert.ok(!urls.some((u) => u.includes('app.css')));
  });

  it('does not include duplicate URLs', () => {
    const html = `
      <script src="/app.js"></script>
      <script src="/app.js"></script>
      <link rel="modulepreload" href="/app.js">
    `;
    const results = parseHtml(html, 'https://example.com/');
    const urls = results.map((r) => r.url);
    const unique = [...new Set(urls)];

    assert.equal(urls.length, unique.length);
  });

  it('marks all entries with source html', () => {
    const results = parseHtml(fixtureHtml, 'https://example.com/');
    assert.ok(results.every((r) => r.source === 'html'));
  });

  it('returns empty array for HTML without scripts', () => {
    const results = parseHtml('<html><body><p>Hello</p></body></html>', 'https://example.com/');
    assert.equal(results.length, 0);
  });
});

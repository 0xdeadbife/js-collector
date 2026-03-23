import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectFrameworkHints } from '../src/crawl/framework-hints.js';

describe('detectFrameworkHints', () => {
  describe('Next.js', () => {
    it('detects /_next/static in HTML', () => {
      const html = '<script src="/_next/static/chunks/main.js"></script>';
      const hints = detectFrameworkHints(html);
      assert.ok(hints.has('nextjs'));
      assert.ok(hints.has('react'), 'Next.js should imply React');
    });

    it('detects __NEXT_DATA__ in HTML', () => {
      const html = '<script id="__NEXT_DATA__" type="application/json">{"page":"/"}</script>';
      const hints = detectFrameworkHints(html);
      assert.ok(hints.has('nextjs'));
      assert.ok(hints.has('react'));
    });
  });

  describe('Angular', () => {
    it('detects ng-version attribute', () => {
      const html = '<app-root ng-version="15.0.0"></app-root>';
      const hints = detectFrameworkHints(html);
      assert.ok(hints.has('angular'));
      assert.ok(!hints.has('react'));
    });

    it('detects ng.core reference', () => {
      const html = '<script>var ng = ng || {}; ng.core = {};</script>';
      const hints = detectFrameworkHints(html);
      assert.ok(hints.has('angular'));
    });
  });

  describe('Vue / Nuxt', () => {
    it('detects __nuxt in HTML', () => {
      const html = '<div id="__nuxt"></div>';
      const hints = detectFrameworkHints(html);
      assert.ok(hints.has('vue'));
    });

    it('detects data-v- Vue attributes', () => {
      const html = '<div data-v-7ba5bd90 class="app"></div>';
      const hints = detectFrameworkHints(html);
      assert.ok(hints.has('vue'));
    });

    it('detects __vue reference', () => {
      const html = '<script>window.__vue = true;</script>';
      const hints = detectFrameworkHints(html);
      assert.ok(hints.has('vue'));
    });
  });

  describe('React / CRA', () => {
    it('detects asset-manifest.json reference', () => {
      const html = '<link rel="manifest" href="/asset-manifest.json">';
      const hints = detectFrameworkHints(html);
      assert.ok(hints.has('react'));
      assert.ok(!hints.has('nextjs'));
    });

    it('detects root div + hashed JS chunks', () => {
      const html = `
        <div id="root"></div>
        <script src="/static/js/main.abc123.js"></script>
      `;
      const hints = detectFrameworkHints(html);
      assert.ok(hints.has('react'));
    });

    it('does not set react standalone when nextjs already detected', () => {
      const html = '/_next/static/chunks/app.js and <div id="root">';
      const hints = detectFrameworkHints(html);
      // nextjs already implies react; we should not add duplicate 'react' detection path
      assert.ok(hints.has('nextjs'));
      assert.ok(hints.has('react'));
    });
  });

  describe('multiple frameworks', () => {
    it('can detect multiple frameworks simultaneously', () => {
      const html = `
        <app-root ng-version="15.0.0"></app-root>
        <div id="__nuxt"></div>
      `;
      const hints = detectFrameworkHints(html);
      assert.ok(hints.has('angular'));
      assert.ok(hints.has('vue'));
    });
  });

  describe('no framework', () => {
    it('returns empty set for plain HTML', () => {
      const html = '<html><body><p>Hello</p></body></html>';
      const hints = detectFrameworkHints(html);
      assert.equal(hints.size, 0);
    });

    it('returns empty set for empty string', () => {
      const hints = detectFrameworkHints('');
      assert.equal(hints.size, 0);
    });
  });
});

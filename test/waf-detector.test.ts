import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectWaf } from '../src/crawl/waf-detector.js';

describe('detectWaf', () => {
  describe('rate-limited (429)', () => {
    it('detects 429 as rate-limited', () => {
      const result = detectWaf(429, '', 'https://example.com/', 'text/html');
      assert.equal(result.signal, 'rate-limited');
      assert.equal(result.shouldBlock, false);
    });
  });

  describe('captcha-redirect', () => {
    it('detects captcha in final URL', () => {
      const result = detectWaf(200, 'some body', 'https://example.com/captcha', 'text/html');
      assert.equal(result.signal, 'captcha-redirect');
      assert.equal(result.shouldBlock, true);
    });

    it('detects /challenge in final URL', () => {
      const result = detectWaf(200, 'body', 'https://example.com/challenge/verify', 'text/html');
      assert.equal(result.signal, 'captcha-redirect');
      assert.equal(result.shouldBlock, true);
    });

    it('detects hcaptcha in final URL', () => {
      const result = detectWaf(200, 'body', 'https://hcaptcha.com/verify', 'text/html');
      assert.equal(result.signal, 'captcha-redirect');
      assert.equal(result.shouldBlock, true);
    });
  });

  describe('cloudflare', () => {
    it('detects cf-ray in body', () => {
      const body = '<html><body>Error cf-ray: 12345-LAX</body></html>';
      const result = detectWaf(503, body, 'https://example.com/', 'text/html');
      assert.equal(result.signal, 'cloudflare');
      assert.equal(result.shouldBlock, true);
    });

    it('detects "Just a moment" in body', () => {
      const body = '<title>Just a moment...</title><body>Checking your browser</body>';
      const result = detectWaf(200, body, 'https://example.com/', 'text/html');
      assert.equal(result.signal, 'cloudflare');
      assert.equal(result.shouldBlock, true);
    });

    it('detects __cf_chl in body', () => {
      const body = 'window.__cf_chl_opt = {};';
      const result = detectWaf(403, body, 'https://example.com/', 'text/html');
      assert.equal(result.signal, 'cloudflare');
      assert.equal(result.shouldBlock, true);
    });

    it('detects cloudflare-static in body', () => {
      const body = '<script src="https://cloudflare-static.com/rocket.js"></script>';
      const result = detectWaf(200, body, 'https://example.com/', 'text/html');
      assert.equal(result.signal, 'cloudflare');
      assert.equal(result.shouldBlock, true);
    });
  });

  describe('generic-403', () => {
    it('detects plain 403 without other markers', () => {
      const result = detectWaf(403, 'Forbidden', 'https://example.com/secret', 'text/html');
      assert.equal(result.signal, 'generic-403');
      assert.equal(result.shouldBlock, false);
    });
  });

  describe('suspicious-empty', () => {
    it('detects 200 with near-empty non-JS non-HTML body', () => {
      const result = detectWaf(200, 'ok', 'https://example.com/api', 'application/json');
      assert.equal(result.signal, 'suspicious-empty');
      assert.equal(result.shouldBlock, false);
    });

    it('does not flag 200 with empty JS body', () => {
      const result = detectWaf(200, '', 'https://example.com/app.js', 'application/javascript');
      assert.equal(result.signal, null);
    });

    it('does not flag 200 with empty HTML body', () => {
      const result = detectWaf(200, '', 'https://example.com/', 'text/html');
      assert.equal(result.signal, null);
    });

    it('does not flag 200 with longer body', () => {
      const body = 'x'.repeat(100);
      const result = detectWaf(200, body, 'https://example.com/api', 'application/json');
      assert.equal(result.signal, null);
    });
  });

  describe('no signal', () => {
    it('returns null for normal 200 response', () => {
      const body = '<html><body><script src="/app.js"></script></body></html>';
      const result = detectWaf(200, body, 'https://example.com/', 'text/html');
      assert.equal(result.signal, null);
      assert.equal(result.shouldBlock, false);
    });

    it('returns null for 404', () => {
      const result = detectWaf(404, 'Not Found', 'https://example.com/missing', 'text/html');
      assert.equal(result.signal, null);
    });

    it('returns null for normal JSON response with sufficient content', () => {
      const body = '{"scripts": ["app.js", "vendor.js", "chunk-1.abc123.js", "chunk-2.def456.js"]}';
      const result = detectWaf(200, body, 'https://example.com/manifest.json', 'application/json');
      assert.equal(result.signal, null);
    });

    it('handles null content-type gracefully', () => {
      const result = detectWaf(200, 'hello world this is a longer body that exceeds 50 chars', 'https://example.com/', null);
      assert.equal(result.signal, null);
    });
  });
});

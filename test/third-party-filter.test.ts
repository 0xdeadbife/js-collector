import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { filterThirdParty } from '../src/filter/third-party-filter.js';
import type { ScriptEntry } from '../src/types.js';

function makeEntry(url: string): ScriptEntry {
  return { url, source: 'html' };
}

describe('filterThirdParty', () => {
  const targetHost = 'example.com';

  describe('Layer 1: CDN hostname matching', () => {
    it('marks scripts from cdnjs.cloudflare.com as third-party', () => {
      const entries = [makeEntry('https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js')];
      const result = filterThirdParty(entries, targetHost);
      assert.equal(result[0].thirdParty, true);
    });

    it('marks scripts from cdn.jsdelivr.net as third-party', () => {
      const entries = [makeEntry('https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js')];
      const result = filterThirdParty(entries, targetHost);
      assert.equal(result[0].thirdParty, true);
    });

    it('marks scripts from unpkg.com as third-party', () => {
      const entries = [makeEntry('https://unpkg.com/react@18.0.0/umd/react.production.min.js')];
      const result = filterThirdParty(entries, targetHost);
      assert.equal(result[0].thirdParty, true);
    });

    it('marks scripts from ajax.googleapis.com as third-party', () => {
      const entries = [makeEntry('https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js')];
      const result = filterThirdParty(entries, targetHost);
      assert.equal(result[0].thirdParty, true);
    });

    it('marks scripts from code.jquery.com as third-party', () => {
      const entries = [makeEntry('https://code.jquery.com/jquery-3.6.0.min.js')];
      const result = filterThirdParty(entries, targetHost);
      assert.equal(result[0].thirdParty, true);
    });

    it('marks scripts from stackpath.bootstrapcdn.com as third-party', () => {
      const entries = [makeEntry('https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js')];
      const result = filterThirdParty(entries, targetHost);
      assert.equal(result[0].thirdParty, true);
    });
  });

  describe('Layer 2: Filename pattern matching (self-hosted libs)', () => {
    it('marks self-hosted jquery as third-party', () => {
      const entries = [makeEntry('https://example.com/js/jquery-3.6.0.min.js')];
      const result = filterThirdParty(entries, targetHost);
      assert.equal(result[0].thirdParty, true);
    });

    it('marks self-hosted react as third-party', () => {
      const entries = [makeEntry('https://example.com/vendor/react.production.min.js')];
      const result = filterThirdParty(entries, targetHost);
      assert.equal(result[0].thirdParty, true);
    });

    it('marks self-hosted react-dom as third-party', () => {
      const entries = [makeEntry('https://example.com/vendor/react-dom.production.min.js')];
      const result = filterThirdParty(entries, targetHost);
      assert.equal(result[0].thirdParty, true);
    });

    it('marks self-hosted lodash as third-party', () => {
      const entries = [makeEntry('https://example.com/static/lodash.min.js')];
      const result = filterThirdParty(entries, targetHost);
      assert.equal(result[0].thirdParty, true);
    });

    it('marks self-hosted lodash with version as third-party', () => {
      const entries = [makeEntry('https://example.com/static/lodash-4.17.21.min.js')];
      const result = filterThirdParty(entries, targetHost);
      assert.equal(result[0].thirdParty, true);
    });

    it('marks self-hosted moment as third-party', () => {
      const entries = [makeEntry('https://example.com/js/moment.min.js')];
      const result = filterThirdParty(entries, targetHost);
      assert.equal(result[0].thirdParty, true);
    });

    it('marks self-hosted bootstrap as third-party', () => {
      const entries = [makeEntry('https://example.com/js/bootstrap.bundle.min.js')];
      const result = filterThirdParty(entries, targetHost);
      assert.equal(result[0].thirdParty, true);
    });

    it('marks self-hosted axios as third-party', () => {
      const entries = [makeEntry('https://example.com/vendor/axios.min.js')];
      const result = filterThirdParty(entries, targetHost);
      assert.equal(result[0].thirdParty, true);
    });

    it('marks self-hosted vue as third-party', () => {
      const entries = [makeEntry('https://example.com/js/vue.global.prod.js')];
      const result = filterThirdParty(entries, targetHost);
      assert.equal(result[0].thirdParty, true);
    });

    it('marks self-hosted d3 as third-party', () => {
      const entries = [makeEntry('https://example.com/js/d3.min.js')];
      const result = filterThirdParty(entries, targetHost);
      assert.equal(result[0].thirdParty, true);
    });

    it('marks self-hosted socket.io as third-party', () => {
      const entries = [makeEntry('https://example.com/js/socket.io.min.js')];
      const result = filterThirdParty(entries, targetHost);
      assert.equal(result[0].thirdParty, true);
    });

    it('marks vendor bundle as third-party', () => {
      const entries = [makeEntry('https://example.com/static/vendor.bundle.js')];
      const result = filterThirdParty(entries, targetHost);
      assert.equal(result[0].thirdParty, true);
    });
  });

  describe('Layer 3: Cross-host heuristic', () => {
    it('marks scripts from a different host as third-party', () => {
      const entries = [makeEntry('https://otherdomain.com/some-custom-lib.js')];
      const result = filterThirdParty(entries, targetHost);
      assert.equal(result[0].thirdParty, true);
    });

    it('marks scripts from a subdomain not in trusted list as third-party', () => {
      const entries = [makeEntry('https://cdn.otherdomain.com/app.js')];
      const result = filterThirdParty(entries, targetHost);
      assert.equal(result[0].thirdParty, true);
    });
  });

  describe('First-party scripts', () => {
    it('marks scripts from the same host as first-party', () => {
      const entries = [makeEntry('https://example.com/js/app.js')];
      const result = filterThirdParty(entries, targetHost);
      assert.equal(result[0].thirdParty, false);
    });

    it('marks scripts from www.example.com as first-party when target is example.com', () => {
      const entries = [makeEntry('https://www.example.com/js/main.js')];
      const result = filterThirdParty(entries, targetHost);
      assert.equal(result[0].thirdParty, false);
    });

    it('marks scripts with custom names from the same host as first-party', () => {
      const entries = [
        makeEntry('https://example.com/static/js/main.abc123.js'),
        makeEntry('https://example.com/static/js/dashboard.chunk.js'),
        makeEntry('https://example.com/assets/app-bundle.js'),
      ];
      const result = filterThirdParty(entries, targetHost);
      assert.ok(result.every((e) => e.thirdParty === false));
    });

    it('marks hashed bundle filenames from the same host as first-party', () => {
      const entries = [makeEntry('https://example.com/static/js/2.a1b2c3d4.chunk.js')];
      const result = filterThirdParty(entries, targetHost);
      assert.equal(result[0].thirdParty, false);
    });
  });

  describe('Trusted domains', () => {
    it('marks scripts from trusted subdomains as first-party', () => {
      const entries = [makeEntry('https://static.example.com/js/app.js')];
      const result = filterThirdParty(entries, targetHost, {
        trustedDomains: ['static.example.com'],
      });
      assert.equal(result[0].thirdParty, false);
    });

    it('marks scripts from multiple trusted domains as first-party', () => {
      const entries = [
        makeEntry('https://cdn.example.com/js/app.js'),
        makeEntry('https://assets.example.com/js/utils.js'),
      ];
      const result = filterThirdParty(entries, targetHost, {
        trustedDomains: ['cdn.example.com', 'assets.example.com'],
      });
      assert.ok(result.every((e) => e.thirdParty === false));
    });

    it('still marks untrusted domains as third-party even when trusted list is set', () => {
      const entries = [makeEntry('https://evil.com/tracker.js')];
      const result = filterThirdParty(entries, targetHost, {
        trustedDomains: ['static.example.com'],
      });
      assert.equal(result[0].thirdParty, true);
    });

    it('trusted domain libs are still marked as third-party if they match lib patterns', () => {
      // Even if you trust your own CDN, if you serve jquery from it, it's still a library
      const entries = [makeEntry('https://static.example.com/vendor/jquery-3.6.0.min.js')];
      const result = filterThirdParty(entries, targetHost, {
        trustedDomains: ['static.example.com'],
      });
      assert.equal(result[0].thirdParty, true);
    });
  });

  describe('Edge cases', () => {
    it('handles empty entries array', () => {
      const result = filterThirdParty([], targetHost);
      assert.deepEqual(result, []);
    });

    it('preserves the source field on entries', () => {
      const entries: ScriptEntry[] = [{ url: 'https://example.com/app.js', source: 'manifest' }];
      const result = filterThirdParty(entries, targetHost);
      assert.equal(result[0].source, 'manifest');
    });

    it('preserves all entries (no filtering/removal)', () => {
      const entries = [
        makeEntry('https://example.com/app.js'),
        makeEntry('https://cdnjs.cloudflare.com/jquery.min.js'),
        makeEntry('https://example.com/vendor/react.production.min.js'),
      ];
      const result = filterThirdParty(entries, targetHost);
      assert.equal(result.length, 3);
    });
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readUrls } from '../src/input/url-reader.js';

describe('readUrls', () => {
  it('parses a single URL', async () => {
    const urls = await readUrls('https://example.com');
    assert.deepEqual(urls, ['https://example.com/']);
  });

  it('adds https:// scheme if missing', async () => {
    const urls = await readUrls('example.com');
    assert.deepEqual(urls, ['https://example.com/']);
  });

  it('reads URLs from a file', async () => {
    const tmpFile = join(tmpdir(), `test-urls-${Date.now()}.txt`);
    writeFileSync(tmpFile, 'https://a.com\nhttps://b.com\nhttps://c.com\n');

    try {
      const urls = await readUrls(tmpFile);
      assert.equal(urls.length, 3);
      assert.ok(urls[0].includes('a.com'));
      assert.ok(urls[1].includes('b.com'));
      assert.ok(urls[2].includes('c.com'));
    } finally {
      unlinkSync(tmpFile);
    }
  });

  it('skips empty lines and comments in files', async () => {
    const tmpFile = join(tmpdir(), `test-urls-${Date.now()}.txt`);
    writeFileSync(tmpFile, 'https://a.com\n\n# comment\nhttps://b.com\n  \n');

    try {
      const urls = await readUrls(tmpFile);
      assert.equal(urls.length, 2);
    } finally {
      unlinkSync(tmpFile);
    }
  });

  it('throws on invalid URL', async () => {
    await assert.rejects(() => readUrls('not a valid url!!!'), /Invalid URL/);
  });
});

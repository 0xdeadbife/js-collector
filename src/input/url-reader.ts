import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

/**
 * Normalize a URL string: ensure it has a scheme, trim whitespace.
 */
function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  let url = trimmed;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  try {
    const parsed = new URL(url);
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Read URLs from a single argument — either a URL string or a path to a file
 * containing one URL per line.
 */
export async function readUrls(input: string): Promise<string[]> {
  // If the input looks like a file path and exists on disk, read it
  if (existsSync(input) && !input.startsWith('http')) {
    const content = await readFile(input, 'utf-8');
    const lines = content.split(/\r?\n/);
    const urls: string[] = [];

    for (const line of lines) {
      const normalized = normalizeUrl(line);
      if (normalized) urls.push(normalized);
    }

    if (urls.length === 0) {
      throw new Error(`No valid URLs found in file: ${input}`);
    }
    return urls;
  }

  // Otherwise treat it as a single URL
  const normalized = normalizeUrl(input);
  if (!normalized) {
    throw new Error(`Invalid URL: ${input}`);
  }
  return [normalized];
}

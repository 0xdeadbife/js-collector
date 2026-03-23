import { spawn, execFileSync } from 'node:child_process';
import type { ScriptEntry } from '../types.js';

let availabilityChecked = false;
let isAvailable = false;

function checkAvailable(): boolean {
  if (availabilityChecked) return isAvailable;
  availabilityChecked = true;
  try {
    execFileSync('which', ['getJS'], { stdio: 'ignore' });
    isAvailable = true;
  } catch {
    console.warn('[getJS] Binary not found in PATH, skipping.');
    isAvailable = false;
  }
  return isAvailable;
}

/**
 * Run getJS on a URL and collect JS file URLs from output.
 */
export async function runGetJs(url: string): Promise<ScriptEntry[]> {
  if (!checkAvailable()) return [];

  return new Promise((resolve) => {
    const entries: ScriptEntry[] = [];

    const proc = spawn('getJS', ['--url', url], {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 60_000,
    });

    let buffer = '';
    proc.stdout.on('data', (data: Buffer) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          try {
            const resolved = new URL(trimmed, url);
            entries.push({ url: resolved.href, source: 'getjs' });
          } catch {
            // skip
          }
        }
      }
    });

    proc.stderr.on('data', () => {
      // Ignore stderr noise
    });

    proc.on('error', () => {
      resolve([]);
    });

    proc.on('close', () => {
      if (buffer.trim()) {
        try {
          const resolved = new URL(buffer.trim(), url);
          entries.push({ url: resolved.href, source: 'getjs' });
        } catch {
          // skip
        }
      }
      resolve(entries);
    });
  });
}

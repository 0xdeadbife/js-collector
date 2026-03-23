import { spawn, execFileSync } from 'node:child_process';
import type { ScriptEntry } from '../types.js';

let availabilityChecked = false;
let isAvailable = false;

function checkAvailable(): boolean {
  if (availabilityChecked) return isAvailable;
  availabilityChecked = true;
  try {
    execFileSync('which', ['katana'], { stdio: 'ignore' });
    isAvailable = true;
  } catch {
    console.warn('[katana] Binary not found in PATH, skipping.');
    isAvailable = false;
  }
  return isAvailable;
}

/**
 * Run katana with -js-crawl on a URL and collect JS file URLs from output.
 */
export async function runKatana(url: string): Promise<ScriptEntry[]> {
  if (!checkAvailable()) return [];

  return new Promise((resolve) => {
    const entries: ScriptEntry[] = [];

    const proc = spawn('katana', ['-u', url, '-js-crawl', '-silent'], {
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
        if (trimmed && /\.js(\?.*)?$/i.test(trimmed)) {
          try {
            new URL(trimmed);
            entries.push({ url: trimmed, source: 'katana' });
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

    proc.on('close', (code) => {
      if (buffer.trim() && /\.js(\?.*)?$/i.test(buffer.trim())) {
        try {
          new URL(buffer.trim());
          entries.push({ url: buffer.trim(), source: 'katana' });
        } catch {
          // skip
        }
      }

      if (code !== 0 && code !== null && code !== 1) {
        console.warn(`[katana] Exited with code ${code}`);
      }
      resolve(entries);
    });
  });
}

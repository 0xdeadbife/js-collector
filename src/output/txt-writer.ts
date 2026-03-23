import { writeFile } from 'node:fs/promises';
import type { CollectorResult } from '../types.js';

/**
 * Write results to a plain text file, grouped by host.
 */
export async function writeTxt(
  results: CollectorResult[],
  filePath: string,
): Promise<void> {
  const lines: string[] = [];

  for (const result of results) {
    lines.push(`[${result.host}] ${result.url}`);

    if (result.status === 'error') {
      lines.push(`  Error: ${result.error}`);
    } else if (result.scripts.length === 0) {
      lines.push('  No JavaScript files found.');
    } else {
      for (const script of result.scripts) {
        lines.push(`  ${script.url}`);
      }
    }

    lines.push('');
  }

  await writeFile(filePath, lines.join('\n'), 'utf-8');
}

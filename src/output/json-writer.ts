import { writeFile } from 'node:fs/promises';
import type { CollectorResult } from '../types.js';

/**
 * Write results to a JSON file.
 */
export async function writeJson(
  results: CollectorResult[],
  filePath: string,
): Promise<void> {
  await writeFile(filePath, JSON.stringify(results, null, 2), 'utf-8');
}

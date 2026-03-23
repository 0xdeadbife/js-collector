import { writeFile } from 'node:fs/promises';
import { stringify } from 'csv-stringify/sync';
import type { CollectorResult } from '../types.js';

/**
 * Write results to a CSV file with columns: host, url, script_url, source.
 */
export async function writeCsv(
  results: CollectorResult[],
  filePath: string,
): Promise<void> {
  const rows: string[][] = [['host', 'url', 'script_url', 'source']];

  for (const result of results) {
    if (result.scripts.length === 0) {
      rows.push([result.host, result.url, '', result.status]);
    } else {
      for (const script of result.scripts) {
        rows.push([result.host, result.url, script.url, script.source]);
      }
    }
  }

  const csv = stringify(rows);
  await writeFile(filePath, csv, 'utf-8');
}

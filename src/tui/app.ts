import chalk from 'chalk';
import { collectScripts } from '../core/collector.js';
import { TaskQueue } from '../concurrency/queue.js';
import { printResults } from '../output/console.js';
import { writeTxt } from '../output/txt-writer.js';
import { writeCsv } from '../output/csv-writer.js';
import type { CollectorOptions, CollectorResult } from '../types.js';

/**
 * Simple interactive TUI using raw terminal input.
 * A lightweight approach without requiring ink/react dependencies.
 */
export async function launchTui(
  urls: string[],
  options: CollectorOptions,
): Promise<void> {
  const results: CollectorResult[] = [];
  const statuses = new Map<string, 'queued' | 'in-progress' | 'completed' | 'error'>();

  for (const url of urls) {
    statuses.set(url, 'queued');
  }

  const queue = new TaskQueue(options.concurrency);

  // Status symbols
  const symbols: Record<string, string> = {
    queued: chalk.dim('○'),
    'in-progress': chalk.yellow('◉'),
    completed: chalk.green('●'),
    error: chalk.red('✗'),
  };

  function renderStatus(): void {
    // Clear screen and move to top
    process.stdout.write('\x1B[2J\x1B[H');
    console.log(chalk.bold.cyan('  js-collector') + chalk.dim(' — JavaScript File Discovery\n'));

    const progress = queue.progress;
    const pct = progress.total > 0
      ? Math.round(((progress.completed + progress.failed) / progress.total) * 100)
      : 0;

    // Progress bar
    const barWidth = 30;
    const filled = Math.round(barWidth * (pct / 100));
    const bar = chalk.cyan('█'.repeat(filled)) + chalk.dim('░'.repeat(barWidth - filled));
    console.log(`  ${bar} ${pct}%  (${progress.completed + progress.failed}/${progress.total})\n`);

    // URL list with statuses
    for (const url of urls) {
      const status = statuses.get(url) || 'queued';
      const symbol = symbols[status];
      const result = results.find((r) => r.url === url);
      const fpCount = result ? result.scripts.filter((s) => !s.thirdParty).length : null;
      const tpCount = result ? result.scripts.filter((s) => s.thirdParty).length : 0;
      const scriptCount = result
        ? chalk.dim(` [${fpCount}`) + (tpCount > 0 && options.showAll ? chalk.dim(`+${tpCount}`) : '') + chalk.dim(' scripts]')
        : '';
      const wafBadge = result?.wafSignal
        ? chalk.yellow(` ⚠${result.wafSignal}`)
        : '';
      console.log(`  ${symbol} ${url}${scriptCount}${wafBadge}`);
    }

    console.log(chalk.dim('\n  Collecting JavaScript files...'));
  }

  // Listen for progress
  queue.on('taskStart', (id: string) => {
    statuses.set(id, 'in-progress');
    renderStatus();
  });

  queue.on('taskComplete', (id: string) => {
    statuses.set(id, 'completed');
    renderStatus();
  });

  queue.on('taskError', (id: string) => {
    statuses.set(id, 'error');
    renderStatus();
  });

  // Initial render
  renderStatus();

  // Enqueue all URLs
  const promises = urls.map((url) =>
    queue.add(url, () => collectScripts(url, options)).then((result) => {
      results.push(result);
      return result;
    }),
  );

  await Promise.allSettled(promises);

  // Sort by original order
  results.sort((a, b) => urls.indexOf(a.url) - urls.indexOf(b.url));

  // Final render
  renderStatus();

  // Show interactive menu
  process.stdout.write('\n');
  console.log(chalk.bold.green('  ✓ Collection complete!\n'));

  // Enable raw mode for keypresses
  if (process.stdin.isTTY) {
    await interactiveMenu(results, options);
  } else {
    printResults(results, options);
  }
}

async function interactiveMenu(
  results: CollectorResult[],
  options: CollectorOptions,
): Promise<void> {
  console.log(chalk.dim('  Keybindings:'));
  console.log(chalk.dim('    [r] Show results     [t] Export .txt'));
  console.log(chalk.dim('    [c] Export .csv       [j] Export .json'));
  console.log(chalk.dim('    [q] Quit\n'));

  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  return new Promise((resolve) => {
    process.stdin.on('data', async (key: string) => {
      switch (key) {
        case 'r':
          console.log();
          printResults(results, options);
          break;
        case 't':
          await writeTxt(results, 'js-collector-results.txt');
          console.log(chalk.green('  Saved to js-collector-results.txt'));
          break;
        case 'c':
          await writeCsv(results, 'js-collector-results.csv');
          console.log(chalk.green('  Saved to js-collector-results.csv'));
          break;
        case 'j':
          console.log(JSON.stringify(results, null, 2));
          break;
        case 'q':
        case '\u0003': // Ctrl+C
          process.stdin.setRawMode(false);
          process.stdin.pause();
          resolve();
          break;
      }
    });
  });
}

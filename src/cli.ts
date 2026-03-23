import { Command } from 'commander';
import chalk from 'chalk';
import { readUrls } from './input/url-reader.js';
import { collectScripts } from './core/collector.js';
import { TaskQueue } from './concurrency/queue.js';
import { printResults, printJson } from './output/console.js';
import { writeTxt } from './output/txt-writer.js';
import { writeCsv } from './output/csv-writer.js';
import { writeJson } from './output/json-writer.js';
import {
  DEFAULT_CONCURRENCY,
  DEFAULT_USER_AGENT,
  DEFAULT_TIMEOUT,
  DEFAULT_MAX_RETRIES,
  DEFAULT_BUDGET,
  DEFAULT_INTRA_CONCURRENCY,
} from './config.js';
import { hostThrottle } from './concurrency/host-throttle.js';
import type { CollectorOptions, CollectorResult } from './types.js';

const program = new Command();

program
  .name('js-collector')
  .description('Detect and list JavaScript files from URLs')
  .version('1.0.0')
  .argument('<url-or-file>', 'A URL to scan or a file containing URLs (one per line)')
  .option('-c, --concurrency <number>', 'Max concurrent targets', String(DEFAULT_CONCURRENCY))
  .option('--ua <string>', 'Custom User-Agent string', DEFAULT_USER_AGENT)
  .option('--timeout <ms>', 'Per-request timeout in milliseconds', String(DEFAULT_TIMEOUT))
  .option('--sourcemaps', 'Parse sourcemaps to discover source file paths', false)
  .option('--use-katana', 'Use katana for additional JS discovery', false)
  .option('--use-getjs', 'Use getJS for additional JS discovery', false)
  .option('-a, --all', 'Enable all discovery methods (sourcemaps, katana, getjs)', false)
  .option('--show-all', 'Show all scripts including third-party libraries', false)
  .option('--trusted-domains <domains>', 'Comma-separated domains to treat as first-party')
  .option('--save-txt <path>', 'Save results to a text file')
  .option('--save-csv <path>', 'Save results to a CSV file')
  .option('-o, --output <path>', 'Save results to file (format inferred from extension: .txt, .csv, .json)')
  .option('--json', 'Output results as JSON to stdout', false)
  .option('--tui', 'Launch interactive terminal UI', false)
  // Anti-block / stealth options
  .option('--delay <ms>', 'Min milliseconds between requests to the same host', '0')
  .option('--rate-limit <n>', 'Max requests per second per host (converted to delay)', '0')
  .option('--stealth', 'Enable stealth mode: browser headers, UA rotation, conservative pacing', false)
  .option('--max-retries <n>', 'Max retries on 429/503/network errors', String(DEFAULT_MAX_RETRIES))
  .option('--budget <ms>', 'Max milliseconds per target (0 to disable)', String(DEFAULT_BUDGET))
  .option(
    '--intra-concurrency <n>',
    'Max simultaneous requests per target',
    String(DEFAULT_INTRA_CONCURRENCY),
  )
  .action(async (input: string, opts: Record<string, string | boolean>) => {
    const useAll = opts.all as boolean;
    const showAll = opts.showAll as boolean;
    const stealth = opts.stealth as boolean;

    // Parse numeric options
    const delayArg = parseInt(opts.delay as string, 10) || 0;
    const rateLimitArg = parseInt(opts.rateLimit as string, 10) || 0;
    const maxRetriesArg = parseInt(opts.maxRetries as string, 10);
    const budgetArg = parseInt(opts.budget as string, 10);
    const intraArg = parseInt(opts.intraConcurrency as string, 10);

    // Compute effective delay: max of --delay and rate-limit conversion
    let delay = delayArg;
    if (rateLimitArg > 0) {
      delay = Math.max(delay, Math.floor(1000 / rateLimitArg));
    }

    // Stealth preset defaults (applied unless user explicitly overrode the flags)
    const argv = process.argv;
    let maxRetries = isNaN(maxRetriesArg) ? DEFAULT_MAX_RETRIES : maxRetriesArg;
    let budget = isNaN(budgetArg) ? DEFAULT_BUDGET : budgetArg;
    let intraConcurrency = isNaN(intraArg) ? DEFAULT_INTRA_CONCURRENCY : intraArg;

    if (stealth) {
      if (!argv.includes('--delay') && !argv.includes('--rate-limit')) {
        delay = Math.max(delay, 2000);
      }
      if (!argv.includes('--intra-concurrency')) {
        intraConcurrency = 1;
      }
      if (!argv.includes('--max-retries')) {
        maxRetries = 5;
      }
    }

    // Configure global per-host throttle
    hostThrottle.configure(delay);

    const options: CollectorOptions = {
      concurrency: parseInt(opts.concurrency as string, 10) || DEFAULT_CONCURRENCY,
      userAgent: (opts.ua as string) || DEFAULT_USER_AGENT,
      timeout: parseInt(opts.timeout as string, 10) || DEFAULT_TIMEOUT,
      sourcemaps: useAll || (opts.sourcemaps as boolean),
      useKatana: useAll || (opts.useKatana as boolean),
      useGetjs: useAll || (opts.useGetjs as boolean),
      filterLibs: !showAll,
      showAll,
      trustedDomains: opts.trustedDomains
        ? (opts.trustedDomains as string).split(',').map((d) => d.trim()).filter(Boolean)
        : [],
      saveTxt: opts.saveTxt as string | undefined,
      saveCsv: opts.saveCsv as string | undefined,
      output: opts.output as string | undefined,
      json: opts.json as boolean,
      tui: opts.tui as boolean,
      delay,
      rateLimit: rateLimitArg,
      stealth,
      maxRetries,
      budget,
      intraConcurrency,
    };

    // Read input URLs
    let urls: string[];
    try {
      urls = await readUrls(input);
    } catch (err) {
      console.error(chalk.red(`Error: ${(err as Error).message}`));
      process.exit(1);
    }

    if (!options.json) {
      const stealthNote = stealth ? chalk.yellow(' [stealth]') : '';
      const delayNote = delay > 0 ? chalk.dim(` delay=${delay}ms`) : '';
      console.log(
        chalk.dim(`Scanning ${urls.length} URL(s) with concurrency ${options.concurrency}`) +
          stealthNote +
          delayNote +
          '\n',
      );
    }

    // TUI mode
    if (options.tui) {
      try {
        const { launchTui } = await import('./tui/app.js');
        await launchTui(urls, options);
        return;
      } catch (err) {
        console.error(chalk.yellow('TUI unavailable, falling back to CLI mode.'));
        console.error(chalk.dim((err as Error).message));
      }
    }

    // Standard CLI mode
    const queue = new TaskQueue(options.concurrency);
    const results: CollectorResult[] = [];

    queue.on('taskStart', (id: string) => {
      if (!options.json) {
        console.log(chalk.dim(`  → Scanning ${id}...`));
      }
    });

    const promises = urls.map((url) =>
      queue.add(url, () => collectScripts(url, options)).then((result) => {
        results.push(result);
        return result;
      }),
    );

    await Promise.allSettled(promises);

    results.sort((a, b) => urls.indexOf(a.url) - urls.indexOf(b.url));

    if (!options.json) {
      console.log();
    }

    if (options.json) {
      printJson(results);
    } else {
      printResults(results, options);
    }

    // Export files
    const exportPromises: Promise<void>[] = [];

    if (options.saveTxt) {
      exportPromises.push(
        writeTxt(results, options.saveTxt).then(() => {
          console.log(chalk.green(`Saved TXT: ${options.saveTxt}`));
        }),
      );
    }

    if (options.saveCsv) {
      exportPromises.push(
        writeCsv(results, options.saveCsv).then(() => {
          console.log(chalk.green(`Saved CSV: ${options.saveCsv}`));
        }),
      );
    }

    if (options.output) {
      const ext = options.output.split('.').pop()?.toLowerCase();
      if (ext === 'csv') {
        exportPromises.push(
          writeCsv(results, options.output).then(() => {
            console.log(chalk.green(`Saved CSV: ${options.output}`));
          }),
        );
      } else if (ext === 'json') {
        exportPromises.push(
          writeJson(results, options.output).then(() => {
            console.log(chalk.green(`Saved JSON: ${options.output}`));
          }),
        );
      } else {
        exportPromises.push(
          writeTxt(results, options.output).then(() => {
            console.log(chalk.green(`Saved TXT: ${options.output}`));
          }),
        );
      }
    }

    await Promise.all(exportPromises);
  });

program.parse();

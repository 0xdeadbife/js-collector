import chalk from 'chalk';
import type { CollectorResult, ScriptEntry, WafSignal } from '../types.js';

interface PrintOptions {
  filterLibs?: boolean;
  showAll?: boolean;
}

const WAF_LABELS: Record<WafSignal, string> = {
  'cloudflare': 'Cloudflare challenge detected — results may be incomplete',
  'rate-limited': 'Rate limited (429) — increase --delay or use --stealth',
  'generic-403': 'Access forbidden (403)',
  'suspicious-empty': 'Suspicious empty response',
  'captcha-redirect': 'Captcha/challenge redirect — blocked by bot protection',
};

/**
 * Print results to the console with colored, grouped output.
 */
export function printResults(results: CollectorResult[], options: PrintOptions = {}): void {
  const filterLibs = options.showAll ? false : (options.filterLibs ?? true);

  for (const result of results) {
    // Host header
    if (result.status === 'error') {
      console.log(chalk.red.bold(`✗ ${result.url}`));
      if (result.wafSignal) {
        console.log(chalk.yellow(`  ⚠ WAF: ${WAF_LABELS[result.wafSignal]}`));
      }
      console.log(chalk.red(`  Error: ${result.error}`));
      console.log();
      continue;
    }

    const firstParty = result.scripts.filter((s) => !s.thirdParty);
    const thirdParty = result.scripts.filter((s) => s.thirdParty);
    const visibleScripts = filterLibs ? firstParty : result.scripts;

    console.log(chalk.cyan.bold(`▸ ${result.host}`) + chalk.dim(` (${result.url})`));

    // WAF warning (non-blocking signals shown as warnings)
    if (result.wafSignal) {
      console.log(chalk.yellow(`  ⚠ WAF: ${WAF_LABELS[result.wafSignal]}`));
    }

    if (filterLibs && thirdParty.length > 0) {
      console.log(chalk.dim(`  [${thirdParty.length} third-party script(s) hidden — use --show-all to display]`));
    }

    if (visibleScripts.length === 0) {
      if (firstParty.length === 0 && thirdParty.length === 0) {
        console.log(chalk.yellow('  No JavaScript files found.'));
      } else {
        console.log(chalk.yellow('  No first-party JavaScript files found.'));
      }
    } else {
      const label = filterLibs
        ? `  Found ${firstParty.length} first-party script(s):`
        : `  Found ${firstParty.length} first-party` +
          (thirdParty.length > 0 ? ` + ${thirdParty.length} third-party` : '') +
          ` script(s):`;
      console.log(chalk.dim(label));

      if (filterLibs) {
        printScriptGroup(firstParty, false);
      } else {
        const fp = visibleScripts.filter((s) => !s.thirdParty);
        const tp = visibleScripts.filter((s) => s.thirdParty);

        if (fp.length > 0) {
          printScriptGroup(fp, false);
        }

        if (tp.length > 0) {
          if (fp.length > 0) {
            console.log();
          }
          printScriptGroup(tp, true);
        }
      }
    }

    console.log();
  }

  // Summary line
  const allScripts = results.flatMap((r) => r.scripts);
  const firstPartyTotal = allScripts.filter((s) => !s.thirdParty).length;
  const thirdPartyTotal = allScripts.filter((s) => s.thirdParty).length;
  const hosts = results.length;
  const errors = results.filter((r) => r.status === 'error').length;
  const wafBlocked = results.filter((r) => r.wafSignal && ['cloudflare', 'captcha-redirect'].includes(r.wafSignal)).length;

  if (filterLibs) {
    console.log(
      chalk.bold(`Total: ${firstPartyTotal} first-party script(s) from ${hosts} URL(s)`) +
        (thirdPartyTotal > 0 ? chalk.dim(` (${thirdPartyTotal} third-party filtered)`) : '') +
        (errors > 0 ? chalk.red(` (${errors} error(s))`) : '') +
        (wafBlocked > 0 ? chalk.yellow(` (${wafBlocked} WAF-blocked)`) : ''),
    );
  } else {
    const total = allScripts.length;
    console.log(
      chalk.bold(`Total: ${total} script(s) from ${hosts} URL(s)`) +
        (thirdPartyTotal > 0 ? chalk.dim(` (${firstPartyTotal} first-party, ${thirdPartyTotal} third-party)`) : '') +
        (errors > 0 ? chalk.red(` (${errors} error(s))`) : '') +
        (wafBlocked > 0 ? chalk.yellow(` (${wafBlocked} WAF-blocked)`) : ''),
    );
  }
}

function printScriptGroup(scripts: ScriptEntry[], isThirdParty: boolean): void {
  const bySource = new Map<string, string[]>();
  for (const script of scripts) {
    const existing = bySource.get(script.source) ?? [];
    existing.push(script.url);
    bySource.set(script.source, existing);
  }

  for (const [source, urls] of bySource) {
    console.log(chalk.dim(`  [${source}]`));
    for (const url of urls) {
      // Third-party: dim + muted red to signal out-of-scope without text labels
      console.log(isThirdParty ? chalk.dim(chalk.hex('#c0392b')(`    ${url}`)) : `    ${url}`);
    }
  }
}

/**
 * Print results as JSON to stdout.
 */
export function printJson(results: CollectorResult[]): void {
  console.log(JSON.stringify(results, null, 2));
}

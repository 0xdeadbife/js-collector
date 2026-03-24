# js-collector

![Logo](logo.png)

CLI tool to discover and enumerate JavaScript files from any web target. Built for bug bounty, pentesting, and attack surface analysis.

Extracts scripts from HTML, HTTP headers, framework manifests (React, Next.js, Angular, Vue), robots.txt, sitemaps, service workers, and sourcemaps — with optional integration of external crawlers like katana and getJS.

---

## Installation

```bash
git clone git@github.com:yourusername/js-collector.git
cd js-collector
npm install -g .
```

This compiles the project and installs `js-collector` as a global command.

### Without installing (dev mode)

```bash
npx tsx src/cli.ts <url>
# or
npm run dev -- <url>
```

---

## Usage

```
js-collector <url-or-file> [options]
```

`<url-or-file>` can be:
- A single URL: `https://example.com`
- A file with one URL per line: `targets.txt`

---

## Quick Examples

```bash
# Single target
js-collector https://example.com

# Multiple targets from file
js-collector targets.txt

# Bug bounty scan with stealth mode and JSON output
js-collector scope.txt --stealth --all -o results.json

# Show all scripts including third-party libs
js-collector https://example.com --show-all

# Extract source paths from sourcemaps
js-collector https://example.com --sourcemaps

# Trust a CDN as first-party
js-collector https://app.example.com --trusted-domains static.example.com,cdn.example.com

# Rate limit to 2 req/s with 3 parallel targets
js-collector scope.txt --rate-limit 2 --concurrency 3

# Interactive TUI
js-collector targets.txt --tui
```

---

## All Options

### Discovery

| Flag | Default | Description |
|------|---------|-------------|
| `--sourcemaps` | off | Parse `.map` files to extract original source paths |
| `--use-katana` | off | Use [katana](https://github.com/projectdiscovery/katana) as an additional crawler |
| `--use-getjs` | off | Use [getJS](https://github.com/003random/getJS) as an additional discoverer |
| `-a, --all` | off | Enable all discovery methods (sourcemaps + katana + getjs) |

### Output

| Flag | Default | Description |
|------|---------|-------------|
| `--show-all` | off | Include third-party scripts (CDNs, libraries) in output |
| `--trusted-domains <list>` | — | Comma-separated domains treated as first-party |
| `--json` | off | Print results as JSON to stdout |
| `--tui` | off | Launch interactive terminal UI with progress |
| `-o, --output <path>` | — | Save results to file — format inferred from extension (`.txt`, `.csv`, `.json`) |
| `--save-txt <path>` | — | Save results as plain text (one URL per line) |
| `--save-csv <path>` | — | Save results as CSV |

### Concurrency & Timeouts

| Flag | Default | Description |
|------|---------|-------------|
| `-c, --concurrency <n>` | `5` | Number of targets to scan in parallel |
| `--intra-concurrency <n>` | `3` | Max simultaneous requests per target |
| `--timeout <ms>` | `15000` | Per-request timeout in milliseconds |
| `--budget <ms>` | `60000` | Max total time per target (0 = unlimited) |

### Stealth & Anti-Block

| Flag | Default | Description |
|------|---------|-------------|
| `--stealth` | off | Enable stealth mode (see below) |
| `--delay <ms>` | `0` | Minimum delay between requests to the same host |
| `--rate-limit <n>` | `0` | Max requests per second per host (converted to delay) |
| `--max-retries <n>` | `3` | Retries on 429 / 503 / network errors |
| `--ua <string>` | Chrome 131 | Custom User-Agent string |

---

## Stealth Mode

`--stealth` applies a conservative preset designed for WAF evasion and responsible bug bounty scanning:

- Full Chromium browser headers (`Sec-Fetch-*`, `Sec-Ch-Ua-*`, `Accept-Language`, etc.)
- User-Agent rotation across Chrome 130/131 on Windows, macOS, and Linux — consistent per host within a session
- `--delay 2000` between requests to the same host
- `--intra-concurrency 1` (one request at a time per target)
- `--max-retries 5`

Any of these can be overridden explicitly:

```bash
# Stealth but faster — allow 2 requests at a time per target
js-collector targets.txt --stealth --intra-concurrency 2

# Stealth with custom delay
js-collector targets.txt --stealth --delay 500
```

---

## Discovery Sources

| Source | What it finds |
|--------|--------------|
| `html` | `<script src>`, `<link rel="modulepreload">`, `<link rel="preload" as="script">` |
| `link-header` | HTTP `Link: <url>; rel=preload` headers |
| `manifest` | React `asset-manifest.json`, Next.js `_buildManifest.js`, Angular `ngsw.json`, Vue SSR manifest |
| `robots` | `.js` paths in `Allow`/`Disallow` rules, `Sitemap:` URLs |
| `sitemap` | `.js` entries in sitemap XML (including sitemap index files) |
| `service-worker` | `importScripts()` and precached URLs in service workers |
| `sourcemap` | `sources` array from `.map` files (`--sourcemaps` required) |
| `katana` | Crawler-discovered scripts (`--use-katana` or `--all` required) |
| `getjs` | getJS-discovered scripts (`--use-getjs` or `--all` required) |

Auto-probed paths per target: `/robots.txt`, `/sitemap.xml`, `/service-worker.js`, `/sw.js`

---

## Output Formats

| Format | How to use |
|--------|-----------|
| Console (default) | Grouped by discovery source, first-party only |
| JSON to stdout | `--json` |
| JSON to file | `-o results.json` |
| CSV to file | `-o results.csv` or `--save-csv results.csv` |
| TXT to file | `-o results.txt` or `--save-txt results.txt` |

CSV columns: `url, source, thirdParty, targetUrl, host`

JSON schema per result:
```json
{
  "url": "https://target.com",
  "host": "target.com",
  "status": "completed",
  "wafSignal": null,
  "scripts": [
    { "url": "https://target.com/static/js/main.abc123.js", "source": "html", "thirdParty": false }
  ]
}
```

---

## Console Output Example

```
Scanning 2 URL(s) with concurrency 5 [stealth] delay=2000ms

  → Scanning https://app.example.com...
  → Scanning https://api.example.com...

▸ app.example.com (https://app.example.com/)
  Found 5 first-party script(s):
  [html]
    https://app.example.com/static/js/main.a1b2c3.js
    https://app.example.com/static/js/vendor.d4e5f6.js
  [manifest]
    https://app.example.com/static/js/chunk-react.g7h8i9.js
    https://app.example.com/static/js/chunk-utils.j0k1l2.js
  [service-worker]
    https://app.example.com/sw-precache.js

▸ api.example.com (https://api.example.com/)
  ⚠ WAF: Cloudflare challenge detected — results may be incomplete
  Found 1 first-party script(s):
  [html]
    https://api.example.com/assets/app.m3n4o5.js

Total: 6 first-party script(s) from 2 URL(s)
```

---

## WAF Detection

js-collector detects and reports WAF signals without blocking the scan:

| Signal | Meaning |
|--------|---------|
| `cloudflare` | Cloudflare challenge page detected |
| `rate-limited` | HTTP 429 received |
| `generic-403` | Blanket 403 with no useful content |
| `suspicious-empty` | Empty response likely filtered by WAF |
| `captcha-redirect` | Redirect to CAPTCHA page |

---

## External Tool Integrations

### katana

```bash
go install github.com/projectdiscovery/katana/cmd/katana@latest
js-collector https://example.com --use-katana
```

### getJS

```bash
go install github.com/003random/getJS@latest
js-collector https://example.com --use-getjs
```

Both tools are optional. Use `--all` to enable both along with sourcemap parsing.

---

## Development

```bash
# Run in dev mode (no build required)
npm run dev -- https://example.com

# Type-check
npx tsc --noEmit

# Build
npm run build

# Run tests (requires build)
npm test

# Run tests in dev mode
npm run test:dev
```

---

## Requirements

- Node.js 18+
- npm
- (Optional) katana, getJS — for extended discovery

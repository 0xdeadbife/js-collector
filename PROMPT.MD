# Project
Create a CLI tool in Node.js that, given a URL or a list of URLs, detects and lists all JavaScript files associated with each URL. The tool is intended for bug bounty hunting, penetration testing, and developer debugging.

## Key Requirements

### Input Flexibility
- Accept a single URL or a text file containing multiple URLs (one per line).
- Provide flags (e.g. `--concurrency`, `--output`, `--ua`) to control concurrency, output format, and User-Agent.

### Output Format
- **Console output:** For each input URL/host, print the URL or hostname as a header and list the discovered JavaScript file URLs underneath it (grouped and indented).
- **Export options:** Include flags such as:
  - `--save-txt` to write a plain text file with each host and its JS URLs.
  - `--save-csv` to write a CSV file with columns for host and script URL.
  - A generic `--output <path>` flag that allows specifying the filename and format based on extension (`.txt` or `.csv`).
- Use a polished output style (colored headers, indentation, or table formatting) for readability, following best practices of modern CLI tools.

### JavaScript Detection Method
- Perform asynchronous HTTP requests and parse the HTML to extract all `<script>` tags (`src` attributes and inline scripts), resolving relative paths to absolute ones.
- Identify framework-related manifests:
  - `asset-manifest.json` and `manifest.json` for React/CRA.
  - `_next/static` and `__BUILD_MANIFEST` for Next.js, plus `/_next/data` for prefetch routes.
  - `main.*.js`, `polyfills.*.js`, `runtime.*.js` in Angular; check `ngsw.json` if a Service Worker is used.
  - `vue-ssr-client-manifest.json` or files under `dist/*` for Vue/Nuxt.
- Analyze `robots.txt`, `sitemap.xml`, `service-worker.js`, and `workbox*` files to discover hidden script paths.
- Inspect `Link` headers and `rel="modulepreload"` attributes for script URLs.
- Support optional parsing of sourcemaps (`*.js.map`) with a `--sourcemaps` flag to extract source code paths.
- Handle CDN and relative URL resolution (e.g., `https://cdn.jsdelivr.net/...`, `https://unpkg.com/...`).

### Integration with Existing Tools
- Allow optional invocation of external binaries like **getJS** or **katana** using `child_process.spawn`.  
- If the user sets `--use-katana`, run katana with `-js-crawl` and merge its results.
- Handle errors from external processes gracefully.

### CLI Design
- Implement using Node.js (ES modules and optionally TypeScript).
- Use Node’s asynchronous patterns (async/await, Promises) to leverage non-blocking behavior.
- Implement controlled concurrency (e.g., with a task queue or `p-limit`).
- Offer output formats such as JSON, plain text, or CSV.

### Terminal User Interface (TUI)
- Use a TUI library like **OpenTUI**, **ink**, or **blessed** to provide a friendly terminal UI.
- Display a list of URLs with their status (queued, in progress, completed, error).
- Present results grouped by host, showing each host and its JavaScript URLs in a clear, navigable manner.
- Allow users to interactively browse found scripts and export results via keypresses.
- Keep the interface simple yet informative.

### Quality and Maintainability
- Organize code into modules: input handling, crawlers/parsers, external integrations, output formatting, TUI, etc.
- Comment and document code thoroughly.
- Include basic unit tests for the script parser and concurrency manager.
- Provide a README explaining installation, usage, and customization.

## Expected Deliverables
- A functional CLI that can be run with `node cli.js` or `npm start` to process the specified URLs.
- An interactive TUI showing progress and enabling exploration of JavaScript files per URL/host.
- Export capabilities to write grouped results to `.txt` or `.csv` files based on user-specified flags.
- Documentation with usage examples and instructions.

**Note:** Use open-source NPM dependencies where appropriate for HTTP requests, HTML parsing, output formatting, and TUI rendering. Ensure the code is self-contained and easy to extend.

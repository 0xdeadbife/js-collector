export const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export const DEFAULT_CONCURRENCY = 5;
export const DEFAULT_TIMEOUT = 15_000;
export const DEFAULT_MAX_RETRIES = 3;
export const DEFAULT_BUDGET = 60_000;
export const DEFAULT_INTRA_CONCURRENCY = 3;

export const STEALTH_UA_POOL = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6649.0 Safari/537.36',
];

export const MANIFEST_PATHS = {
  react: ['/asset-manifest.json', '/manifest.json'],
  nextjs: ['/_next/static'],
  angular: ['/ngsw.json'],
  vue: ['/vue-ssr-client-manifest.json'],
} as const;

export const DISCOVERY_PATHS = [
  '/robots.txt',
  '/sitemap.xml',
  '/service-worker.js',
  '/sw.js',
] as const;

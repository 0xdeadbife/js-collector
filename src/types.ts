export type ScriptSource =
  | 'html'
  | 'manifest'
  | 'sitemap'
  | 'robots'
  | 'service-worker'
  | 'link-header'
  | 'sourcemap'
  | 'katana'
  | 'getjs';

export type WafSignal =
  | 'cloudflare'
  | 'rate-limited'
  | 'generic-403'
  | 'suspicious-empty'
  | 'captcha-redirect';

export interface ScriptEntry {
  url: string;
  source: ScriptSource;
  thirdParty?: boolean;
}

export interface CollectorResult {
  url: string;
  host: string;
  scripts: ScriptEntry[];
  status: 'queued' | 'in-progress' | 'completed' | 'error';
  error?: string;
  wafSignal?: WafSignal;
}

export interface CollectorOptions {
  concurrency: number;
  userAgent: string;
  timeout: number;
  sourcemaps: boolean;
  useKatana: boolean;
  useGetjs: boolean;
  filterLibs: boolean;
  showAll: boolean;
  trustedDomains: string[];
  saveTxt?: string;
  saveCsv?: string;
  output?: string;
  json: boolean;
  tui: boolean;
  // Anti-block / stealth options
  delay: number;
  rateLimit: number;
  stealth: boolean;
  maxRetries: number;
  budget: number;
  intraConcurrency: number;
}

export interface FetchResult {
  status: number;
  headers: Headers;
  body: string;
  finalUrl: string;
  wafSignal?: WafSignal;
}

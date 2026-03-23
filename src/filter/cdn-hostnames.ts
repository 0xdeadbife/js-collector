/**
 * Known CDN hostnames that serve third-party JavaScript libraries.
 * Sources: LocalCDN/Decentraleyes, cdnjs, common knowledge.
 */
export const CDN_HOSTNAMES = new Set<string>([
  // Major CDNs
  'cdnjs.cloudflare.com',
  'cdn.jsdelivr.net',
  'unpkg.com',
  'esm.sh',
  'esm.run',
  'cdn.skypack.dev',
  'skypack.dev',
  'jspm.dev',
  'ga.jspm.io',
  'bundle.run',
  'wzrd.in',
  'gitcdn.xyz',

  // Google
  'ajax.googleapis.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'www.google-analytics.com',
  'www.googletagmanager.com',
  'www.googletagservices.com',
  'ssl.google-analytics.com',
  'stats.g.doubleclick.net',
  'static.doubleclick.net',

  // jQuery official
  'code.jquery.com',

  // Bootstrap CDNs
  'stackpath.bootstrapcdn.com',
  'maxcdn.bootstrapcdn.com',
  'netdna.bootstrapcdn.com',

  // Microsoft
  'ajax.aspnetcdn.com',
  'ajax.microsoft.com',
  'microsoftalexafeedback.azurewebsites.net',

  // Yandex
  'yastatic.net',
  'mc.yandex.ru',

  // Chinese CDNs
  'cdn.staticfile.org',
  'cdn.bootcss.com',
  'cdn.bootcdn.net',
  'libs.baidu.com',
  'lib.sinaapp.com',
  'upcdn.b0.upaiyun.com',

  // Facebook / Meta
  'connect.facebook.net',
  'static.xx.fbcdn.net',

  // Twitter
  'platform.twitter.com',
  'cdn.syndication.twimg.com',

  // Amazon
  'sdk.amazonaws.com',
  's3.amazonaws.com',

  // Stripe
  'js.stripe.com',

  // Cloudflare
  'cdnjs.com',
  'rawgit.com',
  'cdn.rawgit.com',

  // Charts
  'static.chartjs.org',
  'code.highcharts.com',

  // DataTables
  'cdn.datatables.net',

  // Analytics & tracking
  'www.clarity.ms',
  'edge.fullstory.com',
  'script.hotjar.com',
  'static.hotjar.com',
  'cdn.segment.com',
  'cdn.amplitude.com',
  'cdn.mxpnl.com',

  // Intercom, Drift, Zendesk
  'js.intercomcdn.com',
  'widget.intercom.io',
  'js.driftt.com',
  'static.zdassets.com',
  'assets.zendesk.com',

  // Sentry
  'browser.sentry-cdn.com',
  'js.sentry-cdn.com',

  // Firebase
  'www.gstatic.com',

  // reCAPTCHA / hCaptcha
  'www.google.com',
  'hcaptcha.com',
  'js.hcaptcha.com',

  // HubSpot
  'js.hs-scripts.com',
  'js.hubspot.com',

  // Polyfills
  'polyfill.io',
  'cdnjs.cloudflare.com',

  // npm CDNs
  'registry.npmjs.org',
]);

export type FrameworkHint = 'react' | 'nextjs' | 'angular' | 'vue';

/**
 * Detect which frontend frameworks are present in a page's HTML.
 * Used to limit manifest probe requests to only relevant frameworks,
 * reducing unnecessary requests to the target server.
 */
export function detectFrameworkHints(html: string): Set<FrameworkHint> {
  const hints = new Set<FrameworkHint>();

  // Next.js (always implies React)
  if (html.includes('/_next/static') || html.includes('__NEXT_DATA__')) {
    hints.add('nextjs');
    hints.add('react');
  }

  // Angular
  if (
    html.includes('ng-version') ||
    html.includes('ng.core') ||
    html.includes('angular.min.js')
  ) {
    hints.add('angular');
  }

  // Vue / Nuxt
  if (html.includes('__nuxt') || html.includes('data-v-') || html.includes('__vue')) {
    hints.add('vue');
  }

  // React / CRA (only if Next.js not already detected)
  if (!hints.has('nextjs')) {
    if (
      html.includes('asset-manifest.json') ||
      (html.includes('<div id="root">') && /\/static\/js\/[a-z]+\.[a-f0-9]+\.js/.test(html))
    ) {
      hints.add('react');
    }
  }

  return hints;
}

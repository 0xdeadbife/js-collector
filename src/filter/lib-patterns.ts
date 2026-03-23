/**
 * Regex patterns for known third-party JavaScript library filenames.
 * These match the pathname portion of a URL.
 *
 * Sources: retire.js jsrepository.json, cdnjs library list, common knowledge.
 * Format: patterns match common library file naming conventions like:
 *   jquery-3.6.0.min.js, react.production.min.js, lodash.min.js, etc.
 */
export const LIB_PATTERNS: RegExp[] = [
  // jQuery ecosystem
  /\/jquery[.-][\d.]+(?:\.min)?\.js/i,
  /\/jquery\.min\.js/i,
  /\/jquery-latest\.js/i,
  /\/jquery\.js/i,
  /\/jquery-ui[.-][\d.]+(?:\.min)?\.js/i,
  /\/jquery\.ui\.js/i,
  /\/jquery-migrate[.-][\d.]+(?:\.min)?\.js/i,
  /\/jquery\.validate(?:\.min)?\.js/i,
  /\/jquery\.form(?:\.min)?\.js/i,
  /\/jquery\.cookie(?:\.min)?\.js/i,
  /\/jquery\.easing[.-][\d.]+(?:\.min)?\.js/i,
  /\/jquery\.fancybox(?:\.min)?\.js/i,
  /\/jquery\.lazyload(?:\.min)?\.js/i,
  /\/jquery\.masonry(?:\.min)?\.js/i,
  /\/jquery\.isotope(?:\.min)?\.js/i,
  /\/jquery\.scrollspy(?:\.min)?\.js/i,
  /\/jquery\.tablesorter(?:\.min)?\.js/i,
  /\/jquery\.tipsy(?:\.min)?\.js/i,
  /\/jquery\.colorbox(?:\.min)?\.js/i,
  /\/jquery\.magnific-popup(?:\.min)?\.js/i,
  /\/jquery\.slimscroll(?:\.min)?\.js/i,
  /\/jquery\.flexslider(?:\.min)?\.js/i,
  /\/jquery\.cycle(?:\.min)?\.js/i,
  /\/jquery\.appear(?:\.min)?\.js/i,
  /\/jquery\.unveil(?:\.min)?\.js/i,
  /\/jquery\.backstretch(?:\.min)?\.js/i,

  // React ecosystem
  /\/react(?:\.development|\.production\.min|\.profiling\.min)?\.js/i,
  /\/react-dom(?:\.development|\.production\.min|\.profiling\.min)?\.js/i,
  /\/react-router(?:-dom)?[.-][\d.]+(?:\.min)?\.js/i,
  /\/react-redux[.-][\d.]+(?:\.min)?\.js/i,
  /\/react-query[.-][\d.]+(?:\.min)?\.js/i,
  /\/react-hook-form[.-][\d.]+(?:\.min)?\.js/i,
  /\/react-select[.-][\d.]+(?:\.min)?\.js/i,
  /\/react-datepicker[.-][\d.]+(?:\.min)?\.js/i,
  /\/react-modal[.-][\d.]+(?:\.min)?\.js/i,
  /\/react-table[.-][\d.]+(?:\.min)?\.js/i,
  /\/react-toastify[.-][\d.]+(?:\.min)?\.js/i,
  /\/react-helmet[.-][\d.]+(?:\.min)?\.js/i,
  /\/react-spring[.-][\d.]+(?:\.min)?\.js/i,
  /\/react-motion[.-][\d.]+(?:\.min)?\.js/i,
  /\/react-transition-group[.-][\d.]+(?:\.min)?\.js/i,
  /\/react-virtualized[.-][\d.]+(?:\.min)?\.js/i,
  /\/react-window[.-][\d.]+(?:\.min)?\.js/i,
  /\/react-dnd[.-][\d.]+(?:\.min)?\.js/i,
  /\/react-beautiful-dnd[.-][\d.]+(?:\.min)?\.js/i,
  /\/react-dropzone[.-][\d.]+(?:\.min)?\.js/i,

  // Redux
  /\/redux[.-][\d.]+(?:\.min)?\.js/i,
  /\/redux-thunk[.-][\d.]+(?:\.min)?\.js/i,
  /\/redux-saga[.-][\d.]+(?:\.min)?\.js/i,
  /\/redux-observable[.-][\d.]+(?:\.min)?\.js/i,
  /\/reselect[.-][\d.]+(?:\.min)?\.js/i,
  /\/immer[.-][\d.]+(?:\.min)?\.js/i,

  // Angular
  /\/angular[.-][\d.]+(?:\.min)?\.js/i,
  /\/angular\.js/i,
  /\/angular\.min\.js/i,
  /\/angular-(?:route|resource|animate|aria|messages|mocks|cookies|sanitize|loader|touch)[.-][\d.]+(?:\.min)?\.js/i,
  /\/zone\.js[.-][\d.]+(?:\.min)?\.js/i,
  /\/@angular\//i,

  // Vue
  /\/vue[.-][\d.]+(?:\.min)?\.js/i,
  /\/vue\.(?:global|esm|runtime)(?:\.prod|\.dev)?(?:\.min)?\.js/i,
  /\/vuex[.-][\d.]+(?:\.min)?\.js/i,
  /\/vue-router[.-][\d.]+(?:\.min)?\.js/i,
  /\/vue-i18n[.-][\d.]+(?:\.min)?\.js/i,
  /\/pinia[.-][\d.]+(?:\.min)?\.js/i,
  /\/nuxt[.-][\d.]+(?:\.min)?\.js/i,

  // Svelte
  /\/svelte[.-][\d.]+(?:\.min)?\.js/i,

  // Alpine.js
  /\/alpinejs[.-][\d.]+(?:\.min)?\.js/i,
  /\/alpine[.-][\d.]+(?:\.min)?\.js/i,
  /\/alpine\.min\.js/i,

  // Htmx
  /\/htmx[.-][\d.]+(?:\.min)?\.js/i,
  /\/htmx\.min\.js/i,

  // Ember
  /\/ember[.-][\d.]+(?:\.min)?\.js/i,
  /\/ember\.js/i,
  /\/ember\.min\.js/i,
  /\/ember-template-factory-for[.-][\d.]+(?:\.min)?\.js/i,

  // Backbone
  /\/backbone[.-][\d.]+(?:\.min)?\.js/i,
  /\/backbone\.js/i,
  /\/backbone\.min\.js/i,
  /\/marionette[.-][\d.]+(?:\.min)?\.js/i,

  // Knockout
  /\/knockout[.-][\d.]+(?:\.debug|\.min)?\.js/i,
  /\/knockout\.js/i,
  /\/knockout-[\d.]+(?:\.debug|\.min)?\.js/i,

  // Utility libraries
  /\/lodash[.-][\d.]+(?:\.min)?\.js/i,
  /\/lodash(?:\.core)?\.min\.js/i,
  /\/lodash\.js/i,
  /\/underscore[.-][\d.]+(?:\.min)?\.js/i,
  /\/underscore\.js/i,
  /\/underscore-min\.js/i,
  /\/ramda[.-][\d.]+(?:\.min)?\.js/i,

  // Date libraries
  /\/moment[.-][\d.]+(?:\.min)?\.js/i,
  /\/moment\.min\.js/i,
  /\/moment\.js/i,
  /\/moment-timezone[.-][\d.]+(?:\.min)?\.js/i,
  /\/dayjs[.-][\d.]+(?:\.min)?\.js/i,
  /\/dayjs\.min\.js/i,
  /\/date-fns[.-][\d.]+(?:\.min)?\.js/i,
  /\/luxon[.-][\d.]+(?:\.min)?\.js/i,

  // Bootstrap
  /\/bootstrap[.-][\d.]+(?:\.bundle)?(?:\.min)?\.js/i,
  /\/bootstrap\.min\.js/i,
  /\/bootstrap\.bundle\.min\.js/i,

  // Tailwind (runtime)
  /\/tailwind(?:css)?[.-][\d.]+(?:\.min)?\.js/i,

  // HTTP clients
  /\/axios[.-][\d.]+(?:\.min)?\.js/i,
  /\/axios\.min\.js/i,
  /\/superagent[.-][\d.]+(?:\.min)?\.js/i,
  /\/ky[.-][\d.]+(?:\.min)?\.js/i,
  /\/got[.-][\d.]+(?:\.min)?\.js/i,

  // Charts / Data viz
  /\/chart\.js[.-][\d.]+(?:\.min)?\.js/i,
  /\/chart\.min\.js/i,
  /\/chartjs[.-][\d.]+(?:\.min)?\.js/i,
  /\/highcharts[.-][\d.]+(?:\.min)?\.js/i,
  /\/highcharts\.js/i,
  /\/d3[.-][\d.]+(?:\.min)?\.js/i,
  /\/d3\.min\.js/i,
  /\/d3\.js/i,
  /\/echarts[.-][\d.]+(?:\.min)?\.js/i,
  /\/plotly[.-][\d.]+(?:\.min)?\.js/i,
  /\/apexcharts[.-][\d.]+(?:\.min)?\.js/i,
  /\/recharts[.-][\d.]+(?:\.min)?\.js/i,
  /\/vega[.-][\d.]+(?:\.min)?\.js/i,
  /\/nivo[.-][\d.]+(?:\.min)?\.js/i,

  // 3D / WebGL
  /\/three[.-][\d.]+(?:\.min)?\.js/i,
  /\/three\.min\.js/i,
  /\/three\.js/i,
  /\/babylon[.-][\d.]+(?:\.min)?\.js/i,
  /\/aframe[.-][\d.]+(?:\.min)?\.js/i,
  /\/pixi[.-][\d.]+(?:\.min)?\.js/i,
  /\/phaser[.-][\d.]+(?:\.min)?\.js/i,

  // Maps
  /\/leaflet[.-][\d.]+(?:\.min)?\.js/i,
  /\/leaflet\.js/i,
  /\/mapbox-gl[.-][\d.]+(?:\.min)?\.js/i,
  /\/openlayers[.-][\d.]+(?:\.min)?\.js/i,
  /\/gmaps[.-][\d.]+(?:\.min)?\.js/i,

  // UI components
  /\/popper[.-][\d.]+(?:\.min)?\.js/i,
  /\/popper\.js/i,
  /\/tippy[.-][\d.]+(?:\.min)?\.js/i,
  /\/flatpickr[.-][\d.]+(?:\.min)?\.js/i,
  /\/pikaday[.-][\d.]+(?:\.min)?\.js/i,
  /\/select2[.-][\d.]+(?:\.min)?\.js/i,
  /\/chosen[.-][\d.]+(?:\.min)?\.js/i,
  /\/datatables[.-][\d.]+(?:\.min)?\.js/i,
  /\/datatables\.min\.js/i,
  /\/slick[.-][\d.]+(?:\.min)?\.js/i,
  /\/swiper[.-][\d.]+(?:\.min)?\.js/i,
  /\/swiper-bundle(?:\.min)?\.js/i,
  /\/owl\.carousel[.-][\d.]+(?:\.min)?\.js/i,
  /\/glide[.-][\d.]+(?:\.min)?\.js/i,
  /\/splide[.-][\d.]+(?:\.min)?\.js/i,
  /\/flickity[.-][\d.]+(?:\.min)?\.js/i,
  /\/aos[.-][\d.]+(?:\.min)?\.js/i,
  /\/wow[.-][\d.]+(?:\.min)?\.js/i,
  /\/animate[.-][\d.]+(?:\.min)?\.js/i,
  /\/gsap[.-][\d.]+(?:\.min)?\.js/i,
  /\/tweenmax[.-][\d.]+(?:\.min)?\.js/i,
  /\/tweenlite[.-][\d.]+(?:\.min)?\.js/i,
  /\/scrollreveal[.-][\d.]+(?:\.min)?\.js/i,
  /\/velocity[.-][\d.]+(?:\.min)?\.js/i,
  /\/velocity\.ui(?:\.min)?\.js/i,

  // Rich text editors
  /\/tinymce[.-][\d.]+(?:\.min)?\.js/i,
  /\/tinymce\.min\.js/i,
  /\/quill[.-][\d.]+(?:\.min)?\.js/i,
  /\/ckeditor[.-][\d.]+(?:\.min)?\.js/i,
  /\/froala[.-][\d.]+(?:\.min)?\.js/i,
  /\/codemirror[.-][\d.]+(?:\.min)?\.js/i,
  /\/monaco-editor[.-][\d.]+(?:\.min)?\.js/i,
  /\/ace\.js/i,
  /\/ace-[\d.]+(?:\.min)?\.js/i,

  // Video players
  /\/video[.-][\d.]+(?:\.min)?\.js/i,
  /\/video\.js/i,
  /\/videojs[.-][\d.]+(?:\.min)?\.js/i,
  /\/plyr[.-][\d.]+(?:\.min)?\.js/i,
  /\/mediaelement[.-][\d.]+(?:\.min)?\.js/i,

  // Real-time / WebSocket
  /\/socket\.io[.-][\d.]+(?:\.min)?\.js/i,
  /\/socket\.io\.js/i,
  /\/socket\.io\.min\.js/i,
  /\/sockjs[.-][\d.]+(?:\.min)?\.js/i,
  /\/stomp[.-][\d.]+(?:\.min)?\.js/i,
  /\/signalr[.-][\d.]+(?:\.min)?\.js/i,

  // State management
  /\/mobx[.-][\d.]+(?:\.min)?\.js/i,
  /\/xstate[.-][\d.]+(?:\.min)?\.js/i,
  /\/zustand[.-][\d.]+(?:\.min)?\.js/i,
  /\/jotai[.-][\d.]+(?:\.min)?\.js/i,

  // Forms & validation
  /\/yup[.-][\d.]+(?:\.min)?\.js/i,
  /\/zod[.-][\d.]+(?:\.min)?\.js/i,
  /\/formik[.-][\d.]+(?:\.min)?\.js/i,
  /\/vee-validate[.-][\d.]+(?:\.min)?\.js/i,

  // Routing
  /\/page[.-][\d.]+(?:\.min)?\.js/i,
  /\/crossroads[.-][\d.]+(?:\.min)?\.js/i,
  /\/director[.-][\d.]+(?:\.min)?\.js/i,
  /\/sammy[.-][\d.]+(?:\.min)?\.js/i,
  /\/history[.-][\d.]+(?:\.min)?\.js/i,

  // Module loaders
  /\/require[.-][\d.]+(?:\.min)?\.js/i,
  /\/require\.js/i,
  /\/require\.min\.js/i,
  /\/almond[.-][\d.]+(?:\.min)?\.js/i,
  /\/curl[.-][\d.]+(?:\.min)?\.js/i,
  /\/system\.js/i,
  /\/systemjs[.-][\d.]+(?:\.min)?\.js/i,

  // Testing (if shipped to browser)
  /\/jasmine[.-][\d.]+(?:\.min)?\.js/i,
  /\/mocha[.-][\d.]+(?:\.min)?\.js/i,

  // Polyfills
  /\/polyfill(?:\.min)?\.js/i,
  /\/polyfills[.-][\d.]+(?:\.min)?\.js/i,
  /\/core-js[.-][\d.]+(?:\.min)?\.js/i,
  /\/es6-promise[.-][\d.]+(?:\.min)?\.js/i,
  /\/whatwg-fetch[.-][\d.]+(?:\.min)?\.js/i,
  /\/fetch-polyfill[.-][\d.]+(?:\.min)?\.js/i,
  /\/classlist(?:\.min)?\.js/i,
  /\/html5shiv[.-][\d.]+(?:\.min)?\.js/i,
  /\/respond[.-][\d.]+(?:\.min)?\.js/i,

  // Analytics & tracking
  /\/analytics[.-][\d.]+(?:\.min)?\.js/i,
  /\/gtag(?:\.min)?\.js/i,
  /\/ga(?:\.min)?\.js/i,
  /\/analytics\.js/i,
  /\/pixel\.[a-z0-9]+\.js/i,
  /\/fbevents\.js/i,
  /\/hotjar[.-][\d.]+(?:\.min)?\.js/i,
  /\/amplitude[.-][\d.]+(?:\.min)?\.js/i,
  /\/mixpanel[.-][\d.]+(?:\.min)?\.js/i,
  /\/segment[.-][\d.]+(?:\.min)?\.js/i,

  // Error tracking
  /\/sentry[.-][\d.]+(?:\.min)?\.js/i,
  /\/raven[.-][\d.]+(?:\.min)?\.js/i,
  /\/raygun[.-][\d.]+(?:\.min)?\.js/i,
  /\/bugsnag[.-][\d.]+(?:\.min)?\.js/i,
  /\/rollbar[.-][\d.]+(?:\.min)?\.js/i,
  /\/trackjs[.-][\d.]+(?:\.min)?\.js/i,
  /\/logrocket[.-][\d.]+(?:\.min)?\.js/i,

  // Payment
  /\/stripe[.-][\d.]+(?:\.min)?\.js/i,
  /\/paypal[.-][\d.]+(?:\.min)?\.js/i,
  /\/braintree[.-][\d.]+(?:\.min)?\.js/i,
  /\/square[.-][\d.]+(?:\.min)?\.js/i,
  /\/adyen[.-][\d.]+(?:\.min)?\.js/i,

  // CAPTCHAs
  /\/recaptcha[.-][\d.]+(?:\.min)?\.js/i,
  /\/hcaptcha[.-][\d.]+(?:\.min)?\.js/i,
  /\/turnstile[.-][\d.]+(?:\.min)?\.js/i,

  // Firebase / GCP
  /\/firebase[.-][\d.]+(?:\.min)?\.js/i,
  /\/firebase-app(?:\.compat)?(?:\.min)?\.js/i,
  /\/firebase-auth(?:\.compat)?(?:\.min)?\.js/i,
  /\/firebase-firestore(?:\.compat)?(?:\.min)?\.js/i,

  // Testing
  /\/jest[.-][\d.]+(?:\.min)?\.js/i,

  // i18n
  /\/i18next[.-][\d.]+(?:\.min)?\.js/i,
  /\/vue-i18n[.-][\d.]+(?:\.min)?\.js/i,
  /\/react-intl[.-][\d.]+(?:\.min)?\.js/i,

  // Markdown
  /\/marked[.-][\d.]+(?:\.min)?\.js/i,
  /\/showdown[.-][\d.]+(?:\.min)?\.js/i,
  /\/remarkable[.-][\d.]+(?:\.min)?\.js/i,
  /\/markdown-it[.-][\d.]+(?:\.min)?\.js/i,

  // PDF
  /\/pdfjs[.-][\d.]+(?:\.min)?\.js/i,
  /\/pdf[.-][\d.]+(?:\.min)?\.js/i,
  /\/pdf\.min\.js/i,
  /\/jspdf[.-][\d.]+(?:\.min)?\.js/i,
  /\/pdfmake[.-][\d.]+(?:\.min)?\.js/i,

  // Crypto
  /\/crypto-js[.-][\d.]+(?:\.min)?\.js/i,
  /\/sjcl[.-][\d.]+(?:\.min)?\.js/i,
  /\/forge[.-][\d.]+(?:\.min)?\.js/i,

  // Misc popular libs
  /\/velocity[.-][\d.]+(?:\.min)?\.js/i,
  /\/hammer[.-][\d.]+(?:\.min)?\.js/i,
  /\/hammerjs[.-][\d.]+(?:\.min)?\.js/i,
  /\/clipboard[.-][\d.]+(?:\.min)?\.js/i,
  /\/clipboard\.min\.js/i,
  /\/autosize[.-][\d.]+(?:\.min)?\.js/i,
  /\/lazysizes[.-][\d.]+(?:\.min)?\.js/i,
  /\/lozad[.-][\d.]+(?:\.min)?\.js/i,
  /\/filepond[.-][\d.]+(?:\.min)?\.js/i,
  /\/dropzone[.-][\d.]+(?:\.min)?\.js/i,
  /\/uppy[.-][\d.]+(?:\.min)?\.js/i,
  /\/shepherd[.-][\d.]+(?:\.min)?\.js/i,
  /\/intro[.-][\d.]+(?:\.min)?\.js/i,
  /\/driver[.-][\d.]+(?:\.min)?\.js/i,
  /\/tour[.-][\d.]+(?:\.min)?\.js/i,
  /\/hopscotch[.-][\d.]+(?:\.min)?\.js/i,
  /\/noty[.-][\d.]+(?:\.min)?\.js/i,
  /\/sweetalert[.-][\d.]+(?:\.min)?\.js/i,
  /\/sweetalert2[.-][\d.]+(?:\.min)?\.js/i,
  /\/toastr[.-][\d.]+(?:\.min)?\.js/i,
  /\/notie[.-][\d.]+(?:\.min)?\.js/i,
  /\/izitoast[.-][\d.]+(?:\.min)?\.js/i,
  /\/pnotify[.-][\d.]+(?:\.min)?\.js/i,

  // Stimulus / Turbo (Rails)
  /\/stimulus[.-][\d.]+(?:\.min)?\.js/i,
  /\/turbolinks[.-][\d.]+(?:\.min)?\.js/i,
  /\/turbo[.-][\d.]+(?:\.min)?\.js/i,

  // Lit / Web Components
  /\/lit[.-][\d.]+(?:\.min)?\.js/i,
  /\/lit-html[.-][\d.]+(?:\.min)?\.js/i,
  /\/lit-element[.-][\d.]+(?:\.min)?\.js/i,

  // Next.js runtime chunks (framework code, not app code)
  /\/_next\/static\/chunks\/framework[.-][a-z0-9]+\.js/i,
  /\/_next\/static\/chunks\/main[.-][a-z0-9]+\.js/i,
  /\/_next\/static\/chunks\/polyfills[.-][a-z0-9]+\.js/i,
  /\/_next\/static\/chunks\/webpack[.-][a-z0-9]+\.js/i,

  // Nuxt runtime
  /\/_nuxt\/(?:vendors~)?(?:app|commons|runtime)[.-][a-z0-9]+\.js/i,

  // Common vendor bundle names
  /\/vendors?(?:[.-][a-z0-9]+)?\.(?:bundle\.)?(?:min\.)?js/i,
  /\/vendor\.js/i,
  /\/vendor\.min\.js/i,
  /\/vendor\.bundle\.js/i,
];

/**
 * Check if a URL pathname matches any known library pattern.
 */
export function matchesLibPattern(url: string): boolean {
  try {
    const { pathname } = new URL(url);
    return LIB_PATTERNS.some((pattern) => pattern.test(pathname));
  } catch {
    return LIB_PATTERNS.some((pattern) => pattern.test(url));
  }
}

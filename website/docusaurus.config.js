module.exports = {
  title: 'Alfred',
  tagline: 'A Modular Toolchain for JavaScript',
  url: 'https://alfred.js.org',
  baseUrl: '/',
  projectName: 'alfred',
  organizationName: 'amilajack',
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.json'),
          editUrl: 'https://github.com/amilajack/alfred/edit/master/website',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
  plugins: [
    '@docusaurus/plugin-google-analytics',
    '@docusaurus/plugin-google-gtag',
    [
      '@docusaurus/plugin-sitemap',
      {
        cacheTime: 600 * 1000, // 600 sec - cache purge period
        changefreq: 'weekly',
        priority: 0.5,
      },
    ],
  ],
  themeConfig: {
    navbar: {
      title: 'Alfred',
      logo: {
        alt: 'Alfred Logo',
        src: 'img/alfred-logo-small.png',
      },
      links: [
        { to: 'docs/getting-started', label: 'Docs' },
        { to: 'docs/api', label: 'API' },
        {
          href: 'https://github.com/amilajack/alfred/tree/master/examples',
          label: 'Examples',
        },
        {
          href: 'https://spectrum.chat/alfred',
          label: 'Help',
        },
        {
          href: 'http://github.com/amilajack/alfred',
          label: 'GitHub',
        },
        { to: 'blog', label: 'Blog' },
        {
          href: 'https://www.patreon.com/join/2181265/checkout',
          label: 'Donate',
        },
      ],
    },
    footer: {
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Get Started',
              to: 'docs/getting-started',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            // @TODO Add stackoverflow
            {
              label: 'Spectrum',
              href: 'https://spectrum.chat/alfred',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/alfredpkg',
            },
            {
              label: 'Contributor Covenant',
              href:
                'https://www.contributor-covenant.org/version/1/4/code-of-conduct',
            },
          ],
        },
        {
          title: 'Social',
          items: [
            {
              label: 'GitHub',
              href: 'https://www.github.com/amilajack/alfred',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Alfred`,
    },
    image: 'img/alfred-log.png',
    sidebarCollapsible: false,
    algolia: {
      // "Search only api key". Safe to keep this public
      apiKey: 'd848c252109da356e9768ba9749c1b59',
      indexName: 'alfred_js',
    },
    googleAnalytics: {
      trackingID: 'UA-132764504-1',
    },
    gtag: {
      trackingID: 'UA-132764504-1',
    },
  },
  favicon: 'img/alfred-logo-small.png',
  scripts: ['https://buttons.github.io/buttons.js'],
};

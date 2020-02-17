/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
  title: 'Alfred',
  tagline: 'A standard workflow for JavaScript projects',
  url: 'https://alfred.js.org',
  baseUrl: '/',

  projectName: 'alfred',
  organizationName: 'amilajack',

  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.json')
        }
      }
    ]
  ],

  themeConfig: {
    navbar: {
      title: 'Alfred',
      logo: {
        alt: 'Alfred Logo',
        src: 'img/alfred-logo.png'
      },
      links: [
        { href: '/api', label: 'API', position: 'left' },
        { to: 'blog', label: 'Blog', position: 'left' },
        {
          href: 'https://github.com/amilajack/alfred',
          label: 'GitHub',
          position: 'right'
        }
      ]
    },
    header: [
      { doc: 'getting-started', label: 'Docs' },
      {
        href: 'http://github.com/alfred-js/alfred',
        label: 'GitHub'
      },
      { blog: true, label: 'Blog' },
      {
        href: 'https://www.patreon.com/join/2181265/checkout',
        label: 'Donate'
      }
    ],
    footer: {
      copyright: `Copyright © ${new Date().getFullYear()} Alfred`
    },
    image: 'img/alfred-log.png',
    sidebarCollapsible: false,
    algolia: {
      // "Search only api key". Safe to keep this public
      apiKey: 'd848c252109da356e9768ba9749c1b59',
      indexName: 'alfred_js'
    },
    gtag: {
      // Google analytics
      trackingID: 'UA-132764504-1'
    }
  },

  /* path to images for header/footer */
  favicon: 'img/alfred-logo.png',

  // Add custom scripts here that would be placed in <script> tags.
  scripts: ['https://buttons.github.io/buttons.js']
};

/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
          sidebarPath: require.resolve('./sidebars.json')
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css')
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
        { to: 'docs/getting-started', label: 'Docs' },
        { to: 'docs/api', label: 'API' },
        {
          href: 'https://github.com/amilajack/alfred/tree/master/examples',
          label: 'Examples'
        },
        {
          href: 'https://spectrum.chat/alfred',
          label: 'Help'
        },
        {
          href: 'http://github.com/amilajack/alfred',
          label: 'GitHub'
        },
        { to: 'blog', label: 'Blog' },
        {
          href: 'https://www.patreon.com/join/2181265/checkout',
          label: 'Donate'
        }
      ]
    },
    footer: {
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Get Started',
              to: 'docs/getting-started'
            }
          ]
        },
        {
          title: 'Community',
          items: [
            // @TODO Add stackoverflow
            {
              label: 'Spectrum',
              href: 'https://spectrum.chat/alfred'
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/alfredpkg'
            },
            {
              label: 'Contributor Covenant',
              href:
                'https://www.contributor-covenant.org/version/1/4/code-of-conduct'
            }
          ]
        },
        {
          title: 'Social',
          items: [
            {
              label: 'GitHub',
              href: 'https://www.github.com/amilajack/alfred'
            }
          ]
        }
      ],
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
  // path to images for header/footer
  favicon: 'img/alfred-logo-small.png',
  // Add custom scripts here that would be placed in <script> tags.
  scripts: ['https://buttons.github.io/buttons.js']
};

import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'ColabBoard Docs',
  tagline: 'Unified documentation for all ColabBoard microservices',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://ColabBoard.github.io',
  baseUrl: '/ColabBoard_Docs/',
  organizationName: 'ColabBoard',
  projectName: 'ColabBoard_Docs',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  themes: [
    '@docusaurus/theme-mermaid',
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        language: ['en'],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/ColabBoard/ColabBoard_Docs/tree/main/',
          showLastUpdateTime: true,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    mermaid: {
      theme: { light: 'neutral', dark: 'dark' },
    },
    navbar: {
      title: 'ColabBoard Docs',
      logo: {
        alt: 'ColabBoard Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'mainSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://github.com/ColabBoard/ColabBoard_Docs',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Services',
          items: [
            { label: 'SSE Service', to: '/docs/sse-service/overview' },
            { label: 'Session Service', to: '/docs/session-service/overview' },
            { label: 'Web App', to: '/docs/web-app/overview' },
            { label: 'Infrastructure', to: '/docs/infrastructure/gcp-pubsub' },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'GitHub', href: 'https://github.com/ColabBoard' },
            { label: 'Contributing', to: '/docs/contributing' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} ColabBoard. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['csharp', 'bash', 'docker', 'json', 'powershell'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

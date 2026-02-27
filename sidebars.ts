import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  mainSidebar: [
    {
      type: 'category',
      label: '📖 Overview',
      collapsed: false,
      items: [
        'overview/architecture',
        'overview/getting-started',
        'overview/conventions',
      ],
    },
    {
      type: 'category',
      label: '📡 SSE Service',
      collapsed: false,
      items: [
        'sse-service/overview',
        'sse-service/api-reference',
        'sse-service/authentication',
        'sse-service/connection-management',
        'sse-service/event-subscribers',
        'sse-service/deployment',
        'sse-service/configuration',
      ],
    },
    {
      type: 'category',
      label: '🔐 Session Service',
      collapsed: true,
      items: ['session-service/overview'],
    },
    {
      type: 'category',
      label: '🗄️ Session Database',
      collapsed: true,
      items: ['session-db/overview'],
    },
    {
      type: 'category',
      label: '🖥️ Web App',
      collapsed: true,
      items: ['web-app/overview'],
    },
    {
      type: 'category',
      label: '☁️ Infrastructure',
      collapsed: true,
      items: [
        'infrastructure/gcp-pubsub',
        'infrastructure/cloud-run',
        'infrastructure/load-balancer',
        'infrastructure/secret-manager',
      ],
    },
    'contributing',
  ],
};

export default sidebars;

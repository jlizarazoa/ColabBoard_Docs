import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  mainSidebar: [
    {
      type: 'category',
      label: '📖 Visión General',
      collapsed: false,
      items: [
        'overview/architecture',
        'overview/getting-started',
        'overview/conventions',
      ],
    },
    {
      type: 'category',
      label: '🖥️ Web App',
      collapsed: false,
      items: ['web-app/overview'],
    },
    {
      type: 'category',
      label: '🔀 API Gateway',
      collapsed: false,
      items: ['api-gateway/overview'],
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
      items: [
        'session-service/overview',
        'session-service/api-reference',
        'session-service/setup',
      ],
    },
    {
      type: 'category',
      label: '🗄️ Session Database',
      collapsed: true,
      items: ['session-db/overview'],
    },
    {
      type: 'category',
      label: '👤 Profile Service',
      collapsed: true,
      items: [
        'profile-service/overview',
        'profile-service/api-reference',
        'profile-service/setup',
      ],
    },
    {
      type: 'category',
      label: '📋 Task Service',
      collapsed: true,
      items: [
        'task-service/overview',
        'task-service/api-reference',
        'task-service/setup',
      ],
    },
    {
      type: 'category',
      label: '🏢 Workspace Service',
      collapsed: true,
      items: [
        'workspace-service/overview',
        'workspace-service/api-reference',
        'workspace-service/setup',
      ],
    },
    {
      type: 'category',
      label: '☁️ Infraestructura',
      collapsed: true,
      items: [
        'infrastructure/pubsub-standard',
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

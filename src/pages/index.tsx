import type { ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

type ServiceCard = {
  emoji: string;
  title: string;
  description: string;
  link: string;
  status: 'stable' | 'coming-soon';
};

const serviceCards: ServiceCard[] = [
  {
    emoji: '📡',
    title: 'SSE Service',
    description:
      'Real-time Server-Sent Events microservice. Delivers workspace events to browser clients over persistent HTTP connections.',
    link: '/docs/sse-service/overview',
    status: 'stable',
  },
  {
    emoji: '🔐',
    title: 'Session Service',
    description: 'Coming soon — documentation will be added in a future iteration.',
    link: '/docs/session-service/overview',
    status: 'coming-soon',
  },
  {
    emoji: '🗄️',
    title: 'Session Database',
    description: 'Coming soon — documentation will be added in a future iteration.',
    link: '/docs/session-db/overview',
    status: 'coming-soon',
  },
  {
    emoji: '🖥️',
    title: 'Web App',
    description:
      'React 19 SPA deployed on Cloudflare Pages. Kanban board, drag-and-drop, real-time SSE, profile setup, and workspace management.',
    link: '/docs/web-app/overview',
    status: 'stable',
  },
  {
    emoji: '🔀',
    title: 'API Gateway',
    description:
      'YARP reverse proxy (.NET 9) deployed on Cloud Run. Routes all browser traffic to downstream microservices with SSE passthrough.',
    link: '/docs/api-gateway/overview',
    status: 'stable',
  },
  {
    emoji: '☁️',
    title: 'Infrastructure',
    description:
      'GCP Pub/Sub, Cloud Run, Load Balancer, and Secret Manager setup for the entire ColabBoard platform.',
    link: '/docs/infrastructure/gcp-pubsub',
    status: 'stable',
  },
  {
    emoji: '📖',
    title: 'Architecture',
    description:
      'System architecture overview, data flow diagrams, service dependency map, and shared conventions.',
    link: '/docs/overview/architecture',
    status: 'stable',
  },
];

function ServiceCardItem({ card }: { card: ServiceCard }): ReactNode {
  return (
    <div className={clsx('col col--4', styles.cardCol)}>
      <div className={styles.card}>
        <div className={styles.cardEmoji}>{card.emoji}</div>
        <Heading as="h3" className={styles.cardTitle}>
          {card.title}
          {card.status === 'coming-soon' && (
            <span className={styles.badge}>coming soon</span>
          )}
        </Heading>
        <p className={styles.cardDescription}>{card.description}</p>
        <Link className="button button--outline button--primary button--sm" to={card.link}>
          View docs →
        </Link>
      </div>
    </div>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Unified documentation for all ColabBoard microservices">
      <header className={clsx('hero hero--primary', styles.heroBanner)}>
        <div className="container">
          <Heading as="h1" className="hero__title">
            ColabBoard Docs
          </Heading>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            <Link
              className="button button--secondary button--lg"
              to="/docs/overview/architecture">
              Architecture Overview
            </Link>
            <Link
              className="button button--outline button--secondary button--lg"
              to="/docs/overview/getting-started"
              style={{ marginLeft: '1rem' }}>
              Getting Started
            </Link>
          </div>
        </div>
      </header>
      <main>
        <section className={styles.cardsSection}>
          <div className="container">
            <div className="row">
              {serviceCards.map((card) => (
                <ServiceCardItem key={card.title} card={card} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}

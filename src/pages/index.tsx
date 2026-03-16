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
};

const serviceCards: ServiceCard[] = [
  {
    emoji: '📡',
    title: 'SSE Service',
    description:
      'Microservicio de eventos en tiempo real (Server-Sent Events). Entrega eventos del workspace a los clientes del navegador mediante conexiones HTTP persistentes.',
    link: '/docs/sse-service/overview',
  },
  {
    emoji: '🔐',
    title: 'Session Service',
    description:
      'Microservicio de autenticación basado en Spring Boot 3 y Firebase Admin SDK. Gestiona registro, login (email, SMS, OAuth), validación de tokens JWT y revocación de sesiones.',
    link: '/docs/session-service/overview',
  },
  {
    emoji: '🗄️',
    title: 'Session Database',
    description:
      'Firebase Authentication como base de datos de sesiones gestionada. Almacena credenciales, tokens JWT y metadatos de usuario con soporte multi-proveedor.',
    link: '/docs/session-db/overview',
  },
  {
    emoji: '🖥️',
    title: 'Web App',
    description:
      'SPA en React 19 desplegada en Cloudflare Pages. Incluye tablero Kanban, drag-and-drop, eventos en tiempo real por SSE, configuración de perfil y gestión de workspaces.',
    link: '/docs/web-app/overview',
  },
  {
    emoji: '🔀',
    title: 'API Gateway',
    description:
      'Reverse proxy YARP (.NET 9) desplegado en Cloud Run. Enruta el tráfico del navegador hacia los microservicios con soporte de passthrough para SSE.',
    link: '/docs/api-gateway/overview',
  },
  {
    emoji: '☁️',
    title: 'Infraestructura',
    description:
      'Configuración de GCP Pub/Sub, Cloud Run, Load Balancer y Secret Manager para toda la plataforma ColabBoard.',
    link: '/docs/infrastructure/gcp-pubsub',
  },
  {
    emoji: '📖',
    title: 'Arquitectura',
    description:
      'Visión general del sistema, diagramas de flujo de datos, mapa de dependencias entre servicios y convenciones compartidas.',
    link: '/docs/overview/architecture',
  },
];

function ServiceCardItem({ card }: { card: ServiceCard }): ReactNode {
  return (
    <div className={clsx('col col--4', styles.cardCol)}>
      <div className={styles.card}>
        <div className={styles.cardEmoji}>{card.emoji}</div>
        <Heading as="h3" className={styles.cardTitle}>
          {card.title}
        </Heading>
        <p className={styles.cardDescription}>{card.description}</p>
        <Link className="button button--outline button--primary button--sm" to={card.link}>
          Ver docs →
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
      description="Documentación unificada para todos los microservicios de ColabBoard">
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
              Visión General de Arquitectura
            </Link>
            <Link
              className="button button--outline button--secondary button--lg"
              to="/docs/overview/getting-started"
              style={{ marginLeft: '1rem' }}>
              Primeros Pasos
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

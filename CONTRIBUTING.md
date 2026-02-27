# Contributing to ColabBoard Docs

This repository hosts the unified documentation site for all ColabBoard microservices, built with [Docusaurus 3](https://docusaurus.io) and deployed to GitHub Pages.

## Quick Start

```bash
git clone https://github.com/tomasparramonroy/ColabBoard_Docs.git
cd ColabBoard_Docs
npm install
npm start          # Local dev server at http://localhost:3000
```

## Adding Documentation for Your Service

1. Create `.md` files in the relevant `docs/<your-service>/` folder.
2. Add front matter (`id`, `title`, `sidebar_label`) to each file.
3. Register your pages in `sidebars.ts`.
4. Run `npm run build` to check for broken links.
5. Submit a Pull Request to `main`.

Full details: [Contributing Guide](https://tomasparramonroy.github.io/ColabBoard_Docs/docs/contributing)

## Docs Site Structure

```
docs/
├── overview/          ← Architecture, Getting Started, Conventions
├── sse-service/       ← SSE Service full documentation
├── session-service/   ← Session Service (coming soon)
├── session-db/        ← Session Database (coming soon)
├── web-app/           ← Web App (coming soon)
├── infrastructure/    ← GCP setup guides
└── contributing.md    ← This guide (inside the site)
```

## Deployment

Documentation is automatically deployed to GitHub Pages whenever a PR is merged to `main`.

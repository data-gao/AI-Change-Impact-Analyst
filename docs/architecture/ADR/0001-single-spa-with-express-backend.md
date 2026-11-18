# ADR-0001: Single SPA with Express Backend

## Date
2026-08-19

## Status
Accepted

## Context
- The project is an internal automotive engineering tool for requirement impact analysis
- Needs to integrate with Gemini LLM API (requires server-side API key management)
- Needs to proxy requests to IBM Jazz (CORS restrictions, credential security)
- Target deployment: single-server or AI Studio hosted environment
- Development speed prioritized over scalability for MVP
- Alternatives considered: Next.js SSR, separate frontend/backend repos, serverless functions

## Decision
- React 19 SPA built with Vite for fast HMR and modern tooling
- Express.js backend serving as API proxy and Gemini integration layer
- In development: Vite middleware mode attached to Express (single process)
- In production: Vite builds static assets, esbuild bundles server.ts → dist/server.cjs
- Single repository, single deployment unit
- Tailwind CSS 4 via Vite plugin for zero-config styling

## Consequences

### Positive
- Simple deployment (single Node.js process)
- Fast development cycle
- API key stays server-side
- Natural CORS handling

### Negative
- Monolithic frontend (App.tsx is 1400+ lines)
- No SSR/SEO benefits (not needed for internal tool)
- Single process bottleneck

### Risks
- As the app grows, the monolithic App.tsx will need decomposition
- Server restart loses all in-memory state

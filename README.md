<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Outlooking

<img width="1917" height="876" alt="Bildschirmfoto 2026-11-18 um 14 47 28" src="https://github.com/user-attachments/assets/8c0a4d12-a47e-433b-8c1b-aa3de45c3620" />


# AI Impact Analyst

Automotive requirement impact analysis tool, converting meeting logs to user stories, comparing with IBM Jazz, and tracing dependencies via an interactive graph.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Documentation

This project maintains structured specification and architecture documentation under [`docs/`](docs/).

### Specifications
| Document | Description |
|----------|-------------|
| [PRD.md](docs/spec/PRD.md) | Product Requirements Document — features, user personas, functional & non-functional requirements |
| [TECH_SPEC.md](docs/spec/TECH_SPEC.md) | Technical Specification — API contracts, data models, LLM integration, error handling |

### Architecture
| Document | Description |
|----------|-------------|
| [SYSTEM_ARCHITECTURE.md](docs/architecture/SYSTEM_ARCHITECTURE.md) | System architecture overview with diagrams, component decomposition, tech stack |
| [DATA_FLOW.md](docs/architecture/DATA_FLOW.md) | Data flow design, state management, event sequences, graph rendering pipeline |

### Architecture Decision Records (ADR)
| ADR | Title |
|-----|-------|
| [ADR-0001](docs/architecture/ADR/0001-single-spa-with-express-backend.md) | Single SPA with Express Backend |
| [ADR-0002](docs/architecture/ADR/0002-in-memory-state-over-database.md) | In-Memory State Over Database |

### Process
| Document | Description |
|----------|-------------|
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | Contributing guidelines, documentation update rules, ADR submission process |

> **Note:** When making code changes, always check if spec or architecture docs need updating. See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for the change management process.

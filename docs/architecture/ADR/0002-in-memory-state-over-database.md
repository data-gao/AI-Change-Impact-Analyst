# ADR-0002: In-Memory State Over Database

## Date
2026-08-19

## Status
Accepted

## Context
- The tool manages automotive requirements (`Requirement[]`) and trace links (`TraceLink[]`)
- Data is initialized from hardcoded `INITIAL_REQUIREMENTS` and `INITIAL_LINKS` arrays in `src/data.ts`
- 9 initial requirements across 3 domains (ADAS, Security, BMS) + 8 trace links
- Runtime mutations occur via: LLM analysis results, manual creation, Jazz push operations
- A reset API restores factory state
- Primary data source of truth is intended to be IBM Jazz RM (external system)
- Neo4j is listed in the UI but currently mocked/not connected
- Alternatives considered: SQLite, PostgreSQL, file-based JSON storage, actual Neo4j connection

## Decision
- Use JavaScript arrays as in-memory data store (`currentRequirements`, `currentLinks`)
- Provide `/api/requirements/reset` endpoint to restore initial state
- Accept data loss on server restart as acceptable for MVP/demo
- IBM Jazz is the intended eventual system of record

## Consequences

### Positive
- Zero infrastructure dependencies
- Instant startup, perfect for demos
- Easy to understand and debug

### Negative
- Data lost on every server restart
- No persistence across sessions
- No concurrent user support
- No query optimization

### Risks
- Users may expect data persistence; need clear documentation that this is a sandbox.
- Future migration to actual DB or Jazz as source-of-truth will require significant refactoring of `server.ts`

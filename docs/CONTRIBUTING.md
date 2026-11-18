# Contributing Guidelines

Welcome to the AI Impact Analyst project! This document outlines our documentation structure and processes for contributing.

## 1. Documentation Structure Overview

```text
docs/
├── CONTRIBUTING.md
├── spec/
│   ├── PRD.md
│   └── TECH_SPEC.md
└── architecture/
    ├── SYSTEM_ARCHITECTURE.md
    ├── DATA_FLOW.md
    └── ADR/
        ├── 0000-template.md
        ├── 0001-*.md
        └── 0002-*.md
```

## 2. When to Update Each Document

- **PRD.md**: When adding/removing/changing product features or user-facing behavior
- **TECH_SPEC.md**: When changing API contracts, data models, LLM prompts, or integration protocols
- **SYSTEM_ARCHITECTURE.md**: When introducing new components, services, or external integrations
- **DATA_FLOW.md**: When changing state management, data flow patterns, or adding new state variables

## 3. ADR Submission Process

- **When to create an ADR**: Any significant architectural decision (new technology, pattern change, integration approach, data storage change)
- **Numbering**: Sequential 4-digit (0003, 0004, ...)
- **Filename convention**: `NNNN-kebab-case-short-title.md`
- **Status lifecycle**: Proposed → Accepted → (optionally Deprecated/Superseded)
- **Template**: Use the template at `docs/architecture/ADR/0000-template.md`
- **Self-contained**: Each ADR should be self-contained and understandable in isolation

## 4. Change Management Process

- **Step 1**: For any code change, check if it impacts spec or architecture docs
- **Step 2**: Update affected documentation in the same PR as the code change
- **Step 3**: If the change represents a significant architectural decision, create a new ADR
- **Step 4**: PR reviewer should verify documentation consistency

## 5. Document Maintenance Rules

- Keep all Mermaid diagrams in sync with actual code structure
- API contracts in `TECH_SPEC.md` must match `server.ts` implementation
- Data models in `TECH_SPEC.md` must match `types.ts`
- Version history: Use git blame/log, no manual changelog needed

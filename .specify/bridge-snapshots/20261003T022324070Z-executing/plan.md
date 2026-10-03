# Implementation Plan: Legal AI Intake Agent

**Branch**: `001-legal-agent-intake` | **Date**: 2026-10-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-legal-agent-intake/spec.md`

## Summary

Implement a Legal AI Intake Agent using the LEAF Framework. The agent uses a Conditional Router State Machine to dynamically route between educational responses (via Domain Knowledge RAG) and data collection (via Fact Extraction based on dynamic JSON schemas), providing empathetic responses through Case Study steering.

## Technical Context

**Language/Version**: TypeScript (Bun runtime, strict mode)

**Primary Dependencies**: NestJS 10, LangGraph.js, Drizzle ORM, @sancus-flow/types

**Storage**: PostgreSQL with pgvector (Agentic state in `agentic_checkpoints`, facts in `prospect_facts`/`prospect_leaf_profiles`)

**Testing**: Jest (Unit/Integration) & Playwright (E2E)

**Target Platform**: AWS ECS (Fargate for backend APIs)

**Project Type**: NestJS REST API / AI Agent (`agentic-apis` app)

**Performance Goals**: Average response time under 3 seconds per turn

**Constraints**: Separation of LangGraph state from CRM tables; no hardcoded TypeScript taxonomy schemas.

**Scale/Scope**: Extensible to multiple domains (Wills, Conveyancing).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Project rules require Drizzle ORM (Prisma strictly forbidden). -> Compliant.
- Project rules require using `@sancus-flow/types` for shared contracts. -> Compliant.

## Project Structure

### Documentation (this feature)

```text
specs/001-legal-agent-intake/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
apps/agentic-apis/
├── src/
│   ├── agents/
│   │   ├── supervisor/
│   │   ├── educator/
│   │   └── intake/
│   ├── taxonomy/
│   └── knowledge/
└── tests/

packages/types/
└── src/
    └── agentic/
```

**Structure Decision**: Logic is confined to the `agentic-apis` backend application, while domain contracts are placed in `@sancus-flow/types`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*(No violations)*

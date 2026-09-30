# Architecture

## Overview
Sancus Flow is structured as a **Turborepo monorepo** utilizing **Bun** as the package manager and runtime. The system is partitioned into 5 targeted applications (3 frontends, 2 backends) and 3 shared packages to maintain strict separation of concerns, optimize cloud infrastructure costs, and give AI coding agents scoped context.

## Monorepo Layout

### Frontend Applications (`apps/*-ui`)
1. **`marketplace-ui` (Port 3000)**:
   - **Role**: Public-facing consumer "Town Square" for discovering legal services, exploring lawyer profiles, reading legal guides, and tracking consumer case statuses.
   - **Framework**: Next.js 15 (App Router).
   - **Rendering**: Server-Side Rendering (SSR) and Incremental Static Regeneration (ISR/SSG) for dynamic SEO metadata and fast page delivery.
   - **Deployment**: AWS Amplify (or Vercel). Serverless SSR compute.

2. **`agentic-ui` (Port 3001)**:
   - **Role**: Embeddable "Trojan Horse" conversational widget designed to be injected via `<iframe>` into third-party solicitor websites or embedded directly in `marketplace-ui`.
   - **Framework**: Next.js 15 (App Router).
   - **Rendering**: Pure static HTML/JS via Next.js `output: 'export'`.
   - **Deployment**: AWS S3 + CloudFront CDN. Low-cost, highly cacheable edge delivery.

3. **`crm-ui` (Port 3002)**:
   - **Role**: Private "Back Office" dashboard for legal practitioners to manage lead pipelines, review AI-qualified leads and transcripts, and configure practice management integrations.
   - **Framework**: Next.js 15 (App Router).
   - **Rendering**: Pure static HTML/JS Single Page Application (SPA) via `output: 'export'`.
   - **Deployment**: AWS S3 + CloudFront CDN. Authenticated SPA experience with minimal hosting overhead.

### Backend Services (`apps/*-apis`)
1. **`agentic-apis` (Port 4001)**:
   - **Role**: AI Agent Engine dedicated to LLM orchestration, conversational state management, and executing the MEDDPICC qualification framework.
   - **Framework**: NestJS 10 + LangGraph.js.
   - **Key Capabilities**: Real-time WebSocket gateways for consumer chat, prompt engineering, agent state machines, structured brief generation.
   - **Deployment**: AWS ECS (Fargate). Persistent container runtime.
   - **Inter-Service Flow**: Transmits qualified structured case briefs to `crm-apis` via internal REST/Event APIs.

2. **`crm-apis` (Port 4002)**:
   - **Role**: Core data backbone and business logic engine maintaining canonical state (consumer profiles, lawyer accounts, listings, leads, cases).
   - **Framework**: NestJS 10 (Modular Monolith architecture).
   - **Key Capabilities**: PostgreSQL persistence via Drizzle ORM, BetterAuth authentication/sessions, Practice Management System (PMS) integrations (LEAP, Clio), marketplace search APIs.
   - **Deployment**: AWS ECS (Fargate). Persistent container runtime.

### Shared Packages (`packages/*`)
- **`@sancus-flow/types`**: Canonical TypeScript interfaces defining domain models (`Case`, `Lead`, `LawyerProfile`, `ConversationMessage`, etc.). Serves as the single source of truth between `agentic-apis` and `crm-apis`.
- **`@sancus-flow/ui`**: Shared React component library (design system) built with Tailwind CSS and Radix/shadcn primitives, shared across `marketplace-ui`, `crm-ui`, and `agentic-ui`.
- **`@sancus-flow/tsconfig`**: Shared TypeScript compiler configs (`base.json`, `nextjs.json`, `nestjs.json`).

## Architecture Boundaries & Invariants
- **No Direct Database Access from Frontend**: Frontend apps (`*-ui`) must NEVER connect directly to the database or import Drizzle schemas. All persistence goes through `crm-apis`.
- **Separation of LLM and Data Backbone**: `agentic-apis` manages LLM interactions and conversational state, while `crm-apis` owns user data, billing, and canonical database tables.
- **Contract-First Communication**: Changes to payloads exchanged between `agentic-apis` and `crm-apis` must first be updated in `@sancus-flow/types`.
- **Static Export Constraints**: In `agentic-ui` and `crm-ui`, features that require a Next.js Node.js server runtime (e.g. server-side `cookies()` or `headers()` inside layout rendering) are disallowed because both apps build via `output: 'export'`.

## Deployment & Cost Strategy
- **Containerized Compute (ECS Fargate)**: Reserved only for the two persistent backend services (`agentic-apis`, `crm-apis`).
- **Serverless SSR (Amplify)**: Dedicated exclusively to SEO-sensitive `marketplace-ui`.
- **Static Storage & CDN (S3 + CloudFront)**: Houses `agentic-ui` and `crm-ui`, keeping infrastructure costs minimal (~£100-130/month across the stack).
- **IaC**: Terraform configuration resides in `infrastructure/` defining AWS resources.

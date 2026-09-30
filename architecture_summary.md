# Sancus Flow: Architecture & Service Summary

This document provides a technical and functional overview of the Sancus Flow platform architecture. It is designed to capture the structural decisions and service boundaries established during the ideation phase, optimizing for clean developer experience (specifically for AI coding agents), cost-effective deployment, and distinct user contexts.

## 1. Overview
Sancus Flow is structured as a **Turborepo monorepo** utilizing **Bun** as the runtime and package manager. The architecture divides the system into 5 distinct applications (3 frontends, 2 backends) and 3 shared packages. 

This strict separation ensures that each application serves exactly one primary user persona, allowing coding agents to maintain tight, relevant context without being polluted by unrelated business logic.

---

## 2. Frontend Services (Next.js 15)

### 2.1. `marketplace-ui` (Port 3000)
**Functional Purpose:** 
The public-facing consumer "Town Square". This is where end-users discover legal services, browse lawyer profiles, read guides (e.g., "How to make a will"), and access their consumer portal to check case status.
**Technical Architecture:**
- **Framework:** Next.js 15 (App Router)
- **Rendering:** SSR (Server-Side Rendering) and SSG/ISR for critical SEO pages.
- **Deployment Strategy:** AWS Amplify (or Vercel). This is the *only* frontend requiring a server execution environment for dynamic SEO tags.

### 2.2. `agentic-ui` (Port 3001)
**Functional Purpose:**
The embeddable "Trojan Horse" chat widget. This lightweight UI is designed to be injected via `<iframe>` into third-party solicitor websites, or rendered within the `marketplace-ui`. It handles the live conversational interface for consumers.
**Technical Architecture:**
- **Framework:** Next.js 15 (App Router)
- **Rendering:** Static HTML/JS (via Next.js `output: 'export'`).
- **Deployment Strategy:** AWS S3 + CloudFront. Highly cacheable, near-zero cost, easily distributed as a static asset.

### 2.3. `crm-ui` (Port 3002)
**Functional Purpose:**
The private dashboard ("The Back Office") for legal practitioners. This is a fully authenticated web application where lawyers log in to manage their pipeline, review AI-qualified leads, view conversation transcripts, and manage system integrations (e.g., LEAP/Clio).
**Technical Architecture:**
- **Framework:** Next.js 15 (App Router)
- **Rendering:** Static HTML/JS (via Next.js `output: 'export'`). SEO is completely irrelevant here.
- **Deployment Strategy:** AWS S3 + CloudFront. Cost-efficient hosting for an authenticated Single Page Application (SPA) experience.

---

## 3. Backend Services (NestJS 10)

### 3.1. `agentic-apis` (Port 4001)
**Functional Purpose:**
The AI Agent Engine. This service is dedicated exclusively to LLM orchestration, maintaining conversation state, and executing the MEDDPICC qualification framework. It operates the chat interface and structures the raw conversational data into a formalized case brief.
**Technical Architecture:**
- **Framework:** NestJS 10 + LangGraph.js
- **Key Responsibilities:** WebSocket connections for real-time chat, prompt management, LangGraph state execution.
- **Deployment Strategy:** AWS ECS (Fargate). Requires a persistent runtime server.
- **Data Flow:** Once a case is fully qualified by the AI, this service pushes a structured payload to the `crm-apis` via internal REST/Event calls.

### 3.2. `crm-apis` (Port 4002)
**Functional Purpose:**
The general-purpose CRM backend and data backbone. It holds the canonical state of the system: consumer profiles, lawyer accounts, marketplace listings, leads, and cases. 
**Technical Architecture:**
- **Framework:** NestJS 10 (Modular monolith internal structure)
- **Key Responsibilities:** 
  - Database access (PostgreSQL via ORM).
  - Authentication (Lawyer JWTs, Consumer sessions).
  - External PMS integrations (pushing data downstream to LEAP or Clio).
  - Marketplace search APIs.
- **Deployment Strategy:** AWS ECS (Fargate). Requires a persistent runtime server.

---

## 4. Shared Packages

To prevent code duplication while maintaining strict app boundaries, the monorepo utilizes shared packages:
- **`@sancus-flow/types`**: Shared TypeScript interfaces defining the core domain (e.g., `Case`, `Lead`, `LawyerProfile`). Ensures the contract between `agentic-apis` and `crm-apis` remains perfectly synced.
- **`@sancus-flow/ui`**: Shared React components (Design System) used across `marketplace-ui`, `crm-ui`, and `agentic-ui` to maintain visual consistency.
- **`@sancus-flow/tsconfig`**: Centralized TypeScript compiler configurations (Base, Next.js, and NestJS).

## 5. Deployment & Cost Strategy Summary
By logically splitting the architecture, Sancus Flow avoids running 5 expensive containerized microservices. 
- **Compute (ECS):** Only the 2 backend APIs (`agentic-apis`, `crm-apis`) require ECS Fargate containers.
- **Serverless (Amplify):** Only the SEO-critical `marketplace-ui` utilizes serverless SSR compute.
- **Static Storage (S3/CDN):** The `agentic-ui` and `crm-ui` are purely static, costing pennies per month to host globally via CloudFront. 

This hybrid deployment model provides enterprise-grade scalability and extreme modularity while keeping startup infrastructure costs extremely low (~£100-130/month).

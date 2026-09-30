# Frontend Instructions: crm-ui

## Product
The private "Back Office" dashboard for legal practitioners in Sancus Flow (Port 3002). Lawyers log into this authenticated web application to manage their lead pipeline, review AI-qualified leads, inspect conversation transcripts, and manage practice management integrations (e.g., LEAP, Clio).

## Technical Stack
- **Framework**: Next.js 15 (App Router, React 19)
- **Rendering**: Pure static HTML/JS Single Page Application (SPA) via Next.js `output: 'export'`
- **Deployment**: AWS S3 + CloudFront CDN
- **UI Components**: `@sancus-flow/ui` design system & Tailwind CSS
- **Shared Types**: `@sancus-flow/types`
- **Authentication**: BetterAuth client with secure JWT session handling

## Architecture Rules
- **Static Export Discipline**: This application is compiled statically (`output: 'export'`). Do not use server-side runtime APIs (no server actions requiring Node.js runtime, no dynamic server headers). All mutations and data queries occur via client HTTP requests to `crm-apis` (Port 4002).
- **Authentication & Guards**: Enforce authentication state client-side. Protect private routes by validating JWT tokens and redirecting unauthenticated users to the login flow.
- **State Management & Caching**: Use efficient client-side fetching/caching for CRM lead lists, pipeline stages, case details, and integration configurations.
- **Rich Dashboard UI**: Deliver a polished, high-density practitioner workspace with fast filtering, search, kanban or table pipeline views, and transcript viewers.
- **No Direct DB Access**: All data queries and mutations must target `crm-apis`. Never import backend ORM schemas.

## Development Commands
- Start development server: `bun run dev` (runs on `http://localhost:3002`)
- Build static bundle: `bun run build`
- Lint code: `bun run lint`

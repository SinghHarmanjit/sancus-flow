# Backend Instructions: crm-apis

## Product
The core CRM backend and canonical data backbone for Sancus Flow (Port 4002). This service manages persistent state for consumer profiles, lawyer accounts, marketplace listings, leads, qualified cases, and external legal Practice Management System (PMS) integrations.

## Technical Stack
- **Framework**: NestJS 10 (Modular Monolith)
- **Database ORM**: Drizzle ORM (Prisma is strictly forbidden)
- **Database**: PostgreSQL
- **Authentication**: BetterAuth (Lawyer JWTs, consumer sessions, RBAC)
- **Email Service**: Resend
- **Integrations**: PMS Connectors (LEAP, Clio)
- **Shared Types**: `@sancus-flow/types`
- **Deployment**: AWS ECS (Fargate persistent container)

## Architecture Rules
- **Modular Monolith**: Organize `src/` into distinct domain modules (e.g., `cases/`, `leads/`, `lawyers/`, `marketplace/`, `integrations/`, `auth/`).
- **Thin Controllers & Rich Services**: Controllers must only receive requests, validate input via DTOs, and delegate business logic to injectable NestJS services.
- **Database Access via Drizzle**:
  - All database interactions must use Drizzle ORM.
  - Schema definitions and relations must be organized cleanly, exporting shared domain models to `@sancus-flow/types`.
  - Migrations are generated and applied via Drizzle Kit. Never alter an existing migration file.
- **External PMS Integrations**:
  - Encapsulate third-party legal PMS integrations (LEAP, Clio) inside dedicated integration service modules.
  - Use queuing / background retry logic for external PMS data synchronization.
- **Marketplace & Search APIs**: Provide optimized endpoints for lawyer search, filtering, and consumer guide content for `marketplace-ui`.
- **Intake Ingestion**: Expose secure internal endpoints for `agentic-apis` to push structured case briefs and leads into the canonical database.

## Validation & Security
- Use global `ValidationPipe` with `whitelist: true`, `transform: true`, and `forbidNonWhitelisted: true`.
- Implement robust NestJS guards for BetterAuth session verification and role-based permissions.
- Store sensitive tokens in HTTP-only, secure cookies.

## Development Commands
- Start development server: `bun run dev` (runs on `http://localhost:4002`)
- Build application: `bun run build`
- Typecheck & lint: `bun run lint`
- Database migrations: `bun run db:generate` / `bun run db:migrate`

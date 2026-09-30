# Repository Instructions

## Product
Sancus Flow is a full-stack legal technology platform and AI intake pipeline. The system connects consumers seeking legal services with qualified legal practitioners through an AI-powered conversational intake engine (executing the MEDDPICC qualification framework), a public legal marketplace, and a dedicated lawyer CRM.

## Documentation
- Read `architecture_summary.md` and `docs/architecture.md` before modifying service boundaries, monorepo structure, or infrastructure.
- Read `docs/database.md` before changing schemas, models, or creating Drizzle migrations.
- Read `docs/authentication.md` before modifying session, JWT, or permission logic.
- Read `docs/testing.md` for our Jest and Playwright testing setup and guidelines.
- Read `docs/git-workflow.md` for pull request, linting, and validation requirements.

## Technical Stack
- **Monorepo Tool**: Turborepo
- **Package Manager & Runtime**: Bun
- **Language**: TypeScript (strict mode)
- **Frontend Framework**: Next.js 15 (App Router, Server Components)
- **Backend Framework**: NestJS 10
- **AI Orchestration**: LangGraph.js (in `agentic-apis`)
- **Authentication**: BetterAuth (Lawyer JWTs & consumer sessions)
- **ORM**: Drizzle ORM (Prisma is strictly forbidden)
- **Database**: PostgreSQL
- **Emails**: Resend
- **Infrastructure**: AWS ECS (Fargate for backend APIs), AWS Amplify (for SSR marketplace), AWS S3 + CloudFront (for static SPAs)
- **Infrastructure as Code**: Terraform
- **Testing**: Jest (Unit / Integration) & Playwright (E2E)

## Repository Structure
```
sancus-flow/
├── apps/
│   ├── marketplace-ui/    # Next.js 15 SSR/SSG consumer marketplace (Port 3000)
│   ├── agentic-ui/        # Next.js 15 static embeddable iframe chat widget (Port 3001)
│   ├── crm-ui/            # Next.js 15 static lawyer CRM dashboard SPA (Port 3002)
│   ├── agentic-apis/      # NestJS 10 + LangGraph AI intake & orchestration engine (Port 4001)
│   └── crm-apis/          # NestJS 10 modular monolith core CRM & data backbone (Port 4002)
├── packages/
│   ├── types/             # Shared TypeScript domain contracts (@sancus-flow/types)
│   ├── ui/                # Shared React design system (@sancus-flow/ui)
│   └── tsconfig/          # Shared TypeScript configurations (@sancus-flow/tsconfig)
├── docs/                  # Architecture, database, auth, testing & workflow documentation
└── architecture_summary.md # Platform architectural overview and service boundaries
```

## Development Commands
- Install dependencies: `bun install`
- Start all development servers: `bun run dev`
- Build all applications: `bun run build`
- Run linting: `bun run lint`
- Clean build caches: `bun run clean`
- Run unit & integration tests: `bun run test`
- Run E2E tests: `bun run test:e2e`

## Core Architectural Rules for Agents
1. **Strict Service Boundaries**: Each app has a dedicated `AGENTS.md` in its root. Follow the specific instructions for each service.
2. **Database Isolation**: Frontend applications must never connect directly to the database. All persistence is handled by backend services (primarily `crm-apis` via Drizzle ORM).
3. **Cross-App Communication**: `agentic-apis` communicates with `crm-apis` via internal REST/Event calls using shared contracts defined in `@sancus-flow/types`.
4. **Shared Code**: Never duplicate domain interfaces or shared UI across apps; use `@sancus-flow/types` and `@sancus-flow/ui`.
5. **Static Export Discipline**: `agentic-ui` and `crm-ui` are configured for static export (`output: 'export'`). Do not introduce runtime server-only Next.js features (such as dynamic headers/cookies in RSC) in these apps.

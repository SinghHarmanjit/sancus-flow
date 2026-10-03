# Feature Specification: Agentic APIs Bootstrap

**Feature ID**: 000
**Branch**: `000-agentic-apis-bootstrap`
**Date**: 2026-10-03
**Status**: In Planning

---

## Summary

Bootstrap the `agentic-apis` NestJS service so that it is fully operational end-to-end: local LLM models running, database wired with Drizzle migrations auto-applied on startup, LLM service injected via NestJS DI, a working chat REST API, and a persistence layer backed by PostgreSQL with pgvector.

---

## Background

The `agentic-apis` service exists as a skeleton (NestJS app module, schema, and partial src structure) but is not yet functionally wired. The service must connect the following four systems before higher-level agent features (e.g., MEDDPICC intake, LangGraph orchestration) can be built:

1. **Local LLM runtime** — gemma3 and nomic-embed-text served via `llm-run`
2. **Database** — PostgreSQL + pgvector, schema already authored in `src/db/schema.ts`
3. **Drizzle ORM** — migration generation and auto-apply on startup
4. **NestJS application** — ConfigModule, DrizzleModule, LlmModule, ChatModule wired together

---

## Requirements

### Functional Requirements

1. **LLM Model Startup**: Document and support starting local LLM models using `llm-run` commands from `start-llm.md`. `.env` must reflect the correct base URLs.

2. **Database Configuration**: The PostgreSQL connection URL is already set in `.env` (`DATABASE_URL`). The service must connect and confirm the DB is reachable on startup.

3. **Drizzle Migration Scripts**: Add `db:generate`, `db:migrate`, and `db:studio` scripts to `package.json`. Create `drizzle.config.ts` pointing to `src/db/schema.ts` with output to `src/db/migrations/`.

4. **Migration on Startup**: `DrizzleService` must run `migrate()` from `drizzle-orm/node-postgres/migrator` in `onModuleInit()`. Migration folder: `src/db/migrations/`.

5. **LLM Integration**: Wire the `getLLM()` factory (from reference `llm.ts`) into a `LlmModule` / `LlmService` that provides a singleton `ChatOpenAI` instance via NestJS DI.

6. **Service + Controller Layer**:
   - `POST /chat/session` — create session, persist to DB, return `{ sessionId }`
   - `POST /chat/:sessionId/message` — persist user message, invoke LLM, persist assistant message, return reply
   - `GET /chat/:sessionId` — retrieve session + message history
   - `GET /health` — check DB connectivity and LLM reachability

7. **Database Persistence**: All session and message records must be persisted via Drizzle queries through `ChatRepository`.

8. **E2E Test**: The server must start, apply migrations, and respond correctly to all four endpoints.

### Non-Functional Requirements

- **Startup time**: Server ready in < 10s on local hardware
- **LLM response**: Chat endpoint returns within reasonable inference time (depends on model)
- **Idempotency**: Migrations are safe to run on already-migrated DB

---

## Scope

### In Scope
- `drizzle.config.ts` creation
- `db:generate`, `db:migrate`, `db:studio` package.json scripts
- `ConfigModule` global registration in `AppModule`
- `DrizzleModule` / `DrizzleService` with auto-migration on startup
- `LlmModule` / `LlmService` using `ChatOpenAI` via `getLLM()` factory
- `ChatModule` with `ChatController`, `ChatService`, `ChatRepository`
- DTO validation classes for session and message endpoints
- `HealthController` with `/health` endpoint
- Updating `AppModule` to import all modules
- Enabling global `ValidationPipe` in `main.ts`
- Updating `.env` to reference correct LLM ports

### Out of Scope
- LangGraph state machine / MEDDPICC orchestration (feature 001)
- Authentication / JWT validation
- crm-apis integration / case brief transmission
- RAG knowledge base ingestion pipeline
- Streaming (SSE) responses

---

## Acceptance Criteria

- [ ] `bun run db:generate` creates migration files in `src/db/migrations/`
- [ ] `bun run dev` starts server, migration log appears, server is ready on port 4001
- [ ] `GET /health` returns `{ "status": "ok", "db": "connected", "llm": "reachable" }`
- [ ] `POST /chat/session` with valid domain returns `{ sessionId, domain, status, createdAt }`
- [ ] `POST /chat/:sessionId/message` with valid content returns `{ messageId, reply, sessionId }`
- [ ] `GET /chat/:sessionId` returns session with message history array
- [ ] DB contains session + message records (verified via psql)
- [ ] TypeScript compilation passes (`bun run lint`)

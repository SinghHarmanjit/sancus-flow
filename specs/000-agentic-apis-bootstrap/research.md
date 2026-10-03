# Research: Agentic APIs Bootstrap

**Feature**: 000-agentic-apis-bootstrap
**Date**: 2026-10-03

## 1. LLM Local Runtime — `llm-run` CLI

**Decision**: Use `llm-run` CLI to start local models, as referenced in `start-llm.md`.

```bash
llm-run --model gemma3 --port 10086 --start        # LLM inference
llm-run --embedding nomic --port 10087 --start     # Embedding model
```

**Rationale**: The `.env` already configures `LLM_BASE_URL` and `EMBEDDING_BASE_URL` pointing to running servers. `start-llm.md` defines canonical startup. The `.env` ports (10030/10020) should be updated to match 10086/10087 for consistency with `start-llm.md`, or left as-is if they already point to running instances.

**Alternatives considered**: Ollama — heavier footprint, requires separate install. `llm-run` is already in the dev workflow.

---

## 2. Drizzle Migration Script Generation

**Decision**: Use `drizzle-kit generate` + `drizzle-kit migrate` via package.json scripts. Config lives at `apps/agentic-apis/drizzle.config.ts`.

```ts
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

**Scripts to add to `package.json`**:
```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio"
```

**Rationale**: `drizzle-kit` is already in devDependencies (v0.31.11). Schema is already authored in `src/db/schema.ts`. No extra dependencies needed.

**Alternatives considered**: Prisma — forbidden per AGENTS.md. Raw SQL migrations — defeats the purpose of the ORM.

---

## 3. NestJS Drizzle Integration (Migrations on Startup)

**Decision**: Implement a custom `DrizzleModule` with a `DrizzleService` that wraps a `drizzle-orm/node-postgres` Pool connection. Migrations run programmatically via the `migrate()` function from `drizzle-orm/node-postgres/migrator` inside `onModuleInit`.

```ts
// src/db/drizzle.service.ts
import { migrate } from 'drizzle-orm/node-postgres/migrator';

@Injectable()
export class DrizzleService implements OnModuleInit {
  db: NodePgDatabase<typeof schema>;

  async onModuleInit() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.db = drizzle(pool, { schema });
    await migrate(this.db, { migrationsFolder: './src/db/migrations' });
    console.log('[DrizzleService] Migrations applied');
  }
}
```

**Rationale**: Runtime migration on startup keeps the service self-contained in ECS Fargate. No shell CLI dependency at runtime. Idempotent — Drizzle skips already-applied migrations.

**Alternatives considered**: Pre-start shell script (`drizzle-kit migrate`) — fragile in Docker without CLI installed. Separate migration job — over-engineered for current scale.

---

## 4. LLM Wiring via `getLLM` Factory

**Decision**: Wrap the `getLLM` factory (reference: `specs/000-agentic-apis-bootstrap/llm.ts`) into a NestJS `LlmModule` that provides `LlmService`. `LlmService` holds a singleton `ChatOpenAI` instance resolved via `ConfigService`.

```ts
// src/llm/llm.service.ts
@Injectable()
export class LlmService {
  readonly chat: ChatOpenAI;
  constructor(private config: ConfigService) {
    this.chat = getLLM(config);
  }
}
```

**Pattern**: `LlmModule` exports `LlmService` → imported by `ChatModule` and any future agent modules.

**Alternatives considered**: Direct instantiation per-agent — creates multiple model instances, duplicated config reads.

---

## 5. Service + Controller Layer Design

**Decision**: Implement `ChatModule` with:
- `ChatController` — REST endpoints
- `ChatService` — orchestrates LLM + DB interactions
- `ChatRepository` — Drizzle queries for sessions/messages

**Route shape**:
```
POST /chat/session              → create session, return { sessionId }
POST /chat/:sessionId/message   → send message, return { reply, messageId }
GET  /chat/:sessionId           → get session + message history
```

**Rationale**: Thin controller / rich service / repository pattern. Aligns with AGENTS.md DDD structure and MEDDPICC intake pipeline requirements.

---

## 6. Database Entities — Already Authored

**Confirmed from `src/db/schema.ts`** (complete, no new tables needed for bootstrap):
- `prospects` — consumer identity
- `chat_sessions` — session lifecycle (domain, status)
- `chat_messages` — turn history (role, content, metadata)
- `agentic_checkpoints` — LangGraph state checkpoints
- `prospect_facts` — MEDDPICC extracted structured facts
- `taxonomy_entity_definitions` + `prospect_leaf_profiles` — qualification taxonomy
- `domain_knowledge_documents/versions/vectors` — RAG knowledge base
- `case_study_documents/versions/vectors/taxonomy_tags` — case study RAG

All migrations are generated from this existing schema. **pgvector** extension must be enabled on the DB before first migration.

---

## 7. End-to-End Validation Approach

**Steps**:
1. Start LLM models: `llm-run --model gemma3 --port 10086 --start`
2. Start embedding: `llm-run --embedding nomic --port 10087 --start`
3. Run `bun run dev` from `apps/agentic-apis/`
4. Confirm migration logs appear on startup
5. Confirm LLM reachability via `GET http://localhost:10086/v1/models`
6. `POST /chat/session` → verify `{ sessionId }` returned
7. `POST /chat/:sessionId/message` with `{ content: "Hello" }` → verify LLM reply

**Test tooling**: `curl` commands defined in `quickstart.md`. Unit tests via `bun test` (Jest) for `ChatService`.

# Tasks: Agentic APIs Bootstrap

**Feature**: 000-agentic-apis-bootstrap
**Branch**: `000-agentic-apis-bootstrap`
**Plan**: [plan.md](./plan.md)
**Generated**: 2026-10-03

---

## Task Index

| # | Task | Depends On | Status |
|---|------|-----------|--------|
| T01 | Install missing dependencies | — | ✅ |
| T02 | Create `drizzle.config.ts` | — | ✅ |
| T03 | Add DB scripts to `package.json` | T02 | ✅ |
| T04 | Implement `DrizzleService` + `DrizzleModule` | T02 | ✅ |
| T05 | Implement `LlmService` + `LlmModule` | — | ✅ |
| T06 | Implement `ChatRepository` | T04 | ✅ |
| T07 | Implement `ChatService` | T05, T06 | ✅ |
| T08 | Implement `ChatController` + DTOs | T07 | ✅ |
| T09 | Create `ChatModule` | T08 | ✅ |
| T10 | Implement `HealthController` + `HealthModule` | T04, T05 | ✅ |
| T11 | Update `AppModule` | T04, T05, T09, T10 | ✅ |
| T12 | Update `main.ts` | T11 | ✅ |
| T13 | Update `.env` LLM ports | — | ✅ |
| T14 | Generate Drizzle migrations | T03, T04 | ✅ |
| T15 | E2E validation | T12, T13, T14 | ✅ |

---

## Tasks

### T01 — Install Missing Dependencies

**Goal**: Add `class-validator` and `class-transformer` which are required for NestJS DTO validation pipes.

**File**: `apps/agentic-apis/package.json`

**Steps**:
```bash
cd apps/agentic-apis
bun add class-validator class-transformer
```

**Acceptance**:
- `class-validator` and `class-transformer` appear in `dependencies` in `package.json`
- `bun install` succeeds

---

### T02 — Create `drizzle.config.ts`

**Goal**: Create the Drizzle Kit configuration file so migration generation knows where the schema and output folder are.

**File**: `apps/agentic-apis/drizzle.config.ts` (NEW)

```ts
import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**Acceptance**:
- File exists at `apps/agentic-apis/drizzle.config.ts`
- `bun run db:generate` (after T03) resolves schema without errors

---

### T03 — Add DB Scripts to `package.json`

**Goal**: Expose `db:generate`, `db:migrate`, `db:studio` as runnable scripts.

**File**: `apps/agentic-apis/package.json`

**Change**: Add to `"scripts"`:
```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio"
```

**Acceptance**:
- `bun run db:generate` runs without error and creates files in `src/db/migrations/`

---

### T04 — Implement `DrizzleService` + `DrizzleModule`

**Goal**: Create a NestJS injectable that holds the Drizzle DB client and runs migrations on startup.

**Files**:
- `apps/agentic-apis/src/db/drizzle.service.ts` (NEW)
- `apps/agentic-apis/src/db/drizzle.module.ts` (NEW)

**`drizzle.service.ts`**:
```ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as schema from './schema';

@Injectable()
export class DrizzleService implements OnModuleInit {
  private readonly logger = new Logger(DrizzleService.name);
  db: NodePgDatabase<typeof schema>;
  private pool: Pool;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.get<string>('DATABASE_URL');
    this.pool = new Pool({ connectionString: url });
    this.db = drizzle(this.pool, { schema });
    await migrate(this.db, { migrationsFolder: './src/db/migrations' });
    this.logger.log('Migrations applied successfully');
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
```

**`drizzle.module.ts`**:
```ts
import { Module } from '@nestjs/common';
import { DrizzleService } from './drizzle.service';

@Module({
  providers: [DrizzleService],
  exports: [DrizzleService],
})
export class DrizzleModule {}
```

**Acceptance**:
- Module compiles without TS errors
- On server start (after T11–T12), migration log message appears

---

### T05 — Implement `LlmService` + `LlmModule`

**Goal**: Wrap the `getLLM()` factory into a NestJS service for DI.

**Files**:
- `apps/agentic-apis/src/llm/llm.service.ts` (NEW)
- `apps/agentic-apis/src/llm/llm.module.ts` (NEW)
- `apps/agentic-apis/src/llm/llm.factory.ts` (NEW — copy of reference `llm.ts`)

**`llm.factory.ts`**: Copy verbatim from `specs/000-agentic-apis-bootstrap/llm.ts`.

**`llm.service.ts`**:
```ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { getLLM } from './llm.factory';

@Injectable()
export class LlmService {
  readonly chat: ChatOpenAI;

  constructor(private config: ConfigService) {
    this.chat = getLLM(config);
  }
}
```

**`llm.module.ts`**:
```ts
import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';

@Module({
  providers: [LlmService],
  exports: [LlmService],
})
export class LlmModule {}
```

**Acceptance**:
- Module compiles
- `LlmService.chat` is a valid `ChatOpenAI` instance at runtime

---

### T06 — Implement `ChatRepository`

**Goal**: Create the data access layer for chat sessions and messages using Drizzle.

**File**: `apps/agentic-apis/src/chat/chat.repository.ts` (NEW)

**Methods**:
```ts
createSession(domain: 'wills' | 'conveyancing'): Promise<ChatSession>
getSession(sessionId: string): Promise<ChatSession | null>
getSessionWithMessages(sessionId: string): Promise<ChatSessionWithMessages | null>
saveMessage(sessionId: string, role: MessageRole, content: string): Promise<ChatMessage>
```

**Implementation**: Uses `DrizzleService.db` with Drizzle query builder (`db.insert(...).values(...).returning()`, `db.select().from(...).where(...)`).

**Acceptance**:
- Compiles without TS errors
- Query shapes match schema in `src/db/schema.ts`

---

### T07 — Implement `ChatService`

**Goal**: Business logic layer that orchestrates LLM invocations and DB persistence.

**File**: `apps/agentic-apis/src/chat/chat.service.ts` (NEW)

**Methods**:
```ts
createSession(domain: string): Promise<{ sessionId, domain, status, createdAt }>
sendMessage(sessionId: string, content: string): Promise<{ messageId, reply, sessionId }>
getSession(sessionId: string): Promise<ChatSessionWithMessages>
```

**Key logic in `sendMessage`**:
1. Load session from DB (throw 404 if not found, 422 if not active)
2. Load message history from DB
3. Save user message via `ChatRepository`
4. Build LangChain message array (SystemMessage + history + HumanMessage)
5. Invoke `LlmService.chat.invoke(messages)`
6. Save assistant message via `ChatRepository`
7. Return `{ messageId, reply, sessionId }`

**Acceptance**:
- Compiles
- `sendMessage` returns a non-empty string reply from LLM when LLM is running

---

### T08 — Implement `ChatController` + DTOs

**Goal**: Define REST endpoints and input validation DTOs.

**Files**:
- `apps/agentic-apis/src/chat/chat.controller.ts` (NEW)
- `apps/agentic-apis/src/chat/dto/create-session.dto.ts` (NEW)
- `apps/agentic-apis/src/chat/dto/send-message.dto.ts` (NEW)

**`create-session.dto.ts`**:
```ts
import { IsIn } from 'class-validator';
export class CreateSessionDto {
  @IsIn(['wills', 'conveyancing'])
  domain: 'wills' | 'conveyancing';
}
```

**`send-message.dto.ts`**:
```ts
import { IsString, IsNotEmpty } from 'class-validator';
export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}
```

**Controller routes**:
```ts
@Post('session')         → ChatService.createSession()
@Post(':sessionId/message') → ChatService.sendMessage()
@Get(':sessionId')       → ChatService.getSession()
```

**Acceptance**:
- All three routes compile and match contracts in `contracts/chat-api.md`
- Invalid body returns 400

---

### T09 — Create `ChatModule`

**Goal**: Wire all chat components into a NestJS module.

**File**: `apps/agentic-apis/src/chat/chat.module.ts` (NEW)

```ts
import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatRepository } from './chat.repository';
import { DrizzleModule } from '../db/drizzle.module';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [DrizzleModule, LlmModule],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
})
export class ChatModule {}
```

**Acceptance**: Module resolves all DI dependencies without circular reference errors.

---

### T10 — Implement `HealthController` + `HealthModule`

**Goal**: Expose `GET /health` that checks DB connectivity and LLM reachability.

**Files**:
- `apps/agentic-apis/src/health/health.controller.ts` (NEW)
- `apps/agentic-apis/src/health/health.module.ts` (NEW)

**Health check logic**:
- DB: run a simple `SELECT 1` via `DrizzleService.db`
- LLM: `GET ${LLM_BASE_URL}/v1/models` via `fetch`, check 200

**Response**: `{ status: 'ok', db: 'connected', llm: 'reachable' }` or appropriate error status.

**Acceptance**:
- `GET /health` returns 200 with valid JSON when all services are up

---

### T11 — Update `AppModule`

**Goal**: Import all new modules into the root `AppModule` and register `ConfigModule` globally.

**File**: `apps/agentic-apis/src/app.module.ts` (MODIFY)

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from './db/drizzle.module';
import { LlmModule } from './llm/llm.module';
import { ChatModule } from './chat/chat.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DrizzleModule,
    LlmModule,
    ChatModule,
    HealthModule,
  ],
})
export class AppModule {}
```

**Acceptance**: Server starts without DI resolution errors. All modules initialise.

---

### T12 — Update `main.ts`

**Goal**: Enable global `ValidationPipe` and set correct port from config.

**File**: `apps/agentic-apis/src/main.ts` (MODIFY)

```ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  const port = process.env.PORT ?? 4001;
  await app.listen(port);
  console.log(`🤖 Agentic APIs running on http://localhost:${port}`);
}

bootstrap();
```

**Acceptance**: Invalid DTO payloads return 400 responses automatically.

---

### T13 — Update `.env` LLM Ports

**Goal**: Ensure `.env` references the correct ports for `llm-run` started servers.

**File**: `apps/agentic-apis/.env` (MODIFY)

**Change**:
```env
LLM_BASE_URL=http://localhost:10086
EMBEDDING_BASE_URL=http://localhost:10087/v1
PORT=4001
```

> Note: Current `.env` has 10030/10020 from a previous session. Update to match `start-llm.md` canonical ports (10086/10087), OR confirm the existing ports are still valid. The 4001 port correction is mandatory.

**Acceptance**: Server starts on port 4001 and `LlmService` resolves to correct base URL.

---

### T14 — Generate Drizzle Migrations

**Goal**: Generate SQL migration files from the existing schema.

**Steps**:
```bash
cd apps/agentic-apis
bun run db:generate
```

**Expected**: Files created in `src/db/migrations/` (e.g., `0000_initial.sql`).

**Pre-requisite**: PostgreSQL must be running and reachable. pgvector must be enabled:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**Acceptance**:
- Migration files exist in `src/db/migrations/`
- `bun run dev` applies them on startup without error

---

### T15 — E2E Validation

**Goal**: Validate the full system works end-to-end per `quickstart.md`.

**Steps**: Follow all steps in [`quickstart.md`](./quickstart.md) in order.

**Acceptance Criteria** (all must pass):
- [ ] `bun run dev` starts cleanly, migration log appears
- [ ] `GET /health` → `{ "status": "ok", "db": "connected", "llm": "reachable" }`
- [ ] `POST /chat/session` → returns valid `sessionId`
- [ ] `POST /chat/:sessionId/message` → returns non-empty `reply`
- [ ] `GET /chat/:sessionId` → returns session with 2-message history
- [ ] DB contains records (verified via psql)
- [ ] `bun run lint` passes (TypeScript compiles cleanly)

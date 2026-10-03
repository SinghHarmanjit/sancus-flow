# Quickstart: Agentic APIs Bootstrap Validation Guide

**Feature**: 000-agentic-apis-bootstrap
**Service**: `apps/agentic-apis` (Port 4001)

---

## Prerequisites

- PostgreSQL running locally with `tandemlegal` database (see `.env`)
- pgvector extension enabled: `CREATE EXTENSION IF NOT EXISTS vector;`
- `llm-run` CLI installed and available in PATH
- Bun installed (`bun --version`)
- Dependencies installed: `bun install` from repo root

---

## Step 1: Start Local LLM Models

```bash
# Start LLM inference server (gemma3)
llm-run --model gemma3 --port 10086 --start

# Start embedding model (nomic)
llm-run --embedding nomic --port 10087 --start
```

Verify LLM is reachable:
```bash
curl http://localhost:10086/v1/models
# Expected: JSON list containing "gemma3"
```

---

## Step 2: Configure Environment

Ensure `apps/agentic-apis/.env` has:
```env
DATABASE_URL=postgresql://autonomous:autonomous_legal@127.0.0.1:5432/tandemlegal
LLM_BASE_URL=http://localhost:10086
LLM_CONVERSATION_MODEL=gemma3
EMBEDDING_BASE_URL=http://localhost:10087/v1
EMBEDDING_MODEL=nomic-embed-text-v1.5
EMBEDDING_DIMENSION=256
PORT=4001
```

---

## Step 3: Generate Drizzle Migrations

```bash
cd apps/agentic-apis
bun run db:generate
# Expected: SQL migration files created in src/db/migrations/
```

---

## Step 4: Start the Server

```bash
# From apps/agentic-apis/ or repo root
bun run dev
```

**Expected startup output**:
```
[DrizzleService] Migrations applied
🤖 Agentic APIs running on http://localhost:4001
```

Migrations run automatically on startup. If the DB is fresh, tables are created. If already migrated, nothing changes.

---

## Step 5: Validate E2E

### Health Check
```bash
curl http://localhost:4001/health
# Expected:
# { "status": "ok", "db": "connected", "llm": "reachable" }
```

### Create a Session
```bash
curl -X POST http://localhost:4001/chat/session \
  -H "Content-Type: application/json" \
  -d '{"domain":"wills"}'
# Expected:
# { "sessionId": "<uuid>", "domain": "wills", "status": "active", ... }
```

### Send a Message
```bash
SESSION_ID="<uuid from above>"

curl -X POST http://localhost:4001/chat/$SESSION_ID/message \
  -H "Content-Type: application/json" \
  -d '{"content":"I need to create a will for my estate"}'
# Expected:
# { "messageId": "<uuid>", "reply": "<LLM generated response>", "sessionId": "<uuid>" }
```

### Retrieve Session History
```bash
curl http://localhost:4001/chat/$SESSION_ID
# Expected: session object with messages array containing 2 items (user + assistant)
```

---

## Step 6: Verify DB Persistence

```bash
# Connect to Postgres and check records
psql $DATABASE_URL -c "SELECT id, domain, status FROM chat_sessions LIMIT 5;"
psql $DATABASE_URL -c "SELECT role, LEFT(content, 50) FROM chat_messages LIMIT 10;"
```

---

## Success Criteria

- [ ] Server starts without error
- [ ] Migration applied log appears on startup
- [ ] `/health` returns `{ "status": "ok" }`
- [ ] `POST /chat/session` returns a valid session UUID
- [ ] `POST /chat/:sessionId/message` returns a non-empty LLM reply
- [ ] DB contains the session and message records after the above calls

---

## References

- API contracts: [`contracts/chat-api.md`](./contracts/chat-api.md)
- Data model: [`data-model.md`](./data-model.md)
- Research decisions: [`research.md`](./research.md)

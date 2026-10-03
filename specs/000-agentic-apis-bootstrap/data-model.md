# Data Model: Agentic APIs Bootstrap

**Feature**: 000-agentic-apis-bootstrap
**Source Schema**: `apps/agentic-apis/src/db/schema.ts`

> All entities already exist in `schema.ts`. This document describes each entity's purpose, fields, relationships, and validation rules as they relate to this bootstrap feature.

---

## Enums

| Enum | Values | Purpose |
|------|--------|---------|
| `domain` | `wills`, `conveyancing` | Legal practice area |
| `session_status` | `active`, `completed`, `abandoned`, `archived` | Session lifecycle state |
| `message_role` | `user`, `assistant`, `system`, `tool` | Chat turn role |
| `document_status` | `active`, `draft`, `archived` | Knowledge doc state |

---

## Core Chat Entities

### `prospects`
Consumer identity record created at session start.

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | UUID | PK, auto-generated |
| `first_name` | varchar(255) | nullable |
| `last_name` | varchar(255) | nullable |
| `email` | varchar(255) | nullable |
| `phone` | varchar(255) | nullable |
| `created_at` | timestamp | NOT NULL, defaultNow |

**Validation**: Email format validated at DTO level (not DB constraint). Prospect may be anonymous initially.

---

### `chat_sessions`
Groups a conversation thread under a domain and tracks lifecycle.

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | UUID | PK, auto-generated |
| `prospect_id` | UUID | FK → `prospects.id`, nullable |
| `domain` | `domain` enum | NOT NULL |
| `status` | `session_status` enum | NOT NULL, default `active` |
| `created_at` | timestamp | NOT NULL, defaultNow |

**State transitions**: `active` → `completed` | `abandoned` | `archived`

---

### `chat_messages`
Individual turn records within a session.

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | UUID | PK, auto-generated |
| `session_id` | UUID | FK → `chat_sessions.id`, NOT NULL |
| `role` | `message_role` enum | NOT NULL |
| `content` | text | NOT NULL |
| `metadata` | jsonb | nullable (tool call args, token counts) |
| `created_at` | timestamp | NOT NULL, defaultNow |

**Validation**: `content` must be non-empty. `metadata` is freeform JSONB — typed at application layer via Zod.

---

## Agent State Entities

### `agentic_checkpoints`
LangGraph thread state snapshots for resumability.

| Field | Type | Constraints |
|-------|------|-------------|
| `thread_id` | UUID | FK → `chat_sessions.id`, NOT NULL |
| `checkpoint_id` | varchar(255) | PK |
| `parent_checkpoint_id` | varchar(255) | nullable |
| `state` | jsonb | nullable (full LangGraph state blob) |
| `created_at` | timestamp | NOT NULL, defaultNow |

**Notes**: `checkpoint_id` is a LangGraph-generated string (not UUID). State blob can be large — monitor row size in production.

---

### `prospect_facts`
Structured MEDDPICC facts extracted from conversation.

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | UUID | PK, auto-generated |
| `prospect_id` | UUID | FK → `prospects.id`, NOT NULL |
| `domain` | `domain` enum | NOT NULL |
| `fact_key` | varchar(255) | NOT NULL |
| `fact_value` | jsonb | NOT NULL |
| `confidence_score` | doublePrecision | nullable (0.0–1.0) |
| `created_at` | timestamp | NOT NULL, defaultNow |

**Validation**: `confidence_score` range 0–1 enforced at service layer.

---

## Taxonomy Entities

### `taxonomy_entity_definitions`
Domain-specific entity types the intake agent extracts.

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | UUID | PK, auto-generated |
| `domain` | `domain` enum | NOT NULL |
| `entity_name` | varchar(255) | NOT NULL |
| `description` | text | NOT NULL |
| `extraction_schema` | jsonb | NOT NULL (Zod/JSON-Schema format) |
| `is_active` | boolean | NOT NULL, default `true` |
| `created_at` | timestamp | NOT NULL, defaultNow |

### `prospect_leaf_profiles`
Extracted instances of taxonomy entities per prospect.

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | UUID | PK, auto-generated |
| `prospect_id` | UUID | FK → `prospects.id`, NOT NULL |
| `taxonomy_entity_id` | UUID | FK → `taxonomy_entity_definitions.id`, NOT NULL |
| `extracted_data` | jsonb | NOT NULL |
| `created_at` | timestamp | NOT NULL, defaultNow |

---

## Knowledge Base Entities (RAG)

### `domain_knowledge_documents` / `domain_knowledge_versions` / `domain_knowledge_vectors`
Three-layer document versioning + vector chunking for RAG retrieval.

- **document** — top-level title + domain
- **version** — content snapshot with `source_url` and status
- **vector** — chunk with `embedding` (256-dim, pgvector `vector` type)

### `case_study_documents` / `case_study_versions` / `case_study_vectors` / `case_study_taxonomy_tags`
Same pattern for case studies; includes taxonomy tagging.

**pgvector requirement**: `CREATE EXTENSION IF NOT EXISTS vector;` must run before first migration.

---

## Entity Relationship Diagram

```
prospects
  ├── chat_sessions (prospect_id)
  │     ├── chat_messages (session_id)
  │     └── agentic_checkpoints (thread_id)
  ├── prospect_facts (prospect_id)
  └── prospect_leaf_profiles (prospect_id)
        └── taxonomy_entity_definitions (taxonomy_entity_id)

domain_knowledge_documents
  └── domain_knowledge_versions (document_id)
        └── domain_knowledge_vectors (version_id)

case_study_documents
  ├── case_study_versions (case_study_id)
  │     └── case_study_vectors (version_id)
  └── case_study_taxonomy_tags (case_study_id)
```

---

## Migration Files Location

Generated by `drizzle-kit generate` into: `apps/agentic-apis/src/db/migrations/`

Applied automatically on server startup via `DrizzleService.onModuleInit()`.

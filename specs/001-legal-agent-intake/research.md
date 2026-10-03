# Research & Technical Decisions: Legal AI Intake Agent

## 1. LangGraph State Management in Drizzle & PostgreSQL

**Decision:** Use a dedicated `agentic_checkpoints` table keyed by `thread_id` (matching `chat_sessions.id`) rather than a JSONB column on `chat_sessions`.
**Rationale:** LangGraph creates a new checkpoint for every node transition (e.g., Guardrail -> Extractor -> RAG -> Compose). Updating a single row in `chat_sessions` 5 times per user message causes massive bloat (PostgreSQL MVCC row copying) and potential locking issues. A dedicated append-only/checkpoint table is the official recommended architecture for LangGraph memory savers.
**Alternatives Considered:** Storing state entirely in Redis (rejected because we want strict relational ties and auditing of the agent's thought process in the same DB as the CRM).

## 2. Dynamic Taxonomy Schema Generation (The LEAF Framework)

**Decision:** The `taxonomy_entity_definitions` table stores JSON Schemas. On NestJS boot (and triggered via Webhooks on update), these are cached in memory and converted to Zod schemas using `json-schema-to-zod` or evaluated directly via LangChain's `.withStructuredOutput()`.
**Rationale:** Database lookups for schemas on every single message add unnecessary latency. Since taxonomy schemas (like `life_event_pattern`) rarely change, memory caching is safe. Passing raw JSON schema definitions directly to the LLM bypasses the need for hardcoded TypeScript classes for extraction targets.
**Alternatives Considered:** Hardcoding entity types (e.g., `export class WillsLifeEvent {}`). Rejected because it violates the extensibility requirement for future domains like Conveyancing.

## 3. Knowledge Base Tagging vs Semantic Search

**Decision:** Implement a **Hybrid Search** strategy for Case Studies.
**Rationale:** Vector similarity (pgvector) is excellent for answering unstructured questions ("What is a testamentary trust?"). However, for empathetic responses based on user state, metadata filtering is vastly superior. By explicitly filtering `document_taxonomy_tags` using the `AgenticState.activeTaxonomyProfiles` (e.g., `WHERE tag_name = 'blended_family'`), we guarantee the agent retrieves a case study matching the client's exact demographic risk profile, rather than relying on the LLM's unpredictable vector proximity.

## 4. LLM Model Selection & Performance Routing

**Decision:** Multi-model routing within the graph.
- **Node 1 (Guardrail)**: Gemini 3.1 Flash / Claude 3.5 Haiku (Fast, cheap classification).
- **Node 2 (Fact Extractor)**: Gemini 3.1 Flash (High accuracy for structured JSON output, fast).
- **Node 5 (Response Composer)**: Gemini 3.1 Pro / Claude 3.5 Sonnet (Nuanced, empathetic, authoritative tone generation requires higher reasoning).
**Rationale:** Public-facing agents need `< 3s` response times. Extracting facts and querying safety guardrails don't require heavy reasoning. Offloading them to smaller, faster models allows the orchestration to remain snappy, reserving the heavy model exclusively for crafting the final legal disclaimer and response.

## 5. Intent Routing vs. Linear Graph Sequence

**Decision:** Implement a **Conditional Router State Machine** instead of a linear graph.
**Rationale:** A linear graph (`Extractor` -> `RAG` -> `Intake Manager` -> `Compose`) forces the agent to constantly attempt to push the intake form forward on every single turn. This breaks the consultative requirement when a user just wants to be educated (e.g., "What is a trust?"). By introducing the `conversationPhase` state variable, the Supervisor acts as a conditional router. 
- The **Education Phase** routes the user to `Domain Knowledge` and explicitly skips the `Fact Extractor` and `Intake Manager` to ensure a gentle, non-pushy response.
- The **Intake Phase** activates the rigid data-collection pipeline using `Case Studies` for steering.
**Alternatives Considered:** Prompt engineering the `Response Composer` to ignore the `Intake Manager`'s suggested questions if the user is asking a definition. Rejected because it wastes LLM tokens and latency running the `Fact Extractor` and `Intake Manager` nodes when they aren't needed.

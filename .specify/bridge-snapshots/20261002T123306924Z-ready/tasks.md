# Implementation Tasks: Legal AI Intake Agent

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, database schemas, and shared contracts

- [ ] T001 [P] Export Agentic interfaces (StartSessionRequest, ChatMessageRequest, ChatMessageResponse, TaxonomyCreationRequest) in `packages/types/src/agentic/index.ts` based on `contracts/agent-interfaces.ts`
- [ ] T002 Create Drizzle schema for `agentic_checkpoints` (thread_id UUID FK, checkpoint_id String PK, parent_checkpoint_id String, state JSONB, created_at) in `apps/agentic-apis/src/db/schema.ts`
- [ ] T003 Create Drizzle schema for `chat_sessions` (id UUID PK, prospect_id UUID FK, domain Enum, status Enum, created_at) and `chat_messages` (id UUID PK, session_id UUID FK, role Enum, content Text, metadata JSONB) in `apps/agentic-apis/src/db/schema.ts`
- [ ] T004 Create Drizzle schema for `prospects` (id UUID PK, first_name, last_name, email, phone), `prospect_facts` (domain Enum, fact_key, fact_value JSONB, confidence_score), and `prospect_leaf_profiles` (taxonomy_entity_id UUID FK, extracted_data JSONB) in `apps/agentic-apis/src/db/schema.ts`
- [ ] T005 Create Drizzle schema for `taxonomy_entity_definitions` (domain Enum, entity_name String, description Text, extraction_schema JSONB, is_active Boolean) in `apps/agentic-apis/src/db/schema.ts`
- [ ] T006 Create Drizzle schema with pgvector for `domain_knowledge_documents`, `domain_knowledge_vectors` (embedding Vector(1536)), `case_study_documents`, `case_study_vectors` (embedding Vector(1536)), and `case_study_taxonomy_tags` (tag_data JSONB) in `apps/agentic-apis/src/db/schema.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Define the LangGraph `AgenticState` interface (sessionId, domain, messages, conversationPhase, extractedFacts, activeTaxonomyProfiles, missingRequiredFields, retrievedContext, safetyStatus) in `apps/agentic-apis/src/agents/supervisor/state.ts`
- [ ] T008 Implement Guardrail and Intent Router node to classify messages (Education vs Intake) and safety checks in `apps/agentic-apis/src/agents/supervisor/router.ts`
- [ ] T009 Implement API endpoints `StartSession` and `ChatMessage` in `apps/agentic-apis/src/api/chat.controller.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Client Educational Inquiry (Priority: P1) 🎯 MVP

**Goal**: A prospective client asks a definitional question and the agent provides a clear, factual answer without data extraction.

**Independent Test**: Can be tested by sending a purely definitional question to a chat session and verifying that the `Conversation Phase` evaluates to `education` and no extraction takes place.

### Implementation for User Story 1

- [ ] T010 [P] [US1] Implement semantic search over `domain_knowledge_vectors` in `apps/agentic-apis/src/knowledge/domain.service.ts`
- [ ] T011 [US1] Implement Educator Agent node to retrieve facts from Domain Knowledge in `apps/agentic-apis/src/agents/educator/node.ts`
- [ ] T012 [US1] Implement Response Composer node (Education path) to synthesize response without aggressive intake questions in `apps/agentic-apis/src/agents/supervisor/composer.ts`
- [ ] T013 [US1] Wire up the Education subgraph in LangGraph (Router -> Educator -> Composer) in `apps/agentic-apis/src/agents/supervisor/graph.ts`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Client Intake and Fact Extraction (Priority: P1)

**Goal**: The agent extracts structured facts (LEAF framework), uses those facts to find an empathetic case study, and asks the next relevant intake question.

**Independent Test**: Can be tested by providing explicit demographic facts and verifying that the `Fact Extractor` correctly maps them to the `prospect_leaf_profiles` and the `Intake Manager` asks for the next missing field.

### Implementation for User Story 2

- [ ] T014 [P] [US2] Implement Taxonomy fetching and caching in memory in `apps/agentic-apis/src/taxonomy/taxonomy.service.ts`
- [ ] T015 [US2] Implement Fact Extractor node mapping text to dynamic LEAF schemas from Taxonomy definitions in `apps/agentic-apis/src/agents/intake/extractor.ts`
- [ ] T016 [US2] Implement Hybrid Search (Vector + Taxonomy Tag matching) over Case Studies (`case_study_taxonomy_tags`) in `apps/agentic-apis/src/knowledge/case-study.service.ts`
- [ ] T017 [US2] Implement Case Study Planner node to retrieve empathetic steering context in `apps/agentic-apis/src/agents/intake/planner.ts`
- [ ] T018 [US2] Implement Intake Manager node to calculate `missingRequiredFields` and queue the next question in `apps/agentic-apis/src/agents/intake/manager.ts`
- [ ] T019 [US2] Wire up the Intake subgraph in LangGraph (Extractor -> Planner -> Manager -> Composer) in `apps/agentic-apis/src/agents/supervisor/graph.ts`
- [ ] T020 [US2] Update Response Composer node to blend Case Study RAG context and Intake Manager's required questions in `apps/agentic-apis/src/agents/supervisor/composer.ts`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Dynamic Taxonomy Configuration (Priority: P2)

**Goal**: A system administrator adds a new extraction target by submitting a JSON schema for a taxonomy entity definition without deploying new code.

**Independent Test**: Can be tested by inserting a new `taxonomy_entity_definitions` record via API and immediately triggering a chat session to verify the LLM successfully extracts data according to the new schema.

### Implementation for User Story 3

- [ ] T021 [P] [US3] Implement API endpoint for Taxonomy Creation in `apps/agentic-apis/src/api/taxonomy.controller.ts`
- [ ] T022 [US3] Integrate Taxonomy Creation endpoint with Taxonomy service to invalidate cache in `apps/agentic-apis/src/taxonomy/taxonomy.service.ts`

---

## Phase 6: User Story 4 - Knowledge Base Ingestion (Priority: P2)

**Goal**: An administrator adds Domain Knowledge and Case Studies to ground the agent and improve responses.

**Independent Test**: Can be tested by uploading a tagged case study and initiating an intake chat that matches the tags to verify the case study is retrieved.

### Implementation for User Story 4

- [ ] T023 [P] [US4] Implement API endpoint for Domain Knowledge Ingestion (chunking and vector embedding) in `apps/agentic-apis/src/api/knowledge.controller.ts`
- [ ] T024 [P] [US4] Implement API endpoint for Case Study Ingestion with taxonomy tags in `apps/agentic-apis/src/api/knowledge.controller.ts`

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T025 Ensure Graceful Fallback for Safety Guardrail (politely decline query and offer generic contact form) in `apps/agentic-apis/src/agents/supervisor/router.ts`
- [ ] T026 Implement Session Complete hook to flush `extractedFacts` from LangGraph state to Drizzle `prospect_facts` and `prospect_leaf_profiles` in `apps/agentic-apis/src/agents/supervisor/flusher.ts`
- [ ] T027 Run quickstart.md validation script steps to verify end-to-end flow

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2)
- **User Story 3 (P2)**: Can start after Foundational (Phase 2)
- **User Story 4 (P2)**: Can start after Foundational (Phase 2)

### Parallel Opportunities

- DB schemas in Phase 1 (T002-T006) can be created in parallel.
- Once Foundational phase completes, US1, US2, US3, and US4 can start in parallel (if team capacity allows).
- Semantic Search (T010) and Taxonomy Caching (T014) can be implemented concurrently by different developers.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently using a definitional question.
5. Proceed to next user stories.

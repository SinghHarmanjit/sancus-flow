# Data Model: Legal AI Intake Agent (LEAF Framework)

## 1. Agent Architecture (Supervisor & Sub-Agents)

The AI orchestration is built using LangGraph, operating under a **Conditional Router State Machine** pattern.

### The Supervisor (Intent Router & State Manager)
Responsible for maintaining the state of the conversation, enforcing guardrails, and classifying the user's intent to route them down either the **Education** or **Intake** path.

**AgenticState (LangGraph State)**
```typescript
interface AgenticState {
  sessionId: string;
  domain: 'wills' | 'conveyancing';
  messages: BaseMessage[];
  conversationPhase: 'education' | 'intake'; // Determines the active subgraph
  extractedFacts: Record<string, any>;
  activeTaxonomyProfiles: string[]; // e.g., ["minor_children", "foreign_assets"]
  missingRequiredFields: string[];
  retrievedContext: string[]; // RAG results (Definitions vs Case Studies)
  safetyStatus: 'safe' | 'flagged' | 'out_of_scope';
}
```

### Sub-Agents & Conditional Paths
1. **Guardrail & Intent Router**: Classifies the message (Safety check + Phase classification).
   
**Path A: The Educator Agent (Domain Knowledge)**
2. **Domain Knowledge Planner**: Retrieves definitions and processes from `domain_knowledge_vectors`. Skips extraction to avoid aggressive form-filling.

**Path B: The Intake Agent (Extraction & Steering)**
3. **Fact Extractor (LEAF Mapper)**: Extracts structured data mapping to `TaxonomyEntityDefinitions`.
4. **Intake Manager**: Calculates `missingRequiredFields` and determines the next mandatory question.
5. **Case Study Planner (Hybrid RAG)**: Uses `activeTaxonomyProfiles` to retrieve empathetic case studies for steering.

**Shared Output**
6. **Response Composer**: Synthesizes the final response based on the active path, ensuring strict legal disclaimers.

---

## 2. Database Entities & Relationships (Drizzle ORM)

The database schema separates Core platform tables from Domain-Specific AI states, utilizing JSONB for flexible LLM extraction configurations.

### Core Conversation Entities

**`chat_sessions`** (Lightweight Metadata)
- `id`: UUID (PK)
- `prospect_id`: UUID (FK -> prospects.id)
- `domain`: Enum ('wills', 'conveyancing')
- `status`: Enum ('active', 'completed', 'abandoned', 'archived')
- `created_at` / `updated_at`

**`agentic_checkpoints`** (Dedicated LangGraph State Storage)
*LangGraph saves state at every node transition. Storing this separately prevents locking and bloating the main `chat_sessions` table, especially since it contains the full message history.*
- `thread_id`: UUID (FK -> chat_sessions.id)
- `checkpoint_id`: String (PK)
- `parent_checkpoint_id`: String
- `state`: JSONB (The LangGraph AgenticState object)
- `created_at`

**`chat_messages`** (Relational Querying & UI)
*While messages exist in the LangGraph state, storing them relationally allows the frontend to load history without parsing massive JSONB blobs.*
- `id`: UUID (PK)
- `session_id`: UUID (FK -> chat_sessions.id)
- `role`: Enum ('user', 'assistant', 'system')
- `content`: Text
- `metadata`: JSONB (Stores token usage, routing decisions, tool calls)
- `created_at`

### Prospect & Fact Entities

**`prospects`** (Core identity)
- `id`: UUID (PK)
- `user_id`: UUID (Optional, if authenticated)
- `first_name`: String
- `last_name`: String
- `email`: String
- `phone`: String

**`prospect_facts`** (Flat, definitive extracted data - updated when session completes)
- `id`: UUID (PK)
- `prospect_id`: UUID (FK -> prospects.id)
- `domain`: Enum ('wills', 'conveyancing')
- `fact_key`: String (e.g., "children_count")
- `fact_value`: JSONB (e.g., "2")
- `confidence_score`: Float

**`prospect_leaf_profiles`** (The Legal equivalent to the MEDDPICC table)
Stores the structured taxonomy profiles extracted by the AI during the conversation.
- `id`: UUID (PK)
- `prospect_id`: UUID (FK -> prospects.id)
- `taxonomy_entity_id`: UUID (FK -> taxonomy_entity_definitions.id)
- `extracted_data`: JSONB (The structured JSON matching the taxonomy schema)
- `session_id`: UUID (Source of the extraction)

### Configurable Taxonomy Entities (The LEAF System)

**`taxonomy_entity_definitions`**
Defines the structure of the data the Fact Extractor should pull.
- `id`: UUID (PK)
- `domain`: Enum ('wills', 'conveyancing')
- `entity_name`: String (e.g., 'life_event_pattern', 'estate_risk_pattern')
- `description`: Text (System prompt instructions for the LLM)
- `extraction_schema`: JSONB (The Zod/JSON schema passed to the LLM's function calling)
- `is_active`: Boolean

### Knowledge Base & RAG Entities

We split our knowledge base into two distinct types: **Domain Knowledge** (for grounding definitions) and **Case Studies** (for empathetic steering).

**1. Domain Knowledge (Grounding & Definitions)**
*Used to ground the agent in the legal facts, processes, and definitions (e.g., "What is a Testamentary Trust?"). Typically retrieved via standard semantic search.*
- `domain_knowledge_documents`
  - `id`: UUID (PK)
  - `domain`: Enum ('wills', 'conveyancing')
  - `title`: String (e.g., "Wills and Estates Law Factsheet")
  - `short_summary`: Text (For UI list views)
- `domain_knowledge_versions` (The actual source files)
  - `id`: UUID (PK)
  - `document_id`: UUID (FK -> domain_knowledge_documents.id)
  - `version_number`: Integer
  - `source_url`: String (S3 URL)
  - `status`: Enum ('active', 'draft', 'archived')
- `domain_knowledge_vectors` (pgvector)
  - `id`: UUID (PK)
  - `version_id`: UUID (FK -> domain_knowledge_versions.id)
  - `chunk_index`: Integer
  - `content`: Text (The chunk content)
  - `embedding`: Vector(1536)

**2. Case Studies (Conversational Steering)**
*Used to provide contextual, empathetic examples based on the user's specific life situation. Retrieved via Hybrid Search (Vector + Taxonomy Tags).*
- `case_study_documents`
  - `id`: UUID (PK)
  - `domain`: Enum ('wills', 'conveyancing')
  - `title`: String
  - `short_summary`: Text
- `case_study_versions`
  - `id`: UUID (PK)
  - `case_study_id`: UUID (FK -> case_study_documents.id)
  - `version_number`: Integer
  - `source_url`: String (S3 URL)
  - `status`: Enum ('active', 'draft', 'archived')
- `case_study_vectors` (pgvector)
  - `id`: UUID (PK)
  - `version_id`: UUID (FK -> case_study_versions.id)
  - `chunk_index`: Integer
  - `content`: Text (The chunk content)
  - `embedding`: Vector(1536)

**`case_study_taxonomy_tags`** (Hybrid Search Enabler)
Links a Case Study to a taxonomy schema instance, enabling the Agent to fetch a Case Study that exactly matches the Prospect's `prospect_leaf_profile`.
- `case_study_id`: UUID (FK -> case_study_documents.id)
- `taxonomy_entity_id`: UUID (FK -> taxonomy_entity_definitions.id)
- `tag_data`: JSONB (e.g., `{"life_event": "birth_of_child"}`)

---

## 3. Workflow Data Flow (Conditional Graph)

1. **User Message** -> Inserted into `chat_messages` relationally.
2. **Supervisor (Router)** -> Evaluates intent. Sets `AgenticState.conversationPhase`.
3. **Conditional Edge Triggered**:
   - **IF Phase == 'education'**:
     - Queries `domain_knowledge_vectors` for definitions.
     - Skips Intake Manager (does not aggressively ask for facts).
   - **IF Phase == 'intake'**:
     - **Fact Extractor**: Updates `AgenticState.extractedFacts` and taxonomy profiles.
     - **Knowledge Planner**: Queries `case_study_taxonomy_tags` for empathetic context.
     - **Intake Manager**: Updates `AgenticState.missingRequiredFields` and queues the next question.
4. **Response Composer** -> Synthesizes output (blending either Domain RAG or Case Study RAG) and inserts to `chat_messages`.
5. **Session Complete** -> `AgenticState.extractedFacts` flushed to `prospect_facts` and `prospect_leaf_profiles` for rigid relational storage.

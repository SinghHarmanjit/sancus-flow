# Feature Specification: Legal AI Intake Agent

**Feature Branch**: `[001-legal-agent-intake]`

**Created**: 2026-10-02

**Status**: Draft

**Input**: User description: "read the @[architecture_agent_summary.md] as I want to design the agent. Various documents are present in specs/001-legal-agent-intake"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Client Educational Inquiry (Priority: P1)

A prospective client who is unfamiliar with legal terms asks a definitional question (e.g., "What is a testamentary trust?"). The agent must recognize this as an educational query, bypass data extraction, and provide a clear, factual answer without aggressively pushing an intake form.

**Why this priority**: Ensures a consultative, empathetic initial interaction which builds trust and prevents abandonment from aggressive questioning.

**Independent Test**: Can be tested by sending a purely definitional question to a chat session and verifying that the `Conversation Phase` evaluates to `education` and no extraction takes place.

**Acceptance Scenarios**:

1. **Given** an active chat session, **When** the user asks "What is a trust?", **Then** the agent retrieves information from Domain Knowledge and responds with the definition without asking for personal facts.

---

### User Story 2 - Client Intake and Fact Extraction (Priority: P1)

A prospective client provides demographic details and states their legal need. The agent extracts structured facts (LEAF framework), uses those facts to find an empathetic case study (e.g., a similar family situation), and asks the next relevant intake question.

**Why this priority**: This is the core business value—collecting structured data efficiently while maintaining a human-like, consultative conversational flow.

**Independent Test**: Can be tested by providing explicit demographic facts and verifying that the `Fact Extractor` correctly maps them to the `prospect_leaf_profiles` and the `Intake Manager` asks for the next missing field.

**Acceptance Scenarios**:

1. **Given** an active chat session, **When** the user says "I just had a baby and need a will", **Then** the agent extracts the "birth of child" life event, retrieves a relevant case study, and asks who the preferred guardian is.

---

### User Story 3 - Dynamic Taxonomy Configuration (Priority: P2)

A system administrator adds a new extraction target (e.g., a new asset type) by submitting a JSON schema for a taxonomy entity definition without deploying new code.

**Why this priority**: Enables extreme extensibility to new domains (like Conveyancing) without requiring engineering effort to update hardcoded TypeScript schemas.

**Independent Test**: Can be tested by inserting a new `taxonomy_entity_definitions` record via API and immediately triggering a chat session to verify the LLM successfully extracts data according to the new schema.

**Acceptance Scenarios**:

1. **Given** the system is running, **When** the admin submits a new JSON Schema for a life event, **Then** subsequent chats automatically use that schema for fact extraction.

---

### User Story 4 - Knowledge Base Ingestion (Priority: P2)

An administrator adds Domain Knowledge (definitions) and Case Studies (steerable examples tagged with taxonomy profiles) to ground the agent and improve responses.

**Why this priority**: Prevents hallucinations and provides the agent with the necessary material to educate clients and show empathy.

**Independent Test**: Can be tested by uploading a tagged case study and initiating an intake chat that matches the tags to verify the case study is retrieved.

**Acceptance Scenarios**:

1. **Given** a new Case Study, **When** it is ingested and tagged with a taxonomy ID, **Then** the Hybrid Search successfully retrieves it when a prospect's leaf profile matches that tag.

### Edge Cases

- What happens when the LLM outputs invalid JSON during Fact Extraction? (Agent must gracefully retry or skip extraction without breaking the chat).
- What happens when a user provides conflicting demographic facts across different messages?
- What happens when the Safety Guardrail flags the conversation? The agent politely declines the query and offers a generic contact form for human review.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST evaluate the user's intent to dynamically route conversations between educational/consultative responses and formal data collection (intake).
- **FR-002**: The system MUST be capable of extracting structured profile data based on dynamically loaded, configurable definitions rather than hardcoded rules.
- **FR-003**: The system MUST retrieve contextual case studies based on matching a user's extracted profile against predefined situational examples, ensuring empathetic and relevant responses.
- **FR-004**: The system MUST retrieve verified legal definitions and processes from a controlled knowledge base to answer educational queries without hallucinations.
- **FR-005**: The system MUST isolate conversational memory securely to ensure long-running chat sessions do not degrade core system performance.
- **FR-006**: The system MUST route complex reasoning tasks and simple extraction/safety checks to appropriately sized AI models to optimize latency and cost.
- **FR-007**: The system MUST persist all extracted client facts to the core system of record upon session completion.
- **FR-008**: The system MUST gracefully terminate automated intake when the Safety Guardrail flags a conversation as 'out_of_scope' or 'flagged', politely declining and offering a generic contact form for human review.

### Key Entities

- **Conversations & Messages**: Records of the interaction between the client and the agent.
- **Conversational State**: The active memory of the ongoing chat.
- **Prospect Profiles & Facts**: Core client identities and definitive extracted facts.
- **Taxonomy Definitions**: Dynamic schemas dictating what facts the agent should extract.
- **Domain Knowledge**: Factual grounding documents used to educate the user.
- **Case Studies & Tags**: Empathetic conversational steering examples matched to specific client profiles.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Public-facing agent response times MUST average under 3 seconds per turn.
- **SC-002**: The system MUST successfully route at least 90% of definitional/educational questions to the Domain Knowledge path without attempting extraction.
- **SC-003**: The AI MUST correctly parse and store 95% of explicitly provided demographic facts into the client's profile.
- **SC-004**: The system MUST support high concurrent chat volume without conversational state updates degrading core system database latency.

## Assumptions

- Standard database and vector search capabilities are available and configured for all environments.
- API authentication and rate-limiting are handled by the existing unified infrastructure.
- Chosen AI providers have sufficient uptime and rate limits to meet the sub-3s response target.
- Users have standard modern web clients capable of connecting to the chat interface.

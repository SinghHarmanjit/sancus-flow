# Agentic APIs: Legal Intake Architecture Summary

This document summarizes the architectural design decisions for the AI-powered conversational intake engine (`agentic-apis`), specifically designed for transitioning from a B2B Sales framework to a B2C Legal Intake framework (starting with Wills & Estate Planning, extensible to Conveyancing).

## 1. Strategic Shift: The LEAF Framework
The system moves away from rigid sales frameworks (like MEDDPICC) to a flexible, domain-specific taxonomy called **LEAF** (Life events, Estate assets, Aspirations, Family dynamics). 
Instead of behaving like a static web form, the agent extracts rich, multi-dimensional entities (e.g., `life_event_pattern`, `estate_risk_pattern`) from natural conversation to steer the intake process empathetically.

## 2. Configurable Taxonomy System
To ensure extreme extensibility (e.g., adding a Conveyancing agent without changing backend code):
- Extraction schemas are **not** hardcoded in TypeScript.
- They are stored in the database as JSON Schemas within the `taxonomy_entity_definitions` table.
- The `Fact Extractor` agent fetches these schemas dynamically on boot and injects them into the LLM's structured output definitions.

## 3. Two-Tiered Knowledge Base (RAG)
To prevent the LLM from confusing factual legal definitions with contextual client examples, the Knowledge Base is split into two systems:
1. **Domain Knowledge (Grounding)**: Definitions, processes, and factsheets (e.g., "What is a Trust?"). Queried via standard semantic search.
2. **Case Studies (Steering)**: Situational examples (e.g., "The Smith Family"). These are tagged with taxonomy metadata and retrieved via **Hybrid Search** (Vector + Taxonomy Tags). This guarantees the agent fetches an empathetic example that exactly matches the prospect's extracted demographic profile.

## 4. The Conditional Router State Machine
A standard linear LangGraph pipeline (`Extract` -> `RAG` -> `Intake Question`) proved too aggressive; the agent would constantly attempt to push the intake form forward even if the user just asked a simple educational question.

To solve this, the orchestration relies on a **Conditional Router State Machine**:
- **The Supervisor** evaluates intent and sets `AgenticState.conversationPhase`.
- **Path A (Education Phase)**: If the user asks a definitional question, the graph routes to the Domain Knowledge planner and explicitly skips the Fact Extractor and Intake Manager. This provides a gentle, consultative UX.
- **Path B (Intake Phase)**: If the user provides demographic data, the graph activates the Fact Extractor, queries Case Studies for empathetic steering, and runs the Intake Manager to ask the next mandatory question.

## 5. Database Strategy (Drizzle ORM + PostgreSQL)
To balance the fluid nature of AI conversations with the strict relational needs of the Sancus Flow CRM:
- **Agentic State Storage**: LangGraph checkpoints are isolated in an `agentic_checkpoints` table. They are *not* stored as a JSONB column on `chat_sessions` to prevent MVCC bloat and lock contention on every graph node transition.
- **Data Persistence**: The fluid extracted state (`prospect_leaf_profiles` and JSONB blobs) is kept separated from rigid, domain-specific relational tables. 
- **PostgreSQL Schemas**: Domain-specific data resides in isolated Postgres schemas (e.g., `CREATE SCHEMA wills;`) while core orchestration logic remains in the `public` schema.

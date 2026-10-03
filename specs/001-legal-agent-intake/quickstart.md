# Quickstart: Legal AI Intake Agent

This guide validates the Extensible Taxonomy and Agentic State flow end-to-end.

## Prerequisites
- Sancus Flow environment running (`bun run dev`)
- `pgvector` enabled in your local PostgreSQL database.

## 1. Configure the Taxonomy (Admin Setup)

Before the agent can chat, we must define what it needs to extract.

```bash
curl -X POST http://localhost:4001/api/taxonomy \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "wills",
    "entityName": "life_event_pattern",
    "description": "Extract major life changes.",
    "extractionSchema": {
      "type": "object",
      "properties": {
        "event_type": {"type": "string"},
        "triggering_parties": {"type": "array", "items": {"type": "string"}}
      }
    }
  }'
```

## 2. Ingest Domain Knowledge (Grounding)

Provide the agent with foundational facts and processes.

```bash
curl -X POST http://localhost:4001/api/knowledge/domain \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "wills",
    "title": "What is a Testamentary Trust?",
    "content": "A testamentary trust is a trust established in a will that comes into effect upon the death of the testator. It is often used to manage assets for minor children."
  }'
```

## 3. Ingest a Case Study (Steering)

Provide the agent with a situational example linked to the taxonomy.

```bash
curl -X POST http://localhost:4001/api/knowledge/case-studies \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "wills",
    "title": "The Smith Family - Testamentary Trust for Minors",
    "content": "Mr. Smith had young children. We established a Testamentary Trust to ensure the funds were managed by his brother until they turned 25.",
    "tags": [{"taxonomyId": "<ID_FROM_STEP_1>", "value": "birth_of_child"}]
  }'
```

## 4. Run the Chat Sessions

Initialize a session for the 'wills' domain:

```bash
curl -X POST http://localhost:4001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"prospectId": "123e4567-e89b-12d3-a456-426614174000", "domain": "wills"}'
# Returns: {"sessionId": "abc-123"}
```

### Test A: The Educational Phase (Domain RAG)

Send a question about definitions. The Router should skip extraction and hit the Domain Knowledge vectors.

```bash
curl -X POST http://localhost:4001/api/sessions/abc-123/messages \
  -H "Content-Type: application/json" \
  -d '{"message": "I do not know anything about wills. What is a testamentary trust?"}'
```
**Expected Outcome:** 
1. **Supervisor:** Routes to `Phase: Education`.
2. **Educator Agent:** Retrieves the Trust definition from Domain Knowledge.
3. **Composer:** Explains the trust cleanly and gently asks if they are ready to begin. (No aggressive form extraction).

### Test B: The Intake Phase (Case Study Steering)

Send a message providing demographic facts.

```bash
curl -X POST http://localhost:4001/api/sessions/abc-123/messages \
  -H "Content-Type: application/json" \
  -d '{"message": "Okay, let us start. My wife and I just had our first baby and we want to set something up."}'
```
**Expected Outcome:**
1. **Supervisor:** Routes to `Phase: Intake`.
2. **Fact Extractor:** Successfully maps "just had our first baby" to the dynamic `life_event_pattern`.
3. **Case Study Planner:** Retrieves the "Smith Family" case study because the metadata tags match.
4. **Intake Manager:** Detects `guardian_name` is missing.
5. **Composer:** Validates the birth, educates using the Smith Family case study, and pivots to ask who they want as a guardian.

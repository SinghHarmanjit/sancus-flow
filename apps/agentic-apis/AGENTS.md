# Backend Instructions: agentic-apis

## Product
The AI Agent Engine for Sancus Flow (Port 4001). This service is dedicated exclusively to LLM orchestration, conversation state management, and executing the MEDDPICC qualification framework to convert raw consumer chat into structured legal case briefs.

## Technical Stack
- **Framework**: NestJS 10
- **AI Orchestration**: LangGraph.js
- **Protocol**: HTTP/REST & Server-Sent Events (SSE via NestJS Controllers & Stream Response)
- **Shared Types**: `@sancus-flow/types`
- **Deployment**: AWS ECS (Fargate persistent container)

## Architecture Rules
- **Domain-Driven Organization**: Organize `src/` by domain modules (e.g., `orchestrator/`, `chat/`, `qualification/`, `prompts/`).
- **LangGraph State Management**: Model conversational flows as explicit LangGraph state machines. Ensure checkpointing and state persistence allow seamless resume across reconnections.
- **MEDDPICC Qualification Engine**: Systematically capture qualification parameters (Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion, Competition) as part of the structured intake dialogue.
- **Inter-Service Communication**: Once intake is qualified, transmit the structured case brief to `crm-apis` (Port 4002) via internal REST calls using contracts defined in `@sancus-flow/types`.
- **Stateless Agent Containers**: Keep the container runtime stateless by storing conversational state and session checkpoints in external persistence (Postgres thread checkpointing).
- **Prompt & LLM Safety**: Centralize prompt templates, validate model outputs against Zod/DTO schemas, and sanitize user input against prompt injection.

## Validation & Security
- Validate all incoming HTTP requests using NestJS global validation pipes with DTOs.
- Isolate LLM API keys and model credentials in server-only environment variables.

## Development Commands
- Start development server: `bun run dev` (runs on `http://localhost:4001`)
- Build application: `bun run build`
- Typecheck & lint: `bun run lint`

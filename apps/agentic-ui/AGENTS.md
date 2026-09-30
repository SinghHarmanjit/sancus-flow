# Frontend Instructions: agentic-ui

## Product
The embeddable "Trojan Horse" chat widget for Sancus Flow (Port 3001). This lightweight, high-performance conversational interface is designed to be injected via `<iframe>` into third-party solicitor websites or rendered within `marketplace-ui`. It guides consumers through real-time AI-powered legal intake.

## Technical Stack
- **Framework**: Next.js 15 (App Router, React 19)
- **Rendering**: Pure static HTML/JS via Next.js `output: 'export'`
- **Deployment**: AWS S3 + CloudFront CDN
- **Shared Types**: `@sancus-flow/types`
- **Realtime**: Server-Sent Events (SSE) over HTTP POST connecting to `agentic-apis` (Port 4001)

## Architecture Rules
- **Static Export Discipline**: This application is compiled statically (`output: 'export'`). NEVER use dynamic Node.js server runtime features (e.g., dynamic server-rendered headers, server-side cookies, or dynamic API route handlers).
- **Embeddable Optimization**: Keep bundle size minimal. Optimize for zero-layout-shift and fast initial load when embedded inside third-party website iframes.
- **Communication Flow**: 
  - Agent Streaming (HTTP POST + SSE): Dispatches user messages via standard POST requests and receives chunked text/event-stream responses delivering real-time token deltas, thought processes, and tool-call lifecycle events.
  - Generation Control: Leverages native AbortSignal to immediately terminate the HTTP stream and halt backend agent execution when the user cancels or navigates away.
  - Host Integration (postMessage): Implements a secure cross-origin postMessage protocol to synchronize widget state with the parent host (dynamic iframe resizing, minimize/close triggers, and parent modal dispatching).
- **Resilient UI States**: Provide clear loading indicators, typing/thinking states, message delivery status, and graceful reconnection handling for intermittent connections.
- **Shared Contracts**: Use interfaces from `@sancus-flow/types` for message payloads, session identifiers, and qualification brief summaries.

## Development Commands
- Start development server: `bun run dev` (runs on `http://localhost:3001`)
- Build static bundle: `bun run build`
- Lint code: `bun run lint`

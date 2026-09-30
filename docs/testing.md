# Testing Strategy and Guidelines

## Frameworks
- **Unit & Integration Testing**: Jest
- **End-to-End (E2E) Testing**: Playwright
- **Monorepo Test Execution**: Turborepo caching (`turbo test`, `turbo test:e2e`)

## Testing Guidelines

### Backend Testing (`apps/*-apis`)
- **Unit Tests**: Focus on business logic in NestJS services, state transitions in LangGraph workflows, and DTO transformation/validation.
- **Integration Tests**: Test controller-to-service flows and database queries with Drizzle ORM against test databases or deterministic mocks.
- **Mocking**: Mock external third-party APIs (e.g. OpenAI / Anthropic LLM endpoints, Resend, LEAP, Clio) using deterministic fixtures.

### Frontend Testing (`apps/*-ui`)
- **Component Tests**: Test reusable UI primitives in `@sancus-flow/ui` with Jest and React Testing Library.
- **E2E Tests**: Use Playwright to validate critical user flows:
  - Consumer discovery and search in `marketplace-ui`.
  - Chat initiation and message flow in `agentic-ui`.
  - Lawyer login, lead triage, and case review in `crm-ui`.

### Running Tests
```bash
# Run unit tests across the entire monorepo
bun run test

# Run tests for a specific service
bun run --filter @sancus-flow/agentic-apis test
bun run --filter @sancus-flow/crm-apis test

# Run E2E tests
bun run test:e2e
```

### Invariants
- Prefer behavior-based assertions over private implementation details.
- Ensure all tests are deterministic; do not rely on external live network calls during test runs.
- Run affected tests via Turborepo before submitting a pull request.

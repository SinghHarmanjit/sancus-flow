# Git and Pull Request Workflow

## Branching Strategy
- **Base Branch**: `main`
- **Feature Branches**: `feat/<feature-name>`, `fix/<bug-name>`, `refactor/<scope>`
- Direct pushes to `main` are strictly prohibited. All changes must arrive via pull request with passing CI checks.

## Commits & Atomic Changes
- **Conventional Commits**: Use semantic prefixes (e.g., `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
- **Atomic Commits**: Keep schema changes, Drizzle migrations, and corresponding backend code in the same commit.
- Never commit build artifacts (`dist/`, `.next/`), local environment files (`.env*.local`), or test reports.

## Pre-PR Validation
Before creating or updating a pull request, run the full validation suite locally:
```bash
# 1. Typecheck and lint all apps and packages
bun run lint

# 2. Run unit and integration tests
bun run test

# 3. Verify clean production builds
bun run build
```

## Pull Request Requirements
- Clearly describe the purpose, context, and user-visible behavior of the changes.
- Document any schema alterations or configuration variable changes.
- Provide verification steps and test coverage results.

# Authentication and Security

## System Architecture
- **Auth Engine**: BetterAuth
- **Primary Auth Provider Service**: `apps/crm-apis`
- **Email Service**: Resend (used for magic links, OTPs, password resets, and notifications)

## Persona & Session Management
1. **Legal Practitioners (Lawyers)**:
   - Authenticated access to `crm-ui`.
   - Issues secure JWT tokens and refresh tokens managed via HTTP-only, Secure cookies.
   - Strict Role-Based Access Control (RBAC) enforced across all CRM endpoints.
2. **Consumers**:
   - Authenticated access to `marketplace-ui` for case status and profile management.
   - Lightweight session verification via BetterAuth session cookies.
3. **Anonymous / Widget Users**:
   - Consumers in `agentic-ui` interact anonymously or via temporary session tokens linked to an active LangGraph conversation thread in `agentic-apis`.

## Security Policies
- **Input Validation**: Validate 100% of external inputs at API boundaries using NestJS DTOs with `class-validator` and `class-transformer`.
- **Server-Side Authorization**: Never trust client-supplied user IDs, roles, or claims. Verify permissions strictly server-side using NestJS Guards and BetterAuth session hooks.
- **Cookie Security**: Store session tokens in `HttpOnly`, `SameSite=Lax` (or `None` for cross-site iframe where verified), `Secure` cookies.
- **Secrets Management**: Never commit secrets or expose environment variables prefixed with public identifiers (`NEXT_PUBLIC_`) unless explicitly designed for public consumption. Backend secrets (database credentials, API keys, JWT secrets) reside only in environment configurations.

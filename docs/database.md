# Database and Migrations

## ORM and Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM (Prisma is **strictly forbidden**)
- **Migration Engine**: Drizzle Kit

## Database Ownership
- **Primary Owner**: `apps/crm-apis` holds the database connection pool, transactional logic, and execution of schema migrations.
- **Shared Definitions**: Reusable table schemas and type definitions are maintained in shared packages (or domain modules) and exported via `@sancus-flow/types` where appropriate.
- **Client Access**: Frontend applications (`marketplace-ui`, `agentic-ui`, `crm-ui`) must never have database drivers or direct credentials.

## Migrations Workflow
1. **Generating Migrations**:
   Run schema generation via Drizzle Kit:
   ```bash
   bun run --filter @sancus-flow/crm-apis db:generate
   ```
2. **Applying Migrations**:
   ```bash
   bun run --filter @sancus-flow/crm-apis db:migrate
   ```
3. **Migration Rules**:
   - **Immutability**: Never edit an already-applied migration file. Always generate a new incremental migration.
   - **Zero Downtime**: Ensure backward compatibility. Do not rename or delete columns without a multi-phase deprecation strategy.
   - **Backfill Strategy**: When adding non-null constraints or required columns to existing tables, provide a default value or execute a data backfill script prior to applying the constraint.
   - **Transactional Migrations**: Keep DDL operations wrapped in transactions when supported by PostgreSQL.

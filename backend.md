# Backend Documentation

HouseERP uses Supabase PostgreSQL, Supabase Auth, row-level security policies, database functions, triggers, and read-only views as its backend layer. The browser client reads and writes through typed Supabase repositories; the database remains the authority for access control and business data persistence.

## Requirements

- A Supabase project with authentication enabled
- PostgreSQL migrations applied in the documented order
- Supabase managed backups enabled before production use

## Database Setup

Apply the SQL files in [supabase/migrations](./supabase/migrations) in timestamp order:

1. `001_extensions.sql`
2. `002_master_tables.sql`
3. `003_inventory_tables.sql`
4. `004_production_tables.sql`
5. `005_sales_tables.sql`
6. `006_finance_tables.sql`
7. `007_authentication_tables.sql`
8. `008_indexes.sql`
9. `009_functions_and_triggers.sql`
10. `010_row_level_security.sql`
11. `011_seed_data.sql`
12. `012_views.sql`
13. `013_comments.sql`
14. `014_atomic_raw_egg_purchase.sql`
15. `015_atomic_production_batch.sql`
16. `016_atomic_sale.sql`
17. `017_atomic_expenses.sql`
18. `018_atomic_farm_production.sql`
19. `019_supabase_auth_profiles.sql`
20. `020_master_data_commands.sql`

The canonical RLS definition is `20260717000010_row_level_security.sql`.

## Persistence Model

The authoritative store is relational PostgreSQL. Business modules access database tables, functions, and views through Supabase repositories. No browser-storage persistence or legacy manager layer remains.

Inventory-affecting commands execute through atomic PostgreSQL functions. Reports and analytics use read-only Supabase repositories.

## Authentication and Roles

Supabase Auth is the identity source. Application profiles and role-based access must be tied to authenticated users before public deployment.

The schema recognizes these roles:

- `Owner`
- `Admin`
- `Warehouse`
- `Sales`
- `Production`
- `Finance`
- `User`

Database RLS, not hidden UI controls, must remain the authority for access decisions.

## Security Checks

Run the static RLS verifier after changing migrations or policies:

```sh
npm run verify:rls
```

`verify:rls` statically guards RLS coverage, anonymous access, and audit-write restrictions. Live RLS behavior must also be tested against a local or dedicated Supabase test database; the static verifier is not a replacement for database integration tests.

Do not expose this application publicly until:

1. Authentication and user profiles are configured.
2. Tenant or organization ownership is defined.
3. RLS role tests pass against a real test database.
4. Inventory and financial workflows run in atomic PostgreSQL transactions.
5. The client uses database objects that are actually created by the migrations.

## Backups and Audit Data

Use managed PostgreSQL backups from Supabase. The settings screen exports the immutable database audit trail; unsafe client-side restore and system-reset operations have been removed.

Audit-log creation must remain restricted to trusted database functions and triggers. Clients must not be able to forge, update, or delete audit records through the public API.

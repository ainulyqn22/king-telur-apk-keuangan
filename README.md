# HouseERP

HouseERP is a browser-based ERP for a duck-egg business. It tracks farm production, raw and salted egg inventory, production batches, purchases, sales, operating costs, dashboards, and reports.

> **Project status:** Supabase persistence migration complete. Review [IMPROVEMENT_PLAN.md](./IMPROVEMENT_PLAN.md) before production deployment; tenant isolation and live database security testing remain required.

## Requirements

- Node.js 22 or a compatible maintained Node.js release
- npm
- A Supabase project with authentication enabled

## Local development

```sh
npm install
copy .env.example .env.local
npm run dev
```

On macOS or Linux, replace the `copy` command with `cp`.

Set these browser-safe values in `.env.local`:

```dotenv
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-public-anon-key"
```

Never place a Supabase service-role key in a `VITE_*` variable. Vite exposes these values to every browser user.

Both Supabase variables are required. The application has no browser-storage persistence fallback.

## Quality checks

```sh
npm test
npm run typecheck
npm run lint
npm run verify:rls
npm run build
npm run check
```

- `test` runs the Vitest regression suite.
- `typecheck` runs TypeScript in strict mode.
- `lint` runs type-aware ESLint rules, including React Hooks and unsafe-promise checks.
- `verify:rls` statically guards RLS coverage, anonymous access, and audit-write restrictions.
- `build` creates the production bundle in `dist/`.
- `check` runs the complete local/CI verification sequence.

Live RLS behavior must also be tested against a local or dedicated Supabase test database; the static verifier is not a replacement for database integration tests.

## Database setup

Apply the SQL files in [database/migrations](./database/migrations) in numeric order. The canonical RLS definition is `010_row_level_security.sql`; the root `supabase_policies.sql` file is only a compatibility pointer so policy definitions cannot drift.

Do not expose this application publicly until:

1. Authentication and user profiles are configured.
2. Tenant/organization ownership is defined.
3. RLS role tests pass against a real test database.
4. Inventory and financial workflows run in atomic PostgreSQL transactions.
5. The client uses database objects that are actually created by the migrations.

## Current roles

The schema recognizes `Owner`, `Admin`, `Warehouse`, `Sales`, `Production`, `Finance`, and `User`. Database RLS—not hidden UI controls—must remain the authority for access decisions.

## Backups

Use managed PostgreSQL backups from Supabase. The settings screen exports the immutable database audit trail; unsafe client-side restore and system-reset operations have been removed.

## Architecture and limitations

The UI is React 19, TypeScript, Vite, Tailwind CSS, Zod, Recharts, and Supabase. Every module reads from relational PostgreSQL repositories. Inventory-affecting commands execute through atomic PostgreSQL functions; reports and analytics use read-only Supabase repositories. No browser persistence or legacy manager layer remains.

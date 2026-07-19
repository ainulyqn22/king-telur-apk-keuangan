# Backend Documentation

HouseERP uses Supabase as the backend service for PostgreSQL, Auth, row-level security, and optional Storage. The Next.js app never exposes service-role credentials to the browser.

## Architecture

- `src/lib/supabase/server.ts`: cookie-backed Supabase SSR client.
- `src/lib/supabase/admin.ts`: server-only service-role client for privileged auth admin flows.
- `src/repositories`: data access against Supabase tables, views, and RPC functions.
- `src/services`: server-side business orchestration and authorization checks.
- `src/app/(protected)/actions.ts`: validated Server Actions for mutations.
- `src/app/api`: protected Route Handlers for server API integrations.
- `src/proxy.ts`: Next 16 middleware-style session refresh, route protection, and RBAC checks.

## Database Schema

Apply migrations in `supabase/migrations` in timestamp order. The core tables are:

- `profiles`: Supabase Auth profile, role, and employee permissions.
- `settings`: business profile and default transfer price.
- `suppliers`, `customers`, `expense_categories`: master data.
- `stock_states`: current raw and salted egg quantity/HPP.
- `farm_production`, `raw_egg_purchases`: raw egg inputs.
- `production_batches`: salted egg lifecycle and batch costing.
- `raw_transactions`, `production_transactions`: inventory journals.
- `sales`, `operational_costs`: revenue, COGS, and expenses.
- `audit_logs`: database audit trail.

## Supabase Configuration

Required Vercel environment variables:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
```

Use the publishable/anon key for SSR user-scoped clients. Use the service-role key only in server-only files for invitations and administrative profile writes.

## Authentication

Authentication is implemented with Supabase Auth:

- login: `/login`
- logout: Server Action from the protected shell
- forgot password: `/forgot-password`
- password reset: `/reset-password`
- auth callback: `/auth/callback`
- email OTP confirmation: `/auth/confirm`
- user invitation: `/users`

The Next proxy refreshes sessions and blocks unauthenticated protected routes before SSR rendering.

## Authorization

The application exposes three roles:

- `Owner`: full access, user management, settings, reports, and all modules.
- `Admin`: full access, user management, settings, reports, and all modules.
- `Employee`: access only through assigned permissions.

Employee permission keys:

- `dashboard.read`
- `inventory.manage`
- `purchases.manage`
- `production.manage`
- `sales.manage`
- `expenses.manage`
- `reports.read`
- `settings.manage`
- `users.manage`

Authorization is enforced in middleware, Server Actions, Route Handlers, and Supabase RLS. Migration `20260719000021_next_app_rbac.sql` maps employee permissions to the existing RLS/RPC operational checks.

## RLS Policies

Anonymous users have no application-table access. Authenticated access is filtered through `profiles` and `public.check_user_role(text[])`. Audit logs are readable only by Owner/Admin and are written by trusted database triggers.

Keep static verification in CI:

```sh
npm run verify:rls
```

Live RLS tests against a Supabase test database are still required before public production use.

## API And Route Handlers

Route Handlers live under `src/app/api`. Current protected endpoint:

- `GET /api/reports/summary`: returns financial summary and stock values after `reports.read` authorization.

Add route handlers for machine-to-machine or external integrations. Prefer Server Actions for form-driven UI mutations.

## Business Logic

Inventory and financial commands are executed by PostgreSQL RPC functions inside transactions:

- `record_farm_production`
- `record_raw_egg_purchase`
- `create_production_batch`
- `transition_production_batch`
- `record_sale`
- `record_operational_expense`

These functions enforce stock availability, weighted-average HPP, COGS, gross profit, production status transitions, and audit writes atomically.

## Deployment

Deploy on Vercel as a standard Next.js App Router project:

1. Configure all required environment variables.
2. Apply Supabase migrations.
3. Set Supabase Auth redirect URLs to include:
   - `${NEXT_PUBLIC_SITE_URL}/auth/callback`
   - `${NEXT_PUBLIC_SITE_URL}/auth/confirm`
   - `${NEXT_PUBLIC_SITE_URL}/reset-password`
4. Run `npm run check`.
5. Deploy with Vercel’s Next.js build preset.

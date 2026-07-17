# HouseERP Improvement Plan

This document is the persistent implementation backlog created from the project audit on 2026-07-16. Keep it updated as work is completed or new risks are discovered.

## Status legend

- [ ] Not started
- [x] Completed and verified
- `BLOCKED` Waiting for a decision or external dependency

## Definition of done

An item is complete only when its implementation is reviewed, relevant automated checks pass, and the accompanying documentation is updated. Security and data-integrity work must include tests that demonstrate both allowed and denied behavior.

## P0 — Production blockers

### 1. Secure Supabase row-level security

- [x] Remove every anonymous (`anon`) fallback from production RLS policies.
- [x] Require authenticated users for all ERP records and settings.
- [x] Add both `USING` and `WITH CHECK` clauses for role-protected writes.
- [x] Restrict audit-log creation to trusted database functions/triggers.
- [x] Prevent clients from updating or deleting audit records.
- [ ] Add automated policy tests for anonymous users and every application role.

Progress note: `npm run verify:rls` now performs static regression checks across all 24 tables, including anonymous-access and audit-write guards. Live role-behavior tests still require a local or dedicated Supabase test database.

Acceptance criteria:

- Anonymous clients cannot read or mutate ERP data.
- Each role can access only its documented modules and operations.
- Audit records cannot be forged, changed, or deleted through the public API.

### 2. Establish tenant and user ownership

- [ ] Decide whether HouseERP is single-organization or multi-tenant.
- [ ] For multi-tenancy, add `organization_id` to every business record and relevant unique constraint.
- [ ] Derive tenant access from authenticated membership rather than client-provided identifiers.
- [ ] Backfill and verify existing data before making tenant columns mandatory.

Acceptance criteria:

- A user from one organization cannot access another organization's records.
- Tenant isolation is covered by database-policy tests.

### 3. Choose one persistence model

Preferred direction: use the existing relational PostgreSQL tables as the authoritative store.

- [ ] Record an architecture decision: relational tables versus a JSON `erp_store`.
- [ ] Replace `StorageRepository` JSON synchronization with a typed relational Supabase repository.
- [ ] If `erp_store` is retained temporarily, create it through a migration with ownership, constraints, and strict RLS.
- [ ] Check and surface the `{ data, error }` result of every Supabase operation.
- [ ] Keep `localStorage` only for non-sensitive preferences or a deliberately designed offline cache.

Acceptance criteria:

- The client only references database objects created by migrations.
- Failed cloud writes are visible to the user and never reported as successful.
- The source of truth and synchronization behavior are documented.

### 4. Make inventory and financial workflows atomic

- [x] Validate complete batch and sale inputs before changing inventory.
- [ ] Implement transactional database functions for farm production, batch creation/harvest, sales, reversals, and stock adjustments.
- [ ] Lock affected stock rows and prevent concurrent negative inventory.
- [ ] Write the business record, stock movement, balance, and audit event in one transaction.
- [ ] Replace destructive deletion of financial history with immutable reversal/cancellation records.
- [ ] Define and enforce currency rounding rules; prefer integer rupiah or fixed-precision database numerics.

Acceptance criteria:

- Any failed operation leaves all balances and records unchanged.
- Concurrent sales cannot reduce stock below zero.
- Every balance change is traceable to an immutable transaction.

## P1 — Security and reliability

### 5. Complete authentication and authorization

- [ ] Use Supabase Auth as the canonical identity source.
- [ ] Link application profiles and roles to `auth.users.id`.
- [ ] Remove or document the need for duplicate custom user/session/token tables.
- [ ] Load authentication and role state before rendering protected modules.
- [ ] Replace hard-coded `Administrator`/`system` attribution with the authenticated user.
- [ ] Treat UI permissions as convenience only; keep enforcement in RLS/database functions.

### 6. Replace misleading client-side security controls

- [ ] Remove claims that the browser-side 32-bit salted hash prevents tampering.
- [ ] Do not trust browser storage for financial or authorization decisions.
- [x] Use cryptographically strong UUIDs instead of `Math.random()` IDs.
- [x] Clear only HouseERP-owned browser keys instead of calling `localStorage.clear()`.

### 7. Make application initialization and synchronization explicit

- [ ] Replace asynchronous work in the repository constructor with an awaited initialization flow.
- [ ] Add loading, ready, offline, synchronization-failed, and retry states.
- [ ] Await business-critical writes.
- [ ] Prevent older cloud responses from overwriting newer local changes.
- [ ] Define conflict resolution if offline editing is supported.

## P2 — Automated quality controls

### 8. Add tests

- [x] Configure Vitest for service-level tests.
- [x] Configure React Testing Library and jsdom for component tests.
- [x] Test stock additions, deductions, weighted-average cost, and insufficient stock.
- [x] Test all production-batch state transitions.
- [x] Test raw and salted sale creation, cancellation, costing, and inventory reversal.
- [x] Prove batch and sale validation failures do not mutate stock or transaction history.
- [ ] Test concurrent inventory operations against the database.
- [ ] Test backup validation, corrupted files, and safe restoration.
- [ ] Add RLS tests for anonymous, ordinary, and privileged roles.
- [ ] Add a Playwright end-to-end production-to-sale workflow.

### 9. Strengthen static analysis and CI

- [x] Enable TypeScript `strict` mode.
- [ ] Remove avoidable `any` casts from legacy storage adapters, report exports, chart callbacks, and UI error handling.
- [x] Add ESLint rules for React, hooks, TypeScript, and unsafe promises.
- [ ] Add consistent formatting.
- [x] Add CI checks for type-checking, linting, tests, RLS verification, production build, and dependency audit.
- [ ] Require these checks before merging changes.

Progress note: unsafe-promise and React Hooks rules are blocking. Legacy explicit-`any`, unsafe-member, and unused-import rules remain temporarily disabled until the adapter/report cleanup is complete; they must not be described as enforced yet.

### 10. Align validation across layers

- [ ] Validate quantities, dates, money, references, and state transitions at service boundaries.
- [ ] Reject zero, negative, non-finite, and unreasonably large numeric values where inappropriate.
- [ ] Add database constraints matching application validation.
- [ ] Validate all imported backup content before changing existing data.
- [ ] Make backup restoration transactional or safely recoverable.

## P3 — Performance and maintainability

### 11. Reduce initial bundle size

- [x] Lazy-load major ERP modules.
- [x] Split charting and reporting dependencies from the initial bundle.
- [ ] Move large dataset filtering, aggregation, and pagination to the database.
- [x] Add error boundaries around independently loaded modules.

Target:

- [x] Remove Vite's greater-than-500-kB chunk warning or document a measured exception.

### 12. Improve code structure

- [ ] Break oversized views and services into focused modules.
- [ ] Remove duplicate type definitions and establish one canonical type location.
- [ ] Separate domain logic from React components and storage details.
- [ ] Introduce typed repository interfaces for database operations.
- [ ] Standardize application errors and user-safe error messages.

## P4 — Documentation and repository hygiene

### 13. Correct project documentation

- [x] Replace the AI Studio template README with HouseERP architecture, setup, development, testing, migration, deployment, backup, and recovery instructions.
- [x] Update `.env.example` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` without real secrets.
- [x] Document migration order and RLS verification.
- [x] Document roles and their permissions.
- [ ] Add an incident/recovery procedure for failed or partial business operations.

### 14. Clean dependencies and scripts

- [x] Remove unused Gemini, Express, dotenv, Motion, and related dependencies after confirming they are unnecessary.
- [x] Keep one package-manager lockfile; npm is canonical and the empty `bun.lock` is removed.
- [x] Make the `clean` script cross-platform.
- [x] Add meaningful package name, versioning, and metadata.

## Baseline audit results

Recorded on 2026-07-16:

- TypeScript check: passed (`npm run lint`).
- Production build: passed (`npm run build`).
- Production dependency audit: zero known vulnerabilities (`npm audit --omit=dev`).
- Automated tests: 12 service, repository, and UI-boundary regression tests present.
- Production JavaScript: 49 kB application entry plus lazy feature/vendor chunks; largest chunk is approximately 378 kB. Vite's chunk-size warning is resolved.

## Recommended execution order

1. Secure RLS and define tenant ownership.
2. Decide and implement the authoritative persistence model.
3. Move inventory and financial workflows into atomic database transactions.
4. Complete authentication, attribution, and audit enforcement.
5. Add data-integrity and RLS tests.
6. Strengthen TypeScript, linting, and CI.
7. Improve performance, structure, documentation, and repository hygiene.

## Progress log

| Date | Change | Verification |
| --- | --- | --- |
| 2026-07-16 | Created improvement backlog from the initial audit. | Audit findings captured and prioritized. |
| 2026-07-16 | Hardened the canonical RLS migration, covered previously omitted tables, denied client access to credential/session tables, and removed the duplicated policy file. | `npm run verify:rls` and `npm run lint` pass. Live database role tests remain open. |
| 2026-07-16 | Moved complete batch/sale validation before inventory deductions and added the initial service regression suite. | 3 Vitest tests pass; type-check and RLS verification pass. Database transactions are still required for full atomicity. |
| 2026-07-16 | Replaced weak record IDs, scoped reset to HouseERP browser/cloud keys, corrected environment and project documentation, and removed confirmed unused runtime dependencies. | 4 tests, type-check, RLS verification, cross-platform clean, production build, and production dependency audit pass. |
| 2026-07-16 | Lazy-loaded all major views, split stable vendor/chart chunks, and added accessible loading and module-error isolation. | 6 tests and type-check pass; production entry reduced from about 1,083 kB to 49 kB and no chunk exceeds 500 kB. |
| 2026-07-16 | Enabled strict TypeScript, introduced type-aware ESLint safety gates, added an aggregate `check` command, and created GitHub Actions CI. | The full `npm run check` sequence passes: strict type-check, ESLint, 6 tests, 24-table RLS verification, and production build. |
| 2026-07-16 | Added stock-costing, insufficient-stock, batch-state-machine, and raw/salted sale reversal coverage; rejected invalid stock quantities and batch state bypasses at the service boundary. | 12 tests pass together with strict type-check and ESLint. |

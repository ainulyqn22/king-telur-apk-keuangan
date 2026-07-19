# Frontend Documentation

HouseERP is now a monolithic Next.js App Router application optimized for Vercel and SSR. Client components are limited to interactive UI such as navigation; Supabase reads and writes run on the server.

## Application Structure

- `src/app`: App Router routes, layouts, Server Actions, and Route Handlers.
- `src/components`: reusable presentation components.
- `src/services`: server-side business logic and authorization.
- `src/repositories`: Supabase data access.
- `src/lib`: environment, formatting, form, and Supabase helpers.
- `src/types`: shared ERP and RBAC types.
- `src/proxy.ts`: Next 16 middleware-style session refresh and route protection.

## Routing

Public routes:

- `/login`
- `/forgot-password`
- `/reset-password`
- `/auth/callback`
- `/auth/confirm`

Protected routes:

- `/dashboard`
- `/master-data`
- `/purchases`
- `/production/farm`
- `/production/salted`
- `/sales`
- `/expenses`
- `/reports`
- `/analytics`
- `/settings`
- `/users`

## Pages And UI Flow

Each protected page is server-rendered and fetches fresh Supabase data through server repositories. Forms submit to Server Actions. After successful create, update, delete, or status transition, actions call `revalidatePath` and redirect back with a status message.

## Components

Presentation components are in `src/components/ui.tsx`:

- `PageHeader`
- `Notice`
- `Panel`
- `Field`
- `SubmitButton`
- `DangerButton`
- `Table`, `Th`, `Td`
- `CardLink`

`src/components/app-shell.tsx` is the only primary shell client component. It handles responsive navigation and logout form submission but does not access Supabase directly.

## State Management

The app uses server state from Supabase as the source of truth. There is no browser database client, local persistence manager, or client-side cache that can become authoritative. UI state is limited to navigation visibility and native form state.

## API Integration

Internal UI mutations use Server Actions. External or programmatic integrations should use protected Route Handlers under `src/app/api`.

Current endpoint:

- `GET /api/reports/summary`

## Deployment

The app is compatible with Vercel’s managed Next.js runtime. Use environment variables for all Supabase configuration and never place the service-role key in `NEXT_PUBLIC_*`.

Recommended deployment checks:

```sh
npm run typecheck
npm run lint
npm test
npm run verify:rls
npm run build
```

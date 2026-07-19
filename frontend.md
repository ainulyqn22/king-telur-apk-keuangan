# Frontend Documentation

HouseERP's frontend is a React 19 application built with TypeScript, Vite, Tailwind CSS, Zod, Recharts, and Supabase JS. It runs in the browser and communicates with Supabase through typed repository classes.

## Requirements

- Node.js 22 or a compatible maintained Node.js release
- npm
- Browser-safe Supabase project URL and anon key

## Local Development

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

## Application Structure

- [src/app/main.tsx](./src/app/main.tsx) mounts the React application.
- [src/app/App.tsx](./src/app/App.tsx) coordinates the primary application shell and module routing.
- [src/features](./src/features) contains feature modules for dashboard, inventory, production, purchases, sales, finance, reports, and settings.
- [src/shared](./src/shared) contains shared components, controllers, errors, Supabase setup, types, utilities, and validators.
- [src/app/styles.css](./src/app/styles.css) contains global styling.

Major ERP modules are lazy-loaded, and charting/reporting dependencies are split from the initial bundle. Error boundaries isolate independently loaded modules.

## Quality Checks

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

- `test` runs the Vitest regression suite.
- `typecheck` runs TypeScript in strict mode.
- `lint` runs type-aware ESLint rules, including React Hooks and unsafe-promise checks.
- `build` creates the production bundle in `dist/`.

## Frontend Runtime Notes

UI permissions are convenience controls only. The frontend must not be treated as the source of truth for authorization, financial history, inventory balances, audit data, or persistence.

Client-side code must check and surface Supabase operation errors. Failed writes must be visible to the user and must never be reported as successful.

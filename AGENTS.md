# Repository Guidelines

## Project Structure & Module Organization
Client code sits in `src/` with `App.js` wiring routes and shared providers. Use `pages/` for routed screens, `components/` for reusable UI, `contexts/` for React context wrappers, and `hooks/` or `utils/` for shared logic. `src/lib/supabase.js` centralizes API access and enforces required env vars; store seed data in `src/data/`. Static assets live in `public/`, while SQL schemas and row-level security policies reside in `supabase/`, which should stay authoritative.

## Build, Test, and Development Commands
Run `npm install` after cloning to sync dependencies. `npm start` launches the Create React App dev server with hot reload and `.env.local` overrides. `npm run build` emits the production bundle in `build/`. `npm test` runs Jest in watch mode; append `-- --coverage` before merging to confirm key flows remain covered.

## Coding Style & Naming Conventions
ESLint inherits the `react-app` and `react-app/jest` configs, so follow their JSX, hooks, and accessibility guidance. Match the existing two-space indentation, single quotes, and trailing semicolons. Name components with PascalCase, hooks with `use*`, and utilities with camelCase modules. Co-locate CSS only when it is component-specific; keep shared tokens and typography in `src/index.css`.

## Testing Guidelines
Rely on Jest and React Testing Library for unit and interaction coverage. Name specs `FeatureName.test.jsx` beside the implementation or in a sibling `__tests__` folder. Mock Supabase with `jest.mock('src/lib/supabase')` and inject stub data from `src/data/` to keep tests deterministic. Prioritize smoke tests for each route in `src/pages/` and behavioural assertions for newsletter creation, uploads, and access control.

## Commit & Pull Request Guidelines
Keep commit subjects short, present tense, and descriptive (for example, `Adjust Supabase config`). Use the body to note schema changes, manual SQL steps, or environment updates. Pull requests should outline user-visible changes, list local testing, and attach screenshots or recordings for UI tweaks. Link any SQL updates in `supabase/` so reviewers can reapply them locally.

## Supabase & Environment Notes
Store Supabase credentials in `.env.local` as `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`. Document schema edits in `SUPABASE_SETUP.md` and update the paired script under `supabase/`. When credentials are unavailable, mock the client and provide fixture data so `npm start` remains usable for reviewers.

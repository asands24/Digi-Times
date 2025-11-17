# DigiTimes Front Page Studio

Craft rich newspaper-style coverage from your everyday photos in minutes. Upload an image, jot down the angle you want to highlight, and DigiTimes generates a headline, story, dateline, and pull quote worthy of the front page.

## Highlights

- **Photo-to-Story Pipeline** – Drop in one or many images and receive fully written feature articles tuned to your prompt.
- **Editorial Tone Blends** – Smart heuristics adjust tone for celebrations, adventures, community events, or quiet spotlights.
- **Local Story Archive** – Save generated features with their images, edit the copy later, and keep a timestamped history.
- **Print & Export Ready** – Open a print-perfect layout or export the full archive as JSON for safekeeping.
- **Public Template Gallery** – Browse shared templates at `/templates` with no authentication required.
- **Anonymous Photo Uploads** – Upload images straight to Supabase Storage via `/upload` and share them through the `/gallery`.
- **Offline Friendly** – Core newsroom workflows continue to run locally when Supabase credentials are absent.

## Quick Start

```bash
npm install
npm start
```

Open http://localhost:3000 to launch the studio.

## Using the Studio

1. **Set the Angle** – Enter an optional “story idea” prompt. We reuse it for new uploads and inspiration.
2. **Add Photos** – Drag & drop images (JPG/PNG/WebP) or click the upload area.
3. **Shape Each Story** – Adjust the prompt per photo if needed and generate the article.
4. **Archive the Winners** – Save finished pieces to the Edition Archive where they persist in local storage.
5. **Polish & Publish** – Edit saved copy, open a print-ready view, or export the archive for sharing.

## Public Pages

- `/templates` – Lists the 50 most recent public templates (`is_public = true`) from Supabase.
- `/upload` – Anonymous uploader that writes images to the `photos` bucket under the `public/` prefix.
- `/gallery` – Renders a responsive grid of publicly uploaded images.

These routes work in incognito mode once the Supabase SQL policies in `SUPABASE_SETUP.md` are applied (public read on `public.templates` and the `photos` bucket).

## Scripts

- `npm start` – Run the development server with hot reload.
- `npm run build` – Create a production build of the single-page app.
- `npm test` – Execute Jest in watch mode.

## Tech Stack

- **React 18 + TypeScript** – Core UI and state management.
- **Lucide Icons** – Newsroom-inspired iconography.
- **React Hot Toast** – Inline notifications with editorial styling.
- **Custom Styling** – Tailored newspaper aesthetic in `src/index.css`.

## Supabase Note

Legacy Supabase hooks remain (for the original collaborative roadmap) but sit behind configuration guards. If you plan to revive the backend experience, add `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` to `.env.local` and re-enable the associated hooks/pages.

## Story Generation Pipeline

- Generate/Regenerate actions in `src/components/EventBuilder.tsx` now call `generateStoryFromPrompt()` from `src/utils/storyGenerator.ts`, which POSTs to `/.netlify/functions/generateStory` before falling back to the seeded local generator.
- `netlify/functions/generateStory.js` calls OpenAI’s Chat Completions API (`gpt-4o-mini`) with the effective prompt for the draft and returns `{ article }` text for the client to hydrate into the template.
- If the function errors or OpenAI returns an invalid payload, the browser logs `[DigiTimes] Falling back to LocalStoryGenerator due to OpenAI error` and reuses the existing heuristic article builder so the UI keeps working offline.
- `OPENAI_API_KEY` must be configured both in Netlify → Site settings → Environment variables and in `.env.local` when running Netlify CLI/dev locally so the function can authenticate.
- In development mode successful calls log `[DigiTimes] Generated story via OpenAI`, letting you verify which path generated the draft.

### Smoke Script Credentials

- Use the **public anon key** from Supabase Project Settings → API (never the `service_role` key).
- Env vars required locally and in CI:
  - `REACT_APP_SUPABASE_URL=https://<ref>.supabase.co`
  - `REACT_APP_SUPABASE_ANON_KEY=<public anon key>`
  - `SMOKE_TEST_EMAIL=smoke+digitimes@example.com`
  - `SMOKE_TEST_PASSWORD=TestSmoke123!`
  - `SECRETS_SCAN_OMIT_KEYS=REACT_APP_SUPABASE_ANON_KEY` (Netlify secret scanning allowlist)
- Rotate keys in Supabase? Update `.env.local` and hosting env vars before re-running `npm run smoke:*`.

## Acceptance Checklist

- `/templates` renders public rows and handles empty/error states without crashing.
- `/upload` accepts JPG/PNG/WebP images under 10 MB and returns a public URL.
- `/gallery` displays files stored under `photos/public/*` with anonymous access.
- Visiting these routes in a private/incognito window still succeeds (no auth flow).

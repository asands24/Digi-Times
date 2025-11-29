# DigiTimes Front Page Studio

Craft rich newspaper-style coverage from your everyday photos in minutes. Upload an image, jot down the angle you want to highlight, and DigiTimes generates a headline, story, dateline, and pull quote worthy of the front page.

## Highlights

- **Photo-to-Story Pipeline** – Drop in one or many images and receive fully written kid-friendly feature articles tuned to your prompt.
- **Kid-Friendly AI Generation** – Uses OpenAI's cheapest models (o3-mini, gpt-4o-mini) with carefully crafted prompts to ensure appropriate, positive content for ages 7-12.
- **Editorial Tone Blends** – Smart heuristics adjust tone for celebrations, adventures, community events, or quiet spotlights.
- **Story Archive** – Save generated features with their images to Supabase, edit visibility, and maintain a timestamped history.
- **Share & Print** – Share individual stories via public links (`/read/:id`) or build a printable newspaper layout (`/newspaper`) with multiple stories.
- **Production-Ready UX** – Comprehensive loading states, error handling, accessibility features, and first-time user onboarding.
- **Public Template Gallery** – Browse shared templates at `/templates` with no authentication required.
- **Robust Supabase Integration** – Uses direct REST API calls for reliability and performance.

## Quick Start

```bash
npm install
npm start
```

Open http://localhost:3000 to launch the studio.

## How It Works

DigiTimes follows a simple, delightful workflow designed for families:

1. **Write a Story Idea** – Enter a prompt describing what you want to cover (e.g., "Sunset picnic celebrating grandma's 80th birthday").
2. **Add Photos** – Upload images from your device or take new photos with your camera.
3. **Generate Articles** – Click "Generate article" to create a kid-friendly newspaper story using AI.
4. **Save to Archive** – Stories are saved to your personal archive in Supabase with images stored in secure cloud storage.
5. **Share Stories** – Mark stories as public and share them via clean, printable links (`/read/:id`).
6. **Build Your Newspaper** – Select multiple stories and create a beautiful printable newspaper layout (`/newspaper`).
7. **Print & Enjoy** – Print your newspaper or export your stories for safekeeping.

## Public Pages

- `/templates` – Lists the 50 most recent public templates (`is_public = true`) from Supabase.
- `/upload` – Anonymous uploader that writes images to the `photos` bucket under the `public/` prefix.
- `/gallery` – Renders a responsive grid of publicly uploaded images.
- `/issues` – Manage your saved newspaper editions.

These routes work in incognito mode once the Supabase SQL policies in `SUPABASE_SETUP.md` are applied (public read on `public.templates` and the `photos` bucket).

## Scripts

- `npm start` – Run the development server with hot reload.
- `npm run build` – Create a production build of the single-page app.
- `npm test` – Execute Jest in watch mode.
- `npm run clean` – Remove build artifacts, coverage output, and stray OS files (`--all` also drops `node_modules`).

## Tech Stack

- **React 18 + TypeScript** – Core UI and state management.
- **Lucide Icons** – Newsroom-inspired iconography.
- **React Hot Toast** – Inline notifications with editorial styling.
- **Custom Styling** – Tailored newspaper aesthetic in `src/index.css`.
- **Supabase REST API** – Direct API integration for reliable data operations.

## Supabase Architecture

DigiTimes uses a **Raw REST API** approach for all Supabase interactions to ensure reliability and performance:

### Centralized REST Helper (`src/lib/supaRest.ts`)
- **`getAccessToken()`** – Retrieves auth tokens directly from `localStorage`, bypassing potentially slow client calls.
- **`supaRest()`** – Generic helper for authenticated REST requests to Supabase.

### Key Features
- **File Uploads** – Uses `XMLHttpRequest` for image uploads with real-time progress tracking.
- **Database Operations** – All `SELECT`, `INSERT`, and `UPDATE` operations use the REST API.
- **Authentication** – Token-based auth with automatic `localStorage` fallback.
- **Optimistic Updates** – Immediate UI feedback for actions like story deletion.

### Configuration
Set these environment variables in `.env.local` (development) or Netlify (production):
- `REACT_APP_SUPABASE_URL` – Your Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY` – Your Supabase anonymous key

## Story Generation Pipeline

DigiTimes uses a cost-effective, kid-safe AI pipeline with automatic fallback:

### Primary Path: OpenAI (Cheapest Models)
- Generate/Regenerate actions in `src/components/EventBuilder.tsx` call `generateStoryFromPrompt()` from `src/utils/storyGenerator.ts`
- This POSTs to `/.netlify/functions/generateStory`, a Netlify serverless function
- The function tries models in order of cost-effectiveness: **o3-mini** → **gpt-4o-mini**
- Each model receives a carefully crafted system prompt enforcing:
  - **Kid-friendly tone** (ages 7-12)
  - **Newspaper structure** (headline, 2-4 paragraphs, who/what/where/why)
  - **Simple, positive language**
  - **No scary, violent, or adult content**
- Returns `{ headline, article }` JSON for the client to display

### Fallback Path: Local Generator
- If OpenAI fails (network error, timeout, rate limit), the app automatically falls back to a local story generator
- The fallback maintains the same kid-friendly tone and newspaper structure
- Users see no disruption—generation continues seamlessly
- Browser logs: `[DigiTimes] Story generation failed, using local article`

### Configuration
- **Production:** Set `OPENAI_API_KEY` in Netlify → Site settings → Environment variables
- **Local Development:** Add `OPENAI_API_KEY` to `.env.local` for testing with Netlify CLI
- **Cost Control:** The pipeline uses only the cheapest available OpenAI models to minimize API costs

## Public vs Private Stories

Every story in DigiTimes has an `is_public` flag that controls visibility:

- **Public Stories** (`is_public = true`):
  - Accessible to anyone via `/read/:id` share links
  - No authentication required to view
  - Perfect for sharing with family and friends
  - RLS policies allow anonymous SELECT queries

- **Private Stories** (`is_public = false`, default):
  - Only visible to the story creator (matched by `user_id`)
  - Attempting to access via `/read/:id` shows "This story is not available"
  - Protected by Row Level Security (RLS) policies in Supabase
  - Ideal for drafts or personal memories

Users can toggle visibility with the "Public" checkbox in the Story Archive component. Share links are automatically generated when stories are marked public.

## Newspaper Issues

Users can save their newspaper layouts as "Issues":
- **Create Issue**: Select stories in the Story Archive and click "Build Newspaper". In the newspaper view, click "Save Issue".
- **View Issues**: Access your saved editions via the "View Issues" button in the Story Archive or at `/issues`.
- **Manage**: Delete old issues to keep your library clean.

## Development

### Environment Variables
Required for local development (`.env.local`):
```
REACT_APP_SUPABASE_URL=https://<ref>.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<public anon key>
OPENAI_API_KEY=<your openai key>
```

### Smoke Tests
Run automated tests to verify core functionality:
```bash
npm run smoke:archive  # Test story archiving
npm run smoke:story    # Test story creation
npm run smoke:newspaper # Test newspaper compilation
```

Required environment variables for smoke tests:
- `SMOKE_TEST_EMAIL` – Test user email
- `SMOKE_TEST_PASSWORD` – Test user password

## Deployment

DigiTimes is optimized for Netlify deployment:

1. **Connect Repository** – Link your GitHub repo to Netlify
2. **Set Environment Variables** – Add all required env vars in Netlify settings
3. **Deploy** – Netlify automatically builds and deploys on push to main

See `DEPLOYMENT.md` for detailed deployment instructions.

## Acceptance Checklist

- `/templates` renders public rows and handles empty/error states without crashing.
- `/upload` accepts JPG/PNG/WebP images under 10 MB and returns a public URL.
- `/gallery` displays files stored under `photos/public/*` with anonymous access.
- Visiting these routes in a private/incognito window still succeeds (no auth flow).
- Story creation, saving, and display work reliably.
- Newspaper compilation loads multiple stories correctly.


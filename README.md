# DigiTimes Front Page Studio

Craft rich newspaper-style coverage from your everyday photos in minutes. Upload an image, jot down the angle you want to highlight, and DigiTimes generates a headline, story, dateline, and pull quote worthy of the front page.

## Highlights

- **Photo-to-Story Pipeline** – Drop in one or many images and receive fully written feature articles tuned to your prompt.
- **Editorial Tone Blends** – Smart heuristics adjust tone for celebrations, adventures, community events, or quiet spotlights.
- **Local Story Archive** – Save generated features with their images, edit the copy later, and keep a timestamped history.
- **Print & Export Ready** – Open a print-perfect layout or export the full archive as JSON for safekeeping.
- **Offline Friendly** – All generation and storage happen locally; no Supabase credentials are required for the newsroom workflow.

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

# Photo and grounded-story workflow audit

Feature branch: `codex/photo-grounded-stories`. No production deployment or migration was performed.

## Root causes and changes

| Workflow | Previous behavior / root cause | Change |
| --- | --- | --- |
| Selection and editing | Each entry had a single `file` and `previewUrl`; multiple selections became unrelated single-photo stories. | Entries can hold ordered photos; combine selections into one story, explicitly exclude photos, and keep facts and files through regeneration. Up to 20 photos per story. |
| Upload and save | `persistStory` uploaded one file and stored only `image_path`; fixed timestamp paths could collide. A failed save could repeat successful uploads. | Validate JPEG/PNG/WebP/GIF, 10 MB each; authenticated ordered uploads with UUID paths, aggregate progress and per-photo errors. Reuse successful paths during a retry in the same draft/account. Write the archive only after every included upload succeeds. |
| Reopening | Archive types and newspaper reads only carried the legacy image field. | Store ordered original paths in `images`; normalize both new metadata and legacy `image_path`. Reopening resolves storage references rather than temporary browser URLs. |
| AI | Requests contained text, not photo bytes. The text-only first model could not see uploaded photos; local generation invented names, places, events and quotes. The client also substituted a locally generated headline. | Send bounded resized image data as actual `image_url` content to gpt-4o-mini. First extract indexed visible observations, then draft from observations and separate user facts. Use the returned headline. Return questions for missing context; failure produces an explicitly labelled factual starter. Remove fictional fallback generation. |
| Layout and templates | One hero image was rendered by story readers, templates and edition layout. Additional photos had no representation. Fixed cover styles cropped images. | Shared photo normalization feeds readers, templates and newspaper blocks. Append missing template photos in order; preserve aspect ratio. Choose portrait slots and paired landscape rows; advance columns/pages to keep all content. |
| PDF | Image readiness and invalid dimensions were not consistently enforced; preview/export could proceed before a complete photo set loaded. | Preload all required images, recover dimensions, block print/download while loading or on error, provide retry. PDF rejects failed/zero-sized images. The same measured blocks drive preview, print and PDF. |

## Security and compatibility

The API key remains in the Netlify function environment. Vision requests accept bounded image data with MIME/signature validation, not arbitrary remote URLs. No private prompts/images or raw SDK errors are logged. Original uploaded files are retained; only the AI copy is resized. Authentication, story ownership filters, private-by-default story writes, sanitization and template iframe sandbox remain in place. Anonymous trial generation remains available as before.

The migration validates that every new stored path belongs to `stories/<created_by>/`. It changes no grants or RLS policies. Existing storage access policy is preserved; this work does not make the existing public storage bucket private. Archive privacy continues to depend on established story authorization; avoid treating a public-bucket URL as a secret access boundary.

## Setup and release requirements

1. Review and apply `supabase/migrations/20261008_story_photos.sql` in an approved staging environment first, then production only with approval. It adds `story_archives.images` JSONB, validation and a trigger; keeps `image_path`; reloads PostgREST schema. Existing rows use an empty array and retain legacy images.
2. Set server-only `OPENAI_API_KEY` in Netlify. No new frontend secret is needed. Restore provider quota before a live vision acceptance check.
3. On staging, save/reopen five-photo and ten-photo editions under designated test accounts, verify unauthorized account isolation, then export. Do not run live smoke writes against production as verification.
4. Apply the migration before deploying the client. If missing, saves fail clearly while retaining the draft and successful upload references for retry. Closing the draft before retry loses the in-memory retry cache; storage objects are not deleted automatically.

Rollback: redeploy the previous client/function versions. Keep the additive images column and photo objects; do not drop data. The previous client shows only the legacy first photo. Restore this feature version to recover full display. No production rollback was necessary during this work.

## Verification

- Baseline: 24 suites / 68 tests passed. No baseline failures.
- Final checks: 25 suites / 80 tests passed; production build passed. The existing large-bundle warning remains.
- Regression coverage includes 1/5/10 ordered photos, mixed portrait/landscape pagination, five-photo grouping, exclusions, fact-preserving regeneration, authenticated uploads, partial retry, database retry, upload timeout, saved JSON reopening, vision content parts, invalid image rejection and image-load timeout.
- Actual PDF generation using repository fixtures was inspected with pypdf and rendered with Poppler: 10 image placements across 3 pages, with aspect ratios preserved. An automated test also counts all ten native PDF placements.
- Browser desktop and 393 px mobile fixture preview displayed ten loaded photos; mobile document width stayed within the viewport. Screenshots were retained. The newspaper intentionally scrolls within its viewer for readable full-size page typography.
- The browser five-photo file chooser failed in automation. Editor interactions are covered by automated tests, but physical-device/file-picker verification remains outstanding. A browser download click showed no error; the resulting browser file was not captured. Native PDF artifact generation was verified separately.
- A live limited-context vision request encountered provider rate-limit/quota and returned a labelled factual fallback. Live photo recognition accuracy remains unverified; mock tests verify request construction and grounding separation, not real-model accuracy.
- No live database writes/migration checks were performed. Saved JSON tests are not live save/reload integration tests. AI descriptions still require human review; prompts cannot guarantee a model never makes an incorrect visual inference.
- Existing reduced-motion CSS covers the changed editor animation; new photo controls use native labels/checkboxes and buttons. Dedicated keyboard-only and physical-device acceptance checks remain outstanding.

This branch also includes the previously committed template experience improvement (`87d4d4d`), which is not yet present on remote main.

## Follow-up: reuse saved memories

The studio previously offered only new uploads. Library checkboxes could reuse stories, but the next action was easy to miss. The separate library export shortcut used a text-only popup and omitted photos.

- **Fresh article:** Create → Choose saved photos → select in desired order → Use photos. Existing confirmed facts accompany the photos; originals and saved stories remain intact. Combine photos as needed before generating. The picker loads saved story photos in pages and deduplicates repeated references; legacy single-photo stories are supported.
- **Another issue with existing articles:** Library → Add to this issue → Preview selected issue → save under a new title. Selection order leads the front page, and search retains selections. Untitled saved stories can be included. Photos/stories can appear in multiple issues.
- Saved originals are fetched for vision analysis, but saves reuse their original storage paths instead of uploading duplicates. Mixed saved/new photos keep their order. Account-scoped validation rejects another account's paths; the existing migration also checks stored ownership.
- Import failures retain selection and all studio drafts. Cancelling aborts pending photo fetches; late results cannot add photos. Switching accounts closes the picker and releases drafts. Library links open a new tab when necessary to preserve existing drafts. Dialog Escape/focus restoration is covered by regression tests.
- Library Preview & export now uses the same complete newspaper flow as issue creation, including photo loading, pagination and PDF export. No popup or text-only export remains.
- Desktop (1280 px) and mobile (393 px) studio entry points were checked in-browser without outer overflow. The browser was signed out, so live authenticated library import/save was not exercised. Picker interaction, ordering, retries, cancellation, account changes and original-path persistence are tested with fixtures.

No additional database migration or environment variable is needed for this follow-up beyond the multi-photo migration above. Raw storage objects not attached to saved stories are not shown by this picker.

Follow-up validation: all 90 tests across 26 suites passed; the production build passed with the existing large-chunk warning. The new focus restoration test caught a real dialog-close focus issue, which was fixed using the studio trigger reference. Combining reused photos preserves distinct saved facts alongside the current story idea. Focused mixed-photo and grouping tests were rerun after that final adjustment.

# DigiTimes improvement pass

Branch: `fun/digitimes-next-level`. Changes are local and uncommitted. A draft Netlify preview was deployed; the production frontend is unchanged. After explicit user approval, the atomic-save function was applied to Supabase and verified with live tests. The pre-existing untracked image in `src/assets/` was left untouched.

## What changed

- Warmer newsprint styling, Playfair headlines with Georgia fallbacks, Georgia article text, system sans UI, framed photographs, drop caps, reduced-motion support, and responsive navigation.
- Visible Upload → Describe → Generate → Review → Save progress; photo drop area and camera input remain available when adding more memories. Loading cards now appear during generation, with rotating newsroom copy.
- Fixed unresolved local-generator copy placeholders and removed duplicate headlines from the fallback article body. Offline copy now preserves the complete supplied moment and invites editing instead of fabricating witness reporting.
- Accessible headline and article editors; a live newspaper view reflects edits and the selected template’s edition theme. Saved previews offer a sandboxed original-template view, preserving custom HTML/CSS without styling the host app.
- Saves guard against duplicate clicks and blank copy, retain failed drafts, refresh the main library, show a success toast, and offer “Add to Newspaper.” Anonymous users can create/edit and sign in in another tab without deliberately navigating away from their draft.
- Searchable memory library, skeleton loading cards, clearer privacy/reading metadata, lazy thumbnails, explicit story selection, and selection-order preservation through filters. With no selection, Build Newspaper continues to use the visible eligible stories.
- Existing saved issues retained; issue titles now reopen correctly. Newspaper titles can be edited before saving, every section keeps its full article, and photos also appear in the bottom section. Print, PDF export, and public-edition link actions remain available. A share review lists story privacy and blocks copying private or incomplete editions.
- Signed-out and failed-load issue states now have useful next steps. Issue actions are visible on touch devices.
- Public stories use the same paper presentation; Print / Download opens the paginated public edition reader.
- Plans preview at `/pricing`: Free, Family Plan, Lifetime Early Access, and five template-pack concepts. No checkout, quota enforcement, or entitlement restrictions were added.

## Security and architecture

Supabase REST requests and authenticated XHR upload/progress remain the transport architecture. Two detail-loading paths that still used the Supabase query builder were moved onto the existing REST helpers with ownership filtering. Production CSP keeps scripts self-only; the development server uses a development-only nonce for Vite refresh. User-edited paragraph text is escaped before constructing HTML; article and template HTML are sanitized. Original template CSS is confined to an iframe with no sandbox permissions and a restrictive document CSP. The legacy export document now sanitizes article HTML, escapes headlines, opens synchronously during the click, and clears its opener.

No environment/credential files were modified.

## New components and data

- `src/components/CreationSteps.tsx`: accessible progress indicator.
- `src/components/StoryPaper.tsx`: reusable newspaper view used by draft, library, and public-story previews.
- `src/pages/PricingPage.tsx`: future plans preview.
- New history and issue-selection regression tests.
- No new data file. `src/data/historicalEvents.ts` was replaced with 24 sourced, positive milestones, with at least two in each month. Exact-day matches are never fabricated. Missing/partial date coverage is explicitly labeled as monthly history, and monthly items include their actual dates. Theme preference is deterministic.

History reference sources: [National Park Service anniversaries](https://home.nps.gov/subjects/npscelebrates/park-anniversaries.htm), [Smithsonian panda arrival](https://siarchives.si.edu/history/this-day-smithsonian-history/april-16), and NASA mission/history pages linked on the individual data records. These links are editorial metadata; history requires no API call.

## Validation

- `npx tsc --noEmit`: passed.
- `npm run build`: passed with Vite; one large main-bundle warning remains.
- `npm test -- --runInBand`: 20 suites / 48 tests passed after release hardening.
- `git diff --check`: passed.
- Desktop homepage and 390px mobile homepage/plans were visually reviewed in the local browser. Signed-out issue navigation was checked. Real test-account sign-in, JPEG storage upload/download, private story denial, public publishing, anonymous access and share revocation passed against Supabase. A deployed anonymous edition with the uploaded JPEG was reviewed in the browser.

The initial baseline had a missing `@testing-library/dom` peer dependency, stale builder/preview/upload test contracts, incomplete story fixtures, and missing test TextEncoder/TextDecoder globals. These were repaired rather than weakening production typechecking. Upload tests now cover authenticated XHR + REST and ensure failed uploads cannot insert a story record. Additional tests verify escaped print content, template sanitization/sandboxing, honest date fallback, and selected issue order.

## Manual acceptance checklist

1. Sign in with a test account; upload JPG/PNG/WebP and a camera photo. Try multiple photos, a file over 10 MB, a rejected non-image, and drag/drop.
2. Describe the moment, select each template, generate, edit names/headline/body, preview, rewrite, and remove drafts. Verify fallback generation with the Netlify function unavailable, and live AI through a Netlify dev/deployed environment.
3. Save; confirm upload progress, one saved record, photo, template, private default, success toast, refreshed library, and the Add to Newspaper link. Simulate a failed save and verify the draft remains.
4. While signed out, create a draft, sign in in the offered new tab, return and save. Verify the provider updates the original tab’s authentication.
5. Search/filter/sort, select stories in a deliberate order, change filters, build an issue, and verify the first selected story is the lead. Test pagination and retry after a network failure.
6. Preview a saved story with and without a template. Check original template HTML/CSS in its iframe and Close/Escape/focus restoration.
7. Name and save an issue, reopen from Issues, verify title/order/articles/photos, then print at A4 and Letter and export a multi-page PDF. Check photos and text aren’t clipped. Test long headlines and landscape/portrait photos.
8. Confirm private stories cannot be read anonymously; toggle a test story public, share its `/s/:slug` URL, open in incognito, print, then revoke sharing. Test missing/private/deleted links.
9. Verify edition links only copy when all stories are public. Open the copied link in incognito. The `/edition` reader must work without sign-in, including when the rest of the app requires login; private stories must stay inaccessible even to their owner on this public reader.
10. Verify history on exact-match dates, dates without matches, and leap day. Toggle history in an issue. Check all pages at 390px and on an actual iPhone, keyboard-only navigation, and reduced-motion preferences.

## Known limitations / follow-up work

- Test-account auth and Supabase RLS/storage were exercised with synthetic records. The deployed generation endpoint returned an article; source verification is tracked in the release section below. Native camera/share sheets, actual printer output and a physical iPhone remain manual device acceptance checks.
- History intentionally has a small archive (24 records, mainly nature and exploration), not 365-day exact-date coverage. Monthly fallback is labeled honestly. It uses the saved story creation date or today; a separate user-editable memory date needs a schema decision.
- Saved issues preserve paper size, history visibility and edition date in versioned metadata in the existing description field, alongside the title/story membership. Old free-text descriptions are retained, and old issues default to A4 with history and their creation date. The original template view preserves stored HTML/CSS; the edition uses a standard printable layout.
- Drafts and issue selections remain in memory, so a page refresh discards unsaved work. Local draft recovery is a recommended next feature.
- Issue saves now use one SECURITY INVOKER RPC with ownership validation, ordered membership and stable retry IDs. The migration is installed and verified against the live test account, including save/reopen, retry deduplication and rollback on membership failure.
- Direct PDF download uses selectable Times text and embedded photos. Its core fonts cover Latin and common smart punctuation; unsupported scripts/emoji produce a clear Print / Save PDF fallback instead of a damaged download. Browser print uses available browser fonts. Physical printer output and cross-browser download behavior still need staging checks.
- CRA was replaced by Vite, vulnerable dependencies upgraded and the Capacitor/Xcode UUID dependency patched with a scoped override. The final npm audit reports zero vulnerabilities. Node 22.12+ is required.

## Next fun features

- Autosaved draft recovery and a real memory-date picker.
- A family masthead editor, edition cover themes, and drag-to-reorder stories.
- Year-in-review annuals, birthday editions, and grandparents’ delivery packs.
- A richer worldwide history archive with kid-friendly culture and seasonal milestones.
- Private family sharing/invites before any payment rollout.

## Files changed

- `docs/DIGITIMES_NEXT_LEVEL.md`
- `package-lock.json`
- `package.json`
- `src/App.tsx`
- `src/__tests__/archive.flow.test.tsx`
- `src/__tests__/header-auth.spec.tsx`
- `src/__tests__/historicalEvents.test.ts`
- `src/__tests__/issue.selection.test.tsx`
- `src/__tests__/persistStory.upload.test.tsx`
- `src/__tests__/preview.safety.test.tsx`
- `src/__tests__/print.spec.tsx`
- `src/__tests__/publicAccess.test.tsx`
- `src/__tests__/route.login.test.tsx`
- `src/__tests__/templates.fallback.test.ts`
- `src/__tests__/templates.fetch.test.ts`
- `src/components/CreationSteps.tsx`
- `src/components/EventBuilder.tsx`
- `src/components/Header.tsx`
- `src/components/IssuesList.tsx`
- `src/components/OnThisDayBox.tsx`
- `src/components/OnboardingBanner.tsx`
- `src/components/StoryArchive.tsx`
- `src/components/StoryPaper.tsx`
- `src/components/StoryPreviewDialog.tsx`
- `src/components/builder/PhotoUploader.tsx`
- `src/components/builder/StoryPromptInput.tsx`
- `src/components/builder/StoryReview.tsx`
- `src/data/historicalEvents.ts`
- `src/hooks/useStoryLibrary.ts`
- `src/index.css`
- `src/lib/storiesApi.ts`
- `src/pages/NewspaperPage.tsx`
- `src/pages/PricingPage.tsx`
- `src/pages/PublicStoryPage.tsx`
- `src/setupTests.ts`
- `src/utils/storyGenerator.test.ts`
- `src/utils/storyGenerator.ts`

## Newspaper export and sharing follow-up

- Replaced the tall screenshot/sliced PDF with one measured A4/US Letter layout shared by the page preview, browser print and direct PDF renderer. Whole photos retain their aspect ratio; complete story paragraphs flow across columns/pages with continuation headings, repeated mastheads and page numbers. The lead remains the first selected story. Browser print has explicit page sizes, internal safe margins and page breaks; the old overflowing 200mm print grid is gone.
- Wait for loaded photos/fonts before print/download, with bounded photo loading and actionable errors. Direct PDF text stays sharp and selectable. Other scripts/emoji use browser print, with browser font measurement for those lines.
- Share review explains who can read a link and shows each story's public/private status. No story is made public automatically. Incomplete/private editions cannot be copied. `/edition` shares title, selected order, paper size, date and history preference and is available without login. Its REST query and rendering filter require public stories even when the reader is the signed-in owner. Links show later story edits; PDFs preserve the exported copy.
- Save/reopen edition preferences using versioned metadata in the existing issue description field, without a schema migration. Issue-list cards display friendly copy rather than internal metadata. Query changes reset edition preferences and invalidate stale in-flight loads.
- `src/lib/newspaperLayout.ts`, `src/components/EditionPaper.tsx`, and the rewritten `src/lib/pdfExport.tsx` implement the shared layout/export. `src/pages/DebugNewspaper.tsx` at `/debug/newspaper` is a development-only fictional long-edition regression fixture; its sample data never touches saved stories.
- Added layout and sharing regressions: complete long-story text on A4/Letter, page bounds, native PDF page count/text, uncropped photo boxes, story order, sanitized content, metadata round trip, missing photos/unsupported character errors, public reader privacy, incomplete-edition sharing, saved settings and signed-out reader access in login-required mode.
- Final validation: 38 tests / 16 suites, TypeScript, CI production build and whitespace checks pass. Browser preview reviewed at desktop and 390px (horizontal scrolling stays inside the paper, without whole-page overflow). All six sample PDF pages were rendered with Poppler and inspected. PDF text extraction verifies all 22 numbered sample memories, the lead/final story and labeled monthly history in both sizes.
- The in-app browser did not surface a completion event for its blob download. Generated sample files were therefore verified directly through the same production PDF renderer, including the bundled JPEG. Native print dialogs remain a manual device check. Authenticated atomic issue saves and reopening passed live. Real storage photos and anonymous recipient rendering passed in the deployed preview.

## Production release hardening

- Build: Vite 8, Node 22, TypeScript 5.9, jsPDF 4, React Router 7; preserved build/ for Netlify and Capacitor. JSX sources use .jsx extensions. Tests use Jest 30/SWC with a project-local native cache.
- Security: browser configuration is explicitly whitelisted; built assets were checked for server keys and smoke credentials. Production keeps script-src self and excludes development debug fixtures. Public social metadata escapes all HTML-sensitive characters and replaces default tags so crawlers see the correct story.
- Delivery: restored the service-worker script with network-first shell/assets caching only and revalidation headers. API/auth/photo responses are excluded. Corrected the stale local Netlify site link to the site whose repository is asands24/Digi-Times.
- Reliability: additive migration supabase/migrations/20261001_atomic_issue_save.sql supplies one atomic issue+membership transaction under existing RLS, validates ownership and deduplicates response-loss retries. Frontend never falls back to unsafe partial saves. Publishing preserves existing recipient slugs and uses UUIDs for new links; failed visibility writes are reported.
- CI: GitHub workflow installs the lockfile, checks types/tests/build and fails on dependency advisories. npm run smoke:release uses the configured test account, real JPEG and synthetic stories; it cleans only generated records/uploads. Use --skip-issues only before the RPC is installed.
- Verification: 48 tests / 20 suites, TypeScript/build, zero-vulnerability audit, whitespace check, production CSP/script/service-worker checks, real auth/storage/public/private/revocation checks, anonymous browser recipient/photo rendering, and deployed public-story metadata passed. Direct browser PDF action displayed success, but the in-app download API did not expose a file path. The actual renderer regenerated three-page A4 and Letter sample PDFs after the dependency upgrade.
- Database release gate resolved: the user explicitly approved Supabase administrator access. The migration passed rollback-only tests, including a forced membership failure after parent creation, preserved order, idempotent retries, mismatched retry rejection and another-owner story rejection. It was then installed using the official Supabase Management API. Live REST checks passed real JPEG upload, sharing/revocation, atomic save, reopening metadata/full stories/order, deduplicated retry, rejected saves without orphan issues and anonymous save denial. Synthetic rows/uploads were cleaned up. SECURITY INVOKER, empty search_path and restricted execution privileges were confirmed; the rollback test trigger is absent. Existing stories/RLS policies and the production frontend were not changed.

### Final live-generation result

The deployed endpoint returns a usable, explicitly identified local fallback. OpenAI returned a quota/rate-limit error despite a configured server-function key. The handler now reports safe failure categories, never logs raw SDK request errors, avoids retries on insufficient quota and clears completed timeout timers. Tests cover AI success and the honest quota fallback. The live response is HTTP 429 (rate limit or quota); the exact account limit remains unresolved. No billing/account settings were changed, and live AI success is not claimed.

Final draft preview: https://6abdcc0881ca7e38a0d4a483--digi-times.netlify.app (production unchanged). Synthetic test stories and storage photo were deleted after the checks; the test edition URLs no longer contain those records.

The remaining live-service issue is OpenAI HTTP 429 (rate limit or quota), with a working local generation fallback. No further Supabase approval is pending.

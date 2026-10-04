# Editorial motion integration

Date: October 4, 2026. Feature branch: `codex/editorial-motion`.

## Preservation and conflict resolution

Existing application changes were snapshotted in commit `1168bc5` on `codex/digitimes-preserved-baseline`. The original `fun/digitimes-next-level` branch ref was not rewritten. Existing environment files, the local Netlify site link, generated Netlify/Deno artifacts, and the attached patch package remain outside the motion commit.

GitHub rejected publication of the snapshot because the configured token lacks workflow scope for its new `.github/workflows/ci.yml`. The publishing base, `codex/digitimes-motion-base`, preserves the same application tree while excluding only that workflow. The draft PR targets this base to isolate motion from earlier work. The full snapshot and original motion commit remain on local preservation branches; the workflow also remains on disk. No remotely existing workflow was removed. Publishing the preserved workflow requires a credential with workflow permission.

Read the included patch README and repository README. No AGENTS.md instructions were found. Applied the supplied patch using Git three-way conflict handling, retaining the newer audited lockfile rather than its older lockfile edits. Resolved App, reader, creation/upload and test conflicts against the current implementation. Kept the public edition and plans routes, development-only export fixture, atomic issue saving, native text PDFs, private-story filtering, and existing print regressions.

## Final behavior

- Layered animated editorial cover, route fades, card reveals, floating mobile navigation and creation-stage motion without another animation dependency.
- Existing five-step upload/describe/generate/review/save feedback and post-save actions remain intact. Drag-and-drop and camera/file inputs retain their existing handlers.
- Centered desktop reader and mobile bottom sheet, with the accessible newspaper view and isolated original-template view. Template failure leaves the newspaper readable and offers retry.
- Full HTML sanitization, one-pass escaped template substitutions, escaped CSS style boundaries, restrictive iframe CSP and an empty sandbox. Private retained selections cannot be read by a different account.
- Radix handles focus, modal trapping, dismissal and scroll lock. Close/Escape restores the launch control. Print-layout navigation stays in the app. Motion respects reduced-motion preferences; reveals remain visible without IntersectionObserver or under reduced motion.
- Mobile hash destinations account for the existing wrapped header. Public recipient editions do not receive the mobile dock. Print styles remove the dock/decorative cover and reset reveal/route transforms.

## Validation

- Baseline: 20 suites / 48 tests pass; none of the attachment README's legacy failures reproduce in the current checkout.
- Integrated: 21 suites / 55 tests pass. Added reader safety/retry/race/privacy and reduced-motion navigation/reveal coverage; retained existing auth, uploads, generation, saving, sharing, printing and PDF tests.
- `npm ci` and `npm run build` pass. The existing large main-bundle warning remains. Development fixtures and the development CSP nonce are excluded from production assets.
- Live `npm run smoke:release` passes sign-in, real JPEG upload/download, private anonymous denial, public publishing/access/revocation, atomic edition save, ordered full-story reopening, edition settings, retry deduplication, failed-save orphan prevention and anonymous-save denial. Synthetic rows/uploads were cleaned up.
- Browser: desktop homepage and centered reader; 393px and 320px mobile layouts with no document-wide horizontal overflow; long 22-paragraph reader, loaded photo, original sandboxed template, keyboard Tab/Shift+Tab, Escape/focus restoration and mobile Create navigation. Used fictional development fixtures, not personal saved stories.
- Reduced-motion behavior verified with media-preference tests and the loaded stylesheet's reduced-motion rules. An OS-level browser preference toggle was not available in the browser tool.
- Physical camera/share sheets and printer dialogs were not exercised. No deploy command or merge was performed.

## Existing blockers

The clean install reports five high audit entries from the existing Tailwind 3 development dependency chain, originating in the newly reported braces stack-exhaustion advisory (`braces <=3.0.3`). The registry's latest braces is still 3.0.3; npm proposes a Tailwind 4 major upgrade. This patch adds no dependencies and preserves the current lockfile. `npm audit --omit=dev` reports zero findings, but the preserved full-audit CI gate will fail until the tooling advisory is resolved.

A fictional generation request to the existing draft returned a usable local fallback with `rate_limit_or_quota`. The provider issue predates this update; generation success/fallback regressions pass. No API key, billing, deployment or account setting was changed.

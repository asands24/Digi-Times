# Signed-in studio and batch saving

## Changes

Previously, Create and the generation function accepted signed-out visitors. The studio now redirects to sign-in, preserves the selected template in a validated local return destination, and returns authenticated users to Create. The generation function verifies the bearer token with Supabase Auth before processing photos or contacting AI; missing, expired and anonymous sessions are rejected. Authentication outages fail closed.

The callback now awaits the session detected by the Supabase client rather than incorrectly passing the entire URL to a second code exchange. The sign-in form precedes promotional content on mobile and desktop.

Creation guidance now appears at the relevant step. Users may keep one story per photo or combine photos, review drafts, then save all ready stories. Saves run sequentially with progress and duplicate-submit protection. Successful drafts leave the queue and become available together through Add to Newspaper; failed drafts retain their edits and retry controls. Account changes stop further queued saves and suppress results from the previous account. Existing single-story saves, saved-photo reuse and template selection remain available.

## Verification

- All 106 tests across 29 suites passed, including session enforcement, callback completion, signed-out routing, template journeys, draft preservation, full batch success, partial failure/retry, duplicate clicks and account changes.
- Production build and TypeScript passed. Existing bundle-size advisory remains; no performance improvement is claimed.
- Local browser: signed-out Create redirects to Login with its template destination; sign-in form checked at 393px and 1280px, without horizontal overflow; keyboard focus reaches the email form and policy links.
- Batch saving and authenticated navigation were tested with fixtures, not live production writes. Actual email delivery, a real authenticated AI request and live multi-story persistence still need a staging/account smoke check. No production stories or emails were created during verification.

## Configuration and release

No database migration is required. Netlify Functions must have SUPABASE_URL and SUPABASE_ANON_KEY (the existing REACT_APP_ or NEXT_PUBLIC_ equivalents are also supported). The anon key is the public project key, not a service-role credential. AI credentials remain server-only. Ensure Supabase permits the app's /auth/callback redirect including its next query parameter. The standard client URL detection completes magic-link sign-in.

Review and merge the feature PR only when ready. No deployment was performed. Rollback is a revert of this feature commit; it changes no saved-data schema. Reverting also restores the prior unsigned generation access, so prefer a targeted follow-up if only the UI needs adjustment.

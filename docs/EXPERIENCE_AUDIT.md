# DigiTimes experience audit

October 4, 2026 · branch `codex/experience-audit` · based on merged main `46ad31c`.

## Template workflow revision — October 5, 2026

The previous Templates page only highlighted cards and could not transfer a choice to the studio. Its backend query also failed against the deployed legacy schema (missing slug/html/css columns), while the old view included a private system draft. The catalog now queries explicitly public template rows, tolerates legacy fields, and keeps seven built-in editorial layouts available. Queries time out after ten seconds; catalog failures retain the local collection.

Search, sandboxed sample previews, and explicit Use actions lead to `/create?template=…`. The persistent studio loads that choice, allows layout changes before upload and after generation, and keeps photo/text edits intact. Late catalog responses cannot replace a deliberate selection. Invalid links provide a recoverable chooser. One sanitized document renderer powers template previews, generated draft previews, saved readers, and shared story layouts; scripts remain prohibited by iframe sandbox and CSP. Accessible reading views remain available, and shared-page browser printing uses the full readable article. Combined newspapers retain their measured print/PDF layout, as stated in the chooser.

Validation: 24 suites / 68 tests pass, including the selection → creation → edited preview → layout change → save journey, keyboard Escape/focus restoration, invalid links, late catalog responses, and saved-template reopening. Production build/typecheck and whitespace checks pass. Live Supabase checks confirm built-in template IDs persist, real photo upload/download, private access denial, public sharing/revocation, and atomic ordered edition saving/reopening; synthetic data is cleaned up. Existing Vite bundle-size warning remains.

Visual desktop/mobile checks for this revision could not run. Browser access was first rejected by automatic approval review due to an account usage limit; on continuation, the preview error page was rejected because its protocol is blocked. No browser-policy workaround was attempted. Responsive/reduced-motion rules were reviewed in code; fresh visual verification remains pending.

## Navigation revision

Following feedback that Create should not be a homepage scroll destination, the app now has dedicated `/create` and `/library` pages. Home contains the introduction and next-step links. Header, compact menu, and mobile dock share the same primary destinations: Home, Create, Library, Templates, Issues. Photo gallery and Plans are secondary destinations under More. Old `/#create-story`, `/#my-stories`, and `/#story-library` bookmarks redirect to their new pages.

The studio mounts on its first visit and stays mounted but hidden when browsing other pages. Photos, descriptions, chosen templates, and edits survive in-app navigation; hidden content is excluded from layout, focus, and accessibility. Signed-in drafts are released on sign-out or account change, while an anonymous trial is kept when its creator signs in. A late save response cannot show a previous account's saved-story action. Reload/close prompts protect unfinished drafts; persistence across browser sessions is not implemented. Library data loads when the Library page opens, including after a confirmed save.

Validation for this revision: 23 suites / 64 tests pass, production build/typecheck and whitespace checks pass. Browser checks cover separate desktop destinations, local photo/description retention through Templates and back, 393 px and 320 px mobile layouts with no horizontal overflow, and keyboard menu opening, Escape and restored focus. No production story data was changed. The initial JS bundle remains about 43% smaller than the pre-audit baseline. Existing bundle-size warning and development dependency/provider limitations remain.

The sections below record the initial audit before this route restructuring.

## Scope and reference

Reviewed the current homepage, navigation, creation components, saved-story library, edition entry points, and reader. Read the repository and motion-package READMEs. No AGENTS.md instructions were present. The user referenced a video and an anchor website, but neither link was included or found in the supplied package. Requested those links; exact reference matching remains pending. These changes continue the existing warm newsprint, navy/gold, layered cover, and floating navigation direction.

## Findings addressed

| Finding | Change |
| --- | --- |
| Saved stories did not automatically refresh the homepage library | Connected the builder's confirmed-save callback to the visible library refresh. |
| Post-save and empty-issue CTAs pointed to nonexistent `#story-library` | Both now lead to `#my-stories`. |
| Mobile dock omitted the core library flow | Added Library and Issues; photos remain available through the compact navigation menu. |
| Create navigation opened the top of the homepage | Header Create links to the studio; repeated section clicks scroll correctly, respect reduced motion, and keep navigation active state accurate. |
| Tablet/phone header duplicated the dock and wrapped into rows | Compact keyboard-accessible Radix menu replaces the header link row; all routes remain available. |
| Template and photo routes lacked the shared header | Added the header to both routes; new-page navigation resets scroll position while section destinations retain their anchors. |
| Signed-out/empty libraries displayed filters and disabled exports | Contextual sign-in/create actions replace unused controls; search, filters, and exports remain available for populated libraries. |
| Pagination contained a duplicate selection banner and nested button | Removed the duplicate; pagination shows its loading state even when existing stories remain visible. |
| Mixed ready/generating drafts showed the wrong progress stage | Generation takes priority over the review stage while a draft is being generated. |
| Paper cards/editor surfaces and typography were inconsistent | Rounded hero/editor/empty-state surfaces, clearer title hierarchy, aligned spacing, visible input focus, and comfortable touch targets. |
| Mobile upload actions were pushed down by repetitive introductory copy | Shorter creation/upload instructions and compact mobile headings; wrapping upload/camera buttons keep separate handlers. |
| Initial page downloaded newspaper/PDF machinery | Lazy-loaded newspaper and issue views with a visible loading state. Main JS decreases from 340.44 KB to 192.64 KB gzipped (about 43%); PDF/layout code loads when needed. |

## Validation

- Baseline: 21 suites / 55 tests pass. Final: 23 suites / 60 tests pass; no baseline failures. Added navigation, reduced-motion repeated clicks, pagination structure/loading, anonymous library, and homepage save-refresh regression checks.
- Production build/typecheck and diff whitespace checks pass. Main JavaScript remains over Vite's 500 KB warning threshold, although initial download is substantially smaller.
- Browser: desktop homepage; tablet 820 px; phones 393 px and 320 px. No horizontal document overflow at the checked widths. Phone section destination lands at about 92 px, below the 73 px header. Checked photo-menu navigation and page scroll reset.
- Reader: fictional development fixture opens, Tab moves from Close to Newspaper, Escape returns focus to the launcher. Existing reader safety, private ownership, auth, upload, generation fallback, save, sharing, and print/PDF regressions remain passing.
- Reduced motion is checked by tests and existing CSS rules; an OS-level preference switch was not available in browser tooling. Physical camera/share sheets and printer dialogs were not exercised. No production data was changed.

## Remaining work

- Need the video and anchor website URLs to compare composition, motion timing, typography, and interaction details against the actual references.
- Existing development dependency advisories and generation provider quota issue remain as documented in the previous editorial review; dependency/configuration/security policies were not changed in this UX pass.
- Drafts still live in the current studio tab. The navigation revision above now retains them across app pages and handles file/object-URL cleanup and account changes; browser-session persistence remains future work.
- Changes are on the feature branch. No push to main, merge, or deployment was performed.

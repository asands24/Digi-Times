# DigiTimes experience audit

October 4, 2026 · branch `codex/experience-audit` · based on merged main `46ad31c`.

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
- Drafts still live in the current studio tab; navigation away can discard unsaved drafts. Cross-route draft retention deserves a separate, carefully tested pass, including file/object-URL lifecycle and account boundaries.
- Changes are local to this feature branch. No push to main, merge, or deployment was performed.

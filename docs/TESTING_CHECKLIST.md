# DigiTimes Testing Checklist

This document provides a comprehensive testing checklist for all new features added to the DigiTimes application.

## Prerequisites

Before testing, ensure:
- [ ] Supabase RLS policies have been applied (see `MANUAL_RLS_SETUP.sql`)
- [ ] The application is running locally or deployed to staging
- [ ] You have test accounts for authenticated and anonymous testing
- [ ] The database has at least one public story and one private story

---

## Part 1: Public Story Reader (`/read/:id`)

### Anonymous User Access

**Setup:** Log out or use an incognito window

- [ ] Can access `/read/:id` for a **public** story without being forced to log in
- [ ] Story displays correctly with:
  - [ ] DigiTimes masthead
  - [ ] Story title/headline
  - [ ] Story image (if present)
  - [ ] Story article content
  - [ ] Creation date
  - [ ] "Created with DigiTimes" footer
- [ ] Loading state appears while story loads
- [ ] Error message displays appropriately when:
  - [ ] Accessing a **private** story (should show "This story is not available")
  - [ ] Invalid story ID (should show error message)
  - [ ] Network error (should show retry button)
- [ ] Retry button works correctly after error
- [ ] Page is mobile-responsive

### Authenticated User Access

**Setup:** Log in as a user with stories

- [ ] Logged-in user can view their own **private** stories via `/read/:id`
- [ ] Logged-in user can view **public** stories from other users
- [ ] Logged-in user sees appropriate error for private stories they don't own
- [ ] Opening a public story link does **NOT** log out the current user
- [ ] Navigation back to main app works correctly

### Share Link Behavior

- [ ] Sharing a link to `/read/:id` works correctly
- [ ] Recipient can open shared link without authentication (if story is public)
- [ ] Shared link displays story correctly on mobile devices
- [ ] Copy/paste of share URL works across different browsers

---

## Part 2: Share Button Functionality

### In StoryArchive Component

**Setup:** Navigate to the home page with archived stories

- [ ] "Public" checkbox appears for each story
- [ ] Checking "Public" successfully updates `is_public` to `true`
- [ ] Unchecking "Public" successfully updates `is_public` to `false`
- [ ] Toast notification confirms visibility change
- [ ] Share button appears only when story is marked as public
- [ ] Share button is hidden for sample/starter stories
- [ ] Clicking Share button:
  - [ ] On mobile with native share: Opens native share dialog
  - [ ] On desktop/browsers without native share: Copies URL to clipboard
  - [ ] Shows success toast: "Share link copied to clipboard!"
- [ ] Shared URL format is correct: `{origin}/read/{story-id}`
- [ ] Shared URL can be pasted and opened successfully

---

## Part 3: Build Newspaper Page (`/newspaper`)

### Newspaper Layout

**Setup:** Create multiple stories, then click "Build Newspaper"

- [ ] "Build Newspaper" button appears in StoryArchive header
- [ ] Button is disabled when no stories exist
- [ ] Button is enabled when at least one story exists
- [ ] Clicking button navigates to `/newspaper?ids=...`
- [ ] Newspaper page displays:
  - [ ] DigiTimes Gazette masthead
  - [ ] Current date and volume number
  - [ ] Print button (visible on screen, hidden in print)
- [ ] Lead story (first story):
  - [ ] Displays as large featured article
  - [ ] Shows headline
  - [ ] Shows image (if present)
  - [ ] Shows full article content
  - [ ] Uses 2-column layout for text
- [ ] Secondary stories:
  - [ ] Display in 2-column grid
  - [ ] Show headlines
  - [ ] Show images (if present)
  - [ ] Show article content
- [ ] Footer displays correctly

### Print Functionality

- [ ] Print button appears on screen
- [ ] Clicking Print button triggers print dialog
- [ ] Print preview shows:
  - [ ] Clean layout without controls/buttons
  - [ ] Black text on white background
  - [ ] Proper margins
  - [ ] No page breaks in middle of stories
  - [ ] Images sized appropriately (not too large)
  - [ ] Masthead and footer included
- [ ] Printed newspaper looks professional on:
  - [ ] Letter-size paper
  - [ ] A4 paper

### Edge Cases

- [ ] No story IDs in URL → Shows "No stories selected" error
- [ ] Invalid story IDs → Shows appropriate error message
- [ ] Mix of public and private stories:
  - [ ] Anonymous user sees only public stories
  - [ ] Authenticated user sees their own stories
- [ ] Single story → Displays as lead story only (no grid)
- [ ] Many stories (5+) → Grid layout works correctly
- [ ] Stories with no images → Layout still looks good
- [ ] Very long articles → Text flows correctly in columns

### Responsive Design

- [ ] Desktop (>1000px): Full 2-column grid layout
- [ ] Tablet (768-1000px): Responsive grid
- [ ] Mobile (<768px): Single-column layout

---

## Part 4: OpenAI Kid-Friendly Tone

### Generated Stories (via OpenAI)

**Setup:** Generate new stories using the story builder

- [ ] New stories use kid-friendly language
- [ ] Articles follow newspaper structure:
  - [ ] Catchy headline
  - [ ] 2-4 short paragraphs
  - [ ] Include who/what/where/why
- [ ] Language is appropriate for ages 7-12:
  - [ ] Simple, clear vocabulary
  - [ ] No complex or overly literary phrases
  - [ ] Positive and empowering tone
- [ ] No scary, violent, or adult topics appear
- [ ] Stories are engaging and curious in tone
- [ ] Consistency across multiple generations

### Fallback Generator

**Setup:** Disable OpenAI or trigger fallback (network error)

- [ ] Fallback generator produces stories when OpenAI fails
- [ ] Fallback stories also use kid-friendly tone:
  - [ ] Simple, clear language
  - [ ] No overly sophisticated vocabulary
  - [ ] Positive and fun
- [ ] Fallback stories match the same tone as OpenAI stories
- [ ] No errors or console warnings appear

---

## Part 5: Error Handling & Loading States

### PublicStoryPage

- [ ] Loading spinner appears while fetching
- [ ] Error states are user-friendly and clear
- [ ] Retry functionality works after errors
- [ ] No console errors during normal operation
- [ ] Graceful handling of:
  - [ ] Missing story
  - [ ] Permission denied
  - [ ] Network timeout
  - [ ] Invalid UUID

### NewspaperPage

- [ ] Loading spinner appears while fetching stories
- [ ] Error messages are clear and actionable
- [ ] "Go Back" button works correctly
- [ ] Handles partial failures gracefully
- [ ] No console errors during normal operation
- [ ] Graceful handling of:
  - [ ] No IDs provided
  - [ ] Some stories inaccessible
  - [ ] All stories inaccessible
  - [ ] Network errors

### StoryArchive Share Button

- [ ] Clipboard copy fails gracefully on unsupported browsers
- [ ] Native share cancellation doesn't show error
- [ ] Toast notifications appear for success/failure
- [ ] No console errors during share operations

---

## Part 6: Database & RLS Policies

### Row Level Security

**Setup:** Apply RLS policies from `MANUAL_RLS_SETUP.sql`

- [ ] RLS is enabled on `story_archives` table
- [ ] Anonymous users can:
  - [ ] Read public stories (`is_public = true`)
  - [ ] NOT read private stories (`is_public = false`)
- [ ] Authenticated users can:
  - [ ] Read all their own stories (public and private)
  - [ ] Read public stories from other users
  - [ ] NOT read private stories from other users
  - [ ] Create stories with their own `user_id`
  - [ ] Update their own stories
  - [ ] Delete their own stories
  - [ ] NOT modify other users' stories
- [ ] Policy verification query returns expected results:
  ```sql
  SELECT policyname, cmd FROM pg_policies WHERE tablename = 'story_archives';
  ```

### Data Integrity

- [ ] Story visibility updates persist correctly
- [ ] Image URLs generate correctly for public access
- [ ] Created stories have correct `user_id`
- [ ] Timestamps are accurate and timezone-aware

---

## Part 7: Cross-Browser Testing

Test on major browsers:

### Chrome/Edge (Chromium)
- [ ] All features work
- [ ] Native share works on mobile
- [ ] Print preview looks good

### Firefox
- [ ] All features work
- [ ] Clipboard API works
- [ ] Print preview looks good

### Safari (macOS/iOS)
- [ ] All features work
- [ ] Native share works on iOS
- [ ] Print preview looks good

---

## Part 8: Performance & Accessibility

### Performance

- [ ] Public story page loads in < 2 seconds
- [ ] Newspaper page with 10 stories loads in < 3 seconds
- [ ] Image loading doesn't block page render
- [ ] No memory leaks when navigating between pages

### Accessibility

- [ ] All images have appropriate alt text
- [ ] Buttons have clear labels
- [ ] Keyboard navigation works throughout
- [ ] Screen reader can navigate content
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus indicators are visible

---

## Part 9: Integration Testing

### End-to-End User Flows

**Flow 1: Create and Share Story**
1. [ ] User creates a new story
2. [ ] Story appears in archive
3. [ ] User marks story as public
4. [ ] User clicks Share button
5. [ ] URL is copied successfully
6. [ ] Anonymous user opens shared URL
7. [ ] Story displays correctly

**Flow 2: Build and Print Newspaper**
1. [ ] User creates multiple stories
2. [ ] All stories appear in archive
3. [ ] User clicks "Build Newspaper"
4. [ ] Newspaper page opens with all stories
5. [ ] Layout looks professional
6. [ ] User clicks Print
7. [ ] Print preview looks good
8. [ ] User prints to PDF successfully

**Flow 3: Anonymous Access**
1. [ ] Anonymous user receives share link
2. [ ] Opens link without authentication
3. [ ] Story displays correctly
4. [ ] User is NOT forced to log in
5. [ ] User's existing session (if any) is NOT disrupted

---

## Sign-Off

### Tested By

- **Name:** ___________________________
- **Date:** ___________________________
- **Environment:** ☐ Local ☐ Staging ☐ Production

### Notes

_Any issues, observations, or additional testing needed:_

---

## Quick Reference

### Test Data Setup

Create these test scenarios:

1. **Public Story** - `is_public = true`, has content and image
2. **Private Story** - `is_public = false`, has content
3. **Story Without Image** - `is_public = true`, no image
4. **Story With Only Prompt** - Has prompt, no article yet
5. **User A Stories** - Multiple stories owned by test user A
6. **User B Stories** - Multiple stories owned by test user B

### Common Test URLs

- Public Story: `/read/{public-story-id}`
- Private Story: `/read/{private-story-id}`
- Newspaper with 3 stories: `/newspaper?ids=id1,id2,id3`
- Newspaper with no IDs: `/newspaper`

### Test Accounts

- **User A** (authenticated): Has mix of public/private stories
- **User B** (authenticated): Has different stories
- **Anonymous** (logged out): No authentication

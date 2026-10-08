# HEARTAGRAM Redesign Roadmap

## Phase 0 - Freeze and protect the functional baseline

- [ ] Create a redesign checkpoint commit and tag.
- [ ] Run `npm test` and retain the successful output.
- [ ] Run `python scripts/validate_catalog.py`.
- [ ] Record the current localStorage keys.
- [ ] Create a manual regression checklist.
- [ ] Stop feature additions during shell migration.

Exit criteria:

- Tests pass.
- Current test, catalog, wishlist, library, gift, and AI context flows are documented.

## Phase 1 - New application shell

- [ ] Create `tokens.css` and `reset.css`.
- [ ] Create `shell.css`.
- [ ] Replace floating top navigation with collapsible desktop sidebar.
- [ ] Add mobile bottom navigation.
- [ ] Add active destination state.
- [ ] Persist sidebar collapse state.
- [ ] Add accessible labels and keyboard behavior.
- [ ] Use placeholder screen content before migrating features.

Exit criteria:

- Navigation works at all target breakpoints.
- Sidebar never overlays content.
- Sidebar state survives reload.
- Mobile uses bottom navigation.

## Phase 2 - Inicio

- [ ] Build no-profile state.
- [ ] Build returning-profile state.
- [ ] Add Continue card.
- [ ] Add profile summary.
- [ ] Add recommendation for today.
- [ ] Add collection counts.
- [ ] Add secondary shortcuts.

Exit criteria:

- One clear primary action per state.
- Inicio remains concise.
- Existing profile persistence works.

## Phase 3 - Descubrir

- [ ] Merge profile summary, recommendations, Duo, and out-of-zone content.
- [ ] Add mood filter chips.
- [ ] Limit visible recommendations by section.
- [ ] Preserve favorite and library actions.
- [ ] Keep profile detail as a secondary surface.

Exit criteria:

- Existing ranking logic remains unchanged.
- Recommendations render under the new hierarchy.
- Actions update collection state.

## Phase 4 - Explorar

- [ ] Migrate catalog toolbar.
- [ ] Rebuild compact catalog cards.
- [ ] Migrate details dialog.
- [ ] Preserve favorites and owned-library exclusivity.
- [ ] Preserve cover fallback.
- [ ] Prepare later cover resynchronization.

Exit criteria:

- Search, filters, pagination, details, favorites, and library actions pass regression.

## Phase 5 - Mi lista

- [ ] Add segmented control.
- [ ] Show only one collection at a time.
- [ ] Add counts.
- [ ] Add useful empty states.
- [ ] Add compact sorting.
- [ ] Preserve removal and move actions.

Exit criteria:

- No game appears in both states.
- State persists after reload.

## Phase 6 - Chat shell

- [ ] Rename the destination to Chat.
- [ ] Remove permanent Local mode copy.
- [ ] Add conversation history.
- [ ] Add new/delete conversation.
- [ ] Add persisted local threads.
- [ ] Add sticky composer.
- [ ] Implement Enter and Shift+Enter.
- [ ] Add autoscroll.
- [ ] Show starters only in empty threads.
- [ ] Add visible context chips.
- [ ] Render game recommendation cards.
- [ ] Preserve local fallback.

Exit criteria:

- Local conversation works without an external service.
- History survives reload.
- Context is inspectable.

## Phase 7 - Secondary surfaces

- [ ] Migrate full profile.
- [ ] Migrate gift.
- [ ] Migrate redemption guide.
- [ ] Migrate family group instructions.
- [ ] Add secondary navigation/menu.

## Phase 8 - External AI service

- [ ] Define service adapter.
- [ ] Create secure backend endpoint.
- [ ] Connect Gemini without exposing keys.
- [ ] Add streaming status.
- [ ] Add stop and retry.
- [ ] Fall back locally on connection failure.
- [ ] Validate structured actions before execution.

## Phase 9 - Explicit memory

- [ ] Add preference memory schema.
- [ ] Require confirmation before saving.
- [ ] Add memory inspection.
- [ ] Add edit and forget controls.
- [ ] Prevent sensitive or irrelevant memory.

## Phase 10 - Final audit

- [ ] Test 390 x 844.
- [ ] Test 768 x 1024.
- [ ] Test 1366 x 768.
- [ ] Test 1440 x 900.
- [ ] Keyboard audit.
- [ ] Screen-reader audit.
- [ ] Contrast audit.
- [ ] Touch-target audit.
- [ ] Overflow audit.
- [ ] Performance audit.
- [ ] Final regression test.
- [ ] Update README.

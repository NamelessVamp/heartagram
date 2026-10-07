# HEARTAGRAM Redesign Specifications

## 1. Purpose

Rebuild HEARTAGRAM as a responsive Nintendo companion application for Adri without losing the working recommendation, catalog, wishlist, library, gift, and AI context systems.

The redesign replaces the current sequential page shell with a persistent application shell. Existing domain logic and storage remain the source of truth.

## 2. Product Position

HEARTAGRAM is not a store, launcher, or generic AI wrapper.

It is a personal game discovery companion that helps Adri:

- understand her player profile;
- discover games that fit her preferences;
- explore a broad Nintendo Switch and Switch 2 catalog;
- separate games she wants from games she owns;
- find games to play with Inti;
- use a contextual conversation to compare and prioritize options;
- access the gift, redemption guide, and family-group instructions.

## 3. Non-Negotiable Functional Baseline

The redesign must preserve:

- 12-question player profile test;
- persisted profile;
- curated recommendation engine;
- out-of-zone recommendation;
- games to play with Inti;
- IGDB catalog loading and filtering;
- catalog details dialog;
- Me interesa state;
- Mi biblioteca state;
- exclusive wishlist/library state;
- local persistence;
- redeemable-code placeholders;
- redemption guide;
- Nintendo Switch Online family instructions;
- privacy-safe AI context builder;
- local assistant fallback;
- all passing automated tests.

## 4. Information Architecture

### 4.1 Primary destinations

1. Inicio
2. Descubrir
3. Explorar
4. Mi lista
5. Chat

### 4.2 Secondary destinations

- Mi perfil
- Mi regalo
- Configuracion and memory controls when implemented

### 4.3 Desktop navigation

- Collapsible left sidebar.
- Expanded state shows icon and label.
- Collapsed state shows icon and accessible tooltip.
- Active destination is visually explicit.
- Collapse preference persists locally under `heartagram:sidebar-collapsed`.
- Sidebar never overlays page content.

### 4.4 Mobile navigation

- Fixed bottom navigation with the five primary destinations.
- Secondary destinations are accessed from Inicio or a secondary menu.
- Desktop sidebar is not rendered as an overlay by default on mobile.

## 5. Sitemap

```text
HEARTAGRAM
|-- Inicio
|   |-- Continue or start profile
|   |-- Profile summary
|   |-- Recommendation for today
|   |-- Collection summary
|   `-- Secondary shortcuts
|-- Descubrir
|   |-- Profile summary
|   |-- Para ti
|   |-- Segun tu mood
|   |-- Para jugar con Inti
|   `-- Sal de tu zona
|-- Explorar
|   |-- Search and filters
|   |-- Results
|   `-- Game details
|-- Mi lista
|   |-- Me interesa
|   `-- Mi biblioteca
|-- Chat
|   |-- Active conversation
|   |-- Conversation history
|   |-- Context controls
|   `-- Memory controls
`-- Secondary
    |-- Mi perfil
    |-- Mi regalo
    |-- Redemption guide
    `-- Family group
```

## 6. Navigation Flows

### 6.1 First visit

Inicio -> Test -> Profile result -> Descubrir -> Me interesa -> Mi lista

### 6.2 Find something to play

Inicio -> Recommendation for today -> Details -> Ya lo tengo -> Mi biblioteca

### 6.3 Catalog discovery

Explorar -> Search or filter -> Details -> Me interesa or Ya lo tengo

### 6.4 Play with Inti

Inicio or Descubrir -> Para jugar con Inti -> Details -> Save or own

### 6.5 Conversation

Chat -> New conversation -> Message -> Recommendation card -> Details or state action -> Follow-up

### 6.6 Gift

Inicio -> Mi regalo -> Codes -> Redemption guide -> Nintendo Switch Online -> Family group

## 7. Screen Requirements

### 7.1 Inicio

With profile:

- concise greeting and identity;
- one Continue card;
- one recommendation for today;
- compact profile summary;
- counts for Me interesa and Mi biblioteca;
- secondary shortcuts for Inti, gift, and retaking the test.

Without profile:

- one primary call to start the profile test;
- secondary access to Explorar and Mi regalo;
- no empty recommendation dashboard.

Inicio must not become an infinite feed.

### 7.2 Descubrir

- compact profile summary;
- up to three main recommendations;
- mood filters that do not permanently mutate the saved profile;
- up to three options to play with Inti;
- one featured out-of-zone recommendation;
- game actions remain available.

### 7.3 Explorar

- search;
- platform, genre, mode, and sort controls;
- clear active-filter state;
- compact game cards;
- details dialog;
- Me interesa and Ya lo tengo actions;
- cover fallback;
- no price surfaces.

### 7.4 Mi lista

- segmented control for Me interesa and Mi biblioteca;
- only one collection visible at a time;
- counts on both segments;
- useful empty states;
- compact sorting and optional contextual filters;
- no duplicate game across both states.

### 7.5 Chat

- destination label is Chat;
- no visible provider name;
- no permanent Local mode label;
- conversation list on desktop;
- conversation drawer on mobile;
- fixed composer;
- Enter sends;
- Shift+Enter inserts a line break;
- new conversation;
- delete conversation;
- local persistence;
- contextual starter prompts only in an empty conversation;
- visible, removable context chips;
- game recommendation cards with deterministic actions;
- external failure can use local fallback with a brief recovery notice;
- no redeemable codes or secrets in AI context.

### 7.6 Mi perfil

- archetypes;
- radar or dimension visualization;
- explanation;
- retake test action.

### 7.7 Mi regalo

- code placeholders only;
- real codes remain outside Git;
- redemption guide;
- family group instructions.

## 8. Chat History and Memory

### 8.1 Conversation history

Store locally under `heartagram:chat-threads`.

Each thread contains:

- id;
- title;
- createdAt;
- updatedAt;
- messages.

Initial limits:

- display recent threads;
- keep bounded message history;
- no semantic search in the first release.

### 8.2 Preference memory

Memory is distinct from conversation history.

- Explicit confirmation is required before remembering a preference.
- The user can inspect, edit, and forget memory.
- Memory must never include gift codes, secrets, or unrelated personal data.

## 9. Visual Direction

- Dark Romance and Razorblade Romance influence;
- editorial hierarchy for Inicio and Descubrir;
- utilitarian clarity for Explorar and Mi lista;
- intimate, readable conversation surface for Chat;
- no esports launcher aesthetic;
- no generic store dashboard;
- no generic AI wrapper appearance;
- no standard Unicode emoji.

## 10. Image Strategy

### 10.1 Required

- reliable game cover images for catalog recognition;
- graceful cover fallback when an asset is unavailable;
- optional background or hero art only when it supports hierarchy.

### 10.2 Not required for shell implementation

- generated character art;
- decorative full-screen wallpapers;
- screenshots on every card;
- visual assets that delay navigation and content testing.

### 10.3 Rules

- Do not use copyrighted game artwork outside allowed source usage.
- Do not make layout depend on a successful remote image request.
- Avoid image-heavy feeds on Inicio.
- Prioritize correct IGDB cover synchronization after the shell is stable.

## 11. Technical Architecture

Preserve:

- vanilla HTML, CSS, and JavaScript;
- static hosting compatibility;
- localStorage-based personal state;
- existing data files;
- existing tests and validators.

Rewrite:

- document shell;
- navigation shell;
- CSS organization;
- screen markup;
- rendering adapters where the new structure requires it.

Do not migrate to React solely for this redesign.

## 12. New CSS Structure

```text
css/
|-- tokens.css
|-- reset.css
|-- shell.css
|-- components.css
|-- screens/
|   |-- home.css
|   |-- discover.css
|   |-- catalog.css
|   |-- collection.css
|   |-- chat.css
|   `-- gift.css
`-- responsive.css
```

## 13. Accessibility

- complete keyboard navigation;
- visible focus states;
- accessible names for collapsed navigation;
- tooltips are supplementary, not the only accessible label;
- minimum practical touch targets;
- screen-reader announcements for chat status and collection changes;
- no content hidden behind fixed navigation;
- reduced-motion behavior;
- responsive text without horizontal overflow.

## 14. Breakpoints to Validate

- 390 x 844
- 768 x 1024
- 1366 x 768
- 1440 x 900

## 15. Definition of Done

The redesign is complete when:

- all baseline functions still work;
- automated QA passes;
- the app shell is responsive and accessible;
- navigation never overlays content;
- sidebar collapse persists;
- collection states remain exclusive;
- chat supports persisted conversations;
- gift codes and secrets remain excluded from Git and AI payloads;
- no legacy price or cart UI returns;
- existing and new screens share one coherent design system.

# Lorewright — Build Plan (v1: Lore Encyclopedia)

Status: **approved.** Visual direction **B (The Sourcebook)**. License: none (all rights reserved). Stages 1–5 done.

---

## 1. UX brief (from `/impeccable shape`)

**Job and audience.** Solo developers and small indie teams writing a game's world. They read and write in long sessions, often next to their engine, and come back to check facts quickly in between ("what year did the Siege of Varn happen?", "is Maelis still alive in Act 3?").

**Modes.** Reading pages, the timeline and the world home are **Read** surfaces: the reader's question comes first, with a calm column and strong wayfinding. Editing, settings, the map editor and AI review are **Operate** surfaces: fast, consistent, keyboard-friendly. All of them share one visual world.

**Outcome.** A developer can:
1. go from nothing to a first linked page in under a minute;
2. find any fact in two keystrokes (Ctrl/⌘+K);
3. see their world from different angles (timeline, map, graph) without writing anything twice;
4. let AI propose additions they review before anything is saved.

**Anti-goals.**
- No admin-panel look: no grey card grid, no dashboard tiles, no stat widgets.
- No fake-parchment fantasy look.
- No MediaWiki clone.
- AI never writes silently.

**States that must be designed, not left to defaults:**
- first run (no worlds)
- an empty world (no pages)
- an empty category
- a page whose body is still empty
- red links
- no search results
- no dated events (timeline)
- no map uploaded
- a graph with fewer than two linked pages
- AI not configured
- AI errors
- an AI suggestion waiting for review
- loading a large world
- over-long titles in any language (German compounds, Turkish suffixes)

**Ranges to design for:**
- 0–30 worlds
- 0–5,000 pages per world
- page bodies from 0 words to 10,000 words
- titles from 1 to 80 characters
- 0–40 infobox fields
- 0–500 events
- 0–1,000 map markers

---

## 2. Visual direction

**Chosen: B, The Sourcebook.** The direction contract lives in `.impeccable/surfaces/src-modules-encyclopedia.md`. A and C are kept below for the record. Both directions get full dark and light themes, mobile layouts, logical CSS properties (RTL-ready), and fonts with complete Turkish coverage (ı İ ş ğ ç ö ü).

### A. "The Reference Volume" (recommended by the roll)

The world as a bound encyclopedia, with the apparatus of a real reference book turned into navigation.

- **Thumb index.** A rail of category tabs sits on the book's fore-edge (the inline-end side in LTR, which mirrors automatically in RTL). Each category has its own printed-ink colour: Character, Location, Faction, Event, Item, Creature, Concept, plus custom categories. Tapping a tab jumps to that category, the way a thumb-indexed dictionary opens at a letter.
- **Running head.** The top of the page always shows where you are: `World › Category › first–last entry`.
- **Headword entries.** Each page opens with a bold headword, then a meta line (category · era · dates), then a calm reading column of about 68 characters.
  - Cross-references are set in small caps as `→ SILVERMERE`.
  - Red links show as a dashed-underline mark, not just a red colour.
- **Bookcloth frame.** Each world chooses its own cloth colour (deep viridian, oxblood, indigo, ochre…). It covers the frame (masthead, rail, covers on the worlds shelf); the reading column stays clean.
  - Light theme: cool bright reference paper, not cream.
  - Dark theme: the cloth becomes the ground and the text is soft bone white.
- **Worlds shelf.** The worlds list is a row of book spines in their cloth colours. An empty shelf invites you to "bind your first volume".
- **Type.** Literata for reading (built for long-form screen reading, with full Latin Extended) and Schibsted Grotesk for headwords and UI. Both are self-hosted.

Additions borrowed from the other dealt directions (their discipline, not their look):
- *from the struck-cathode world:* no boxes around entries. Grouping is done with space and type weight, never card borders.
- *from the film-cutting-bench world:* state is a **mark, not a hue**. Stub, draft, AI-pending and red link each carry a typographic mark, so colour is never the only signal.
- *from the yé-yé record sleeve:* one committed ground per release, so **each world owns one cloth colour**, applied to its whole frame.
- *from the polar newspaper press:* the measure is fixed and the margins absorb the width, so the reading line never stretches on wide screens.
- *from the cyclorama:* the timeline's eras are full-width named horizontal bands, each with a text label.
- *from the Miura-fold sheet:* every visual diagram (graph, map) has a complete text equivalent (a list view).

**Honest risk:** Encyclopedia is the literal reading of the module's name. The thumb-index rail needs care on phones (it becomes a bottom sheet of tabs).

### B. "The Sourcebook" (my own top pick)

A tabletop-RPG sourcebook: two-column spreads on wide screens, stat-block infoboxes, sidebars, chapter openers, and an index at the back.

**Honest risk:** this is the most familiar look in the category, close to what many lore tools and fan wikis already do. It is easy to read but hard to make feel like Lorewright's own.

### C. Standard wiki (the safe exit)

A left sidebar tree, the infobox on the right, neutral greys and blue links, played straight and well made.

**Honest risk:** it looks like every other wiki, which is the "ordinary panel" look you asked to avoid.

---

## 3. Libraries

| Concern | Choice | Why |
|---|---|---|
| Build | Vite, React 19, TypeScript (strict) | As requested. |
| Routing | React Router v7, **hash router** | Works on GitHub Pages: refreshing a page doesn't 404. |
| i18n | i18next, react-i18next, i18next-browser-languagedetector | Detects the browser language, falls back to `en`, remembers the choice in localStorage. |
| Formatting | Native `Intl` (DateTimeFormat, NumberFormat, RelativeTimeFormat, PluralRules) | Zero weight, correct for every locale. |
| Storage | Dexie 4, dexie-react-hooks | IndexedDB with live queries. |
| Markdown render | react-markdown, remark-gfm, a custom `remark-wikilink` plugin, rehype-sanitize | `[[Page]]` and `[[Page\|label]]`, with sanitized output. |
| Markdown editor | CodeMirror 6 (`@codemirror/lang-markdown`) | `[[` autocomplete for page titles, keyboard-first, handles RTL text. |
| Search | MiniSearch, plus a custom normalizer | Fuzzy and prefix search. Folds case and diacritics with Turkish-aware rules: `istanbul` finds `İstanbul`, `isik` finds `Işık`. |
| Command palette | cmdk | Accessible Ctrl/⌘+K palette. |
| Graph | Cytoscape.js with the fcose layout | Mature, filterable, performs with thousands of nodes. |
| Map | Leaflet (`CRS.Simple`), react-leaflet | Zoom and pan over an uploaded image; markers in image coordinates. |
| Timeline | Custom (SVG + HTML) | The world's own calendar and eras don't fit any off-the-shelf timeline library. |
| Zip export | fflate | Tiny, fast. |
| Icons | Lucide | Consistent stroke icons, used sparingly. |
| Styling | CSS Modules + CSS custom properties (design tokens), with `stylelint-use-logical` | Enforces logical properties, so the layout is RTL-ready. |
| Fonts | @fontsource (Literata, Schibsted Grotesk) | Self-hosted, Latin Extended subsets. |
| AI | Plain `fetch` + SSE/NDJSON stream parsing, no vendor SDKs | One small code path per provider, smaller bundle. |
| Tests | Vitest, Testing Library | Unit tests for the link parser, rename, search normalization, calendar math, the AI stream parsers and i18n key parity. |

---

## 4. Folder structure

```
lorewright/
├─ .github/workflows/deploy.yml     # stage 6: build + deploy to GitHub Pages
├─ docs/PLAN.md
├─ proxy/                           # optional zero-dependency local CORS proxy (stage 5)
│  └─ server.mjs
├─ scripts/
│  └─ check-i18n.mjs                # fails on missing/unused keys across locales
├─ public/
└─ src/
   ├─ main.tsx
   ├─ app/                          # shell: router, providers, layout, theme
   │  ├─ App.tsx
   │  ├─ router.tsx                 # composes core routes + module routes
   │  └─ shell/                     # masthead, thumb-index rail, mobile tab sheet
   ├─ core/
   │  ├─ db/                        # Dexie schema, versions, migrations
   │  ├─ i18n/                      # i18next setup, locale registry, Intl helpers, dir handling
   │  ├─ lore/                      # domain layer used by every module
   │  │  ├─ types.ts
   │  │  ├─ worlds.ts  pages.ts  categories.ts  links.ts
   │  │  ├─ wikilinks.ts            # parse / rewrite [[links]]
   │  │  ├─ calendar.ts             # world calendars, eras, date math
   │  │  ├─ search.ts               # index + Turkish-aware normalizer
   │  │  └─ api.ts                  # the read API future modules consume
   │  ├─ ai/
   │  │  ├─ AIProvider.ts           # interface: generate, stream, testConnection, listModels
   │  │  ├─ registry.ts             # auto-registers every file in providers/
   │  │  ├─ providers/              # anthropic.ts openai.ts gemini.ts openrouter.ts
   │  │  │                          # ollama.ts lmstudio.ts openai-compatible.ts
   │  │  ├─ prompts/                # provider-agnostic English prompts
   │  │  ├─ context.ts              # smart context selection
   │  │  └─ errors.ts               # normalized, translatable error codes
   │  └─ export/                    # json backup/restore, markdown zip, single html
   ├─ modules/
   │  ├─ registry.ts                # list of module manifests (routes, nav, db tables)
   │  └─ encyclopedia/              # module 1: Lore Encyclopedia
   │     ├─ manifest.ts
   │     ├─ screens/                # one folder per screen
   │     └─ components/
   │     # later: npc-lab/, playtest-hub/, store-page-studio/
   ├─ ui/                           # design-system primitives (Button, Dialog, Field, Tabs…)
   │  └─ tokens.css
   ├─ locales/
   │  ├─ en/  meta.json common.json encyclopedia.json ai.json settings.json errors.json
   │  └─ tr/  (same files)
   └─ sample-data/                  # English demo world (15–20 pages) + small Turkish world
```

**Modularity contract.** A module is a folder with a `manifest.ts` that declares:
- its routes (mounted under `/w/:worldId/<module>`);
- its nav entry (label key and icon);
- optional Dexie tables, namespaced, e.g. `npc_profiles`;
- its translation namespace.

Modules read lore only through `core/lore/api.ts`, e.g.:
- `usePages({ category: 'character' })`
- `getPage(id)`
- `getLinkedPages(id)`
- `onPagesChanged()`

So NPC Personality Lab can attach a personality profile to a character page by `pageId`, without touching encyclopedia internals.

---

## 5. Data model (IndexedDB via Dexie)

Database `lorewright` (exported and backed up):

```ts
World {
  id: string; name: string; genre: string; tone: string;
  contentLanguage: string;     // BCP-47, e.g. "tr" — AI writes in this language
  summary: string;
  cloth: string;               // world's bookcloth colour token (if direction A)
  calendar: Calendar;
  createdAt: number; updatedAt: number;
}

Calendar {
  yearLabel: string;            // "after the Founding"
  yearAbbr: string;             // "AF"
  months?: { name: string; days: number }[];  // optional; year-only worlds are fine
  negativeLabel?: string;       // "before the Founding"
}

Era { id; worldId; name; startYear: number; endYear?: number; color: string; order: number }

Category {
  id; worldId;
  builtIn?: 'character'|'location'|'faction'|'event'|'item'|'creature'|'concept';
  name?: string;                // custom categories only; built-ins use i18n keys
  color: string; icon: string; order: number;
  fields: FieldDef[];
}

FieldDef {
  id: string; key: string;
  label?: string;               // custom only; built-in fields use i18n keys
  type: 'text'|'longtext'|'number'|'worldDate'|'pageRef'|'pageRefs'|'select'|'tags'|'boolean';
  options?: string[];
  refCategory?: string;         // e.g. a character's "faction" refs Faction pages
}

Page {
  id; worldId; categoryId;
  title: string; titleKey: string;   // titleKey = normalized title, unique per world
  aliases: string[];
  body: string;                      // Markdown
  fields: Record<string, unknown>;   // infobox values by FieldDef.id
  date?: WorldDate; endDate?: WorldDate;  // events (and anything dated)
  status: 'stub'|'draft'|'complete';
  createdAt: number; updatedAt: number;
}

WorldDate { year: number; month?: number; day?: number; approximate?: boolean }  // + derived sortKey

Link {                // derived index, rebuilt whenever a page is saved
  id; worldId; fromPageId;
  toKey: string;      // normalized target title
  toPageId?: string;  // undefined → red link
  source: 'body' | string;   // 'body' or the FieldDef.id of a pageRef field
}

MapDoc    { id; worldId; name; imageId; width; height }
MapImage  { id; blob: Blob }
Marker    { id; mapId; pageId?: string; label?: string; x: number; y: number }
```

Built-in infobox fields (editable and extendable per world):
- **Character:** born, died, race/species, affiliation → Faction, home → Location, occupation, status (alive/dead/unknown)
- **Location:** type, region → Location, ruler → Character/Faction, population
- **Faction:** type, leader → Character, headquarters → Location, founded, dissolved
- **Event:** date, end date, era, location → Location, participants → pages, outcome
- **Item:** type, owner → Character, origin → Location, rarity
- **Creature:** classification, habitat → Locations, danger level
- **Concept:** type (magic system, religion, technology…), related → pages

Database `lorewright-secrets` (**never exported, never committed**):

```ts
ProviderProfile { id; type; label; baseUrl?; apiKey?; defaultModel? }
TaskModels { expand; fillMissing; consistency: { profileId; model } }
```

UI preferences (language, theme) live in localStorage.

**Link behaviour:**
- When a page is saved, the app parses `[[…]]` in the body and the pageRef fields, then rewrites that page's `Link` rows.
- When a page is renamed, a single transaction rewrites `[[Old]]` → `[[New]]` (keeping the `|label`) in every page that links to it, then re-indexes.
- When a page is created, matching red links become live.

---

## 6. Screens and routes (hash routes)

| Route | Screen | Empty state |
|---|---|---|
| `/` | **Worlds shelf**: your worlds; create, import a backup, or open a sample world | "Bind your first volume", with buttons for a new world, a sample world, or importing a backup |
| `/w/:w` | **World home**: summary, recently edited, category index with counts, red links waiting, quick create | Guided first steps: write a first character, then a place, then link them |
| `/w/:w/c/:category` | **Category index**: alphabetical entries with thumb-index letters | Explains what this category is for and offers a create button |
| `/w/:w/p/:slug` | **Page reader**: headword, infobox, body, "Pages that link here", AI actions | An empty body prompts you to start writing, or to "Expand with AI" if AI is configured |
| `/w/:w/p/:slug/edit`, `/w/:w/new` | **Page editor**: Markdown with `[[` autocomplete, infobox form, category, status, live preview (side-by-side on desktop, tabbed on mobile) | — |
| `/w/:w/timeline` | **Timeline**: eras as bands; events placed by world date; zoom; filter by era/category; list fallback | Shows how to give an event a date and how to define the calendar and eras |
| `/w/:w/maps`, `/w/:w/maps/:id` | **Map**: upload an image, zoom and pan, place and drag markers, link them to Location pages; marker list | Upload area with what makes a good map image |
| `/w/:w/graph` | **Relationship graph**: force layout, colour per category, category filters, focus on a node, list view | Explains that links create the graph and shows a 3-node example |
| `/w/:w/categories` | **Categories and fields**: edit built-in fields, create custom categories | — |
| `/w/:w/settings` | **World settings**: name, genre, tone, content language, summary, cloth colour, calendar and eras, export/backup/restore, delete | — |
| `/settings` | **App settings**: interface language, theme (system/light/dark), AI providers, per-task models | AI: explains that it's optional and that keys stay in this browser |
| overlay | **Command palette (Ctrl/⌘+K)**: search pages, jump to screens, run actions | "No pages match", with a "Create '…'" action |
| overlay | **AI review panel**: streaming output, then accept / edit / discard; consistency findings with links | — |

The language selector lives in two places: App settings, and a compact switch in the masthead menu that you can always reach.

---

## 7. i18n structure

- `src/locales/<lang>/meta.json`: `{ "name": "Turkish", "nativeName": "Türkçe", "dir": "ltr" }`.
- Namespaces, one JSON file each:
  - `common`: nav, buttons, generic words
  - `encyclopedia`: categories, fields, pages, timeline, map, graph
  - `ai`
  - `settings`
  - `errors`
  - `onboarding`
- Locales are discovered with `import.meta.glob`, so **adding a language means adding one folder**. There is no code change; the language selector lists it automatically.
- `dir` sets `<html dir>` and `<html lang>`. All CSS uses logical properties, so an `ar` folder with `"dir": "rtl"` mirrors the layout.
- Plurals use i18next's `_one`/`_other` keys, which work through `Intl.PluralRules`.
- Dates, numbers and relative times go through `Intl` with the active UI language. In-world dates go through the world's calendar with localized number formatting.
- `npm run i18n:check` compares every locale against `en` and fails CI on missing, extra or unused keys.
- **Interface language ≠ content language.** The UI follows the user's choice. Each world's `contentLanguage` governs:
  - the AI output language;
  - the search normalizer's locale rules;
  - the `lang` attribute on rendered page bodies (correct hyphenation and screen-reader voice).

---

## 8. AI architecture (stage 5)

```ts
interface AIProvider {
  id: string; labelKey: string;
  needs: { apiKey: boolean; baseUrl: boolean };
  listModels(cfg): Promise<string[]>;
  testConnection(cfg): Promise<void>;           // throws AIError
  generate(cfg, req): Promise<string>;
  stream(cfg, req, signal): AsyncIterable<string>;
}
```

- Each provider is one file in `core/ai/providers/` and self-registers. The app only talks to the registry.
- `AIError` codes: `invalid_key`, `quota_exceeded`, `rate_limited`, `model_not_found`, `local_unreachable`, `cors_blocked`, `context_too_long`, `network`, `unknown`. Each maps to a translated message with a suggested fix.
- **CORS by provider:**

  | Provider | Browser access |
  |---|---|
  | Anthropic | Direct, via its browser-access header |
  | OpenAI, Gemini, OpenRouter | Direct (they allow browser calls) |
  | Ollama | Needs `OLLAMA_ORIGINS`; the README shows the one-liner |
  | LM Studio | Needs "Enable CORS" in its server settings |
  | Custom endpoints | Vary; when a call fails with a CORS signature, the app suggests the optional proxy |

  The proxy is `npm run proxy`, a zero-dependency Node script on localhost that forwards only to the URL you configure.
- **Prompts** are English templates in `core/ai/prompts/`. Each includes "Respond in {{contentLanguageName}}" and the world's genre and tone.
- **Context selection:**
  1. the target page;
  2. its direct links and backlinks, ranked by link count and recency;
  3. for consistency checks, the pages that share entities or dates with the target;
  4. trimmed to a token budget per model.

  The whole world is never sent.
- **Features:**
  - Expand this page
  - Fill missing pages (drafts for red links)
  - Consistency check, which returns structured findings that link to the pages involved
- Everything AI produces appears in the review panel first. Nothing is saved until you accept it, optionally after editing.
- The app works fully without AI. AI buttons explain how to set it up instead of failing.

---

## 9. Export and deploy (stage 6)

- **JSON backup:** the whole `lorewright` DB for one world, including map images as base64. It never contains the secrets DB. Restore validates the version and either merges or replaces.
- **Markdown zip:** `category/Page Title.md` with YAML front-matter for the infobox. Map images are included.
- **Single HTML:** one self-contained, readable file with a table of contents and working internal anchors.
- **GitHub Pages:** an Actions workflow builds on every push to `main` and deploys. Vite `base` is `/lorewright/`.

---

## 10. Stages

Each stage ends with run and test instructions, the i18n check, an `/impeccable critique` pass with fixes, a commit and push, and a stop for your approval.

1. **Skeleton and core.**
   - Vite/React/TS, i18n (EN+TR), theme, shell
   - Dexie, worlds CRUD, pages CRUD
   - Markdown editor and reader
   - Categories, `[[links]]` with red links, link rename
   - Sample worlds: English, 15–20 pages; Turkish, 4–5 pages
2. **Search, backlinks, infoboxes.**
3. **Timeline and relationship graph.**
4. **Map.**
5. **AI:** Anthropic first, then OpenAI, Gemini, OpenRouter, Ollama, LM Studio, custom; settings; proxy.
6. **Export, backup and Pages deploy,** then `/impeccable audit` and `/impeccable polish`.

---

## 11. Decisions for you

1. Visual direction: A, B or C.
2. License: see the question that follows this plan.
3. `PRODUCT.md` will be updated with the facts from this brief:
   - modules renamed to *NPC Personality Lab* and *Playtest Feedback Hub*;
   - IndexedDB storage;
   - interface language separate from content language.

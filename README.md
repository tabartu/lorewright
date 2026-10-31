# Lorewright

*[Türkçe README](README.tr.md)*

Lorewright is a local-first wiki for game developers to write and manage the lore of their game worlds, independent of genre or engine.

Its first module, the **Lore Encyclopedia**, keeps a world as a sourcebook. Categories are chapters, pages are entries, and every entry can link to any other. Everything is stored in your browser: no server and no account.

> **Status:** in development. Stage 1 of 6 is done (worlds, pages, chapters, internal links, EN/TR interface). See [docs/PLAN.md](docs/PLAN.md) for the roadmap.

## Features

Available now:

- **Multiple worlds.** Each world has a name, genre, tone, content language, summary, cover colour and calendar label.
- **Pages in Markdown.** Pages are sorted into chapters: Character, Location, Faction, Event, Item, Creature, Concept, plus chapters of your own.
- **Internal links.**
  - `[[Page Name]]` or `[[Page Name|label]]` creates a link.
  - Links to pages that don't exist yet appear as dashed red links; clicking one creates the page.
  - Renaming a page updates every link that points to it.
  - Aliases ("also known as") resolve links too.
- **Wanted pages.** The world home lists red links, ranked by how often they're used.
- **Editor.** CodeMirror with `[[` autocomplete, live preview or side-by-side view, Ctrl/⌘+S to save, and a guard against losing unsaved changes.
- **Multilingual interface.** English and Turkish are included.
  - The browser language is detected on first visit, and your choice is remembered.
  - Dates and numbers follow the interface language.
  - Layouts use CSS logical properties, so right-to-left languages work.
- **Content language is separate from interface language.** You can use an English interface and write Turkish lore.
- **Light and dark themes**, and layouts for phones.

Planned, see [docs/PLAN.md](docs/PLAN.md):

- search (Ctrl/⌘+K), backlinks and infobox editing
- timeline and relationship graph
- maps
- AI assistance with multiple providers
- export, backup, and GitHub Pages deployment

## Getting started

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). On first run, pick **Open a sample world** to explore a linked demo world, or create your own.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Unit tests (Vitest) |
| `npm run i18n:check` | Fail on missing, extra or unknown translation keys |
| `npm run css:check` | Fail on physical CSS properties (keeps layouts RTL-ready) |
| `npm run check` | All of the above plus lint |

## Your data

All worlds live in your browser's IndexedDB, in a database named `lorewright`. Nothing leaves your machine. Clearing site data for the app deletes your worlds. JSON backup and restore arrive in stage 6.

## How to add a new language

Interface languages are discovered automatically from `src/locales/`. To add one, for example German:

1. Copy the English folder:
   ```bash
   cp -r src/locales/en src/locales/de
   ```
2. Edit `src/locales/de/meta.json`:
   ```json
   { "name": "German", "nativeName": "Deutsch", "dir": "ltr" }
   ```
   Use `"dir": "rtl"` for right-to-left languages such as Arabic or Hebrew. The layout mirrors automatically.
3. Translate the values in every other JSON file in the folder. Keep the keys and the `{{placeholders}}` unchanged.
   - Plural keys end in `_one` / `_other`. Add `_zero`, `_two`, `_few` or `_many` if your language needs them; see [i18next plurals](https://www.i18next.com/translation-function/plurals).
4. Run the check:
   ```bash
   npm run i18n:check
   ```
   It reports any missing or extra keys and mismatched placeholders.

No code changes are needed. The new language appears in the language menu and in **Settings**, and is picked automatically for browsers set to that language.

## Project structure

```
src/
├─ app/            App shell: router, masthead, world layout, app-level screens
├─ core/
│  ├─ db/          Dexie (IndexedDB) schema
│  ├─ i18n/        i18next setup, locale discovery, Intl formatters
│  └─ lore/        Domain layer: types, worlds, pages, links, calendar
│                  api.ts is the read API every module uses
├─ modules/
│  ├─ registry.ts  Installed modules (routes are mounted from here)
│  └─ encyclopedia/  Module 1: Lore Encyclopedia (screens, components)
├─ ui/             Design tokens and shared UI primitives
├─ locales/        One folder per interface language
└─ sample-data/    Demo worlds (English and Turkish)
scripts/           Repository checks (i18n, logical CSS)
docs/PLAN.md       Architecture and roadmap
```

### Adding a module

Future modules such as *NPC Personality Lab*, *Playtest Feedback Hub* and *Store Page Studio* plug in the same way:

1. Create `src/modules/<name>/manifest.tsx` exporting a `LorewrightModule`, which declares its routes under `/w/:worldId/<basePath>`.
2. Add it to `src/modules/registry.ts`.
3. Read lore through `src/core/lore/api.ts`, for example `getPages(worldId, { builtIn: 'character' })` or `getLinkedPages(id)`.
4. If the module needs its own tables, add namespaced stores in a new Dexie version in `src/core/db/db.ts`.
5. Put its translations in a new namespace file in each locale folder, and register the namespace in `src/core/i18n/index.ts`.

## Tech stack

| Area | Library |
|---|---|
| App | Vite, React 19, TypeScript, React Router (hash routing) |
| Storage | Dexie on IndexedDB |
| Translation | i18next and react-i18next |
| Markdown | react-markdown, remark-gfm, rehype-sanitize |
| Editor | CodeMirror 6 |
| Fonts | Literata and Archivo, self-hosted via Fontsource |

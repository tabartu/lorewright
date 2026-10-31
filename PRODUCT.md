# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React + TypeScript. Runs in the browser; data in IndexedDB (Dexie). No backend is required; an optional local proxy may be added only for AI providers that block browser requests.

## Users

Solo developers and small indie game teams (roughly 1–5 people), where the same person usually both writes the lore and carries it into the game. They are building a game world and need its characters, places, factions, events and rules to stay consistent while the project grows and changes.

## Product Purpose

Lorewright is a lore workspace built specifically for game developers, not general writers. It holds a game's whole world, uses AI that knows that world to keep it consistent, and turns lore into material that ships with the game.

Success: a developer's lore stays coherent as the world grows, contradictions are caught before they reach the game, and lore moves into the game and its other production work without rewriting.

## Positioning

- **Built for game development.** General worldbuilding and note tools (World Anvil, Notion, Obsidian, Campfire) treat lore as documentation. In Lorewright, lore is the source that later production work draws from.
- **AI that knows the whole world.** It keeps lore consistent, catches contradictions, and expands pages in the world's own voice.
- **Connected lore.** Entities and the relationships between them come first. Visualizing those connections is a core capability.
- **No lock-in.** Works with any AI provider, including free local models, and with any game engine. Local-first, no account needed.

## Operating Context

- Used by people already working in a game engine and production tools. Lorewright is not a replacement for either.
- The first module is the **Lore Encyclopedia** (a wiki of the world). Lore feeds later modules inside the same application:
  - **NPC Personality Lab** (uses character pages)
  - **Playtest Feedback Hub**
  - **Store Page Studio**
- Lore exports to game-ready formats for use in engines.

## Capabilities and Constraints

Confirmed:
- Browser application. Data stays on the user's device. No account or sign-up.
- AI assistance is provider-agnostic, including free local models. The user brings their own provider.
- Engine-agnostic export of lore into game-ready formats.
- Relationships between lore entities are first-class, and seeing those connections is part of the product.
- NPC Personality Lab, Playtest Feedback Hub and Store Page Studio are modules of this same application, built on the lore core.
- Interface is multilingual from day one (English default, Turkish complete); new languages are added as translation files only. RTL languages must be supported later without layout changes.
- Interface language and content language are separate: each world has its own content language, and AI writes in it.
- Lore pages are Markdown, sorted into categories (Character, Location, Faction, Event, Item, Creature, Concept, plus custom) with per-category infobox fields. `[[Page]]` links, red links for missing pages, backlinks, and link updates on rename.
- Views of the same lore: search palette, timeline with a world-specific calendar and eras, uploaded maps with markers, relationship graph.
- Export: JSON backup/restore, Markdown zip, single-page HTML. API keys never leave the browser and never enter exports.
- AI never saves anything without the user's review.

Open decisions (not yet decided, do not assume):
- Which export formats and which engines get first-class support.
- How AI providers are configured and which ones ship first.
- Scope and order of the NPC Personality Lab, Playtest Feedback Hub and Store Page Studio modules.
- Sync between devices (none planned yet; JSON backup is the only transfer).

## Brand Commitments

- Product name: **Lorewright**.
- Module names: **Lore Encyclopedia**, **NPC Personality Lab**, **Playtest Feedback Hub**, **Store Page Studio**.
- No open-source license: all rights reserved.
- Promises the product must keep: local-first, no account needed, any AI provider, any engine.

## Evidence on Hand

None yet. There are no users, testimonials, studio logos, benchmarks, pricing or screenshots. Future work must not make these up.

## Product Principles

1. **Lore is production material.** Every piece of lore should be able to feed a module or an export, not sit as a dead document.
2. **The world is the context.** AI help is grounded in the user's whole world and speaks in its voice. Generic output that ignores established lore is a failure.
3. **Consistency over volume.** Catching a contradiction matters more than generating more text.
4. **The user owns everything.** Their data stays local, their AI provider and engine are their choice, and no account stands between them and their work.
5. **Respect the indie workflow.** One person wears every hat, so keep the tool fast to pick up and never make it a second job.

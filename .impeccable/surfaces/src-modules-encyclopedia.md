---
version: 1
slug: "src-modules-encyclopedia"
primary_target: "src/modules/encyclopedia"
related_targets: []
---

# Lore Encyclopedia — surface brief

Scope: the whole Lore Encyclopedia module and the app shell around it (worlds shelf, world home, category index, page reader/editor, settings, palette; later timeline, map, graph, AI review).
Visitor mode: Read for reader, world home, index, timeline; Operate for editor, settings, map editing, AI review. One world across both.
Audience/job: solo and small indie game developers writing and checking their game's lore in long sessions next to their engine.
Constraints: EN + TR from day one, any language later (RTL-ready via logical properties); long-word resilience (German, Turkish suffixes); light + dark; mobile; browser-only (IndexedDB).

## Direction contract

THESIS: The world as a game sourcebook: categories are chapters, pages are entries with a stat block, sidebars and cross-references, and every chapter ends in an index. It refuses the wiki default (grey sidebar tree, blue links, card grid dashboard) and the fake-parchment fantasy skin.

OWN-WORLD: Bright cool-white sheet (dark: deep cover-navy ground, bone text). Near-black ink. Each world picks one cover ink from a set of eight printing inks; it owns the masthead band, chapter openers and the shelf spines. Each category has a chapter ink for its tab, opener band and stat-block rules. Archivo condensed heavy caps for headwords, chapter titles and stat labels; Literata for reading. Stat block: double hairline rules, condensed small labels, tabular values. Sidebar: flat ink tint with a top rule. No cards, no content shadows, 2px control radii.
- Raise (film-cutting-bench): state is a mark, not a hue; stub, draft, red link carry typographic marks.
- Raise (polar ice press): fixed reading measure; margins absorb width.
- Raise (yé-yé sleeve): one committed cover ink per world across its whole frame.
- Raise (cyclorama): timeline eras as full-width named bands.
- Raise (Miura sheet): every diagram has a full text equivalent.

STORY: The reader always knows the world, chapter and entry (running head), reads a calm column, scans facts in the stat block, follows cross-references, and treats red links as invitations to write.

FIRST VIEWPORT: Page reader, desktop. Masthead band in the world's cover ink: world name, chapter tabs, search (Ctrl/Cmd+K), menu. Running head in chapter ink. Headword in large condensed caps, meta line beneath. Two-column spread: reading column (~68ch) and a sticky stat block column at inline-end. Edit is the primary action at the headword. Mobile: tabs scroll, stat block follows the headword.

FORM: TTRPG sourcebook / campaign setting book; rank 1 on my ordered list (chosen as the pick card over the assigned reference-volume direction). seed:34d5769aed0cead4

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

import type { LucideIcon } from 'lucide-react'
import type { RouteObject } from 'react-router'

/**
 * A Worldledger module (Lore Encyclopedia, and later NPC Personality Lab,
 * Playtest Feedback Hub, Store Page Studio).
 *
 * Modules mount their screens under `/w/:worldId/<basePath>` and read lore
 * through `core/lore/api.ts` only. Translations live in a namespace file
 * under `src/locales/<lang>/`.
 */
export interface WorldledgerModule {
  id: string
  /** i18n key for the module name, e.g. 'encyclopedia:module.name'. */
  nameKey: string
  icon: LucideIcon
  /** Path segment under /w/:worldId ('' for the default module). */
  basePath: string
  /** Routes relative to /w/:worldId/<basePath>. */
  worldRoutes: RouteObject[]
}

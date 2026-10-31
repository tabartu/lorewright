import Dexie, { type EntityTable } from 'dexie'
import type { Category, Era, Link, Page, PageBody, World } from '../lore/types'

/**
 * The main Lorewright database. Everything here belongs to the user's worlds
 * and is included in backups. Secrets (AI keys) live in a separate database
 * that is never exported.
 *
 * Adding a module's own tables: bump the version below and add namespaced
 * stores (e.g. `npc_profiles`). Never rename or drop a core store without a
 * migration in `.upgrade()`.
 */
export class LorewrightDB extends Dexie {
  worlds!: EntityTable<World, 'id'>
  categories!: EntityTable<Category, 'id'>
  pages!: EntityTable<Page, 'id'>
  pageBodies!: EntityTable<PageBody, 'pageId'>
  links!: EntityTable<Link, 'id'>
  eras!: EntityTable<Era, 'id'>

  constructor(name = 'lorewright') {
    super(name)
    this.version(1).stores({
      worlds: 'id, updatedAt',
      categories: 'id, worldId, [worldId+order]',
      pages: 'id, worldId, [worldId+categoryId], [worldId+updatedAt], [worldId+dateSort], *keys',
      pageBodies: 'pageId',
      links: '++id, worldId, fromPageId, toPageId, [worldId+toKey]',
      eras: 'id, worldId',
    })
  }
}

export const db = new LorewrightDB()

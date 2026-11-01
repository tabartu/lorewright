import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db/db'
import { getCategories } from '../lore/api'
import { createPage } from '../lore/pages'
import { createWorld } from '../lore/worlds'
import { BackupError, exportWorld, parseBackup, restoreWorld } from './backup'

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
})

async function seed() {
  const world = await createWorld({ name: 'Kül Denizi', genre: '', tone: '', contentLanguage: 'tr', summary: '', cover: 'rust' })
  const [cat] = await getCategories(world.id)
  await createPage({ worldId: world.id, categoryId: cat.id, title: 'İskender Han', body: 'Lives in [[Işıklı Liman]].' })
  await createPage({ worldId: world.id, categoryId: cat.id, title: 'Işıklı Liman' })
  return world
}

describe('backup', () => {
  it('round-trips a world through JSON and rebuilds links', async () => {
    const world = await seed()
    const json = JSON.stringify(await exportWorld(world.id))
    await Promise.all(db.tables.map((t) => t.clear()))
    const id = await restoreWorld(parseBackup(json), 'replace')
    expect(id).toBe(world.id)
    expect(await db.pages.where('worldId').equals(id).count()).toBe(2)
    const links = await db.links.where('worldId').equals(id).toArray()
    expect(links).toHaveLength(1)
    expect(links[0].toPageId).toBeTruthy()
  })

  it('imports a copy next to the original with fresh ids', async () => {
    const world = await seed()
    const backup = await exportWorld(world.id)
    const copyId = await restoreWorld(backup, 'copy', 'Copy')
    expect(copyId).not.toBe(world.id)
    expect(await db.worlds.count()).toBe(2)
    expect(await db.pages.where('worldId').equals(copyId).count()).toBe(2)
    const links = await db.links.where('worldId').equals(copyId).toArray()
    expect(links[0].toPageId).toBeTruthy()
  })

  it('rejects files that are not backups', () => {
    expect(() => parseBackup('nope')).toThrow(BackupError)
    expect(() => parseBackup('{"format":"other"}')).toThrow('wrong_format')
    expect(() => parseBackup('{"format":"worldledger-backup","version":99}')).toThrow('newer_version')
  })
})

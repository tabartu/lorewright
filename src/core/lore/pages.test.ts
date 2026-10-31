import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db/db'
import { getBacklinks, getCategories } from './api'
import { createPage, deletePage, getPageBody, updatePage } from './pages'
import { createWorld } from './worlds'

async function setup() {
  const world = await createWorld({
    name: 'Test', genre: '', tone: '', contentLanguage: 'en', summary: '', cover: 'lapis',
  })
  const [character] = await getCategories(world.id)
  return { world, categoryId: character.id }
}

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
})

describe('pages and links', () => {
  it('creates red links that resolve when the target page is created', async () => {
    const { world, categoryId } = await setup()
    const a = await createPage({ worldId: world.id, categoryId, title: 'Aldric', body: 'Serves [[Queen Maelis]].' })
    let [link] = await db.links.where('fromPageId').equals(a.id).toArray()
    expect(link.toPageId).toBeUndefined()
    const q = await createPage({ worldId: world.id, categoryId, title: 'queen maelis' })
    ;[link] = await db.links.where('fromPageId').equals(a.id).toArray()
    expect(link.toPageId).toBe(q.id)
    expect((await getBacklinks(q.id)).map((p) => p.id)).toEqual([a.id])
  })

  it('rejects duplicate titles per world (folded)', async () => {
    const { world, categoryId } = await setup()
    await createPage({ worldId: world.id, categoryId, title: 'İnci Adası' })
    await expect(createPage({ worldId: world.id, categoryId, title: 'inci adasi' })).rejects.toThrow('title_taken')
  })

  it('rewrites incoming links on rename', async () => {
    const { world, categoryId } = await setup()
    const target = await createPage({ worldId: world.id, categoryId, title: 'Maelis' })
    const src = await createPage({ worldId: world.id, categoryId, title: 'Aldric', body: 'Loves [[Maelis]] and [[maelis|her]].' })
    const { rewrittenLinks } = await updatePage(target.id, { title: 'Queen Maelis' })
    expect(rewrittenLinks).toBe(2)
    expect(await getPageBody(src.id)).toBe('Loves [[Queen Maelis]] and [[Queen Maelis|her]].')
    const [link] = await db.links.where('fromPageId').equals(src.id).toArray()
    expect(link.toPageId).toBe(target.id)
  })

  it('turns links red again when the target is deleted', async () => {
    const { world, categoryId } = await setup()
    const target = await createPage({ worldId: world.id, categoryId, title: 'Saltspire' })
    const src = await createPage({ worldId: world.id, categoryId, title: 'Siege', body: '[[Saltspire]]' })
    await deletePage(target.id)
    const [link] = await db.links.where('fromPageId').equals(src.id).toArray()
    expect(link.toPageId).toBeUndefined()
  })
})

import { db } from '../db/db'
import { dateSortKey } from './calendar'
import { LoreError } from './errors'
import { countWords, foldKey, makeExcerpt, markdownToPlain, newId } from './normalize'
import type { ID, Link, Page, PageStatus, WorldDate } from './types'
import { renameMarkerRefs } from './maps'
import { parseWikiLinks, rewriteWikiLinks } from './wikilinks'

export interface PageInput {
  worldId: ID
  categoryId: ID
  title: string
  body?: string
  status?: PageStatus
  aliases?: string[]
  fields?: Record<string, unknown>
  date?: WorldDate
  endDate?: WorldDate
}

export interface PagePatch {
  title?: string
  body?: string
  categoryId?: ID
  status?: PageStatus
  aliases?: string[]
  fields?: Record<string, unknown>
  date?: WorldDate | null
  endDate?: WorldDate | null
}

function pageKeys(title: string, aliases: string[]): string[] {
  return [...new Set([foldKey(title), ...aliases.map(foldKey)].filter(Boolean))]
}

function textStats(body: string) {
  const plain = markdownToPlain(body)
  return { wordCount: countWords(plain), excerpt: makeExcerpt(plain) }
}

/** Collect every outgoing reference of a page: body links and page-reference fields. */
function outgoingRefs(body: string, fields: Record<string, unknown>): Array<{ title: string; source: string }> {
  const refs = parseWikiLinks(body).map((m) => ({ title: m.target, source: 'body' }))
  for (const [fieldId, value] of Object.entries(fields)) {
    const titles = Array.isArray(value) ? value : [value]
    for (const v of titles) {
      if (v && typeof v === 'object' && 'ref' in v && typeof (v as { ref: unknown }).ref === 'string') {
        refs.push({ title: (v as { ref: string }).ref, source: fieldId })
      }
    }
  }
  return refs
}

async function findByKey(worldId: ID, key: string): Promise<Page | undefined> {
  if (!key) return undefined
  return db.pages
    .where('keys')
    .equals(key)
    .filter((p) => p.worldId === worldId)
    .first()
}

/** Rebuild the link rows that start at `page`. Must run inside a transaction. */
async function reindexLinks(page: Page, body: string): Promise<void> {
  await db.links.where('fromPageId').equals(page.id).delete()
  const refs = outgoingRefs(body, page.fields)
  const seen = new Set<string>()
  const rows: Link[] = []
  for (const ref of refs) {
    const toKey = foldKey(ref.title)
    const dedupe = `${toKey}\u0000${ref.source}`
    if (!toKey || seen.has(dedupe)) continue
    seen.add(dedupe)
    const target = await findByKey(page.worldId, toKey)
    rows.push({
      worldId: page.worldId,
      fromPageId: page.id,
      toKey,
      toTitle: ref.title,
      toPageId: target?.id,
      source: ref.source,
    })
  }
  if (rows.length) await db.links.bulkAdd(rows)
}

/** Point red links whose key matches one of `keys` at `pageId`. */
async function resolveIncoming(worldId: ID, keys: string[], pageId: ID): Promise<void> {
  if (!keys.length) return
  await db.links
    .where('[worldId+toKey]')
    .anyOf(keys.map((k) => [worldId, k]))
    .modify({ toPageId: pageId })
}

/** Links that pointed at `pageId` through keys it no longer has become red (or re-resolve). */
async function releaseStaleIncoming(worldId: ID, pageId: ID, keys: string[]): Promise<void> {
  const stale = await db.links
    .where('toPageId')
    .equals(pageId)
    .filter((l) => !keys.includes(l.toKey))
    .toArray()
  for (const link of stale) {
    const other = await findByKey(worldId, link.toKey)
    await db.links.update(link.id!, { toPageId: other?.id })
  }
}

async function assertTitleFree(worldId: ID, keys: string[], selfId?: ID) {
  for (const key of keys) {
    const existing = await findByKey(worldId, key)
    if (existing && existing.id !== selfId) throw new LoreError('title_taken')
  }
}

export async function createPage(input: PageInput): Promise<Page> {
  const title = input.title.trim()
  if (!title) throw new LoreError('title_required')
  const aliases = (input.aliases ?? []).map((a) => a.trim()).filter(Boolean)
  const keys = pageKeys(title, aliases)
  const body = input.body ?? ''
  const now = Date.now()
  const page: Page = {
    id: newId(),
    worldId: input.worldId,
    categoryId: input.categoryId,
    title,
    titleKey: foldKey(title),
    aliases,
    keys,
    fields: input.fields ?? {},
    date: input.date,
    endDate: input.endDate,
    dateSort: dateSortKey(input.date),
    status: input.status ?? (body.trim() ? 'draft' : 'stub'),
    ...textStats(body),
    createdAt: now,
    updatedAt: now,
  }
  await db.transaction('rw', [db.pages, db.pageBodies, db.links, db.worlds], async () => {
    await assertTitleFree(page.worldId, keys)
    await db.pages.add(page)
    await db.pageBodies.put({ pageId: page.id, body })
    await reindexLinks(page, body)
    await resolveIncoming(page.worldId, keys, page.id)
    await db.worlds.update(page.worldId, { updatedAt: now })
  })
  return page
}

/**
 * Update a page. Renaming rewrites `[[Old Title]]` in every page that links to
 * it, so links keep working. Returns how many links were rewritten.
 */
export async function updatePage(id: ID, patch: PagePatch): Promise<{ rewrittenLinks: number }> {
  let rewrittenLinks = 0
  await db.transaction('rw', [db.pages, db.pageBodies, db.links, db.worlds, db.markers], async () => {
    const page = await db.pages.get(id)
    if (!page) throw new LoreError('not_found')
    const now = Date.now()
    const oldKey = page.titleKey
    const title = patch.title !== undefined ? patch.title.trim() : page.title
    if (!title) throw new LoreError('title_required')
    const aliases =
      patch.aliases !== undefined ? patch.aliases.map((a) => a.trim()).filter(Boolean) : page.aliases
    const keys = pageKeys(title, aliases)
    const newKey = foldKey(title)
    await assertTitleFree(page.worldId, keys, page.id)

    let body = patch.body ?? (await db.pageBodies.get(id))?.body ?? ''
    const renamed = newKey !== oldKey

    if (renamed) {
      // Rewrite links in this page's own body first (self-links).
      body = rewriteWikiLinks(body, oldKey, title).text
    }

    const date = patch.date === null ? undefined : (patch.date ?? page.date)
    const endDate = patch.endDate === null ? undefined : (patch.endDate ?? page.endDate)
    const next: Page = {
      ...page,
      title,
      titleKey: newKey,
      aliases,
      keys,
      categoryId: patch.categoryId ?? page.categoryId,
      status: patch.status ?? page.status,
      fields: patch.fields ?? page.fields,
      date,
      endDate,
      dateSort: dateSortKey(date),
      ...textStats(body),
      updatedAt: now,
    }
    await db.pages.put(next)
    await db.pageBodies.put({ pageId: id, body })
    await reindexLinks(next, body)

    if (renamed) {
      const incoming = await db.links.where('[worldId+toKey]').equals([page.worldId, oldKey]).toArray()
      const sources = [...new Set(incoming.map((l) => l.fromPageId))].filter((pid) => pid !== id)
      for (const sourceId of sources) {
        const source = await db.pages.get(sourceId)
        const sourceBody = (await db.pageBodies.get(sourceId))?.body ?? ''
        if (!source) continue
        const result = rewriteWikiLinks(sourceBody, oldKey, title)
        const fields = renameRefsInFields(source.fields, oldKey, title)
        rewrittenLinks += result.count + fields.count
        const updated: Page = { ...source, fields: fields.fields, ...textStats(result.text), updatedAt: now }
        await db.pages.put(updated)
        await db.pageBodies.put({ pageId: sourceId, body: result.text })
        await reindexLinks(updated, result.text)
      }
    }

    if (renamed) await renameMarkerRefs(page.worldId, oldKey, title)
    await releaseStaleIncoming(page.worldId, id, keys)
    await resolveIncoming(page.worldId, keys, id)
    await db.worlds.update(page.worldId, { updatedAt: now })
  })
  return { rewrittenLinks }
}

function renameRefsInFields(fields: Record<string, unknown>, oldKey: string, title: string) {
  let count = 0
  const rename = (v: unknown) => {
    if (v && typeof v === 'object' && 'ref' in v && foldKey(String((v as { ref: unknown }).ref)) === oldKey) {
      count++
      return { ...(v as object), ref: title }
    }
    return v
  }
  const next: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(fields)) next[k] = Array.isArray(v) ? v.map(rename) : rename(v)
  return { fields: next, count }
}

export async function deletePage(id: ID): Promise<void> {
  await db.transaction('rw', [db.pages, db.pageBodies, db.links, db.worlds], async () => {
    const page = await db.pages.get(id)
    if (!page) return
    await db.links.where('fromPageId').equals(id).delete()
    await db.links.where('toPageId').equals(id).modify((l: Link) => {
      delete l.toPageId
    })
    await db.pageBodies.delete(id)
    await db.pages.delete(id)
    await db.worlds.update(page.worldId, { updatedAt: Date.now() })
  })
}

export async function getPageBody(id: ID): Promise<string> {
  return (await db.pageBodies.get(id))?.body ?? ''
}

export { findByKey as findPageByKey }

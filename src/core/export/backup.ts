import { db } from '../db/db'
import { newId } from '../lore/normalize'
import { rebuildLinks } from '../lore/pages'
import type { Category, Era, ID, MapDoc, Marker, Page, PageBody, World } from '../lore/types'

/**
 * JSON backup of one world. Contains everything needed to restore it,
 * including map images as data URLs. It never contains AI keys: those live
 * in a separate database this module does not touch.
 */
export const BACKUP_FORMAT = 'worldledger-backup'
export const BACKUP_VERSION = 1

export interface WorldBackup {
  format: typeof BACKUP_FORMAT
  version: number
  exportedAt: string
  world: World
  categories: Category[]
  pages: Page[]
  bodies: PageBody[]
  eras: Era[]
  maps: MapDoc[]
  mapImages: Array<{ id: ID; dataUrl: string }>
  markers: Marker[]
}

export class BackupError extends Error {
  readonly code: 'not_json' | 'wrong_format' | 'newer_version' | 'incomplete'
  constructor(code: BackupError['code']) {
    super(code)
    this.code = code
  }
}

export async function exportWorld(worldId: ID): Promise<WorldBackup> {
  const world = await db.worlds.get(worldId)
  if (!world) throw new BackupError('incomplete')
  const [categories, pages, eras, maps, markers] = await Promise.all([
    db.categories.where('worldId').equals(worldId).toArray(),
    db.pages.where('worldId').equals(worldId).toArray(),
    db.eras.where('worldId').equals(worldId).toArray(),
    db.maps.where('worldId').equals(worldId).toArray(),
    db.markers.where('worldId').equals(worldId).toArray(),
  ])
  const bodies = (await db.pageBodies.bulkGet(pages.map((p) => p.id))).filter((b): b is PageBody => !!b)
  const images = (await db.mapImages.bulkGet(maps.map((m) => m.imageId))).filter((x) => !!x)
  const mapImages = await Promise.all(images.map(async (img) => ({ id: img!.id, dataUrl: await blobToDataUrl(img!.blob) })))
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), world, categories, pages, bodies, eras, maps, mapImages, markers }
}

export function parseBackup(text: string): WorldBackup {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new BackupError('not_json')
  }
  const b = json as Partial<WorldBackup>
  if (!b || b.format !== BACKUP_FORMAT) throw new BackupError('wrong_format')
  if ((b.version ?? 0) > BACKUP_VERSION) throw new BackupError('newer_version')
  if (!b.world || !Array.isArray(b.pages) || !Array.isArray(b.categories)) throw new BackupError('incomplete')
  return {
    ...b,
    bodies: b.bodies ?? [],
    eras: b.eras ?? [],
    maps: b.maps ?? [],
    mapImages: b.mapImages ?? [],
    markers: b.markers ?? [],
  } as WorldBackup
}

export async function worldExists(id: ID) {
  return !!(await db.worlds.get(id))
}

/**
 * Restore a backup. 'replace' overwrites the world with the same id;
 * 'copy' imports it as a new world with fresh ids (and " (copy)"-style name from the caller).
 */
export async function restoreWorld(backup: WorldBackup, mode: 'replace' | 'copy', copyName?: string): Promise<ID> {
  const data = mode === 'copy' ? remap(backup, copyName) : backup
  const images = await Promise.all(data.mapImages.map(async (m) => ({ id: m.id, blob: await dataUrlToBlob(m.dataUrl) })))
  await db.transaction('rw', [db.worlds, db.categories, db.pages, db.pageBodies, db.links, db.eras, db.maps, db.mapImages, db.markers], async () => {
    const id = data.world.id
    if (mode === 'replace') {
      const pageIds = await db.pages.where('worldId').equals(id).primaryKeys()
      await db.pageBodies.bulkDelete(pageIds)
      await db.pages.where('worldId').equals(id).delete()
      await db.links.where('worldId').equals(id).delete()
      await db.categories.where('worldId').equals(id).delete()
      await db.eras.where('worldId').equals(id).delete()
      const oldMaps = await db.maps.where('worldId').equals(id).toArray()
      await db.mapImages.bulkDelete(oldMaps.map((m) => m.imageId))
      await db.maps.where('worldId').equals(id).delete()
      await db.markers.where('worldId').equals(id).delete()
    }
    await db.worlds.put({ ...data.world, updatedAt: Date.now() })
    await db.categories.bulkPut(data.categories)
    await db.pages.bulkPut(data.pages)
    await db.pageBodies.bulkPut(data.bodies)
    await db.eras.bulkPut(data.eras)
    await db.mapImages.bulkPut(images)
    await db.maps.bulkPut(data.maps)
    await db.markers.bulkPut(data.markers)
  })
  await rebuildLinks(data.world.id)
  return data.world.id
}

/** Give every record a fresh id so a copy can live next to the original. */
function remap(b: WorldBackup, name?: string): WorldBackup {
  const ids = new Map<ID, ID>()
  const fresh = (old: ID) => {
    if (!ids.has(old)) ids.set(old, newId())
    return ids.get(old)!
  }
  const worldId = fresh(b.world.id)
  return {
    ...b,
    world: { ...b.world, id: worldId, name: name ?? b.world.name, createdAt: Date.now() },
    categories: b.categories.map((c) => ({ ...c, id: fresh(c.id), worldId })),
    pages: b.pages.map((p) => ({ ...p, id: fresh(p.id), worldId, categoryId: fresh(p.categoryId) })),
    bodies: b.bodies.map((x) => ({ ...x, pageId: fresh(x.pageId) })),
    eras: b.eras.map((e) => ({ ...e, id: fresh(e.id), worldId })),
    maps: b.maps.map((m) => ({ ...m, id: fresh(m.id), worldId, imageId: fresh(m.imageId) })),
    mapImages: b.mapImages.map((m) => ({ ...m, id: fresh(m.id) })),
    markers: b.markers.map((m) => ({ ...m, id: fresh(m.id), worldId, mapId: fresh(m.mapId) })),
  }
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const [head, data] = dataUrl.split(',')
  const mime = head.match(/data:([^;]+)/)?.[1] ?? 'application/octet-stream'
  const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0))
  return new Blob([bytes], { type: mime })
}

/** Trigger a download of a Blob with a filename. */
export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** A filesystem-safe name that keeps letters of every script. */
export function safeFileName(name: string): string {
  return (
    name
      .normalize('NFC')
      .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120) || 'untitled'
  )
}

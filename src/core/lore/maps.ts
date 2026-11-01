import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { foldKey, newId } from './normalize'
import type { ID, MapDoc, Marker } from './types'

/** Read an image file's natural size. */
async function imageSize(blob: Blob): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(blob)
  const size = { width: bitmap.width, height: bitmap.height }
  bitmap.close()
  return size
}

export async function createMap(worldId: ID, name: string, file: Blob): Promise<MapDoc> {
  const { width, height } = await imageSize(file)
  const now = Date.now()
  const map: MapDoc = { id: newId(), worldId, name: name.trim() || 'Map', imageId: newId(), width, height, createdAt: now, updatedAt: now }
  await db.transaction('rw', [db.maps, db.mapImages, db.worlds], async () => {
    await db.mapImages.add({ id: map.imageId, blob: file })
    await db.maps.add(map)
    await db.worlds.update(worldId, { updatedAt: now })
  })
  return map
}

export async function renameMap(id: ID, name: string) {
  if (name.trim()) await db.maps.update(id, { name: name.trim(), updatedAt: Date.now() })
}

export async function deleteMap(id: ID) {
  await db.transaction('rw', [db.maps, db.mapImages, db.markers], async () => {
    const map = await db.maps.get(id)
    if (!map) return
    await db.markers.where('mapId').equals(id).delete()
    await db.mapImages.delete(map.imageId)
    await db.maps.delete(id)
  })
}

export async function addMarker(marker: Omit<Marker, 'id'>): Promise<Marker> {
  const m = { ...marker, id: newId() }
  await db.markers.add(m)
  return m
}

export async function updateMarker(id: ID, patch: Partial<Omit<Marker, 'id' | 'mapId' | 'worldId'>>) {
  await db.markers.update(id, patch)
}

export async function deleteMarker(id: ID) {
  await db.markers.delete(id)
}

/** When a page is renamed, markers pointing at the old title follow it. */
export async function renameMarkerRefs(worldId: ID, oldKey: string, title: string) {
  await db.markers
    .where('worldId')
    .equals(worldId)
    .filter((m) => !!m.pageTitle && foldKey(m.pageTitle) === oldKey)
    .modify({ pageTitle: title })
}

export function useMaps(worldId: ID | undefined) {
  return useLiveQuery(async () => (worldId ? (await db.maps.where('worldId').equals(worldId).toArray()).sort((a, b) => a.createdAt - b.createdAt) : []), [worldId])
}

export function useMap(id: ID | undefined) {
  return useLiveQuery(async () => (id ? ((await db.maps.get(id)) ?? null) : null), [id])
}

export function useMapImage(imageId: ID | undefined) {
  return useLiveQuery(async () => (imageId ? ((await db.mapImages.get(imageId))?.blob ?? null) : null), [imageId])
}

export function useMarkers(mapId: ID | undefined) {
  return useLiveQuery(async () => (mapId ? db.markers.where('mapId').equals(mapId).toArray() : []), [mapId])
}

/** Markers anywhere in the world that point at a page (by any of its keys). */
export function useMarkersForPage(worldId: ID | undefined, keys: string[]) {
  const sig = keys.join('\u0000')
  return useLiveQuery(async () => {
    if (!worldId || !sig) return []
    const set = new Set(sig.split('\u0000'))
    return db.markers
      .where('worldId')
      .equals(worldId)
      .filter((m) => !!m.pageTitle && set.has(foldKey(m.pageTitle)))
      .toArray()
  }, [worldId, sig])
}

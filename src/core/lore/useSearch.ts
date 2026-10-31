import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { db } from '../db/db'
import { buildSearchIndex } from './search'
import type { ID } from './types'

/** Live full-text index of a world; rebuilt when its pages change. */
export function useWorldSearchIndex(worldId: ID | undefined, enabled = true) {
  const data = useLiveQuery(async () => {
    if (!worldId || !enabled) return null
    const pages = await db.pages.where('worldId').equals(worldId).toArray()
    const bodies = await db.pageBodies.bulkGet(pages.map((p) => p.id))
    return { pages, bodies: new Map(bodies.filter((b) => !!b).map((b) => [b!.pageId, b!.body])) }
  }, [worldId, enabled])
  return useMemo(() => (data ? buildSearchIndex(data.pages, data.bodies) : null), [data])
}

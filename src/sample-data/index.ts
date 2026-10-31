import { db } from '../core/db/db'
import { getCategories } from '../core/lore/api'
import { createPage } from '../core/lore/pages'
import { createWorld, replaceEras } from '../core/lore/worlds'
import { drownedCrown } from './en-drowned-crown'
import { kulDenizi } from './tr-kul-denizi'
import type { SampleWorld } from './types'

export type SampleKind = 'en' | 'tr'

const SAMPLES: Record<SampleKind, SampleWorld> = { en: drownedCrown, tr: kulDenizi }

/** Create a fresh copy of a sample world and return its id. */
export async function loadSampleWorld(kind: SampleKind): Promise<string> {
  const sample = SAMPLES[kind]
  // Opening the sample twice reopens the existing copy instead of duplicating it.
  const existing = await db.worlds.filter((w) => w.name === sample.world.name).first()
  if (existing) return existing.id
  const world = await createWorld(sample.world)
  await replaceEras(world.id, sample.eras)
  const categories = await getCategories(world.id)
  const byBuiltIn = new Map(categories.map((c) => [c.builtIn, c.id]))
  for (const page of sample.pages) {
    await createPage({
      worldId: world.id,
      categoryId: byBuiltIn.get(page.category)!,
      title: page.title,
      aliases: page.aliases,
      status: page.status,
      date: page.date,
      fields: page.fields,
      body: page.body,
    })
  }
  return world.id
}

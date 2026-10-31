import { newId } from './normalize'
import type { BuiltInCategory, Category, ChapterInk, FieldDef, FieldType, ID } from './types'

interface BuiltInSpec {
  ink: ChapterInk
  icon: string
  fields: Array<[key: string, type: FieldType, refCategory?: string]>
}

/**
 * Built-in chapters and their default stat-block fields.
 * Labels come from i18n: `encyclopedia:category.<key>.*` and `encyclopedia:field.<key>`.
 */
export const BUILT_IN_SPECS: Record<BuiltInCategory, BuiltInSpec> = {
  character: {
    ink: 'vermilion',
    icon: 'user-round',
    fields: [
      ['born', 'worldDate'],
      ['died', 'worldDate'],
      ['species', 'text'],
      ['affiliation', 'pageRefs', 'faction'],
      ['home', 'pageRef', 'location'],
      ['occupation', 'text'],
      ['lifeStatus', 'select'],
    ],
  },
  location: {
    ink: 'jade',
    icon: 'map-pin',
    fields: [
      ['locationType', 'text'],
      ['region', 'pageRef', 'location'],
      ['ruler', 'pageRef'],
      ['population', 'text'],
    ],
  },
  faction: {
    ink: 'violet',
    icon: 'shield',
    fields: [
      ['factionType', 'text'],
      ['leader', 'pageRef', 'character'],
      ['headquarters', 'pageRef', 'location'],
      ['founded', 'worldDate'],
      ['dissolved', 'worldDate'],
    ],
  },
  event: {
    ink: 'amber',
    icon: 'calendar-days',
    fields: [
      ['place', 'pageRef', 'location'],
      ['participants', 'pageRefs'],
      ['outcome', 'longtext'],
    ],
  },
  item: {
    ink: 'cobalt',
    icon: 'gem',
    fields: [
      ['itemType', 'text'],
      ['owner', 'pageRef', 'character'],
      ['origin', 'pageRef', 'location'],
      ['rarity', 'text'],
    ],
  },
  creature: {
    ink: 'moss',
    icon: 'paw-print',
    fields: [
      ['classification', 'text'],
      ['habitat', 'pageRefs', 'location'],
      ['danger', 'text'],
    ],
  },
  concept: {
    ink: 'magenta',
    icon: 'sparkles',
    fields: [
      ['conceptType', 'text'],
      ['related', 'pageRefs'],
    ],
  },
}

export const LIFE_STATUS_OPTIONS = ['alive', 'dead', 'unknown'] as const

export function makeBuiltInCategories(worldId: ID): Category[] {
  return (Object.keys(BUILT_IN_SPECS) as BuiltInCategory[]).map((key, order) => {
    const spec = BUILT_IN_SPECS[key]
    const fields: FieldDef[] = spec.fields.map(([fieldKey, type, refCategory]) => ({
      id: fieldKey,
      key: fieldKey,
      type,
      refCategory,
      builtIn: true,
      options: fieldKey === 'lifeStatus' ? [...LIFE_STATUS_OPTIONS] : undefined,
    }))
    return { id: newId(), worldId, builtIn: key, ink: spec.ink, icon: spec.icon, order, fields }
  })
}

/** Display name of a category: translated for built-ins, stored for custom ones. */
export function categoryName(category: Category, t: (key: string) => string, plural = false): string {
  if (category.builtIn) {
    return t(`encyclopedia:category.${category.builtIn}.${plural ? 'plural' : 'singular'}`)
  }
  return category.name ?? ''
}

import type { BuiltInCategory, Era, PageStatus, WorldDate } from '../core/lore/types'
import type { WorldInput } from '../core/lore/worlds'

export interface SamplePage {
  category: BuiltInCategory
  title: string
  aliases?: string[]
  status: PageStatus
  date?: WorldDate
  fields?: Record<string, unknown>
  body: string
}

export interface SampleWorld {
  world: WorldInput
  eras: Omit<Era, 'id' | 'worldId'>[]
  pages: SamplePage[]
}

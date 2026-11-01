/**
 * Core lore domain types. Every module reads lore through these shapes
 * (see `api.ts`), so changes here are changes to the public contract.
 */

export type ID = string

/** Printing inks a world can choose for its cover (masthead band, shelf spine). */
export const COVER_INKS = ['lapis', 'viridian', 'oxblood', 'ochre', 'plum', 'slate', 'teal', 'rust'] as const
export type CoverInk = (typeof COVER_INKS)[number]

/** Chapter inks used to colour-code categories. */
export const CHAPTER_INKS = [
  'vermilion',
  'jade',
  'violet',
  'amber',
  'cobalt',
  'moss',
  'magenta',
  'sienna',
  'cyan',
  'graphite',
] as const
export type ChapterInk = (typeof CHAPTER_INKS)[number]

export interface CalendarMonth {
  name: string
  days: number
}

/** A world's own calendar. Year-only calendars are valid (no months). */
export interface Calendar {
  /** e.g. "after the Founding" */
  yearLabel: string
  /** e.g. "AF" */
  yearAbbr: string
  /** e.g. "before the Founding" — used for negative years. */
  negativeLabel?: string
  negativeAbbr?: string
  months?: CalendarMonth[]
}

export interface World {
  id: ID
  name: string
  genre: string
  tone: string
  /** BCP-47 language tag of the lore itself. AI writes in this language. */
  contentLanguage: string
  summary: string
  cover: CoverInk
  calendar: Calendar
  createdAt: number
  updatedAt: number
}

export interface Era {
  id: ID
  worldId: ID
  name: string
  startYear: number
  endYear?: number
  ink: ChapterInk
  order: number
}

export const BUILT_IN_CATEGORIES = [
  'character',
  'location',
  'faction',
  'event',
  'item',
  'creature',
  'concept',
] as const
export type BuiltInCategory = (typeof BUILT_IN_CATEGORIES)[number]

export type FieldType =
  | 'text'
  | 'longtext'
  | 'number'
  | 'worldDate'
  | 'pageRef'
  | 'pageRefs'
  | 'select'
  | 'tags'
  | 'boolean'

export interface FieldDef {
  id: ID
  /** Stable key. Built-in fields are labelled via i18n `encyclopedia:field.<key>`. */
  key: string
  /** Label for custom fields only. */
  label?: string
  type: FieldType
  options?: string[]
  /** For pageRef(s): the built-in category or category id the reference prefers. */
  refCategory?: string
  builtIn?: boolean
}

export interface Category {
  id: ID
  worldId: ID
  builtIn?: BuiltInCategory
  /** Name for custom categories only; built-ins are translated. */
  name?: string
  ink: ChapterInk
  icon: string
  order: number
  fields: FieldDef[]
}

export type PageStatus = 'stub' | 'draft' | 'complete'

export interface WorldDate {
  year: number
  month?: number
  day?: number
  approximate?: boolean
}

/**
 * Page metadata. The Markdown body lives in `PageBody` so lists, indexes,
 * the timeline and the graph never load full texts.
 */
export interface Page {
  id: ID
  worldId: ID
  categoryId: ID
  title: string
  /** Normalized title (see `foldKey`). Unique per world. */
  titleKey: string
  aliases: string[]
  /** titleKey + folded aliases; multi-entry index used to resolve links. */
  keys: string[]
  fields: Record<string, unknown>
  date?: WorldDate
  endDate?: WorldDate
  /** Sortable number derived from `date`. */
  dateSort?: number
  status: PageStatus
  wordCount: number
  excerpt: string
  createdAt: number
  updatedAt: number
}

export interface PageBody {
  pageId: ID
  body: string
}

/** An uploaded map image of a world. */
export interface MapDoc {
  id: ID
  worldId: ID
  name: string
  imageId: ID
  width: number
  height: number
  createdAt: number
  updatedAt: number
}

export interface MapImage {
  id: ID
  blob: Blob
}

/** A pin on a map, in image pixel coordinates; usually linked to a page by title. */
export interface Marker {
  id: ID
  worldId: ID
  mapId: ID
  /** Linked page title (resolved like a [[link]]), or empty for a plain label. */
  pageTitle?: string
  label?: string
  x: number
  y: number
}

/** Derived index of every [[link]] and page reference. Rebuilt on save. */
export interface Link {
  id?: number
  worldId: ID
  fromPageId: ID
  /** Folded target title. */
  toKey: string
  /** Target title as written (used to label red links). */
  toTitle: string
  /** Resolved page, or undefined for a red link. */
  toPageId?: ID
  /** 'body' or the FieldDef id of a page-reference field. */
  source: string
}

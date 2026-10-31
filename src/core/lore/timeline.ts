import { dateSortKey } from './calendar'
import { isWorldDate } from './fields'
import type { Category, Era, FieldDef, ID, Page, WorldDate } from './types'

export interface TimelineEntry {
  key: string
  pageId: ID
  title: string
  categoryId: ID
  /** 'page' for a page's own date (events); otherwise a stat-block date field. */
  source: 'page' | 'field'
  field?: FieldDef
  date: WorldDate
  endDate?: WorldDate
  sort: number
}

/**
 * Collect everything with a world date: event pages (their own date range)
 * and, optionally, date fields from stat blocks (born, died, founded…).
 */
export function buildTimeline(pages: Page[], categories: Category[], includeFields: boolean): TimelineEntry[] {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const out: TimelineEntry[] = []
  for (const p of pages) {
    if (p.date) {
      out.push({ key: `${p.id}:page`, pageId: p.id, title: p.title, categoryId: p.categoryId, source: 'page', date: p.date, endDate: p.endDate, sort: dateSortKey(p.date)! })
    }
    if (!includeFields) continue
    for (const f of byId.get(p.categoryId)?.fields ?? []) {
      const v = p.fields[f.id]
      if (f.type === 'worldDate' && isWorldDate(v)) {
        out.push({ key: `${p.id}:${f.id}`, pageId: p.id, title: p.title, categoryId: p.categoryId, source: 'field', field: f, date: v, sort: dateSortKey(v)! })
      }
    }
  }
  return out.sort((a, b) => a.sort - b.sort || (a.source === 'page' ? -1 : 1))
}

export interface EraGroup {
  era?: Era
  entries: TimelineEntry[]
}

/** Split sorted entries into era bands; entries outside every era form unnamed groups in order. */
export function groupByEra(entries: TimelineEntry[], eras: Era[]): EraGroup[] {
  const sorted = [...eras].sort((a, b) => a.startYear - b.startYear || a.order - b.order)
  const find = (year: number) =>
    sorted.filter((e) => year >= e.startYear && (e.endYear === undefined || year <= e.endYear)).at(-1)
  const groups: EraGroup[] = []
  for (const entry of entries) {
    const era = find(entry.date.year)
    const last = groups.at(-1)
    if (last && last.era?.id === era?.id) last.entries.push(entry)
    else groups.push({ era, entries: [entry] })
  }
  // Eras with no entries still appear as bands, so the world's history reads complete.
  for (const era of sorted) {
    if (groups.some((g) => g.era?.id === era.id)) continue
    const at = groups.findIndex((g) => (g.entries[0]?.date.year ?? Infinity) > era.startYear)
    groups.splice(at < 0 ? groups.length : at, 0, { era, entries: [] })
  }
  return groups
}

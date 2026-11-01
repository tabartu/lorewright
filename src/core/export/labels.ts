import type { Category, FieldDef, WorldDate } from '../lore/types'

/** Translated words the exporters need; supplied by the UI in the interface language. */
export interface ExportLabels {
  category: (c: Category, plural?: boolean) => string
  field: (f: FieldDef) => string
  option: (f: FieldDef, value: string) => string
  date: (d: WorldDate) => string
  yes: string
  no: string
  contents: string
  linksHere: string
  dateLabel: string
  aliases: string
  maps: string
  generated: string
  lang: string
}

/** Plain-text value of a stat-block field, with page references as [[links]] (Markdown) or titles. */
export function fieldText(f: FieldDef, v: unknown, labels: ExportLabels, asLinks: boolean): string | null {
  if (v === undefined || v === null || v === '') return null
  const ref = (x: unknown) => {
    const title = x && typeof x === 'object' && 'ref' in x ? String((x as { ref: unknown }).ref) : String(x)
    return asLinks ? `[[${title}]]` : title
  }
  switch (f.type) {
    case 'worldDate':
      return v && typeof v === 'object' && 'year' in v ? labels.date(v as WorldDate) : null
    case 'pageRef':
      return ref(v)
    case 'pageRefs':
      return Array.isArray(v) && v.length ? v.map(ref).join(', ') : null
    case 'tags':
      return Array.isArray(v) && v.length ? v.join(', ') : null
    case 'boolean':
      return v ? labels.yes : labels.no
    case 'select':
      return labels.option(f, String(v))
    default:
      return String(v)
  }
}

import type { FieldDef, WorldDate } from './types'

/** Stored shape of a page-reference field value: the target's title. */
export interface PageRefValue {
  ref: string
}

export function isPageRef(v: unknown): v is PageRefValue {
  return !!v && typeof v === 'object' && typeof (v as PageRefValue).ref === 'string'
}

export function isWorldDate(v: unknown): v is WorldDate {
  return !!v && typeof v === 'object' && Number.isFinite((v as WorldDate).year)
}

/** Label of a field: translated for built-ins, stored for custom fields. */
export function fieldLabel(field: FieldDef, t: (key: string) => string): string {
  return field.builtIn ? t(`encyclopedia:field.${field.key}`) : (field.label ?? field.key)
}

/** Label of a select option: built-in options are translated (e.g. life status). */
export function optionLabel(field: FieldDef, option: string, t: (key: string) => string): string {
  return field.builtIn && field.key === 'lifeStatus' ? t(`encyclopedia:lifeStatus.${option}`) : option
}

export function isEmptyValue(field: FieldDef, v: unknown): boolean {
  if (v === undefined || v === null) return true
  switch (field.type) {
    case 'text':
    case 'longtext':
    case 'select':
      return typeof v !== 'string' || !v.trim()
    case 'number':
      return typeof v !== 'number' || !Number.isFinite(v)
    case 'boolean':
      return typeof v !== 'boolean'
    case 'worldDate':
      return !isWorldDate(v)
    case 'pageRef':
      return !isPageRef(v) || !v.ref.trim()
    case 'pageRefs':
    case 'tags':
      return !Array.isArray(v) || v.length === 0
  }
}

/** Drop empty values so stored pages stay small and the stat block stays honest. */
export function cleanFields(defs: FieldDef[], values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const known = new Set(defs.map((d) => d.id))
  for (const def of defs) {
    const v = values[def.id]
    if (!isEmptyValue(def, v)) out[def.id] = v
  }
  // Keep values of fields from another category so switching chapters back loses nothing.
  for (const [k, v] of Object.entries(values)) if (!known.has(k) && v !== undefined) out[k] = v
  return out
}

import type { Calendar, WorldDate } from './types'

/** Sortable number for a world date: year-major, month and day as fractions. */
export function dateSortKey(date: WorldDate | undefined): number | undefined {
  if (!date || !Number.isFinite(date.year)) return undefined
  const month = date.month ?? 0
  const day = date.day ?? 0
  return date.year * 10000 + month * 100 + day
}

/**
 * Format a world date with the world's calendar, using the interface locale
 * for numerals. Returns parts so the caller can translate the template.
 */
export function formatWorldDate(
  date: WorldDate,
  calendar: Calendar,
  locale: string,
): { year: string; era: string; month?: string; day?: string; approximate: boolean } {
  const nf = new Intl.NumberFormat(locale, { useGrouping: false })
  const negative = date.year < 0
  const era = negative
    ? (calendar.negativeAbbr ?? calendar.negativeLabel ?? '')
    : calendar.yearAbbr || calendar.yearLabel
  const month = date.month && calendar.months?.[date.month - 1]?.name
  return {
    year: nf.format(Math.abs(date.year)),
    era,
    month: month || (date.month ? nf.format(date.month) : undefined),
    day: date.day ? nf.format(date.day) : undefined,
    approximate: !!date.approximate,
  }
}

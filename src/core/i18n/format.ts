import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatWorldDate } from '../lore/calendar'
import type { Calendar, WorldDate } from '../lore/types'

/** Locale-aware formatters bound to the current interface language. */
export function useFormat() {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? 'en'
  return useMemo(() => {
    const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })
    const dateTimeFmt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })
    const numberFmt = new Intl.NumberFormat(locale)
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
      ['year', 31536000],
      ['month', 2592000],
      ['week', 604800],
      ['day', 86400],
      ['hour', 3600],
      ['minute', 60],
    ]
    return {
      locale,
      date: (ms: number) => dateFmt.format(ms),
      dateTime: (ms: number) => dateTimeFmt.format(ms),
      number: (n: number) => numberFmt.format(n),
      relative(ms: number) {
        const diff = (ms - Date.now()) / 1000
        for (const [unit, secs] of units) {
          if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit)
        }
        return rtf.format(0, 'minute')
      },
      worldDate(date: WorldDate, calendar: Calendar) {
        const p = formatWorldDate(date, calendar, locale)
        const core = p.month
          ? p.day
            ? t('encyclopedia:date.dayMonthYear', { day: p.day, month: p.month, year: p.year, era: p.era })
            : t('encyclopedia:date.monthYear', { month: p.month, year: p.year, era: p.era })
          : t('encyclopedia:date.year', { year: p.year, era: p.era })
        return (p.approximate ? t('encyclopedia:date.approximate', { date: core }) : core).trim()
      },
      /** Display name of a language tag in the interface language, e.g. "tr" → "Turkish". */
      languageName(tag: string) {
        try {
          return new Intl.DisplayNames([locale], { type: 'language' }).of(tag) ?? tag
        } catch {
          return tag
        }
      },
    }
  }, [locale, t])
}

/** Collator for sorting lore in its own content language. */
export function contentCollator(contentLanguage: string) {
  return new Intl.Collator(contentLanguage, { sensitivity: 'base', numeric: true })
}

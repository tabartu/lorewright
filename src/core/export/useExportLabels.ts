import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useFormat } from '../i18n/format'
import { categoryName } from '../lore/categories'
import { fieldLabel, optionLabel } from '../lore/fields'
import type { Calendar } from '../lore/types'
import type { ExportLabels } from './labels'

/** Export wording in the current interface language. */
export function useExportLabels(calendar: Calendar): ExportLabels {
  const { t, i18n } = useTranslation()
  const fmt = useFormat()
  return useMemo(
    () => ({
      category: (c, plural) => categoryName(c, t, plural),
      field: (f) => fieldLabel(f, t),
      option: (f, v) => optionLabel(f, v, t),
      date: (d) => fmt.worldDate(d, calendar),
      yes: t('common:yes'),
      no: t('common:no'),
      contents: t('encyclopedia:home.contents'),
      linksHere: t('encyclopedia:backlinks.title'),
      dateLabel: t('encyclopedia:field.date'),
      aliases: t('encyclopedia:page.aliases'),
      maps: t('encyclopedia:maps.title'),
      generated: t('encyclopedia:export.generated', { date: fmt.date(Date.now()) }),
      lang: i18n.resolvedLanguage ?? 'en',
    }),
    [t, fmt, calendar, i18n.resolvedLanguage],
  )
}

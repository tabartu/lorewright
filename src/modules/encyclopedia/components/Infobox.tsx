import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { useFormat } from '../../../core/i18n/format'
import { useResolveKeys } from '../../../core/lore/api'
import { fieldLabel, isEmptyValue, isPageRef, isWorldDate, optionLabel } from '../../../core/lore/fields'
import { foldKey } from '../../../core/lore/normalize'
import type { Category, FieldDef, Page, World } from '../../../core/lore/types'
import { WikiRef } from './WikiRef'
import styles from './Infobox.module.css'

interface InfoboxProps {
  page: Page
  category: Category | undefined
  world: World
}

/** The stat block: this chapter's fields with values, then the page's dates. */
export function Infobox({ page, category, world }: InfoboxProps) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const defs = category?.fields ?? []
  const filled = defs.filter((d) => !isEmptyValue(d, page.fields[d.id]))
  const refTitles = filled.flatMap((d) => {
    const v = page.fields[d.id]
    return d.type === 'pageRef' && isPageRef(v) ? [v.ref] : d.type === 'pageRefs' && Array.isArray(v) ? v.filter(isPageRef).map((r) => r.ref) : []
  })
  const resolved = useResolveKeys(world.id, refTitles.map(foldKey))

  const ref = (title: string) => <WikiRef key={title} title={title} worldId={world.id} target={resolved?.get(foldKey(title))} />

  function render(def: FieldDef) {
    const v = page.fields[def.id]
    switch (def.type) {
      case 'worldDate':
        return isWorldDate(v) ? fmt.worldDate(v, world.calendar) : null
      case 'pageRef':
        return isPageRef(v) ? ref(v.ref) : null
      case 'pageRefs':
        return Array.isArray(v)
          ? v.filter(isPageRef).map((r, i) => (
              <Fragment key={r.ref}>
                {i > 0 && ', '}
                {ref(r.ref)}
              </Fragment>
            ))
          : null
      case 'tags':
        return Array.isArray(v) ? v.join(', ') : null
      case 'boolean':
        return t(v ? 'common:yes' : 'common:no')
      case 'number':
        return typeof v === 'number' ? fmt.number(v) : null
      case 'select':
        return typeof v === 'string' ? optionLabel(def, v, t) : null
      default:
        return typeof v === 'string' ? v : null
    }
  }

  const hasDate = !!page.date
  const empty = filled.length === 0 && !hasDate

  return (
    <aside className={styles.statBlock} aria-label={t('encyclopedia:page.facts')}>
      <h2 className={styles.title} lang={world.contentLanguage}>
        {page.title}
      </h2>
      {empty ? (
        <p className={styles.empty}>{t('encyclopedia:infobox.empty')}</p>
      ) : (
        <dl className={styles.stats}>
          {hasDate && (
            <div>
              <dt>{t('encyclopedia:field.date')}</dt>
              <dd lang={world.contentLanguage}>
                {fmt.worldDate(page.date!, world.calendar)}
                {page.endDate && ` – ${fmt.worldDate(page.endDate, world.calendar)}`}
              </dd>
            </div>
          )}
          {filled.map((d) => (
            <div key={d.id} data-type={d.type}>
              <dt>{fieldLabel(d, t)}</dt>
              <dd lang={world.contentLanguage}>{render(d)}</dd>
            </div>
          ))}
        </dl>
      )}
    </aside>
  )
}

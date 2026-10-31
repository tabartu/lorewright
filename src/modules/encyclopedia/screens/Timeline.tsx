import { CalendarPlus, Settings } from 'lucide-react'
import { Fragment, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useWorldContext } from '../../../app/shell/WorldLayout'
import { useDocumentTitle } from '../../../app/shell/useDocumentTitle'
import { useFormat } from '../../../core/i18n/format'
import { useEras, usePages } from '../../../core/lore/api'
import { categoryName } from '../../../core/lore/categories'
import { fieldLabel } from '../../../core/lore/fields'
import { buildTimeline, groupByEra, type TimelineEntry } from '../../../core/lore/timeline'
import { ButtonLink } from '../../../ui/Button'
import { CategoryIcon } from '../../../ui/CategoryIcon'
import styles from './Timeline.module.css'

type Scale = 'compact' | 'proportional'

/** Dated pages along the world's own calendar, banded by era. */
export function Timeline() {
  const { world, categories } = useWorldContext()
  const { t } = useTranslation()
  const fmt = useFormat()
  const pages = usePages(world.id)
  const eras = useEras(world.id)
  const [includeFields, setIncludeFields] = useState(true)
  const [scale, setScale] = useState<Scale>('compact')
  const [zoom, setZoom] = useState(3)
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  useDocumentTitle(t('encyclopedia:timeline.title'), world.name)

  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const all = useMemo(() => (pages ? buildTimeline(pages, categories, includeFields) : []), [pages, categories, includeFields])
  const present = useMemo(() => [...new Set(all.map((e) => e.categoryId))], [all])
  const entries = all.filter((e) => !hidden.has(e.categoryId))
  const groups = useMemo(() => groupByEra(entries, eras ?? []), [entries, eras])
  const eventCategory = categories.find((c) => c.builtIn === 'event')
  const base = `/w/${world.id}`

  const toggle = (id: string) =>
    setHidden((h) => {
      const next = new Set(h)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const span = (e: TimelineEntry) =>
    fmt.worldDate(e.date, world.calendar) + (e.endDate ? ` – ${fmt.worldDate(e.endDate, world.calendar)}` : '')

  let previous: TimelineEntry | undefined

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>{t('encyclopedia:timeline.title')}</h1>
          <p className={styles.lede}>
            {world.calendar.yearLabel
              ? t('encyclopedia:timeline.ledeCalendar', { label: world.calendar.yearLabel })
              : t('encyclopedia:timeline.lede')}{' '}
            <Link to={`${base}/settings#calendar`}>{t('encyclopedia:timeline.editCalendar')}</Link>
          </p>
        </div>
        {eventCategory && (
          <ButtonLink to={`${base}/new?category=${eventCategory.id}`} variant="primary" icon={<CalendarPlus aria-hidden="true" />}>
            {t('encyclopedia:timeline.newEvent')}
          </ButtonLink>
        )}
      </header>

      {pages && all.length === 0 ? (
        <section className={styles.empty}>
          <h2 className={styles.emptyTitle}>{t('encyclopedia:timeline.emptyTitle')}</h2>
          <p>{t('encyclopedia:timeline.emptyBody')}</p>
          <ol className={styles.emptySteps}>
            <li>{t('encyclopedia:timeline.emptyStep1')}</li>
            <li>{t('encyclopedia:timeline.emptyStep2')}</li>
            <li>{t('encyclopedia:timeline.emptyStep3')}</li>
          </ol>
          <div className={styles.emptyActions}>
            {eventCategory && (
              <ButtonLink to={`${base}/new?category=${eventCategory.id}`} variant="primary" icon={<CalendarPlus aria-hidden="true" />}>
                {t('encyclopedia:timeline.newEvent')}
              </ButtonLink>
            )}
            <ButtonLink to={`${base}/settings#calendar`} icon={<Settings aria-hidden="true" />}>
              {t('encyclopedia:timeline.setupCalendar')}
            </ButtonLink>
          </div>
        </section>
      ) : (
        <>
          <div className={styles.controls}>
            <fieldset className={styles.filters}>
              <legend className="visually-hidden">{t('encyclopedia:timeline.filter')}</legend>
              {present.map((id) => {
                const c = byId.get(id)
                if (!c) return null
                return (
                  <label key={id} className={styles.chip} data-ink={c.ink}>
                    <input type="checkbox" checked={!hidden.has(id)} onChange={() => toggle(id)} />
                    <CategoryIcon name={c.icon} className={styles.chipIcon} />
                    {categoryName(c, t, true)}
                  </label>
                )
              })}
            </fieldset>
            <label className={styles.switch}>
              <input type="checkbox" checked={includeFields} onChange={(e) => setIncludeFields(e.target.checked)} />
              {t('encyclopedia:timeline.includeFields')}
            </label>
            <div className={styles.scale} role="group" aria-label={t('encyclopedia:timeline.scale')}>
              {(['compact', 'proportional'] as Scale[]).map((s) => (
                <button key={s} type="button" aria-pressed={scale === s} onClick={() => setScale(s)}>
                  {t(`encyclopedia:timeline.${s}`)}
                </button>
              ))}
            </div>
            {scale === 'proportional' && (
              <label className={styles.zoom}>
                {t('encyclopedia:timeline.zoom')}
                <input type="range" min={1} max={10} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
              </label>
            )}
          </div>

          {eras && eras.length > 1 && (
            <nav className={styles.eraNav} aria-label={t('encyclopedia:timeline.eras')}>
              {eras.map((era) => (
                <a key={era.id} href={`#era-${era.id}`} data-ink={era.ink}
                  onClick={(e) => { e.preventDefault(); document.getElementById(`era-${era.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>
                  {era.name}
                </a>
              ))}
            </nav>
          )}

          <div className={styles.timeline} lang={world.contentLanguage}>
            {groups.map((g, gi) => (
              <section key={g.era?.id ?? `none-${gi}`} className={styles.era} data-ink={g.era?.ink ?? 'graphite'} aria-labelledby={`era-${g.era?.id ?? gi}`}>
                <header className={styles.band} id={g.era ? `era-${g.era.id}` : undefined}>
                  <h2 id={`era-${g.era?.id ?? gi}`} className={styles.bandName}>
                    {g.era?.name ?? t('encyclopedia:timeline.noEra')}
                  </h2>
                  {g.era && (
                    <p className={styles.bandRange}>
                      {fmt.worldDate({ year: g.era.startYear }, world.calendar)}
                      {' – '}
                      {g.era.endYear !== undefined ? fmt.worldDate({ year: g.era.endYear }, world.calendar) : t('encyclopedia:timeline.present')}
                    </p>
                  )}
                </header>
                {g.entries.length === 0 ? (
                  <p className={styles.bandEmpty}>{t('encyclopedia:timeline.eraEmpty')}</p>
                ) : (
                  <ol className={styles.entries}>
                    {g.entries.map((e) => {
                      const c = byId.get(e.categoryId)
                      const gap = previous ? e.date.year - previous.date.year : 0
                      const sameYear = previous?.date.year === e.date.year
                      previous = e
                      const space = scale === 'proportional' ? Math.min(gap * zoom * 0.08, 14) : 0
                      return (
                        <Fragment key={e.key}>
                          {scale === 'compact' && gap > 1 && (
                            <li className={styles.gap} aria-hidden="true">
                              {t('encyclopedia:timeline.gap', { count: gap, formatted: fmt.number(gap) })}
                            </li>
                          )}
                          <li className={styles.entry} data-ink={c?.ink} data-source={e.source}
                            style={space ? { marginBlockStart: `${space}rem` } : undefined}>
                            <span className={styles.year} aria-hidden={sameYear || undefined}>
                              {sameYear ? '' : fmt.worldDate({ year: e.date.year }, world.calendar)}
                            </span>
                            <span className={styles.marker} aria-hidden="true" />
                            <div className={styles.card}>
                              <p className={styles.what}>
                                {e.source === 'field' && e.field && <span className={styles.fieldLabel}>{fieldLabel(e.field, t)}: </span>}
                                <Link to={`${base}/p/${e.pageId}`} className={styles.link}>{e.title}</Link>
                              </p>
                              <p className={styles.meta}>
                                {c && <CategoryIcon name={c.icon} className={styles.metaIcon} />}
                                <span>{c ? categoryName(c, t) : ''}</span>
                                <span aria-hidden="true">·</span>
                                <span>{span(e)}</span>
                              </p>
                            </div>
                          </li>
                        </Fragment>
                      )
                    })}
                  </ol>
                )}
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

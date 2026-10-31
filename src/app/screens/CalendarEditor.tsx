import { Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useEras } from '../../core/lore/api'
import { CHAPTER_INKS, type CalendarMonth, type ChapterInk, type World } from '../../core/lore/types'
import { replaceEras, updateWorld } from '../../core/lore/worlds'
import { Button } from '../../ui/Button'
import layout from '../../ui/layout.module.css'
import styles from './CalendarEditor.module.css'

interface EraDraft {
  name: string
  start: string
  end: string
  ink: ChapterInk
}

/** Months of the world's year and its named eras. Loaded once, then edited locally. */
export function CalendarEditor({ world }: { world: World }) {
  const eras = useEras(world.id)
  if (!eras) return null
  return (
    <Editor
      key={world.id}
      world={world}
      initialEras={eras.map((e) => ({ name: e.name, start: String(e.startYear), end: e.endYear === undefined ? '' : String(e.endYear), ink: e.ink }))}
    />
  )
}

function Editor({ world, initialEras }: { world: World; initialEras: EraDraft[] }) {
  const { t } = useTranslation()
  const [months, setMonths] = useState<CalendarMonth[]>(world.calendar.months ?? [])
  const [eras, setEras] = useState<EraDraft[]>(initialEras)
  const [negLabel, setNegLabel] = useState(world.calendar.negativeAbbr ?? '')
  const [error, setError] = useState<string>()
  const [saved, setSaved] = useState(false)

  async function save(e: FormEvent) {
    e.preventDefault()
    const clean = eras.filter((x) => x.name.trim())
    for (const era of clean) {
      const start = Number(era.start)
      const end = era.end === '' ? undefined : Number(era.end)
      if (era.start === '' || !Number.isFinite(start)) return setError(t('encyclopedia:calendar.eraStartRequired', { name: era.name }))
      if (end !== undefined && end < start) return setError(t('encyclopedia:calendar.eraEndBeforeStart', { name: era.name }))
    }
    setError(undefined)
    await updateWorld(world.id, {
      calendar: {
        ...world.calendar,
        negativeAbbr: negLabel.trim() || undefined,
        months: months.filter((m) => m.name.trim()).map((m) => ({ name: m.name.trim(), days: Math.max(1, Math.trunc(m.days) || 30) })),
      },
    })
    await replaceEras(
      world.id,
      clean.map((era, order) => ({
        name: era.name.trim(),
        startYear: Math.trunc(Number(era.start)),
        endYear: era.end === '' ? undefined : Math.trunc(Number(era.end)),
        ink: era.ink,
        order,
      })),
    )
    setSaved(true)
  }

  return (
    <section id="calendar" className={layout.section} aria-labelledby="calendar-title">
      <h2 id="calendar-title" className={layout.sectionTitle}>
        {t('encyclopedia:calendar.title')}
      </h2>
      <p className={styles.help}>{t('encyclopedia:calendar.help')}</p>
      <form onSubmit={save} noValidate onChange={() => setSaved(false)}>
        <h3 className={styles.sub}>{t('encyclopedia:calendar.eras')}</h3>
        <p className={styles.help}>{t('encyclopedia:calendar.erasHelp')}</p>
        <div className={styles.table} role="table" aria-label={t('encyclopedia:calendar.eras')}>
          <div className={styles.head} role="row">
            <span role="columnheader">{t('encyclopedia:calendar.eraName')}</span>
            <span role="columnheader">{t('encyclopedia:calendar.eraStart')}</span>
            <span role="columnheader">{t('encyclopedia:calendar.eraEnd')}</span>
            <span role="columnheader">{t('encyclopedia:calendar.eraInk')}</span>
            <span role="columnheader" className="visually-hidden">{t('common:action.delete')}</span>
          </div>
          {eras.map((era, i) => {
            const set = (patch: Partial<EraDraft>) => setEras((list) => list.map((x, j) => (j === i ? { ...x, ...patch } : x)))
            return (
              <div key={i} className={styles.row} role="row" data-ink={era.ink}>
                <input role="cell" aria-label={t('encyclopedia:calendar.eraName')} className={styles.input} value={era.name} lang={world.contentLanguage}
                  onChange={(e) => set({ name: e.target.value })} placeholder={t('encyclopedia:calendar.eraNamePlaceholder')} />
                <input role="cell" aria-label={t('encyclopedia:calendar.eraStart')} className={styles.input} type="number" inputMode="numeric" value={era.start}
                  onChange={(e) => set({ start: e.target.value })} />
                <input role="cell" aria-label={t('encyclopedia:calendar.eraEnd')} className={styles.input} type="number" inputMode="numeric" value={era.end}
                  onChange={(e) => set({ end: e.target.value })} placeholder={t('encyclopedia:calendar.eraOpen')} />
                <span role="cell" className={styles.inkCell}>
                  <span className={styles.swatch} aria-hidden="true" />
                  <select aria-label={t('encyclopedia:calendar.eraInk')} value={era.ink} onChange={(e) => set({ ink: e.target.value as ChapterInk })}>
                    {CHAPTER_INKS.map((ink) => (
                      <option key={ink} value={ink}>{t(`encyclopedia:ink.${ink}`)}</option>
                    ))}
                  </select>
                </span>
                <span role="cell">
                  <Button size="sm" variant="quiet" icon={<Trash2 aria-hidden="true" />} onClick={() => setEras((l) => l.filter((_, j) => j !== i))}
                    aria-label={t('encyclopedia:calendar.removeEra', { name: era.name || '…' })} />
                </span>
              </div>
            )
          })}
        </div>
        <Button size="sm" icon={<Plus aria-hidden="true" />} onClick={() => {
          const last = eras.at(-1)
          const start = last ? (last.end !== '' ? Number(last.end) + 1 : Number(last.start) + 100) : 0
          setEras([...eras, { name: '', start: String(start), end: '', ink: CHAPTER_INKS[(eras.length + 3) % CHAPTER_INKS.length] }])
        }}>
          {t('encyclopedia:calendar.addEra')}
        </Button>

        <h3 className={styles.sub}>{t('encyclopedia:calendar.months')}</h3>
        <p className={styles.help}>{t('encyclopedia:calendar.monthsHelp')}</p>
        <ol className={styles.months}>
          {months.map((m, i) => (
            <li key={i} className={styles.monthRow}>
              <input aria-label={t('encyclopedia:calendar.monthName', { n: i + 1 })} className={styles.input} value={m.name} lang={world.contentLanguage}
                onChange={(e) => setMonths((l) => l.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <label className={styles.days}>
                <input type="number" min={1} inputMode="numeric" className={styles.input} value={m.days}
                  onChange={(e) => setMonths((l) => l.map((x, j) => (j === i ? { ...x, days: Number(e.target.value) } : x)))} />
                <span>{t('encyclopedia:calendar.days')}</span>
              </label>
              <Button size="sm" variant="quiet" icon={<Trash2 aria-hidden="true" />} onClick={() => setMonths((l) => l.filter((_, j) => j !== i))}
                aria-label={t('encyclopedia:calendar.removeMonth', { name: m.name || i + 1 })} />
            </li>
          ))}
        </ol>
        <Button size="sm" icon={<Plus aria-hidden="true" />} onClick={() => setMonths([...months, { name: '', days: 30 }])}>
          {t('encyclopedia:calendar.addMonth')}
        </Button>

        <h3 className={styles.sub}>{t('encyclopedia:calendar.before')}</h3>
        <label className={styles.beforeField}>
          <span>{t('encyclopedia:calendar.beforeHelp')}</span>
          <input className={styles.input} value={negLabel} onChange={(e) => setNegLabel(e.target.value)} lang={world.contentLanguage}
            placeholder={t('encyclopedia:calendar.beforePlaceholder')} maxLength={12} />
        </label>

        {error && <p className={styles.error} role="alert">{error}</p>}
        {saved && <p className={layout.notice} role="status">{t('common:status.saved')}</p>}
        <div className={layout.formActions}>
          <Button type="submit" variant="primary">{t('encyclopedia:calendar.save')}</Button>
        </div>
      </form>
    </section>
  )
}

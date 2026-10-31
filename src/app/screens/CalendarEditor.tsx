import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useBlocker } from 'react-router'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
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
  const [errors, setErrors] = useState<Map<number, string>>(new Map())
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname)
  useEffect(() => {
    if (errors.size) errorRef.current?.focus()
  }, [errors])

  /** Every era needs a start, must not end before it starts, and must not overlap another era. */
  function validate(): Map<number, string> {
    const found = new Map<number, string>()
    const spans = eras
      .map((era, i) => ({ i, era, start: Number(era.start), end: era.end === '' ? Infinity : Number(era.end) }))
      .filter((x) => x.era.name.trim())
    for (const x of spans) {
      if (x.era.start === '' || !Number.isFinite(x.start)) found.set(x.i, t('encyclopedia:calendar.eraStartRequired', { name: x.era.name }))
      else if (x.end < x.start) found.set(x.i, t('encyclopedia:calendar.eraEndBeforeStart', { name: x.era.name }))
    }
    const sorted = spans.filter((x) => !found.has(x.i)).sort((a, b) => a.start - b.start)
    for (let k = 1; k < sorted.length; k++) {
      const prev = sorted[k - 1]
      const cur = sorted[k]
      if (cur.start <= prev.end) {
        found.set(cur.i, t('encyclopedia:calendar.eraOverlap', { name: cur.era.name, other: prev.era.name }))
      }
    }
    return found
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    const clean = eras.filter((x) => x.name.trim())
    const found = validate()
    setErrors(found)
    if (found.size) return
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
    setDirty(false)
  }

  return (
    <section id="calendar" className={layout.section} aria-labelledby="calendar-title">
      <h2 id="calendar-title" className={layout.sectionTitle} tabIndex={-1}>
        {t('encyclopedia:calendar.title')}
      </h2>
      <p className={styles.help}>{t('encyclopedia:calendar.help')}</p>
      <form onSubmit={save} noValidate onChange={() => { setSaved(false); setDirty(true) }}>
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
              <div key={i} className={styles.row} role="row" data-ink={era.ink} data-invalid={errors.has(i) || undefined}>
                <label role="cell" className={styles.cell}>
                  <span className={styles.cellLabel}>{t('encyclopedia:calendar.eraName')}</span>
                  <input className={styles.input} value={era.name} lang={world.contentLanguage}
                    onChange={(e) => set({ name: e.target.value })} placeholder={t('encyclopedia:calendar.eraNamePlaceholder')}
                    aria-invalid={errors.has(i) || undefined} aria-describedby={errors.has(i) ? `era-error-${i}` : undefined} />
                </label>
                <label role="cell" className={styles.cell}>
                  <span className={styles.cellLabel}>{t('encyclopedia:calendar.eraStart')}</span>
                  <input className={styles.input} type="number" inputMode="numeric" value={era.start}
                    onChange={(e) => set({ start: e.target.value })} aria-invalid={errors.has(i) || undefined} />
                </label>
                <label role="cell" className={styles.cell}>
                  <span className={styles.cellLabel}>{t('encyclopedia:calendar.eraEnd')}</span>
                  <input className={styles.input} type="number" inputMode="numeric" value={era.end}
                    onChange={(e) => set({ end: e.target.value })} placeholder={t('encyclopedia:calendar.eraOpen')} aria-invalid={errors.has(i) || undefined} />
                </label>
                <label role="cell" className={`${styles.cell} ${styles.inkCell}`}>
                  <span className={styles.cellLabel}>{t('encyclopedia:calendar.eraInk')}</span>
                  <span className={styles.inkControl}>
                    <span className={styles.swatch} aria-hidden="true" />
                    <select className={styles.input} value={era.ink} onChange={(e) => set({ ink: e.target.value as ChapterInk })}>
                      {CHAPTER_INKS.map((ink) => (
                        <option key={ink} value={ink}>{t(`encyclopedia:ink.${ink}`)}</option>
                      ))}
                    </select>
                  </span>
                </label>
                <span role="cell" className={styles.removeCell}>
                  <Button size="sm" variant="quiet" icon={<Trash2 aria-hidden="true" />} onClick={() => { setEras((l) => l.filter((_, j) => j !== i)); setDirty(true) }}
                    aria-label={t('encyclopedia:calendar.removeEra', { name: era.name || '…' })} />
                </span>
                {errors.has(i) && (
                  <p id={`era-error-${i}`} className={styles.rowError}>{errors.get(i)}</p>
                )}
              </div>
            )
          })}
        </div>
        <Button size="sm" icon={<Plus aria-hidden="true" />} onClick={() => {
          // A new era starts after the latest one; an ongoing era is closed the year before.
          const latest = [...eras].filter((x) => x.start !== '').sort((a, b) => Number(b.start) - Number(a.start))[0]
          const start = latest ? (latest.end !== '' ? Number(latest.end) + 1 : Number(latest.start) + 100) : 0
          const closed = eras.map((x) => (x === latest && x.end === '' ? { ...x, end: String(start - 1) } : x))
          setEras([...closed, { name: '', start: String(start), end: '', ink: CHAPTER_INKS[(eras.length + 3) % CHAPTER_INKS.length] }])
          setDirty(true)
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

        {errors.size > 0 && (
          <p ref={errorRef} tabIndex={-1} className={styles.error} role="alert">
            {t('encyclopedia:calendar.fixErrors', { count: errors.size })}
          </p>
        )}
        {saved && <p className={layout.notice} role="status">{t('common:status.saved')}</p>}
        <div className={layout.formActions}>
          <Button type="submit" variant="primary">{t('encyclopedia:calendar.save')}</Button>
        </div>
      </form>
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title={t('encyclopedia:editor.leaveTitle')}
        confirmLabel={t('encyclopedia:editor.leaveConfirm')}
        danger
        onCancel={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
      >
        {t('encyclopedia:calendar.leaveBody')}
      </ConfirmDialog>
    </section>
  )
}

import { X } from 'lucide-react'
import { useId, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { fieldLabel, isPageRef, isWorldDate, optionLabel, type PageRefValue } from '../../../core/lore/fields'
import { foldKey } from '../../../core/lore/normalize'
import type { Calendar, FieldDef, WorldDate } from '../../../core/lore/types'
import styles from './InfoboxForm.module.css'

interface InfoboxFormProps {
  fields: FieldDef[]
  values: Record<string, unknown>
  onChange: (fieldId: string, value: unknown) => void
  titles: string[]
  calendar: Calendar
  lang: string
  /** Event chapters also edit the page's own date range. */
  dates?: { date?: WorldDate; endDate?: WorldDate; error?: string; onDate: (d?: WorldDate) => void; onEndDate: (d?: WorldDate) => void }
}

/** Edits a page's stat block. Empty fields are dropped on save. */
export function InfoboxForm({ fields, values, onChange, titles, calendar, lang, dates }: InfoboxFormProps) {
  const { t } = useTranslation()
  const listId = useId()
  if (fields.length === 0 && !dates) return null
  return (
    <fieldset className={styles.form}>
      <legend className={styles.legend}>{t('encyclopedia:infobox.title')}</legend>
      <datalist id={listId}>
        {titles.map((title) => (
          <option key={title} value={title} />
        ))}
      </datalist>
      <div className={styles.grid}>
        {dates && (
          <>
            <DateField label={t('encyclopedia:field.date')} value={dates.date} onChange={dates.onDate} calendar={calendar} />
            <DateField label={t('encyclopedia:field.endDate')} value={dates.endDate} onChange={dates.onEndDate} calendar={calendar}
              disabled={!dates.date} error={dates.error} />
          </>
        )}
        {fields.map((f) => (
          <FieldInput key={f.id} field={f} value={values[f.id]} onChange={(v) => onChange(f.id, v)} listId={listId} calendar={calendar} lang={lang} titles={titles} />
        ))}
      </div>
    </fieldset>
  )
}

function FieldInput({
  field,
  value,
  onChange,
  listId,
  calendar,
  lang,
  titles,
}: {
  titles: string[]
  field: FieldDef
  value: unknown
  onChange: (v: unknown) => void
  listId: string
  calendar: Calendar
  lang: string
}) {
  const { t } = useTranslation()
  const id = useId()
  const label = fieldLabel(field, t)
  const wide = field.type === 'longtext' || field.type === 'pageRefs'

  switch (field.type) {
    case 'worldDate':
      return <DateField label={label} value={isWorldDate(value) ? value : undefined} onChange={onChange} calendar={calendar} />
    case 'pageRefs':
      return (
        <RefsField
          label={label}
          value={Array.isArray(value) ? value.filter(isPageRef) : []}
          onChange={(v) => onChange(v.length ? v : undefined)}
          listId={listId}
          lang={lang}
          suggestions={titles}
        />
      )
    case 'boolean':
      return (
        <label className={styles.check}>
          <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
          <span>{label}</span>
        </label>
      )
  }

  let control
  switch (field.type) {
    case 'longtext':
      control = (
        <textarea id={id} className={`${styles.input} ${styles.textarea}`} lang={lang} rows={3}
          value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} />
      )
      break
    case 'number':
      control = (
        <input id={id} type="number" inputMode="decimal" className={styles.input}
          value={typeof value === 'number' ? value : ''}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
      )
      break
    case 'select':
      control = (
        <select id={id} className={styles.input} value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value || undefined)}>
          <option value="">{t('encyclopedia:infobox.none')}</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {optionLabel(field, o, t)}
            </option>
          ))}
        </select>
      )
      break
    case 'pageRef':
      control = (
        <input id={id} className={styles.input} list={listId} lang={lang} autoComplete="off"
          placeholder={t('encyclopedia:infobox.refPlaceholder')}
          value={isPageRef(value) ? value.ref : ''}
          onChange={(e) => onChange(e.target.value.trim() ? ({ ref: e.target.value } satisfies PageRefValue) : undefined)} />
      )
      break
    case 'tags':
      control = <TagsInput id={id} value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} lang={lang} />
      break
    default:
      control = (
        <input id={id} className={styles.input} lang={lang} value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} />
      )
  }
  return (
    <div className={`${styles.field} ${wide ? styles.wide : ''}`}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {control}
      {field.type === 'tags' && <p className={styles.hint}>{t('encyclopedia:infobox.tagsHint')}</p>}
    </div>
  )
}

function TagsInput({ id, value, onChange, lang }: { id: string; value: string[]; onChange: (v: unknown) => void; lang: string }) {
  const [text, setText] = useState(value.join(', '))
  return (
    <input id={id} className={styles.input} lang={lang} value={text}
      onChange={(e) => {
        setText(e.target.value)
        const tags = e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
        onChange(tags.length ? tags : undefined)
      }} />
  )
}

/** Year (required), optional month and day, and an "approximate" flag. */
function DateField({ label, value, onChange, calendar, disabled, error }: { label: string; value?: WorldDate; onChange: (v?: WorldDate) => void; calendar: Calendar; disabled?: boolean; error?: string }) {
  const { t } = useTranslation()
  const id = useId()
  const set = (patch: Partial<WorldDate>) => {
    const next = { ...value, ...patch } as WorldDate
    if (!Number.isFinite(next.year)) return onChange(undefined)
    onChange(next)
  }
  const era = calendar.yearAbbr || calendar.yearLabel
  return (
    <fieldset className={`${styles.field} ${styles.dateField}`}>
      <legend className={styles.label}>{label}</legend>
      <div className={styles.dateRow}>
        <label className={styles.datePart}>
          <span className={styles.subLabel}>{t('encyclopedia:infobox.year')}</span>
          <input id={id} type="number" inputMode="numeric" className={styles.input} disabled={disabled}
            aria-invalid={error ? true : undefined}
            value={value && Number.isFinite(value.year) ? value.year : ''}
            onChange={(e) => (e.target.value === '' ? onChange(undefined) : set({ year: Math.trunc(Number(e.target.value)) }))} />
        </label>
        {era && <span className={styles.era}>{era}</span>}
        <label className={styles.datePart}>
          <span className={styles.subLabel}>{t('encyclopedia:infobox.month')}</span>
          {calendar.months?.length ? (
            <select className={styles.input} value={value?.month ?? ''} disabled={!value}
              onChange={(e) => set({ month: e.target.value ? Number(e.target.value) : undefined })}>
              <option value="">–</option>
              {calendar.months.map((m, i) => (
                <option key={i} value={i + 1}>{m.name}</option>
              ))}
            </select>
          ) : (
            <input type="number" min={1} inputMode="numeric" className={`${styles.input} ${styles.short}`} value={value?.month ?? ''} disabled={!value}
              onChange={(e) => set({ month: e.target.value ? Math.trunc(Number(e.target.value)) : undefined })} />
          )}
        </label>
        <label className={styles.datePart}>
          <span className={styles.subLabel}>{t('encyclopedia:infobox.day')}</span>
          <input type="number" min={1} inputMode="numeric" className={`${styles.input} ${styles.short}`} value={value?.day ?? ''} disabled={!value?.month}
            onChange={(e) => set({ day: e.target.value ? Math.trunc(Number(e.target.value)) : undefined })} />
        </label>
      </div>
      <label className={styles.check}>
        <input type="checkbox" checked={!!value?.approximate} disabled={!value} onChange={(e) => set({ approximate: e.target.checked || undefined })} />
        <span>{t('encyclopedia:infobox.approximate')}</span>
      </label>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  )
}

/** Several page references as removable chips plus an input with title suggestions. */
function RefsField({ label, value, onChange, listId, lang, suggestions }: { label: string; value: PageRefValue[]; onChange: (v: PageRefValue[]) => void; listId: string; lang: string; suggestions: string[] }) {
  const { t } = useTranslation()
  const id = useId()
  const [text, setText] = useState('')
  const add = () => {
    const typed = text.trim()
    const folded = foldKey(typed)
    const exact = suggestions.find((s) => foldKey(s) === folded)
    const prefixed = suggestions.filter((s) => foldKey(s).startsWith(folded))
    const title = exact ?? (typed && prefixed.length === 1 ? prefixed[0] : typed)
    if (!title || value.some((v) => v.ref === title)) return setText('')
    onChange([...value, { ref: title }])
    setText('')
  }
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add()
    } else if (e.key === 'Backspace' && !text && value.length) {
      onChange(value.slice(0, -1))
    }
  }
  return (
    <div className={`${styles.field} ${styles.wide}`}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <div className={styles.chips}>
        {value.map((v) => (
          <span key={v.ref} className={styles.chip} lang={lang}>
            {v.ref}
            <button type="button" onClick={() => onChange(value.filter((x) => x.ref !== v.ref))} aria-label={t('encyclopedia:infobox.remove', { title: v.ref })}>
              <X aria-hidden="true" />
            </button>
          </span>
        ))}
        <input id={id} className={styles.chipInput} list={listId} lang={lang} autoComplete="off" value={text}
          placeholder={t('encyclopedia:infobox.refsPlaceholder')}
          onChange={(e) => setText(e.target.value)} onKeyDown={onKey} onBlur={add} />
      </div>
    </div>
  )
}

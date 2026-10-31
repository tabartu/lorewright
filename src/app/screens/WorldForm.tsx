import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useFormat } from '../../core/i18n/format'
import { COVER_INKS, type CoverInk } from '../../core/lore/types'
import type { WorldInput } from '../../core/lore/worlds'
import { Button } from '../../ui/Button'
import { SelectField, TextAreaField, TextField } from '../../ui/Field'
import { InkPicker } from '../../ui/InkPicker'
import layout from '../../ui/layout.module.css'
import { CONTENT_LANGUAGES, nativeLanguageName } from './contentLanguages'

interface WorldFormProps {
  initial: WorldInput
  submitLabel: string
  onSubmit: (value: WorldInput) => Promise<void>
  onCancel?: () => void
}

export function WorldForm({ initial, submitLabel, onSubmit, onCancel }: WorldFormProps) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const [value, setValue] = useState<WorldInput>(initial)
  const [busy, setBusy] = useState(false)
  const [nameError, setNameError] = useState<string>()

  const set = <K extends keyof WorldInput>(key: K, v: WorldInput[K]) => setValue((prev) => ({ ...prev, [key]: v }))
  const calendar = value.calendar ?? { yearLabel: '', yearAbbr: '' }

  const languages = CONTENT_LANGUAGES.includes(value.contentLanguage)
    ? CONTENT_LANGUAGES
    : [value.contentLanguage, ...CONTENT_LANGUAGES]

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!value.name.trim()) {
      setNameError(t('errors:lore.title_required'))
      return
    }
    setBusy(true)
    try {
      await onSubmit(value)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className={layout.form} onSubmit={submit} noValidate>
      <TextField
        label={t('encyclopedia:world.name')}
        value={value.name}
        onChange={(e) => {
          set('name', e.target.value)
          setNameError(undefined)
        }}
        placeholder={t('encyclopedia:world.namePlaceholder')}
        error={nameError}
        required
        autoFocus={!initial.name}
        lang={value.contentLanguage}
        maxLength={120}
      />
      <div className={layout.row}>
        <TextField
          label={t('encyclopedia:world.genre')}
          value={value.genre}
          onChange={(e) => set('genre', e.target.value)}
          placeholder={t('encyclopedia:world.genrePlaceholder')}
          maxLength={80}
        />
        <TextField
          label={t('encyclopedia:world.tone')}
          value={value.tone}
          onChange={(e) => set('tone', e.target.value)}
          placeholder={t('encyclopedia:world.tonePlaceholder')}
          maxLength={80}
        />
      </div>
      <SelectField
        label={t('encyclopedia:world.contentLanguage')}
        hint={t('encyclopedia:world.contentLanguageHint')}
        value={value.contentLanguage}
        onChange={(e) => set('contentLanguage', e.target.value)}
      >
        {languages.map((tag) => (
          <option key={tag} value={tag}>
            {fmt.languageName(tag)} — {nativeLanguageName(tag)}
          </option>
        ))}
      </SelectField>
      <TextAreaField
        label={t('encyclopedia:world.summary')}
        value={value.summary}
        onChange={(e) => set('summary', e.target.value)}
        placeholder={t('encyclopedia:world.summaryPlaceholder')}
        rows={4}
        lang={value.contentLanguage}
      />
      <InkPicker
        legend={t('encyclopedia:world.cover')}
        kind="cover"
        inks={COVER_INKS}
        value={value.cover}
        onChange={(ink: CoverInk) => set('cover', ink)}
        labelFor={(ink) => t(`encyclopedia:ink.${ink}`)}
      />
      <fieldset className={`${layout.row} ${layout.plainFieldset}`}>
        <TextField
          label={t('encyclopedia:world.yearLabel')}
          hint={t('encyclopedia:world.yearLabelHint')}
          value={calendar.yearLabel}
          onChange={(e) => set('calendar', { ...calendar, yearLabel: e.target.value })}
          placeholder={t('encyclopedia:world.yearLabelPlaceholder')}
          lang={value.contentLanguage}
          maxLength={60}
        />
        <TextField
          label={t('encyclopedia:world.yearAbbr')}
          value={calendar.yearAbbr}
          onChange={(e) => set('calendar', { ...calendar, yearAbbr: e.target.value })}
          placeholder={t('encyclopedia:world.yearAbbrPlaceholder')}
          lang={value.contentLanguage}
          maxLength={12}
        />
      </fieldset>
      <div className={layout.formActions}>
        <Button type="submit" variant="primary" busy={busy}>
          {submitLabel}
        </Button>
        {onCancel && <Button onClick={onCancel}>{t('common:action.cancel')}</Button>}
      </div>
    </form>
  )
}

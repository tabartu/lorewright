import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { NotFound } from '../../../app/screens/NotFound'
import { useWorldContext } from '../../../app/shell/WorldLayout'
import { useDocumentTitle } from '../../../app/shell/useDocumentTitle'
import { categoryName } from '../../../core/lore/categories'
import { getPages } from '../../../core/lore/api'
import { fieldLabel, isEmptyValue } from '../../../core/lore/fields'
import { newId } from '../../../core/lore/normalize'
import type { FieldDef, FieldType } from '../../../core/lore/types'
import { updateCategory } from '../../../core/lore/worlds'
import { Button } from '../../../ui/Button'
import { ConfirmDialog } from '../../../ui/ConfirmDialog'
import { SelectField, TextField } from '../../../ui/Field'
import layout from '../../../ui/layout.module.css'
import styles from './ChapterFields.module.css'

const TYPES: FieldType[] = ['text', 'longtext', 'number', 'worldDate', 'pageRef', 'pageRefs', 'select', 'tags', 'boolean']

/** Stat-block fields of one chapter: built-in ones plus the user's own. */
export function ChapterFields() {
  const { categoryId } = useParams()
  const { world, categories } = useWorldContext()
  const { t } = useTranslation()
  const category = categories.find((c) => c.id === categoryId)
  const [label, setLabel] = useState('')
  const [type, setType] = useState<FieldType>('text')
  const [options, setOptions] = useState('')
  const [error, setError] = useState<string>()
  const [optionsError, setOptionsError] = useState<string>()
  const [toDelete, setToDelete] = useState<{ field: FieldDef; uses: number } | null>(null)
  const [renaming, setRenaming] = useState<{ id: string; label: string; options: string } | null>(null)
  useDocumentTitle(category ? t('encyclopedia:fields.title', { chapter: categoryName(category, t, true) }) : undefined, world.name)
  if (!category) return <NotFound />

  const save = (fields: FieldDef[]) => updateCategory(category.id, { fields })

  async function add(e: FormEvent) {
    e.preventDefault()
    const clean = label.trim()
    if (!clean) return setError(t('errors:lore.title_required'))
    const opts = options.split(',').map((o) => o.trim()).filter(Boolean)
    if (type === 'select' && opts.length === 0) return setOptionsError(t('encyclopedia:fields.optionsRequired'))
    await save([...category!.fields, { id: newId(), key: clean, label: clean, type, options: type === 'select' ? opts : undefined }])
    setLabel('')
    setOptions('')
    setError(undefined)
    setOptionsError(undefined)
  }

  async function askDelete(field: FieldDef) {
    const pages = await getPages(world.id, { categoryId: category!.id })
    setToDelete({ field, uses: pages.filter((p) => !isEmptyValue(field, p.fields[field.id])).length })
  }

  function move(i: number, dir: -1 | 1) {
    const next = [...category!.fields]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    void save(next)
  }

  return (
    <div className={`${layout.page} ${layout.narrow}`} data-ink={category.ink}>
      <header className={layout.header}>
        <div>
          <p className={styles.back}>
            <Link to={`/w/${world.id}/chapters`}>{t('encyclopedia:nav.manageChapters')}</Link>
          </p>
          <h1 className={layout.title}>{t('encyclopedia:fields.title', { chapter: categoryName(category, t, true) })}</h1>
          <p className={layout.lede}>{t('encyclopedia:fields.lede')}</p>
        </div>
      </header>

      {category.fields.length === 0 ? (
        <p className={styles.empty}>{t('encyclopedia:fields.empty')}</p>
      ) : (
        <ol role="list" className={styles.list}>
          {category.fields.map((f, i) => (
            <li key={f.id} className={styles.row}>
              {renaming?.id === f.id ? (
                <form
                  className={styles.renameForm}
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!renaming.label.trim()) return
                    const opts = renaming.options.split(',').map((o) => o.trim()).filter(Boolean)
                    void save(category.fields.map((x) => (x.id === f.id ? { ...x, label: renaming.label.trim(), options: f.type === 'select' && opts.length ? opts : x.options } : x)))
                    setRenaming(null)
                  }}
                >
                  <TextField label={t('encyclopedia:fields.label')} value={renaming.label} onChange={(e) => setRenaming({ ...renaming, label: e.target.value })} autoFocus lang={world.contentLanguage} />
                  {f.type === 'select' && (
                    <TextField label={t('encyclopedia:fields.options')} hint={t('encyclopedia:fields.optionsHint')} value={renaming.options} onChange={(e) => setRenaming({ ...renaming, options: e.target.value })} lang={world.contentLanguage} />
                  )}
                  <div className={styles.renameActions}>
                    <Button type="submit" size="sm" variant="primary">{t('common:action.save')}</Button>
                    <Button size="sm" onClick={() => setRenaming(null)}>{t('common:action.cancel')}</Button>
                  </div>
                </form>
              ) : (<>
              <div className={styles.rowMain}>
                <span className={styles.name}>{fieldLabel(f, t)}</span>
                <span className={styles.type}>{t(`encyclopedia:fieldType.${f.type}`)}</span>
                {f.type === 'select' && f.options && <span className={styles.options}>{f.options.map((o) => (f.builtIn ? t(`encyclopedia:lifeStatus.${o}`) : o)).join(' · ')}</span>}
                {f.builtIn && <span className={styles.badge}>{t('encyclopedia:chapters.builtIn')}</span>}
              </div>
              <div className={styles.actions}>
                <Button size="sm" variant="quiet" icon={<ArrowUp aria-hidden="true" />} disabled={i === 0} onClick={() => move(i, -1)} aria-label={t('encyclopedia:fields.moveUp', { field: fieldLabel(f, t) })} title={t('encyclopedia:fields.moveUp', { field: fieldLabel(f, t) })} />
                <Button size="sm" variant="quiet" icon={<ArrowDown aria-hidden="true" />} disabled={i === category.fields.length - 1} onClick={() => move(i, 1)} aria-label={t('encyclopedia:fields.moveDown', { field: fieldLabel(f, t) })} title={t('encyclopedia:fields.moveDown', { field: fieldLabel(f, t) })} />
                {!f.builtIn && (
                  <>
                    <Button size="sm" variant="quiet" onClick={() => setRenaming({ id: f.id, label: f.label ?? '', options: (f.options ?? []).join(', ') })}>
                      {t('common:action.edit')}
                    </Button>
                    <Button size="sm" variant="quiet" icon={<Trash2 aria-hidden="true" />} onClick={() => void askDelete(f)} aria-label={t('encyclopedia:fields.delete', { field: fieldLabel(f, t) })} title={t('encyclopedia:fields.delete', { field: fieldLabel(f, t) })} />
                  </>
                )}
              </div>
              </>)}
            </li>
          ))}
        </ol>
      )}

      <section className={layout.section} aria-labelledby="add-field">
        <h2 id="add-field" className={layout.sectionTitle}>
          {t('encyclopedia:fields.addTitle')}
        </h2>
        <form className={layout.form} onSubmit={add} noValidate>
          <div className={layout.row}>
            <TextField label={t('encyclopedia:fields.label')} placeholder={t('encyclopedia:fields.labelPlaceholder')} value={label}
              onChange={(e) => { setLabel(e.target.value); setError(undefined) }} error={error} maxLength={40} lang={world.contentLanguage} />
            <SelectField label={t('encyclopedia:fields.type')} value={type} onChange={(e) => setType(e.target.value as FieldType)}>
              {TYPES.map((ft) => (
                <option key={ft} value={ft}>{t(`encyclopedia:fieldType.${ft}`)}</option>
              ))}
            </SelectField>
          </div>
          {type === 'select' && (
            <TextField label={t('encyclopedia:fields.options')} hint={t('encyclopedia:fields.optionsHint')} value={options}
              onChange={(e) => { setOptions(e.target.value); setOptionsError(undefined) }} error={optionsError} lang={world.contentLanguage} />
          )}
          <p className={styles.typeHelp}>{t(`encyclopedia:fieldTypeHelp.${type}`)}</p>
          <div>
            <Button type="submit" variant="primary" icon={<Plus aria-hidden="true" />}>
              {t('encyclopedia:fields.add')}
            </Button>
          </div>
        </form>
      </section>

      <ConfirmDialog
        open={!!toDelete}
        danger
        title={t('encyclopedia:fields.deleteConfirm', { field: toDelete ? fieldLabel(toDelete.field, t) : '' })}
        confirmLabel={t('common:action.delete')}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) await save(category.fields.filter((x) => x.id !== toDelete.field.id))
          setToDelete(null)
        }}
      >
        {toDelete && t('encyclopedia:fields.deleteBody', { count: toDelete.uses })}
      </ConfirmDialog>
    </div>
  )
}

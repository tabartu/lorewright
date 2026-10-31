import { Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useWorldContext } from '../../../app/shell/WorldLayout'
import { useDocumentTitle } from '../../../app/shell/useDocumentTitle'
import { usePageCounts } from '../../../core/lore/api'
import { categoryName } from '../../../core/lore/categories'
import { LoreError } from '../../../core/lore/errors'
import { CHAPTER_INKS, type Category, type ChapterInk } from '../../../core/lore/types'
import { createCategory, deleteCategory, updateCategory } from '../../../core/lore/worlds'
import { Button } from '../../../ui/Button'
import { CategoryIcon } from '../../../ui/CategoryIcon'
import { ConfirmDialog } from '../../../ui/ConfirmDialog'
import { TextField } from '../../../ui/Field'
import { InkPicker } from '../../../ui/InkPicker'
import layout from '../../../ui/layout.module.css'
import styles from './ChaptersManage.module.css'

/** Built-in and custom chapters (categories): add, rename, re-ink, remove. */
export function ChaptersManage() {
  const { world, categories } = useWorldContext()
  const { t } = useTranslation()
  const counts = usePageCounts(world.id)
  const [name, setName] = useState('')
  const [ink, setInk] = useState<ChapterInk>('sienna')
  const [error, setError] = useState<string>()
  const [toDelete, setToDelete] = useState<Category | null>(null)
  useDocumentTitle(t('encyclopedia:chapters.title'), world.name)

  async function add(e: FormEvent) {
    e.preventDefault()
    try {
      await createCategory(world.id, name, ink)
      setName('')
      setError(undefined)
    } catch (err) {
      if (err instanceof LoreError) setError(t(`errors:lore.${err.code}`))
      else throw err
    }
  }

  return (
    <div className={`${layout.page} ${layout.narrow}`}>
      <header className={layout.header}>
        <div>
          <h1 className={layout.title}>{t('encyclopedia:chapters.title')}</h1>
          <p className={layout.lede}>{t('encyclopedia:chapters.lede')}</p>
        </div>
      </header>

      <ul role="list" className={styles.list}>
        {categories.map((c) => (
          <ChapterRow
            key={c.id}
            category={c}
            count={counts?.get(c.id) ?? 0}
            worldId={world.id}
            onDelete={() => setToDelete(c)}
          />
        ))}
      </ul>

      <section className={layout.section} aria-labelledby="add-chapter">
        <h2 id="add-chapter" className={layout.sectionTitle}>
          {t('encyclopedia:chapters.addTitle')}
        </h2>
        <p className={styles.help}>{t('encyclopedia:chapters.addHelp')}</p>
        <form className={layout.form} onSubmit={add} noValidate>
          <TextField
            label={t('encyclopedia:chapters.name')}
            placeholder={t('encyclopedia:chapters.namePlaceholder')}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError(undefined)
            }}
            error={error}
            maxLength={60}
          />
          <InkPicker
            legend={t('encyclopedia:chapters.ink')}
            kind="chapter"
            inks={CHAPTER_INKS}
            value={ink}
            onChange={setInk}
            labelFor={(i) => t(`encyclopedia:ink.${i}`)}
          />
          <div>
            <Button type="submit" variant="primary" icon={<Plus aria-hidden="true" />}>
              {t('encyclopedia:chapters.add')}
            </Button>
          </div>
        </form>
      </section>

      <ConfirmDialog
        open={!!toDelete}
        danger
        title={t('encyclopedia:chapters.deleteConfirm', { name: toDelete ? categoryName(toDelete, t, true) : '' })}
        confirmLabel={t('common:action.delete')}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) await deleteCategory(toDelete.id)
          setToDelete(null)
        }}
      />
    </div>
  )
}

function ChapterRow({
  category,
  count,
  worldId,
  onDelete,
}: {
  category: Category
  count: number
  worldId: string
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(category.name ?? '')
  return (
    <li className={styles.row} data-ink={category.ink}>
      <div className={styles.rowMain}>
        <CategoryIcon name={category.icon} className={styles.icon} />
        {editing && !category.builtIn ? (
          <form
            className={styles.renameForm}
            onSubmit={async (e) => {
              e.preventDefault()
              if (!name.trim()) return
              await updateCategory(category.id, { name })
              setEditing(false)
            }}
          >
            <label className="visually-hidden" htmlFor={`rename-${category.id}`}>
              {t('encyclopedia:chapters.name')}
            </label>
            <input
              id={`rename-${category.id}`}
              className={styles.renameInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              maxLength={60}
            />
            <Button type="submit" size="sm" variant="primary">
              {t('common:action.save')}
            </Button>
            <Button size="sm" onClick={() => setEditing(false)}>
              {t('common:action.cancel')}
            </Button>
          </form>
        ) : (
          <Link to={`/w/${worldId}/c/${category.id}`} className={styles.name}>
            {categoryName(category, t, true)}
          </Link>
        )}
        <span className={styles.count}>{t('encyclopedia:chapter.count', { count, formatted: count })}</span>
        {category.builtIn && <span className={styles.badge}>{t('encyclopedia:chapters.builtIn')}</span>}
      </div>
      <div className={styles.rowActions}>
        <label className={styles.inkSelect}>
          <span className="visually-hidden">{t('encyclopedia:chapters.ink')}</span>
          <span className={styles.swatch} aria-hidden="true" />
          <select
            value={category.ink}
            onChange={(e) => void updateCategory(category.id, { ink: e.target.value as ChapterInk })}
          >
            {CHAPTER_INKS.map((i) => (
              <option key={i} value={i}>
                {t(`encyclopedia:ink.${i}`)}
              </option>
            ))}
          </select>
        </label>
        <Link to={`/w/${worldId}/chapters/${category.id}`} className={styles.fieldsLink}>
          {t('encyclopedia:chapters.fields', { count: category.fields.length })}
        </Link>
        {!category.builtIn && !editing && (
          <Button size="sm" variant="quiet" onClick={() => setEditing(true)}>
            {t('common:action.rename')}
          </Button>
        )}
        {!category.builtIn && (
          <Button
            size="sm"
            variant="quiet"
            icon={<Trash2 aria-hidden="true" />}
            onClick={onDelete}
            disabled={count > 0}
            title={count > 0 ? t('errors:lore.category_not_empty') : t('common:action.delete')}
            aria-label={t('common:action.delete')}
          />
        )}
      </div>
    </li>
  )
}

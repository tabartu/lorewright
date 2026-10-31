import { Columns2, Eye, PenLine, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useBlocker, useNavigate, useParams, useSearchParams } from 'react-router'
import { NotFound } from '../../../app/screens/NotFound'
import { useActiveChapter, useWorldContext } from '../../../app/shell/WorldLayout'
import { useDocumentTitle } from '../../../app/shell/useDocumentTitle'
import { usePage, usePageTitles } from '../../../core/lore/api'
import { categoryName } from '../../../core/lore/categories'
import { LoreError } from '../../../core/lore/errors'
import { createPage, deletePage, updatePage } from '../../../core/lore/pages'
import type { ID, Page, PageStatus } from '../../../core/lore/types'
import { Button } from '../../../ui/Button'
import { ConfirmDialog } from '../../../ui/ConfirmDialog'
import { SelectField, TextField } from '../../../ui/Field'
import { MarkdownEditor } from '../components/MarkdownEditor'
import { MarkdownView } from '../components/MarkdownView'
import styles from './PageEditor.module.css'

const STATUSES: PageStatus[] = ['stub', 'draft', 'complete']
type View = 'write' | 'preview' | 'split'

interface Draft {
  title: string
  categoryId: ID
  status: PageStatus
  aliases: string
  body: string
}

/** Route wrapper: resolves "new" vs "edit" and waits for the page to load. */
export function PageEditor() {
  const { pageId } = useParams()
  const [params] = useSearchParams()
  const { categories } = useWorldContext()
  const data = usePage(pageId)

  if (pageId && data === null) return <NotFound />
  if (pageId && !data) return <div aria-busy="true" className={styles.loading} />

  const requested = params.get('category')
  const fallbackCategory = categories.find((c) => c.id === requested)?.id ?? categories[0]?.id
  const initial: Draft = data
    ? {
        title: data.page.title,
        categoryId: data.page.categoryId,
        status: data.page.status,
        aliases: data.page.aliases.join(', '),
        body: data.body,
      }
    : { title: params.get('title') ?? '', categoryId: fallbackCategory, status: 'draft', aliases: '', body: '' }

  return <EditorForm key={pageId ?? `new:${params.toString()}`} page={data?.page} initial={initial} />
}

function EditorForm({ page, initial }: { page?: Page; initial: Draft }) {
  const { world, categories } = useWorldContext()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const titles = usePageTitles(world.id)
  const [draft, setDraft] = useState<Draft>(initial)
  const [view, setView] = useState<View>('write')
  const [titleError, setTitleError] = useState<string>()
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const allowLeave = useRef(false)
  const isNew = !page
  useDocumentTitle(isNew ? t('encyclopedia:page.new') : t('encyclopedia:page.editing', { title: page.title }), world.name)

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(initial), [draft, initial])
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty &&
      !allowLeave.current &&
      currentLocation.pathname + currentLocation.search !== nextLocation.pathname + nextLocation.search,
  )

  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))
  const category = categories.find((c) => c.id === draft.categoryId)
  useActiveChapter(category?.id)
  const base = `/w/${world.id}`

  const completionTitles = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c]))
    return (titles ?? [])
      .filter((p) => p.id !== page?.id)
      .map((p) => {
        const c = byId.get(p.categoryId)
        return { title: p.title, detail: c ? categoryName(c, t) : undefined }
      })
  }, [titles, categories, page?.id, t])

  const save = useCallback(async () => {
    if (saving) return
    if (!draft.title.trim()) {
      setTitleError(t('errors:lore.title_required'))
      return
    }
    setSaving(true)
    const aliases = draft.aliases.split(',').map((a) => a.trim()).filter(Boolean)
    try {
      let id: ID
      let notice: string | undefined
      if (page) {
        const { rewrittenLinks } = await updatePage(page.id, {
          title: draft.title,
          body: draft.body,
          categoryId: draft.categoryId,
          status: draft.status,
          aliases,
        })
        id = page.id
        notice = rewrittenLinks > 0 ? t('encyclopedia:page.renamedLinks', { count: rewrittenLinks }) : t('common:status.saved')
      } else {
        const created = await createPage({
          worldId: world.id,
          categoryId: draft.categoryId,
          title: draft.title,
          body: draft.body,
          status: draft.status,
          aliases,
        })
        id = created.id
        notice = t('encyclopedia:page.created')
      }
      allowLeave.current = true
      navigate(`${base}/p/${id}`, { state: { notice } })
    } catch (err) {
      if (err instanceof LoreError && (err.code === 'title_taken' || err.code === 'title_required')) {
        setTitleError(t(`errors:lore.${err.code}`))
      } else {
        throw err
      }
    } finally {
      setSaving(false)
    }
  }, [saving, draft, page, world.id, base, navigate, t])

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void save()
  }

  function cancel() {
    navigate(page ? `${base}/p/${page.id}` : category ? `${base}/c/${category.id}` : base)
  }

  const viewButtons: Array<{ id: View; label: string; icon: ReactNode; wideOnly?: boolean }> = [
    { id: 'write', label: t('encyclopedia:editor.write'), icon: <PenLine aria-hidden="true" /> },
    { id: 'preview', label: t('encyclopedia:editor.preview'), icon: <Eye aria-hidden="true" /> },
    { id: 'split', label: t('encyclopedia:editor.split'), icon: <Columns2 aria-hidden="true" />, wideOnly: true },
  ]

  return (
    <form
      className={styles.editor}
      data-ink={category?.ink}
      onSubmit={onSubmit}
      noValidate
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
          e.preventDefault()
          void save()
        }
      }}
    >
      <div className={styles.toolbar}>
        <div className={styles.toolbarInner}>
          <p className={styles.toolbarTitle}>
            {isNew ? t('encyclopedia:page.new') : t('encyclopedia:page.editShort')}
            {dirty && <span className={styles.dirty}>{t('encyclopedia:editor.unsaved')}</span>}
          </p>
          <div className={styles.toolbarActions}>
            <Button onClick={cancel}>{t('common:action.cancel')}</Button>
            <Button type="submit" variant="primary" busy={saving} title={t('encyclopedia:editor.saveShortcut')}>
              {t('common:action.save')}
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.inner}>
        <label className="visually-hidden" htmlFor="page-title">
          {t('encyclopedia:page.title')}
        </label>
        <input
          id="page-title"
          className={styles.headwordInput}
          value={draft.title}
          onChange={(e) => {
            set('title', e.target.value)
            setTitleError(undefined)
          }}
          placeholder={t('encyclopedia:page.titlePlaceholder')}
          lang={world.contentLanguage}
          aria-invalid={titleError ? true : undefined}
          aria-describedby={titleError ? 'page-title-error' : undefined}
          autoFocus={isNew && !draft.title}
          maxLength={160}
          autoComplete="off"
        />
        {titleError && (
          <p id="page-title-error" className={styles.titleError} role="alert">
            {titleError}
          </p>
        )}
        {page && draft.title.trim() && draft.title.trim() !== page.title && (
          <p className={styles.renameHint}>{t('encyclopedia:editor.renameHint', { old: page.title })}</p>
        )}

        <div className={styles.meta}>
          <SelectField
            label={t('encyclopedia:page.category')}
            value={draft.categoryId}
            onChange={(e) => set('categoryId', e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {categoryName(c, t)}
              </option>
            ))}
          </SelectField>
          <SelectField
            label={t('encyclopedia:page.statusLabel')}
            value={draft.status}
            onChange={(e) => set('status', e.target.value as PageStatus)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`encyclopedia:status.${s}`)}
              </option>
            ))}
          </SelectField>
          <TextField
            label={t('encyclopedia:page.aliases')}
            hint={t('encyclopedia:page.aliasesHint')}
            value={draft.aliases}
            onChange={(e) => set('aliases', e.target.value)}
            lang={world.contentLanguage}
          />
        </div>

        <div className={styles.bodyHead}>
          <h2 className={styles.bodyLabel}>{t('encyclopedia:editor.body')}</h2>
          <div className={styles.viewSwitch} role="group" aria-label={t('encyclopedia:editor.viewMode')}>
            {viewButtons.map((b) => (
              <button
                key={b.id}
                type="button"
                className={`${styles.viewButton} ${b.wideOnly ? styles.wideOnly : ''}`}
                aria-pressed={view === b.id}
                onClick={() => setView(b.id)}
              >
                {b.icon}
                <span>{b.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.workspace} data-view={view}>
          <div className={styles.pane} hidden={view === 'preview'}>
            <MarkdownEditor
              value={draft.body}
              onChange={(v) => set('body', v)}
              titles={completionTitles}
              lang={world.contentLanguage}
              label={t('encyclopedia:editor.body')}
              placeholder={t('encyclopedia:editor.placeholder')}
              onSave={() => void save()}
            />
            <p className={styles.help}>{t('encyclopedia:editor.help')}</p>
          </div>
          <div className={`${styles.pane} ${styles.previewPane}`} hidden={view === 'write'}>
            {draft.body.trim() ? (
              <MarkdownView markdown={draft.body} worldId={world.id} lang={world.contentLanguage} />
            ) : (
              <p className={styles.previewEmpty}>{t('encyclopedia:editor.previewEmpty')}</p>
            )}
          </div>
        </div>

        {page && (
          <section className={styles.danger}>
            <Button variant="danger" size="sm" icon={<Trash2 aria-hidden="true" />} onClick={() => setConfirmDelete(true)}>
              {t('encyclopedia:page.delete')}
            </Button>
          </section>
        )}
      </div>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title={t('encyclopedia:editor.leaveTitle')}
        confirmLabel={t('encyclopedia:editor.leaveConfirm')}
        danger
        onCancel={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
      >
        {t('encyclopedia:editor.leaveBody')}
      </ConfirmDialog>
      {page && (
        <ConfirmDialog
          open={confirmDelete}
          title={t('encyclopedia:page.deleteConfirmTitle', { title: page.title })}
          confirmLabel={t('encyclopedia:page.delete')}
          danger
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            allowLeave.current = true
            await deletePage(page.id)
            navigate(category ? `${base}/c/${category.id}` : base)
          }}
        >
          {t('encyclopedia:page.deleteConfirmBody')}
        </ConfirmDialog>
      )}
    </form>
  )
}

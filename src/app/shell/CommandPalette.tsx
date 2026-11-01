import { Command } from 'cmdk'
import { BookOpen, CalendarCog, CalendarRange, FilePlus2, Home, Library, Map as MapIcon, Network, Settings, Settings2 } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useRecentPages } from '../../core/lore/api'
import { categoryName } from '../../core/lore/categories'
import { foldKey } from '../../core/lore/normalize'
import { searchPages } from '../../core/lore/search'
import type { Category, World } from '../../core/lore/types'
import { useWorldSearchIndex } from '../../core/lore/useSearch'
import { CategoryIcon } from '../../ui/CategoryIcon'
import styles from './CommandPalette.module.css'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  world: World
  categories: Category[]
}

/** Ctrl/⌘+K: search every page of the world, jump to chapters, run actions. */
export function CommandPalette({ open, onOpenChange, world, categories }: CommandPaletteProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  // Kept warm while the world is open, so typing right after Ctrl+K never races the index.
  const index = useWorldSearchIndex(world.id)
  const [selected, setSelected] = useState('')
  const recent = useRecentPages(open ? world.id : undefined, 6)
  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const base = `/w/${world.id}`

  const hits = useMemo(() => (index && query.trim() ? searchPages(index, query, 25) : []), [index, query])
  const folded = foldKey(query)
  const chapterHits = query.trim()
    ? categories.filter((c) => foldKey(categoryName(c, t, true)).includes(folded) || foldKey(categoryName(c, t)).includes(folded))
    : []
  const exact = hits.some((h) => foldKey(h.title) === folded)
  const actions = [
    { id: 'new', icon: <FilePlus2 aria-hidden="true" />, label: t('encyclopedia:page.new'), to: `${base}/new` },
    { id: 'home', icon: <Home aria-hidden="true" />, label: t('encyclopedia:search.worldHome'), to: base },
    { id: 'timeline', icon: <CalendarRange aria-hidden="true" />, label: t('encyclopedia:timeline.title'), to: `${base}/timeline` },
    { id: 'maps', icon: <MapIcon aria-hidden="true" />, label: t('encyclopedia:maps.title'), to: `${base}/maps` },
    { id: 'graph', icon: <Network aria-hidden="true" />, label: t('encyclopedia:graph.title'), to: `${base}/graph` },
    { id: 'calendar', icon: <CalendarCog aria-hidden="true" />, label: t('encyclopedia:calendar.title'), to: `${base}/settings#calendar` },
    { id: 'chapters', icon: <BookOpen aria-hidden="true" />, label: t('encyclopedia:nav.manageChapters'), to: `${base}/chapters` },
    { id: 'worldSettings', icon: <Settings aria-hidden="true" />, label: t('common:nav.worldSettings'), to: `${base}/settings` },
    { id: 'shelf', icon: <Library aria-hidden="true" />, label: t('common:nav.shelf'), to: '/' },
    { id: 'appSettings', icon: <Settings2 aria-hidden="true" />, label: t('common:nav.appSettings'), to: '/settings' },
  ]
  const actionHits = query.trim() ? actions.filter((a) => foldKey(a.label).includes(folded)) : actions
  const firstValue = hits[0] ? `page:${hits[0].id}` : chapterHits[0] ? `chapter:${chapterHits[0].id}` : query.trim() && actionHits[0] ? actionHits[0].id : query.trim() ? 'create' : ''
  // Whenever results change, the best match is selected, never a stale action.
  useEffect(() => setSelected(firstValue), [firstValue])
  const status = !query.trim()
    ? ''
    : !index
      ? t('encyclopedia:search.loading')
      : t('encyclopedia:search.status', { count: hits.length + chapterHits.length })


  function go(to: string) {
    onOpenChange(false)
    setQuery('')
    navigate(to)
  }

  const action = (id: string, icon: ReactNode, label: string, to: string) => (
    <Command.Item key={id} value={id} onSelect={() => go(to)} className={styles.item}>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.label}>{label}</span>
    </Command.Item>
  )

  return (
    <Command.Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) setQuery('')
      }}
      label={t('encyclopedia:search.label', { world: world.name })}
      shouldFilter={false}
      value={selected}
      onValueChange={setSelected}
      loop
      overlayClassName={styles.overlay}
      contentClassName={styles.content}
      className={styles.command}
    >
      <div className={styles.inputRow}>
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder={t('encyclopedia:search.placeholder', { world: world.name })}
          className={styles.input}
          lang={world.contentLanguage}
        />
        <kbd className={styles.esc}>{t('encyclopedia:search.escKey')}</kbd>
        <button type="button" className={styles.close} onClick={() => onOpenChange(false)}>
          {t('common:action.close')}
        </button>
      </div>
      <Command.List className={styles.list}>
        {query.trim() && index && hits.length === 0 && chapterHits.length === 0 && actionHits.length === 0 && (
          <p className={styles.empty}>{t('encyclopedia:search.noResults', { query })}</p>
        )}

        {hits.length > 0 && (
          <Command.Group heading={t('encyclopedia:search.pages')} className={styles.group}>
            {hits.map((h) => {
              const c = byId.get(h.categoryId)
              return (
                <Command.Item key={h.id} value={`page:${h.id}`} onSelect={() => go(`${base}/p/${h.id}`)} className={styles.item} data-ink={c?.ink}>
                  <span className={styles.icon}>{c && <CategoryIcon name={c.icon} />}</span>
                  <span className={styles.main}>
                    <span className={styles.label} lang={world.contentLanguage}>
                      {h.title}
                    </span>
                    {h.snippet && (
                      <span className={styles.snippet} lang={world.contentLanguage}>
                        {h.snippet}
                      </span>
                    )}
                  </span>
                  {c && <span className={styles.meta}>{categoryName(c, t)}</span>}
                </Command.Item>
              )
            })}
          </Command.Group>
        )}

        {chapterHits.length > 0 && (
          <Command.Group heading={t('encyclopedia:nav.chapters')} className={styles.group}>
            {chapterHits.map((c) => (
              <Command.Item key={c.id} value={`chapter:${c.id}`} onSelect={() => go(`${base}/c/${c.id}`)} className={styles.item} data-ink={c.ink}>
                <span className={styles.icon}>
                  <CategoryIcon name={c.icon} />
                </span>
                <span className={styles.label}>{categoryName(c, t, true)}</span>
              </Command.Item>
            ))}
          </Command.Group>
        )}


        {!query.trim() && (
          <>
            {recent && recent.length > 0 && (
              <Command.Group heading={t('encyclopedia:home.recent')} className={styles.group}>
                {recent.map((p) => {
                  const c = byId.get(p.categoryId)
                  return (
                    <Command.Item key={p.id} value={`recent:${p.id}`} onSelect={() => go(`${base}/p/${p.id}`)} className={styles.item} data-ink={c?.ink}>
                      <span className={styles.icon}>{c && <CategoryIcon name={c.icon} />}</span>
                      <span className={styles.label} lang={world.contentLanguage}>
                        {p.title}
                      </span>
                      {c && <span className={styles.meta}>{categoryName(c, t)}</span>}
                    </Command.Item>
                  )
                })}
              </Command.Group>
            )}
          </>
        )}
        {actionHits.length > 0 && (
          <Command.Group heading={t('encyclopedia:search.goTo')} className={styles.group}>
            {actionHits.map((a) => action(a.id, a.icon, a.label, a.to))}
          </Command.Group>
        )}
        {query.trim() && index && !exact && (
          <Command.Group heading={t('encyclopedia:search.actions')} className={styles.group}>
            <Command.Item
              value="create"
              onSelect={() => go(`${base}/new?title=${encodeURIComponent(query.trim())}`)}
              className={styles.item}
            >
              <span className={styles.icon}>
                <FilePlus2 aria-hidden="true" />
              </span>
              <span className={styles.label}>{t('encyclopedia:search.create', { title: query.trim() })}</span>
            </Command.Item>
          </Command.Group>
        )}
      </Command.List>
      <p className="visually-hidden" role="status" aria-live="polite">
        {status}
      </p>
      <p className={styles.footer}>{t('encyclopedia:search.hint')}</p>
    </Command.Dialog>
  )
}

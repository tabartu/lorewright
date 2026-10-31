import { CalendarRange, Network, Plus, Search, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useOutletContext, useParams } from 'react-router'
import { useCategories, usePageCounts, useWorld } from '../../core/lore/api'
import { categoryName } from '../../core/lore/categories'
import type { Category, World } from '../../core/lore/types'
import { CategoryIcon } from '../../ui/CategoryIcon'
import { NotFound } from '../screens/NotFound'
import { CommandPalette } from './CommandPalette'
import { Masthead, mastheadStyles } from './Masthead'
import styles from './WorldLayout.module.css'

const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

export interface WorldContext {
  world: World
  categories: Category[]
  /** Lets a screen mark the chapter it belongs to (e.g. the reader of a character page). */
  setActiveCategory: (id: string | undefined) => void
}

export function useWorldContext() {
  return useOutletContext<WorldContext>()
}

/** Highlight `categoryId`'s tab while the calling screen is mounted. */
export function useActiveChapter(categoryId: string | undefined) {
  const { setActiveCategory } = useWorldContext()
  useEffect(() => {
    setActiveCategory(categoryId)
    return () => setActiveCategory(undefined)
  }, [categoryId, setActiveCategory])
}

/** Masthead in the world's cover ink, chapter tabs, then the module screen. */
export function WorldLayout() {
  const { worldId } = useParams()
  const world = useWorld(worldId)
  const categories = useCategories(worldId)
  const counts = usePageCounts(worldId)
  const { t } = useTranslation()
  const [activeCategory, setActiveCategory] = useState<string>()
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (world === null) return <NotFound />
  if (!world || !categories) return <div className={styles.loading} aria-busy="true" />

  const base = `/w/${world.id}`
  return (
    <div className={styles.layout} data-cover={world.cover}>
      <Masthead
        cover={world.cover}
        title={world.name}
        titleTo={base}
        titleLang={world.contentLanguage}
        actions={
          <>
            <button
              type="button"
              className={`${mastheadStyles.iconButton} ${styles.searchButton}`}
              onClick={() => setPaletteOpen(true)}
              aria-keyshortcuts="Control+K Meta+K"
              title={t('encyclopedia:search.button')}
            >
              <Search aria-hidden="true" strokeWidth={1.75} />
              <span className={styles.searchLabel}>{t('encyclopedia:search.button')}</span>
              <kbd className={styles.kbd}>{IS_MAC ? '⌘K' : t('encyclopedia:search.shortcut')}</kbd>
            </button>
            <NavLink to={`${base}/new`} className={mastheadStyles.iconButton} title={t('encyclopedia:page.new')}>
              <Plus aria-hidden="true" strokeWidth={1.75} />
              <span className={styles.actionLabel}>{t('encyclopedia:page.newShort')}</span>
            </NavLink>
            <NavLink
              to={`${base}/settings`}
              className={mastheadStyles.iconButton}
              aria-label={t('common:nav.worldSettings')}
              title={t('common:nav.worldSettings')}
            >
              <Settings aria-hidden="true" strokeWidth={1.75} />
            </NavLink>
          </>
        }
      >
        <nav className={styles.tabs} aria-label={t('encyclopedia:nav.chapters')}>
          <ul role="list" className={styles.tabList}>
            {categories.map((c) => (
              <li key={c.id} data-ink={c.ink}>
                <NavLink to={`${base}/c/${c.id}`} className={styles.tab} data-active={c.id === activeCategory || undefined}>
                  <CategoryIcon name={c.icon} className={styles.tabIcon} />
                  <span className={styles.tabLabel}>{categoryName(c, t, true)}</span>
                  <span className={styles.tabCount}>{counts?.get(c.id) ?? 0}</span>
                </NavLink>
              </li>
            ))}
            <li className={styles.viewsStart}>
              <NavLink to={`${base}/timeline`} className={`${styles.tab} ${styles.viewTab}`}>
                <CalendarRange aria-hidden="true" className={styles.tabIcon} strokeWidth={1.75} />
                <span className={styles.tabLabel}>{t('encyclopedia:timeline.title')}</span>
              </NavLink>
            </li>
            <li>
              <NavLink to={`${base}/graph`} className={`${styles.tab} ${styles.viewTab}`}>
                <Network aria-hidden="true" className={styles.tabIcon} strokeWidth={1.75} />
                <span className={styles.tabLabel}>{t('encyclopedia:nav.graph')}</span>
              </NavLink>
            </li>
            <li className={styles.tabManage}>
              <NavLink to={`${base}/chapters`} className={styles.tab}>
                <span className={styles.tabLabel}>{t('encyclopedia:nav.manageChapters')}</span>
              </NavLink>
            </li>
          </ul>
        </nav>
      </Masthead>
      <main id="main" className={styles.main} tabIndex={-1}>
        <Outlet context={{ world, categories, setActiveCategory } satisfies WorldContext} />
      </main>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} world={world} categories={categories} />
    </div>
  )
}

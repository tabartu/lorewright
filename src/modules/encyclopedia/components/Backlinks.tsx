import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { contentCollator } from '../../../core/i18n/format'
import { useBacklinks } from '../../../core/lore/api'
import { categoryName } from '../../../core/lore/categories'
import type { Category, World } from '../../../core/lore/types'
import { CategoryIcon } from '../../../ui/CategoryIcon'
import styles from './Backlinks.module.css'
import { StatusMark } from './StatusMark'

/** "Pages that link here": every page whose text or stat block points at this one. */
export function Backlinks({ pageId, world, categories }: { pageId: string; world: World; categories: Category[] }) {
  const { t } = useTranslation()
  const pages = useBacklinks(pageId)
  if (!pages) return null
  const byId = new Map(categories.map((c) => [c.id, c]))
  const collator = contentCollator(world.contentLanguage)
  const sorted = [...pages].sort((a, b) => collator.compare(a.title, b.title))
  return (
    <section className={styles.backlinks} aria-labelledby="backlinks-title">
      <h2 id="backlinks-title" className={styles.title}>
        {t('encyclopedia:backlinks.title')}
        <span className={styles.count}>{sorted.length}</span>
      </h2>
      {sorted.length === 0 ? (
        <p className={styles.empty}>{t('encyclopedia:backlinks.empty')}</p>
      ) : (
        <ul role="list" className={styles.list}>
          {sorted.map((p) => {
            const c = byId.get(p.categoryId)
            return (
              <li key={p.id} data-ink={c?.ink}>
                {c && <CategoryIcon name={c.icon} className={styles.icon} />}
                <Link to={`/w/${world.id}/p/${p.id}`} className={styles.link} lang={world.contentLanguage}>
                  {p.title}
                </Link>{' '}
                <StatusMark status={p.status} />
                {c && <span className={styles.meta}>{categoryName(c, t)}</span>}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

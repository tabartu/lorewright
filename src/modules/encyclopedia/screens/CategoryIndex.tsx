import { Plus } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { NotFound } from '../../../app/screens/NotFound'
import { useWorldContext } from '../../../app/shell/WorldLayout'
import { useDocumentTitle } from '../../../app/shell/useDocumentTitle'
import { contentCollator, useFormat } from '../../../core/i18n/format'
import { usePages } from '../../../core/lore/api'
import { categoryName } from '../../../core/lore/categories'
import type { Page } from '../../../core/lore/types'
import { ButtonLink } from '../../../ui/Button'
import { CategoryIcon } from '../../../ui/CategoryIcon'
import { StatusMark } from '../components/StatusMark'
import styles from './CategoryIndex.module.css'

/** A chapter: opener band in the chapter ink, then an A–Z index of its entries. */
export function CategoryIndex() {
  const { categoryId } = useParams()
  const { world, categories } = useWorldContext()
  const { t } = useTranslation()
  const fmt = useFormat()
  const category = categories.find((c) => c.id === categoryId)
  const pages = usePages(world.id, { categoryId })
  useDocumentTitle(category ? categoryName(category, t, true) : undefined, world.name)

  const groups = useMemo(() => {
    if (!pages) return []
    const lang = world.contentLanguage
    const collator = contentCollator(lang)
    const sorted = [...pages].sort((a, b) => collator.compare(a.title, b.title))
    const map = new Map<string, Page[]>()
    for (const p of sorted) {
      const first = [...p.title.trim()][0] ?? '#'
      const letter = /\p{L}/u.test(first) ? first.toLocaleUpperCase(lang) : '#'
      map.set(letter, [...(map.get(letter) ?? []), p])
    }
    return [...map.entries()]
  }, [pages, world.contentLanguage])

  if (!category) return <NotFound />
  const singular = categoryName(category, t)
  const plural = categoryName(category, t, true)
  const newHref = `/w/${world.id}/new?category=${category.id}`

  return (
    <div data-ink={category.ink}>
      <header className={styles.opener}>
        <div className={styles.openerInner}>
          <CategoryIcon name={category.icon} className={styles.openerIcon} />
          <div className={styles.openerText}>
            <h1 className={styles.title}>{plural}</h1>
            <p className={styles.count}>
              {pages ? t('encyclopedia:chapter.count', { count: pages.length, formatted: fmt.number(pages.length) }) : ' '}
            </p>
          </div>
          <ButtonLink to={newHref} variant="primary" icon={<Plus aria-hidden="true" />}>
            {t('encyclopedia:chapter.new', { category: singular })}
          </ButtonLink>
        </div>
      </header>

      <div className={styles.body}>
        {pages && pages.length === 0 ? (
          <section className={styles.empty}>
            <h2 className={styles.emptyTitle}>{t('encyclopedia:chapter.emptyTitle', { category: plural })}</h2>
            <p className={styles.emptyBody}>
              {category.builtIn
                ? t(`encyclopedia:category.${category.builtIn}.purpose`)
                : t('encyclopedia:chapter.customPurpose', { category: plural })}
            </p>
            <p className={styles.emptyBody}>{t('encyclopedia:chapter.emptyHint')}</p>
            <ButtonLink to={newHref} variant="primary" icon={<Plus aria-hidden="true" />}>
              {t('encyclopedia:chapter.new', { category: singular })}
            </ButtonLink>
          </section>
        ) : (
          <>
            {groups.length > 6 && (
              <nav className={styles.letters} aria-label={t('encyclopedia:chapter.letters')}>
                {groups.map(([letter]) => (
                  <a key={letter} href={`#letter-${encodeURIComponent(letter)}`} onClick={(e) => {
                    e.preventDefault()
                    document.getElementById(`letter-${letter}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}>
                    {letter}
                  </a>
                ))}
              </nav>
            )}
            <div className={styles.index} lang={world.contentLanguage}>
              {groups.map(([letter, entries]) => (
                <section key={letter} className={styles.group} aria-labelledby={`letter-${letter}`}>
                  <h2 id={`letter-${letter}`} className={styles.letter}>
                    {letter}
                  </h2>
                  <ul role="list" className={styles.entries}>
                    {entries.map((p) => (
                      <li key={p.id}>
                        <Link to={`/w/${world.id}/p/${p.id}`} className={styles.entry}>
                          <span className={styles.entryTitle}>{p.title}</span> <StatusMark status={p.status} />
                        </Link>
                        {p.excerpt && <p className={styles.excerpt}>{p.excerpt}</p>}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useParams } from 'react-router'
import { NotFound } from '../../../app/screens/NotFound'
import { useActiveChapter, useWorldContext } from '../../../app/shell/WorldLayout'
import { useDocumentTitle } from '../../../app/shell/useDocumentTitle'
import { contentCollator, useFormat } from '../../../core/i18n/format'
import { usePage, usePages } from '../../../core/lore/api'
import { categoryName } from '../../../core/lore/categories'
import { ButtonLink } from '../../../ui/Button'
import { MarkdownView } from '../components/MarkdownView'
import { StatusMark } from '../components/StatusMark'
import styles from './PageReader.module.css'

/** An entry: running head, headword, reading column and stat block, folio. */
export function PageReader() {
  const { pageId } = useParams()
  const { world, categories } = useWorldContext()
  const data = usePage(pageId)
  const { t } = useTranslation()
  const fmt = useFormat()
  const location = useLocation()
  const notice = (location.state as { notice?: string } | null)?.notice
  const category = data ? categories.find((c) => c.id === data.page.categoryId) : undefined
  const siblings = usePages(world.id, { categoryId: category?.id })
  useDocumentTitle(data?.page.title, world.name)
  useActiveChapter(category?.id)

  const folio = useMemo(() => {
    if (!siblings || !data) return {}
    const collator = contentCollator(world.contentLanguage)
    const sorted = [...siblings].sort((a, b) => collator.compare(a.title, b.title))
    const i = sorted.findIndex((p) => p.id === data.page.id)
    return { prev: i > 0 ? sorted[i - 1] : undefined, next: i >= 0 ? sorted[i + 1] : undefined }
  }, [siblings, data, world.contentLanguage])

  if (data === null) return <NotFound />
  if (!data) return <div className={styles.loading} aria-busy="true" />

  const { page, body } = data
  const base = `/w/${world.id}`
  const singular = category ? categoryName(category, t) : ''

  return (
    <article className={styles.entry} data-ink={category?.ink}>
      <div className={styles.inner}>
        <nav className={styles.runningHead} aria-label={t('encyclopedia:page.breadcrumb')}>
          <Link to={base} lang={world.contentLanguage}>
            {world.name}
          </Link>
          <span aria-hidden="true">/</span>
          {category && <Link to={`${base}/c/${category.id}`}>{categoryName(category, t, true)}</Link>}
        </nav>

        {notice && (
          <p className={styles.notice} role="status">
            {notice}
          </p>
        )}

        <header className={styles.head}>
          <h1 className={styles.headword} lang={world.contentLanguage}>
            {page.title}
          </h1>
          <div className={styles.headMeta}>
            <p className={styles.metaLine}>
              <span className={styles.metaCategory}>{singular}</span>
              {page.date && <span>{fmt.worldDate(page.date, world.calendar)}</span>}
              {page.aliases.length > 0 && (
                <span lang={world.contentLanguage}>
                  {t('encyclopedia:page.alsoKnownAs', { names: page.aliases.join(', ') })}
                </span>
              )}
              <StatusMark status={page.status} />
            </p>
            <ButtonLink to={`${base}/p/${page.id}/edit`} variant="primary" size="sm" icon={<Pencil aria-hidden="true" />}>
              {t('common:action.edit')}
            </ButtonLink>
          </div>
        </header>

        <div className={styles.spread}>
          <div className={styles.column}>
            {body.trim() ? (
              <MarkdownView markdown={body} worldId={world.id} lang={world.contentLanguage} />
            ) : (
              <div className={styles.blank}>
                <p className={styles.blankTitle}>{t('encyclopedia:page.emptyTitle')}</p>
                <p className={styles.blankBody}>{t('encyclopedia:page.emptyBody')}</p>
                <ButtonLink to={`${base}/p/${page.id}/edit`} icon={<Pencil aria-hidden="true" />}>
                  {t('encyclopedia:page.startWriting')}
                </ButtonLink>
              </div>
            )}
          </div>

          <aside className={styles.statBlock} aria-label={t('encyclopedia:page.facts')}>
            <h2 className={styles.statTitle} lang={world.contentLanguage}>
              {page.title}
            </h2>
            <dl className={styles.stats}>
              <div>
                <dt>{t('encyclopedia:page.category')}</dt>
                <dd>{singular}</dd>
              </div>
              {page.date && (
                <div>
                  <dt>{t('encyclopedia:field.date')}</dt>
                  <dd>
                    {fmt.worldDate(page.date, world.calendar)}
                    {page.endDate && ` – ${fmt.worldDate(page.endDate, world.calendar)}`}
                  </dd>
                </div>
              )}
              <div>
                <dt>{t('encyclopedia:page.statusLabel')}</dt>
                <dd>{t(`encyclopedia:status.${page.status}`)}</dd>
              </div>
              <div>
                <dt>{t('encyclopedia:page.words')}</dt>
                <dd>{fmt.number(page.wordCount)}</dd>
              </div>
              <div>
                <dt>{t('encyclopedia:page.updated')}</dt>
                <dd>
                  <time dateTime={new Date(page.updatedAt).toISOString()} title={fmt.dateTime(page.updatedAt)}>
                    {fmt.relative(page.updatedAt)}
                  </time>
                </dd>
              </div>
            </dl>
          </aside>
        </div>

        {(folio.prev || folio.next) && (
        <nav className={styles.folio} aria-label={t('encyclopedia:page.folio')}>
          {folio.prev ? (
            <Link to={`${base}/p/${folio.prev.id}`} className={styles.folioLink} rel="prev">
              <ChevronLeft aria-hidden="true" className={styles.folioIcon} />
              <span>
                <span className={styles.folioLabel}>{t('encyclopedia:page.previous')}</span>
                <span className={styles.folioTitle} lang={world.contentLanguage}>
                  {folio.prev.title}
                </span>
              </span>
            </Link>
          ) : (
            <span />
          )}
          {folio.next && (
            <Link to={`${base}/p/${folio.next.id}`} className={`${styles.folioLink} ${styles.folioNext}`} rel="next">
              <span>
                <span className={styles.folioLabel}>{t('encyclopedia:page.next')}</span>
                <span className={styles.folioTitle} lang={world.contentLanguage}>
                  {folio.next.title}
                </span>
              </span>
              <ChevronRight aria-hidden="true" className={styles.folioIcon} />
            </Link>
          )}
        </nav>
        )}
      </div>
    </article>
  )
}

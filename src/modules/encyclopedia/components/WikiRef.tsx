import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import styles from './MarkdownView.module.css'

/** A link to a page by title: live if it exists, a red "create" link if not. */
export function WikiRef({ title, worldId, target }: { title: string; worldId: string; target?: { id: string } }) {
  const { t } = useTranslation()
  if (target) {
    return (
      <Link to={`/w/${worldId}/p/${target.id}`} className={styles.wikilink}>
        {title}
      </Link>
    )
  }
  return (
    <Link
      to={`/w/${worldId}/new?title=${encodeURIComponent(title)}`}
      className={styles.redlink}
      title={t('encyclopedia:link.missingTitle', { title })}
    >
      {title}
      <span className="visually-hidden"> ({t('encyclopedia:link.missingA11y')})</span>
    </Link>
  )
}

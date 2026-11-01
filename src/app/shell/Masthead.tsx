import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { CoverInk } from '../../core/lore/types'
import styles from './Masthead.module.css'
import { PreferencesMenu } from './PreferencesMenu'

interface MastheadProps {
  cover?: CoverInk
  /** Title shown after the Worldledger mark (world name). */
  title?: ReactNode
  titleTo?: string
  titleLang?: string
  actions?: ReactNode
  children?: ReactNode
}

/** The band across the top of every screen, printed in the world's cover ink. */
export function Masthead({ cover, title, titleTo, titleLang, actions, children }: MastheadProps) {
  const { t } = useTranslation()
  return (
    <header className={styles.masthead} data-cover={cover} data-house={cover ? undefined : ''}>
      <div className={styles.band}>
        <div className={styles.inner}>
          <Link to="/" className={styles.mark} aria-label={t('common:nav.shelf')} title={t('common:nav.shelf')}>
            <svg viewBox="0 0 32 32" aria-hidden="true" className={styles.glyph}>
              <path d="M6 5h4v22H6z" fill="currentColor" />
              <path d="M12 5h14v22H12z" fill="currentColor" opacity="0.35" />
              <path d="M15 10h8M15 14h8M15 18h8M15 22h5" stroke="currentColor" strokeWidth="2" />
            </svg>
            {!title && <span className={styles.wordmark} lang="en">{t('common:appName')}</span>}
          </Link>
          {title && (
            <>
              <span className={styles.divider} aria-hidden="true" />
              {titleTo ? (
                <Link to={titleTo} className={styles.title} lang={titleLang}>
                  {title}
                </Link>
              ) : (
                <span className={styles.title} lang={titleLang}>
                  {title}
                </span>
              )}
            </>
          )}
          <div className={styles.actions}>
            {actions}
            <PreferencesMenu triggerClassName={styles.iconButton} />
          </div>
        </div>
      </div>
      {children}
    </header>
  )
}

export { styles as mastheadStyles }

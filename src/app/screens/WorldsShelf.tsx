import { BookPlus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { useFormat } from '../../core/i18n/format'
import { useWorlds } from '../../core/lore/api'
import { loadSampleWorld, type SampleKind } from '../../sample-data'
import { Button, ButtonLink } from '../../ui/Button'
import layout from '../../ui/layout.module.css'
import { Masthead } from '../shell/Masthead'
import { useDocumentTitle } from '../shell/useDocumentTitle'
import styles from './WorldsShelf.module.css'

export function WorldsShelf() {
  const worlds = useWorlds()
  const { t } = useTranslation()
  const fmt = useFormat()
  const navigate = useNavigate()
  const [loading, setLoading] = useState<SampleKind | null>(null)
  useDocumentTitle(t('common:nav.shelf'))

  async function openSample(kind: SampleKind) {
    setLoading(kind)
    try {
      const id = await loadSampleWorld(kind)
      navigate(`/w/${id}`)
    } finally {
      setLoading(null)
    }
  }

  const sampleButtons = (
    <>
      <Button onClick={() => openSample('en')} busy={loading === 'en'}>
        {t('onboarding:shelf.sampleEn')}
      </Button>
      <Button onClick={() => openSample('tr')} busy={loading === 'tr'}>
        {t('onboarding:shelf.sampleTr')}
      </Button>
    </>
  )

  return (
    <>
      <Masthead />
      <main id="main" className={layout.page}>
        {worlds === undefined ? (
          <div aria-busy="true" className={styles.placeholder} />
        ) : worlds.length === 0 ? (
          <section className={styles.empty} aria-labelledby="shelf-empty-title">
            <div className={styles.emptyCopy}>
              <h1 id="shelf-empty-title" className={styles.emptyTitle}>
                {t('onboarding:shelf.emptyTitle')}
              </h1>
              <p className={styles.emptyLede}>{t('onboarding:shelf.emptyLede')}</p>
              <ol className={styles.steps}>
                <li>{t('onboarding:shelf.step1')}</li>
                <li>{t('onboarding:shelf.step2')}</li>
                <li>{t('onboarding:shelf.step3')}</li>
              </ol>
              <div className={layout.actions}>
                <ButtonLink to="/worlds/new" variant="primary" icon={<BookPlus aria-hidden="true" />}>
                  {t('onboarding:shelf.create')}
                </ButtonLink>
                {sampleButtons}
              </div>
              <p className={styles.emptyNote}>{t('onboarding:shelf.localNote')}</p>
            </div>
            <div className={styles.emptyShelf} aria-hidden="true">
              <span className={styles.ghostCover} data-cover="lapis" />
              <span className={styles.ghostCover} data-cover="oxblood" />
              <span className={styles.ghostCover} data-cover="ochre" />
              <span className={styles.ghostSlot} />
            </div>
          </section>
        ) : (
          <>
            <header className={layout.header}>
              <div>
                <h1 className={layout.title}>{t('common:nav.shelf')}</h1>
                <p className={layout.lede}>{t('onboarding:shelf.lede', { count: worlds.length })}</p>
              </div>
              <div className={layout.actions}>
                <ButtonLink to="/worlds/new" variant="primary" icon={<BookPlus aria-hidden="true" />}>
                  {t('onboarding:shelf.create')}
                </ButtonLink>
              </div>
            </header>
            <ul role="list" className={styles.shelf}>
              {worlds.map((w) => (
                <li key={w.id}>
                  <Link to={`/w/${w.id}`} className={styles.cover} data-cover={w.cover}>
                    <span className={styles.coverTop}>
                      {[w.genre, fmt.languageName(w.contentLanguage)].filter(Boolean).join(' · ')}
                    </span>
                    <span className={styles.coverTitle} lang={w.contentLanguage}>
                      {w.name}
                    </span>
                    <span className={styles.coverRule} aria-hidden="true" />
                    <span className={styles.coverFoot}>
                      {t('onboarding:shelf.updated', { when: fmt.relative(w.updatedAt) })}
                    </span>
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/worlds/new" className={styles.newSlot}>
                  <BookPlus aria-hidden="true" strokeWidth={1.5} />
                  <span>{t('onboarding:shelf.newSlot')}</span>
                </Link>
              </li>
            </ul>
            <section className={layout.section}>
              <h2 className={layout.sectionTitle}>{t('onboarding:shelf.samplesTitle')}</h2>
              <div className={layout.actions}>
                {sampleButtons}
              </div>
            </section>
          </>
        )}
      </main>
    </>
  )
}

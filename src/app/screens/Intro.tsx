import { BookPlus, BookOpen, Search } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { loadSampleWorld, type SampleKind } from '../../sample-data'
import { Button, ButtonLink } from '../../ui/Button'
import { RestoreBackup } from './RestoreBackup'
import styles from './Intro.module.css'

const SECTIONS = ['pages', 'facts', 'search', 'timeline', 'map', 'graph', 'ai', 'export'] as const
type Section = (typeof SECTIONS)[number]

/**
 * The prospectus: what Worldledger is, shown as the front matter of a
 * sourcebook. First-time visitors land here; it is also reachable from the shelf.
 * Every specimen is drawn from the sample worlds and labelled as such.
 */
export function Intro() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState<SampleKind | null>(null)
  const sampleKind: SampleKind = i18n.resolvedLanguage === 'tr' ? 'tr' : 'en'

  async function openSample(kind: SampleKind) {
    setLoading(kind)
    try {
      navigate(`/w/${await loadSampleWorld(kind)}`)
    } finally {
      setLoading(null)
    }
  }

  const actions = (
    <div className={styles.actions}>
      <ButtonLink to="/worlds/new" variant="primary" icon={<BookPlus aria-hidden="true" />}>
        {t('onboarding:shelf.create')}
      </ButtonLink>
      <Button icon={<BookOpen aria-hidden="true" />} onClick={() => void openSample(sampleKind)} busy={loading === sampleKind}>
        {t('onboarding:intro.openSample')}
      </Button>
    </div>
  )

  return (
    <div className={styles.intro}>
      <section className={styles.hero} aria-labelledby="intro-title">
        <div className={styles.heroText}>
          <h1 id="intro-title" className={styles.title}>{t('onboarding:intro.title')}</h1>
          <p className={styles.lede}>{t('onboarding:intro.lede')}</p>
          {actions}
          <p className={styles.small}>{t('onboarding:shelf.localNote')}</p>
        </div>
        <div className={styles.heroArt} aria-hidden="true">
          <div className={styles.miniCase}>
            {(['viridian', 'oxblood', 'ochre', 'lapis', 'rust'] as const).map((ink, i) => (
              <span key={ink} className={styles.miniBook} data-cover={ink} style={{ blockSize: `${[88, 76, 94, 82, 70][i]}%` }}>
                <span>{t(`onboarding:intro.spines.${i}`)}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <nav className={styles.contents} aria-labelledby="intro-contents">
        <h2 id="intro-contents" className={styles.contentsTitle}>{t('encyclopedia:home.contents')}</h2>
        <ol role="list">
          {SECTIONS.map((s) => (
            <li key={s}>
              <a href={`#intro-${s}`} onClick={(e) => { e.preventDefault(); document.getElementById(`intro-${s}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>
                <span className={styles.tocName}>{t(`onboarding:intro.${s}.title`)}</span>
                <span className={styles.tocDesc}>{t(`onboarding:intro.${s}.short`)}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {SECTIONS.map((s, i) => (
        <section key={s} id={`intro-${s}`} className={styles.feature} data-flip={i % 2 === 1 || undefined} aria-labelledby={`intro-${s}-title`}>
          <div className={styles.featureText}>
            <h2 id={`intro-${s}-title`} className={styles.featureTitle}>{t(`onboarding:intro.${s}.title`)}</h2>
            <p>{t(`onboarding:intro.${s}.body`)}</p>
          </div>
          <figure className={styles.specimen} aria-label={t('onboarding:intro.specimenLabel', { what: t(`onboarding:intro.${s}.title`) })}>
            <Specimen kind={s} />
            <figcaption>{t('onboarding:intro.fromSample')}</figcaption>
          </figure>
        </section>
      ))}

      <section className={styles.promises} aria-labelledby="intro-promises">
        <h2 id="intro-promises" className={styles.promisesTitle}>{t('onboarding:intro.promisesTitle')}</h2>
        <dl className={styles.promiseList}>
          {(['local', 'account', 'ai', 'engine'] as const).map((p) => (
            <div key={p}>
              <dt>{t(`onboarding:intro.promise.${p}.title`)}</dt>
              <dd>{t(`onboarding:intro.promise.${p}.body`)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.close} aria-labelledby="intro-close">
        <h2 id="intro-close" className={styles.closeTitle}>{t('onboarding:intro.closeTitle')}</h2>
        {actions}
        <div className={styles.secondary}>
          <Button variant="quiet" onClick={() => void openSample(sampleKind === 'tr' ? 'en' : 'tr')} busy={loading === (sampleKind === 'tr' ? 'en' : 'tr')}>
            {sampleKind === 'tr' ? t('onboarding:shelf.sampleEn') : t('onboarding:shelf.sampleTr')}
          </Button>
          <RestoreBackup />
        </div>
      </section>
    </div>
  )
}

/** Small, faithful renderings of each feature, built from the app's own styles. */
function Specimen({ kind }: { kind: Section }) {
  const { t } = useTranslation()
  const d = (k: string) => t(`onboarding:intro.demo.${k}`)
  switch (kind) {
    case 'pages':
      return (
        <div className={styles.page} data-ink="cyan">
          <p className={styles.runHead}>{d('world')} / {t('encyclopedia:category.character.plural')}</p>
          <p className={styles.headword}>{d('hero')}</p>
          <p className={styles.prose}>
            {d('pagePre')} <span className={styles.live}>{d('linkLive')}</span> {d('pageMid')} <span className={styles.red}>{d('linkMissing')}</span>{d('pageEnd')}
          </p>
        </div>
      )
    case 'facts':
      return (
        <div className={styles.stat} data-ink="cyan">
          <p className={styles.statTitle}>{d('hero')}</p>
          <dl>
            <div><dt>{t('encyclopedia:field.born')}</dt><dd>{d('born')}</dd></div>
            <div><dt>{t('encyclopedia:field.affiliation')}</dt><dd><span className={styles.live}>{d('faction')}</span></dd></div>
            <div><dt>{t('encyclopedia:field.home')}</dt><dd><span className={styles.live}>{d('linkLive')}</span></dd></div>
            <div><dt>{t('encyclopedia:field.lifeStatus')}</dt><dd>{t('encyclopedia:lifeStatus.alive')}</dd></div>
          </dl>
        </div>
      )
    case 'search':
      return (
        <div className={styles.palette}>
          <p className={styles.query}><Search aria-hidden="true" />{d('query')}</p>
          <p className={styles.hit} data-ink="jade"><span>{d('hit1')}</span><small>{t('encyclopedia:category.location.singular')}</small></p>
          <p className={styles.hitDim} data-ink="cyan"><span>{d('hit2')}</span><small>{t('encyclopedia:category.character.singular')}</small></p>
        </div>
      )
    case 'timeline':
      return (
        <div className={styles.timeline}>
          <p className={styles.band} data-ink="cobalt"><b>{d('era1')}</b><span>{d('era1Range')}</span></p>
          <p className={styles.event}><b>{d('ev1Year')}</b><i className={styles.mark} />{d('ev1')}</p>
          <p className={styles.gap}>{d('gap')}</p>
          <p className={styles.band} data-ink="sienna"><b>{d('era2')}</b><span>{d('era2Range')}</span></p>
          <p className={styles.event}><b>{d('ev2Year')}</b><i className={styles.mark} />{d('ev2')}</p>
        </div>
      )
    case 'map':
      return (
        <div className={styles.map}>
          <svg viewBox="0 0 240 150" aria-hidden="true">
            <path className={styles.land} d="M20 120 C30 70 60 40 110 35 C150 30 170 55 200 50 C225 46 232 80 220 110 C205 135 150 140 110 130 C70 122 40 140 20 120 Z" />
            <path className={styles.water} d="M95 80 C110 70 130 75 135 90 C138 102 120 108 105 102 C92 97 88 88 95 80 Z" />
          </svg>
          <span className={styles.pin} data-ink="jade" style={{ insetInlineStart: '38%', insetBlockStart: '22%' }} />
          <span className={styles.pinLabel} style={{ insetInlineStart: '30%', insetBlockStart: '45%' }}>{d('linkLive')}</span>
          <span className={styles.pin} data-ink="graphite" data-missing="" style={{ insetInlineStart: '72%', insetBlockStart: '38%' }} />
          <span className={styles.pinLabel} style={{ insetInlineStart: '62%', insetBlockStart: '61%' }}>{d('linkMissing')}</span>
        </div>
      )
    case 'graph':
      return (
        <svg className={styles.graph} viewBox="0 0 240 150" aria-hidden="true">
          <g className={styles.edges}>
            <line x1="120" y1="75" x2="50" y2="35" /><line x1="120" y1="75" x2="195" y2="40" /><line x1="120" y1="75" x2="60" y2="120" />
            <line x1="120" y1="75" x2="185" y2="118" /><line x1="50" y1="35" x2="60" y2="120" />
          </g>
          <circle cx="120" cy="75" r="14" data-ink="cyan" />
          <rect x="40" y="25" width="20" height="20" rx="4" data-ink="jade" />
          <path d="M195 28 L208 50 L182 50 Z" data-ink="amber" />
          <path d="M60 108 L72 120 L60 132 L48 120 Z" data-ink="violet" />
          <circle cx="185" cy="118" r="9" data-ink="magenta" />
        </svg>
      )
    case 'ai':
      return (
        <div className={styles.ai}>
          <p className={styles.aiHead}>{t('ai:task.consistency.name')}</p>
          <p className={styles.finding}><span className={styles.sev}>{t('ai:severity.high')}</span>{d('finding')}</p>
          <p className={styles.findingText}>{d('findingText')}</p>
          <p className={styles.aiNote}>{t('ai:panel.reviewNote')}</p>
        </div>
      )
    case 'export':
      return (
        <ul className={styles.files} role="list">
          <li><b>{d('world')}.worldledger.json</b><span>{t('encyclopedia:export.json.name')}</span></li>
          <li><b>{d('world')} (Markdown).zip</b><span>{t('encyclopedia:export.zip.name')}</span></li>
          <li><b>{d('world')}.html</b><span>{t('encyclopedia:export.html.name')}</span></li>
        </ul>
      )
  }
}

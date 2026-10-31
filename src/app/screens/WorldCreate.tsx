import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { FALLBACK_LANGUAGE } from '../../core/i18n'
import { createWorld } from '../../core/lore/worlds'
import layout from '../../ui/layout.module.css'
import { Masthead } from '../shell/Masthead'
import { useDocumentTitle } from '../shell/useDocumentTitle'
import { WorldForm } from './WorldForm'

export function WorldCreate() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  useDocumentTitle(t('encyclopedia:world.createTitle'))
  return (
    <>
      <Masthead />
      <main id="main" className={`${layout.page} ${layout.narrow}`}>
        <header className={layout.header}>
          <div>
            <h1 className={layout.title}>{t('encyclopedia:world.createTitle')}</h1>
            <p className={layout.lede}>{t('encyclopedia:world.createLede')}</p>
          </div>
        </header>
        <WorldForm
          initial={{
            name: '',
            genre: '',
            tone: '',
            summary: '',
            contentLanguage: i18n.resolvedLanguage ?? FALLBACK_LANGUAGE,
            cover: 'lapis',
            calendar: { yearLabel: '', yearAbbr: '' },
          }}
          submitLabel={t('encyclopedia:world.createSubmit')}
          onCancel={() => navigate('/')}
          onSubmit={async (value) => {
            const world = await createWorld(value)
            navigate(`/w/${world.id}`)
          }}
        />
      </main>
    </>
  )
}

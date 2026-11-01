import { useTranslation } from 'react-i18next'
import layout from '../../ui/layout.module.css'
import { Masthead } from '../shell/Masthead'
import { useDocumentTitle } from '../shell/useDocumentTitle'
import { Intro } from './Intro'

/** The prospectus, reachable from the shelf once you already have worlds. */
export function About() {
  const { t } = useTranslation()
  useDocumentTitle(t('onboarding:intro.aboutLink'))
  return (
    <>
      <Masthead />
      <main id="main" className={layout.page}>
        <Intro />
      </main>
    </>
  )
}

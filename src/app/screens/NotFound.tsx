import { useTranslation } from 'react-i18next'
import { ButtonLink } from '../../ui/Button'
import layout from '../../ui/layout.module.css'
import { useDocumentTitle } from '../shell/useDocumentTitle'

export function NotFound() {
  const { t } = useTranslation()
  useDocumentTitle(t('common:notFound.title'))
  return (
    <div id="main" className={`${layout.page} ${layout.narrow}`}>
      <h1 className={layout.title}>{t('common:notFound.title')}</h1>
      <p className={layout.lede}>{t('common:notFound.body')}</p>
      <p className={layout.section}>
        <ButtonLink to="/" variant="primary">
          {t('common:notFound.back')}
        </ButtonLink>
      </p>
    </div>
  )
}

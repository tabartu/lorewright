import { Outlet } from 'react-router'
import { useTranslation } from 'react-i18next'

export function AppFrame() {
  const { t } = useTranslation()
  return (
    <>
      <a className="skip-link" href="#main">
        {t('common:a11y.skipToContent')}
      </a>
      <Outlet />
    </>
  )
}

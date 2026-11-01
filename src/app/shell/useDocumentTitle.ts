import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

/** Sets the tab title as "part · part · Worldledger". */
export function useDocumentTitle(...parts: Array<string | undefined | null>) {
  const { t } = useTranslation()
  const appName = t('common:appName')
  const title = [...parts.filter(Boolean), appName].join(' · ')
  useEffect(() => {
    document.title = title
  }, [title])
}

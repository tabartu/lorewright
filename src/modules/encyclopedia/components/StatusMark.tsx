import { useTranslation } from 'react-i18next'
import type { PageStatus } from '../../../core/lore/types'
import styles from './StatusMark.module.css'

/** Status is a typographic mark, never colour alone. Complete pages carry no mark. */
export function StatusMark({ status }: { status: PageStatus }) {
  const { t } = useTranslation()
  if (status === 'complete') return null
  return (
    <span className={styles.mark} data-status={status} title={t(`encyclopedia:status.${status}Hint`)}>
      {t(`encyclopedia:status.${status}`)}
    </span>
  )
}

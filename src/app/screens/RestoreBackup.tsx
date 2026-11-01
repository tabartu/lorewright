import { Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { BackupError, parseBackup, restoreWorld, worldExists, type WorldBackup } from '../../core/export/backup'
import { Button } from '../../ui/Button'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import styles from './RestoreBackup.module.css'

/** Restore a world from a JSON backup file; asks before replacing an existing world. */
export function RestoreBackup() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const input = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<WorldBackup | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  async function pick(file: File | undefined) {
    if (!file) return
    setError(undefined)
    try {
      const backup = parseBackup(await file.text())
      if (await worldExists(backup.world.id)) setPending(backup)
      else await restore(backup, 'replace')
    } catch (err) {
      setError(err instanceof BackupError ? t(`encyclopedia:export.restoreError.${err.code}`) : t('encyclopedia:export.failed', { detail: String(err) }))
    } finally {
      if (input.current) input.current.value = ''
    }
  }

  async function restore(backup: WorldBackup, mode: 'replace' | 'copy') {
    setBusy(true)
    try {
      const id = await restoreWorld(backup, mode, mode === 'copy' ? t('encyclopedia:export.copyName', { name: backup.world.name }) : undefined)
      setPending(null)
      navigate(`/w/${id}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button icon={<Upload aria-hidden="true" />} onClick={() => input.current?.click()} busy={busy}>
        {t('encyclopedia:export.restore')}
      </Button>
      <input ref={input} type="file" accept="application/json,.json" className="visually-hidden" tabIndex={-1}
        aria-label={t('encyclopedia:export.restore')} onChange={(e) => void pick(e.target.files?.[0])} />
      {error && <p className={styles.error} role="alert">{error}</p>}
      <ConfirmDialog
        open={!!pending}
        title={t('encyclopedia:export.existsTitle', { name: pending?.world.name ?? '' })}
        confirmLabel={t('encyclopedia:export.replace')}
        danger
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={() => pending && void restore(pending, 'replace')}
      >
        <p>{t('encyclopedia:export.existsBody')}</p>
        <p className={styles.copyRow}>
          <Button onClick={() => pending && void restore(pending, 'copy')} disabled={busy}>
            {t('encyclopedia:export.importCopy')}
          </Button>
        </p>
      </ConfirmDialog>
    </>
  )
}

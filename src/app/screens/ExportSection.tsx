import { FileArchive, FileCode2, FileJson } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { download, exportWorld, safeFileName } from '../../core/export/backup'
import { useExportLabels } from '../../core/export/useExportLabels'
import type { World } from '../../core/lore/types'
import { Button } from '../../ui/Button'
import layout from '../../ui/layout.module.css'
import styles from './ExportSection.module.css'

type Kind = 'json' | 'zip' | 'html'

/** Backup (JSON) and readable exports (Markdown zip, single HTML) of one world. */
export function ExportSection({ world }: { world: World }) {
  const { t } = useTranslation()
  const labels = useExportLabels(world.calendar)
  const [busy, setBusy] = useState<Kind | null>(null)
  const [done, setDone] = useState<string>()
  const [error, setError] = useState<string>()
  const stamp = new Date().toISOString().slice(0, 10)
  const base = `${safeFileName(world.name)} ${stamp}`

  async function run(kind: Kind) {
    setBusy(kind)
    setDone(undefined)
    setError(undefined)
    try {
      const backup = await exportWorld(world.id)
      if (kind === 'json') {
        download(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }), `${base}.worldledger.json`)
      } else if (kind === 'zip') {
        const { buildMarkdownZip } = await import('../../core/export/markdownZip')
        download(await buildMarkdownZip(backup, labels), `${base} (Markdown).zip`)
      } else {
        const { buildHtml } = await import('../../core/export/html')
        download(await buildHtml(backup, labels), `${base}.html`)
      }
      setDone(t(`encyclopedia:export.done.${kind}`))
    } catch (err) {
      setError(t('encyclopedia:export.failed', { detail: err instanceof Error ? err.message : String(err) }))
    } finally {
      setBusy(null)
    }
  }

  const items: Array<{ kind: Kind; icon: ReactNode }> = [
    { kind: 'json', icon: <FileJson aria-hidden="true" /> },
    { kind: 'zip', icon: <FileArchive aria-hidden="true" /> },
    { kind: 'html', icon: <FileCode2 aria-hidden="true" /> },
  ]

  return (
    <section id="export" className={layout.section} aria-labelledby="export-title">
      <h2 id="export-title" className={layout.sectionTitle}>{t('encyclopedia:export.title')}</h2>
      <p className={styles.help}>{t('encyclopedia:export.lede')}</p>
      <ul role="list" className={styles.list}>
        {items.map(({ kind, icon }) => (
          <li key={kind} className={styles.item}>
            <div className={styles.text}>
              <span className={styles.name}>{t(`encyclopedia:export.${kind}.name`)}</span>
              <span className={styles.desc}>{t(`encyclopedia:export.${kind}.desc`)}</span>
            </div>
            <Button icon={icon} busy={busy === kind} disabled={!!busy && busy !== kind} onClick={() => void run(kind)}>
              {t(`encyclopedia:export.${kind}.action`)}
            </Button>
          </li>
        ))}
      </ul>
      <p className={styles.note}>{t('encyclopedia:export.keysNote')}</p>
      {done && <p className={layout.notice} role="status">{done}</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </section>
  )
}

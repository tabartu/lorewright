import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { deleteWorld, updateWorld } from '../../core/lore/worlds'
import { Button } from '../../ui/Button'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import layout from '../../ui/layout.module.css'
import { useWorldContext } from '../shell/WorldLayout'
import { useDocumentTitle } from '../shell/useDocumentTitle'
import { CalendarEditor } from './CalendarEditor'
import { ExportSection } from './ExportSection'
import { WorldForm } from './WorldForm'

export function WorldSettings() {
  const { world } = useWorldContext()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  useDocumentTitle(t('common:nav.worldSettings'), world.name)
  const { hash } = useLocation()
  useEffect(() => {
    if (!hash) return
    const id = hash.slice(1)
    const timer = setTimeout(() => {
      const el = document.getElementById(id)
      el?.scrollIntoView({ block: 'start' })
      el?.querySelector<HTMLElement>('h2')?.focus()
    }, 50)
    return () => clearTimeout(timer)
  }, [hash])

  return (
    <div className={`${layout.page} ${layout.narrow}`}>
      <header className={layout.header}>
        <div>
          <h1 className={layout.title}>{t('common:nav.worldSettings')}</h1>
          <p className={layout.lede}>{t('encyclopedia:world.settingsLede')}</p>
        </div>
      </header>
      {saved && (
        <p className={layout.notice} role="status">
          {t('common:status.saved')}
        </p>
      )}
      <WorldForm
        key={world.id}
        initial={{
          name: world.name,
          genre: world.genre,
          tone: world.tone,
          summary: world.summary,
          contentLanguage: world.contentLanguage,
          cover: world.cover,
          calendar: world.calendar,
        }}
        submitLabel={t('common:action.save')}
        onSubmit={async (value) => {
          await updateWorld(world.id, value)
          setSaved(true)
        }}
      />
      <CalendarEditor world={world} />
      <ExportSection world={world} />
      <section className={layout.dangerZone}>
        <h2>{t('encyclopedia:world.deleteTitle')}</h2>
        <p>{t('encyclopedia:world.deleteBody')}</p>
        <Button variant="danger" onClick={() => setConfirmDelete(true)}>
          {t('encyclopedia:world.deleteAction')}
        </Button>
      </section>
      <ConfirmDialog
        open={confirmDelete}
        danger
        busy={deleting}
        title={t('encyclopedia:world.deleteConfirmTitle', { name: world.name })}
        confirmLabel={t('encyclopedia:world.deleteAction')}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          setDeleting(true)
          await deleteWorld(world.id)
          navigate('/')
        }}
      >
        {t('encyclopedia:world.deleteConfirmBody')}
      </ConfirmDialog>
    </div>
  )
}

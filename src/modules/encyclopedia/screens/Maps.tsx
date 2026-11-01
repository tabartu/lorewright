import { ImagePlus, Map as MapIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { useWorldContext } from '../../../app/shell/WorldLayout'
import { useDocumentTitle } from '../../../app/shell/useDocumentTitle'
import { useFormat } from '../../../core/i18n/format'
import { createMap, useMapImage, useMaps } from '../../../core/lore/maps'
import type { MapDoc } from '../../../core/lore/types'
import { Button } from '../../../ui/Button'
import { TextField } from '../../../ui/Field'
import styles from './Maps.module.css'

const MAX_BYTES = 40 * 1024 * 1024

/** The world's maps, and the place to upload a new one. */
export function Maps() {
  const { world } = useWorldContext()
  const { t } = useTranslation()
  const maps = useMaps(world.id)
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  useDocumentTitle(t('encyclopedia:maps.title'), world.name)

  function pick(f: File | undefined) {
    if (!f) return
    if (!f.type.startsWith('image/')) return setError(t('encyclopedia:maps.notImage'))
    if (f.size > MAX_BYTES) return setError(t('encyclopedia:maps.tooLarge', { mb: 40 }))
    setError(undefined)
    setFile(f)
    if (!name) setName(f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '))
  }

  async function upload(e: FormEvent) {
    e.preventDefault()
    if (!file) return setError(t('encyclopedia:maps.chooseFile'))
    setBusy(true)
    try {
      const map = await createMap(world.id, name, file)
      navigate(`/w/${world.id}/maps/${map.id}`)
    } catch {
      setError(t('encyclopedia:maps.readFailed'))
    } finally {
      setBusy(false)
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    pick(e.dataTransfer.files[0])
  }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>{t('encyclopedia:maps.title')}</h1>
        <p className={styles.lede}>{t('encyclopedia:maps.lede')}</p>
      </header>

      {maps && maps.length > 0 && (
        <ul role="list" className={styles.grid}>
          {maps.map((m) => (
            <li key={m.id}>
              <MapCard map={m} worldId={world.id} lang={world.contentLanguage} />
            </li>
          ))}
        </ul>
      )}

      <section className={styles.upload} aria-labelledby="upload-title">
        <h2 id="upload-title" className={styles.uploadTitle}>
          {maps && maps.length === 0 ? t('encyclopedia:maps.emptyTitle') : t('encyclopedia:maps.addTitle')}
        </h2>
        {maps && maps.length === 0 && <p className={styles.uploadLede}>{t('encyclopedia:maps.emptyBody')}</p>}
        <form onSubmit={upload} className={styles.form} noValidate>
          <div
            className={styles.drop}
            data-dragging={dragging || undefined}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <ImagePlus aria-hidden="true" className={styles.dropIcon} />
            <p className={styles.dropText}>{file ? file.name : t('encyclopedia:maps.dropHere')}</p>
            <Button onClick={() => input.current?.click()}>{t('encyclopedia:maps.chooseButton')}</Button>
            <input ref={input} type="file" accept="image/*" className="visually-hidden" tabIndex={-1}
              aria-label={t('encyclopedia:maps.chooseButton')} onChange={(e) => pick(e.target.files?.[0])} />
            <p className={styles.dropHint}>{t('encyclopedia:maps.hint')}</p>
          </div>
          <TextField label={t('encyclopedia:maps.name')} value={name} onChange={(e) => setName(e.target.value)}
            placeholder={t('encyclopedia:maps.namePlaceholder')} lang={world.contentLanguage} maxLength={80} />
          {error && <p className={styles.error} role="alert">{error}</p>}
          <div>
            <Button type="submit" variant="primary" busy={busy} disabled={!file} icon={<MapIcon aria-hidden="true" />}>
              {t('encyclopedia:maps.upload')}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}

function MapCard({ map, worldId, lang }: { map: MapDoc; worldId: string; lang: string }) {
  const blob = useMapImage(map.imageId)
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : undefined), [blob])
  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
  const fmt = useFormat()
  return (
    <Link to={`/w/${worldId}/maps/${map.id}`} className={styles.card}>
      <span className={styles.thumb}>{url && <img src={url} alt="" loading="lazy" />}</span>
      <span className={styles.cardName} lang={lang}>{map.name}</span>
      <span className={styles.cardMeta}>{fmt.number(map.width)} × {fmt.number(map.height)}</span>
    </Link>
  )
}

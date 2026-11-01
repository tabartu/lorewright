import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Crosshair, MapPin, Pencil, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { NotFound } from '../../../app/screens/NotFound'
import { useWorldContext } from '../../../app/shell/WorldLayout'
import { useDocumentTitle } from '../../../app/shell/useDocumentTitle'
import { contentCollator } from '../../../core/i18n/format'
import { usePageTitles, useResolveKeys } from '../../../core/lore/api'
import { categoryName } from '../../../core/lore/categories'
import { addMarker, deleteMap, deleteMarker, renameMap, updateMarker, useMap, useMapImage, useMarkers } from '../../../core/lore/maps'
import { foldKey } from '../../../core/lore/normalize'
import type { Marker } from '../../../core/lore/types'
import { Button } from '../../../ui/Button'
import { ConfirmDialog } from '../../../ui/ConfirmDialog'
import { WikiRef } from '../components/WikiRef'
import styles from './MapView.module.css'

/** Image px (x from left, y from top) ↔ Leaflet CRS.Simple lat/lng. */
const toLatLng = (x: number, y: number, h: number) => L.latLng(h - y, x)
const fromLatLng = (ll: L.LatLng, h: number) => ({ x: Math.round(ll.lng), y: Math.round(h - ll.lat) })

/** An uploaded map with zoom, pan and markers linked to pages. */
export function MapView() {
  const { mapId } = useParams()
  const map = useMap(mapId)
  if (map === null) return <NotFound />
  if (!map) return <div className={styles.loading} aria-busy="true" />
  return <MapScreen key={map.id} mapId={map.id} />
}

function MapScreen({ mapId }: { mapId: string }) {
  const { world, categories } = useWorldContext()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const map = useMap(mapId)!
  const blob = useMapImage(map?.imageId)
  const markers = useMarkers(mapId)
  const titles = usePageTitles(world.id)
  const resolved = useResolveKeys(world.id, (markers ?? []).filter((m) => m.pageTitle).map((m) => foldKey(m.pageTitle!)))
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState<string | null>(params.get('marker'))
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(map?.name ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showLabels, setShowLabels] = useState(true)
  const host = useRef<HTMLDivElement>(null)
  const leaflet = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)
  const addingRef = useRef(adding)
  addingRef.current = adding
  useDocumentTitle(map?.name, world.name)

  const byCat = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const pageCat = useMemo(() => new Map((titles ?? []).map((p) => [p.id, p.categoryId])), [titles])
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob])
  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])

  // Create the Leaflet map once the image is available.
  useEffect(() => {
    if (!host.current || !url || !map) return
    const h = map.height
    const w = map.width
    const bounds = L.latLngBounds([0, 0], [h, w])
    const lm = L.map(host.current, {
      crs: L.CRS.Simple,
      minZoom: -5,
      maxZoom: 3,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      attributionControl: false,
      maxBounds: bounds.pad(0.25),
      maxBoundsViscosity: 0.8,
    })
    L.imageOverlay(url, bounds, { alt: map.name }).addTo(lm)
    lm.fitBounds(bounds)
    lm.setMinZoom(lm.getZoom() - 1)
    layer.current = L.layerGroup().addTo(lm)
    lm.on('click', (e: L.LeafletMouseEvent) => {
      if (!addingRef.current) {
        setSelected(null)
        return
      }
      const { x, y } = fromLatLng(e.latlng, h)
      if (x < 0 || y < 0 || x > w || y > h) return
      void addMarker({ worldId: world.id, mapId: map.id, x, y, pageTitle: '' }).then((m) => {
        setSelected(m.id)
        setAdding(false)
      })
    })
    const ro = new ResizeObserver(() => lm.invalidateSize())
    ro.observe(host.current)
    leaflet.current = lm
    return () => {
      ro.disconnect()
      lm.remove()
      leaflet.current = null
      layer.current = null
    }
  }, [url, map?.id, map?.width, map?.height, map?.name, world.id])

  // Draw markers.
  useEffect(() => {
    const group = layer.current
    if (!group || !markers || !map) return
    group.clearLayers()
    for (const m of markers) {
      const target = m.pageTitle ? resolved?.get(foldKey(m.pageTitle)) : undefined
      const ink = target ? (byCat.get(pageCat.get(target.id) ?? '')?.ink ?? 'graphite') : 'graphite'
      const missing = !!m.pageTitle && !target
      const label = m.pageTitle || m.label || t('encyclopedia:maps.untitledMarker')
      const icon = L.divIcon({
        className: 'lw-pin-wrap',
        html: `<span class="lw-pin" data-ink="${ink}" ${missing ? 'data-missing' : ''} ${m.id === selected ? 'data-selected' : ''}></span>`,
        iconSize: [26, 34],
        iconAnchor: [13, 32],
      })
      const marker = L.marker(toLatLng(m.x, m.y, map.height), { icon, draggable: true, keyboard: true, title: label, alt: label, riseOnHover: true })
      if (showLabels) marker.bindTooltip(escapeHtml(label), { permanent: true, direction: 'bottom', offset: [0, 4], className: 'lw-pin-label' })
      marker.on('click', () => setSelected(m.id))
      marker.on('keypress', (e: L.LeafletKeyboardEvent) => {
        if (e.originalEvent.key === 'Enter') setSelected(m.id)
      })
      marker.on('dragend', () => {
        const { x, y } = fromLatLng(marker.getLatLng(), map.height)
        void updateMarker(m.id, { x: clamp(x, 0, map.width), y: clamp(y, 0, map.height) })
      })
      marker.addTo(group)
    }
  }, [markers, resolved, byCat, pageCat, selected, showLabels, map, t])

  // Selecting from the list (or ?marker=) centres the map on that marker.
  useEffect(() => {
    const m = markers?.find((x) => x.id === selected)
    if (m && leaflet.current && map) leaflet.current.panTo(toLatLng(m.x, m.y, map.height), { animate: true })
    if (selected !== params.get('marker')) {
      const next = new URLSearchParams(params)
      if (selected) next.set('marker', selected)
      else next.delete('marker')
      setParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, markers === undefined, leaflet.current])

  useEffect(() => {
    if (!adding) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAdding(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [adding])

  if (!map) return null
  const collator = contentCollator(world.contentLanguage)
  const sorted = [...(markers ?? [])].sort((a, b) => collator.compare(a.pageTitle || a.label || '', b.pageTitle || b.label || ''))
  const current = markers?.find((m) => m.id === selected)
  const base = `/w/${world.id}`

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        {renaming ? (
          <form className={styles.renameForm} onSubmit={(e) => { e.preventDefault(); void renameMap(map.id, name); setRenaming(false) }}>
            <label className="visually-hidden" htmlFor="map-name">{t('encyclopedia:maps.name')}</label>
            <input id="map-name" className={styles.renameInput} value={name} onChange={(e) => setName(e.target.value)} autoFocus lang={world.contentLanguage} maxLength={80} />
            <Button type="submit" size="sm" variant="primary">{t('common:action.save')}</Button>
            <Button size="sm" onClick={() => setRenaming(false)}>{t('common:action.cancel')}</Button>
          </form>
        ) : (
          <h1 className={styles.title} lang={world.contentLanguage}>{map.name}</h1>
        )}
        <div className={styles.actions}>
          <Button variant={adding ? 'primary' : 'secondary'} icon={<Crosshair aria-hidden="true" />} aria-pressed={adding} onClick={() => setAdding((a) => !a)}>
            {adding ? t('encyclopedia:maps.addingMarker') : t('encyclopedia:maps.addMarker')}
          </Button>
          <label className={styles.switch}>
            <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
            {t('encyclopedia:maps.showLabels')}
          </label>
          {!renaming && <Button variant="quiet" size="sm" icon={<Pencil aria-hidden="true" />} onClick={() => { setName(map.name); setRenaming(true) }}>{t('common:action.rename')}</Button>}
          <Button variant="quiet" size="sm" icon={<Trash2 aria-hidden="true" />} onClick={() => setConfirmDelete(true)}>{t('encyclopedia:maps.delete')}</Button>
        </div>
      </header>
      {adding && <p className={styles.addHint} role="status">{t('encyclopedia:maps.addHint')}</p>}

      <div className={styles.layout}>
        <div className={styles.stage} data-adding={adding || undefined}>
          <div ref={host} className={styles.canvas} role="application" aria-label={t('encyclopedia:maps.canvasLabel', { name: map.name, count: markers?.length ?? 0 })} />
        </div>

        <aside className={styles.side}>
          {current ? (
            <MarkerEditor
              key={current.id}
              marker={current}
              worldId={world.id}
              lang={world.contentLanguage}
              titles={(titles ?? []).map((p) => p.title)}
              target={current.pageTitle ? resolved?.get(foldKey(current.pageTitle)) : undefined}
              onClose={() => setSelected(null)}
              onOpen={(id) => navigate(`${base}/p/${id}`)}
            />
          ) : null}
          <section aria-labelledby="markers-title">
            <h2 id="markers-title" className={styles.sideTitle}>
              {t('encyclopedia:maps.markers', { count: sorted.length })}
            </h2>
            {sorted.length === 0 ? (
              <p className={styles.sideEmpty}>{t('encyclopedia:maps.noMarkers')}</p>
            ) : (
              <ul role="list" className={styles.list}>
                {sorted.map((m) => {
                  const target = m.pageTitle ? resolved?.get(foldKey(m.pageTitle)) : undefined
                  const cat = target ? byCat.get(pageCat.get(target.id) ?? '') : undefined
                  return (
                    <li key={m.id} data-ink={cat?.ink ?? 'graphite'}>
                      <button type="button" className={styles.listItem} aria-current={m.id === selected || undefined} onClick={() => setSelected(m.id)}>
                        <MapPin aria-hidden="true" className={styles.listIcon} />
                        <span className={styles.listLabel} lang={world.contentLanguage} data-missing={(m.pageTitle && !target) || undefined}>
                          {m.pageTitle || m.label || t('encyclopedia:maps.untitledMarker')}
                        </span>
                        {cat && <span className={styles.listMeta}>{categoryName(cat, t)}</span>}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        danger
        title={t('encyclopedia:maps.deleteConfirm', { name: map.name })}
        confirmLabel={t('encyclopedia:maps.delete')}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await deleteMap(map.id)
          navigate(`${base}/maps`)
        }}
      >
        {t('encyclopedia:maps.deleteBody', { count: markers?.length ?? 0 })}
      </ConfirmDialog>
    </div>
  )
}

function MarkerEditor({
  marker,
  worldId,
  lang,
  titles,
  target,
  onClose,
  onOpen,
}: {
  marker: Marker
  worldId: string
  lang: string
  titles: string[]
  target?: { id: string; title: string }
  onClose: () => void
  onOpen: (id: string) => void
}) {
  const { t } = useTranslation()
  const [pageTitle, setPageTitle] = useState(marker.pageTitle ?? '')
  const [label, setLabel] = useState(marker.label ?? '')
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!marker.pageTitle && !marker.label) input.current?.focus()
  }, [marker.pageTitle, marker.label])
  const save = () => void updateMarker(marker.id, { pageTitle: pageTitle.trim(), label: label.trim() || undefined })
  return (
    <section className={styles.editor} aria-labelledby="marker-title">
      <div className={styles.editorHead}>
        <h2 id="marker-title" className={styles.sideTitle}>{t('encyclopedia:maps.marker')}</h2>
        <button type="button" className={styles.close} onClick={onClose} aria-label={t('common:action.close')}>
          <X aria-hidden="true" />
        </button>
      </div>
      <form className={styles.editorForm} onSubmit={(e) => { e.preventDefault(); save() }}>
        <label className={styles.field}>
          <span>{t('encyclopedia:maps.linkedPage')}</span>
          <input ref={input} list="marker-pages" value={pageTitle} lang={lang} autoComplete="off"
            placeholder={t('encyclopedia:infobox.refPlaceholder')} onChange={(e) => setPageTitle(e.target.value)} onBlur={save} />
          <datalist id="marker-pages">{titles.map((x) => <option key={x} value={x} />)}</datalist>
        </label>
        <label className={styles.field}>
          <span>{t('encyclopedia:maps.label')}</span>
          <input value={label} lang={lang} placeholder={t('encyclopedia:maps.labelPlaceholder')} onChange={(e) => setLabel(e.target.value)} onBlur={save} />
        </label>
        {marker.pageTitle && (
          <p className={styles.linkLine}>
            <WikiRef title={marker.pageTitle} worldId={worldId} target={target} />
          </p>
        )}
        <div className={styles.editorActions}>
          <Button type="submit" size="sm" variant="primary">{t('common:action.save')}</Button>
          {target && <Button size="sm" onClick={() => onOpen(target.id)}>{t('encyclopedia:graph.open')}</Button>}
          <Button size="sm" variant="danger" icon={<Trash2 aria-hidden="true" />} onClick={() => { void deleteMarker(marker.id); onClose() }}>
            {t('encyclopedia:maps.deleteMarker')}
          </Button>
        </div>
      </form>
    </section>
  )
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

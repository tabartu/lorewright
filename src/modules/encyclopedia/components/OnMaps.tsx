import { MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useMarkersForPage, useMaps } from '../../../core/lore/maps'
import styles from './OnMaps.module.css'

/** "On the map": jump from a page to each marker that points at it. */
export function OnMaps({ worldId, keys }: { worldId: string; keys: string[] }) {
  const { t } = useTranslation()
  const markers = useMarkersForPage(worldId, keys)
  const maps = useMaps(markers && markers.length ? worldId : undefined)
  if (!markers?.length || !maps) return null
  const byId = new Map(maps.map((m) => [m.id, m]))
  return (
    <section className={styles.onMaps} aria-labelledby="on-maps-title">
      <h2 id="on-maps-title" className={styles.title}>{t('encyclopedia:maps.onMaps')}</h2>
      <ul role="list" className={styles.list}>
        {markers.map((m) => (
          <li key={m.id}>
            <Link to={`/w/${worldId}/maps/${m.mapId}?marker=${m.id}`} className={styles.link}>
              <MapPin aria-hidden="true" className={styles.icon} />
              {byId.get(m.mapId)?.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

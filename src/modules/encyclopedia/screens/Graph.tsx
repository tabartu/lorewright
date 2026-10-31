import cytoscape, { type Core, type ElementDefinition } from 'cytoscape'
import fcose from 'cytoscape-fcose'
import { ExternalLink, List, Network, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { useWorldContext } from '../../../app/shell/WorldLayout'
import { useDocumentTitle } from '../../../app/shell/useDocumentTitle'
import { contentCollator } from '../../../core/i18n/format'
import { usePages, useWorldLinks } from '../../../core/lore/api'
import { categoryName } from '../../../core/lore/categories'
import type { ID, Page } from '../../../core/lore/types'
import { ButtonLink } from '../../../ui/Button'
import { CategoryIcon } from '../../../ui/CategoryIcon'
import { tokenColor } from '../components/inkColor'
import styles from './Graph.module.css'

cytoscape.use(fcose)

type View = 'graph' | 'list'

/** Re-render when the theme (light/dark) changes, so canvas colours follow. */
function useThemeKey() {
  return useSyncExternalStore(
    (cb) => {
      const mq = matchMedia('(prefers-color-scheme: dark)')
      const mo = new MutationObserver(cb)
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
      mq.addEventListener('change', cb)
      return () => {
        mo.disconnect()
        mq.removeEventListener('change', cb)
      }
    },
    () => `${document.documentElement.dataset.theme ?? ''}:${matchMedia('(prefers-color-scheme: dark)').matches}`,
  )
}

/** Pages as nodes, links as edges, coloured by chapter. Has a full list equivalent. */
export function Graph() {
  const { world, categories } = useWorldContext()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const pages = usePages(world.id)
  const links = useWorldLinks(world.id)
  const themeKey = useThemeKey()
  const [view, setView] = useState<View>('graph')
  const [hidden, setHidden] = useState<Set<ID>>(new Set())
  const [showOrphans, setShowOrphans] = useState(false)
  const [selected, setSelected] = useState<ID | null>(null)
  const host = useRef<HTMLDivElement>(null)
  const cy = useRef<Core | null>(null)
  useDocumentTitle(t('encyclopedia:graph.title'), world.name)

  const byCat = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const byPage = useMemo(() => new Map((pages ?? []).map((p) => [p.id, p])), [pages])

  /** Undirected edges with weights, plus each page's neighbours. */
  const graph = useMemo(() => {
    const edges = new Map<string, { a: ID; b: ID; weight: number }>()
    const neighbours = new Map<ID, Set<ID>>()
    for (const l of links ?? []) {
      if (!l.toPageId || l.toPageId === l.fromPageId) continue
      if (!byPage.has(l.fromPageId) || !byPage.has(l.toPageId)) continue
      const [a, b] = [l.fromPageId, l.toPageId].sort()
      const key = `${a}|${b}`
      const e = edges.get(key) ?? { a, b, weight: 0 }
      e.weight++
      edges.set(key, e)
      for (const [x, y] of [[a, b], [b, a]]) {
        const set = neighbours.get(x) ?? new Set()
        set.add(y)
        neighbours.set(x, set)
      }
    }
    return { edges: [...edges.values()], neighbours }
  }, [links, byPage])

  const visiblePages = useMemo(
    () => (pages ?? []).filter((p) => !hidden.has(p.categoryId) && (showOrphans || graph.neighbours.has(p.id))),
    [pages, hidden, showOrphans, graph],
  )
  const presentCats = useMemo(() => [...new Set((pages ?? []).map((p) => p.categoryId))], [pages])
  const linkedCount = (pages ?? []).filter((p) => graph.neighbours.has(p.id)).length

  // Build / rebuild the Cytoscape instance.
  useEffect(() => {
    if (view !== 'graph' || !host.current || !pages) return
    const visible = new Set(visiblePages.map((p) => p.id))
    const ink = (p: Page) => tokenColor(`--ink-${byCat.get(p.categoryId)?.ink ?? 'graphite'}`)
    const els: ElementDefinition[] = [
      ...visiblePages.map((p) => ({
        data: { id: p.id, label: p.title, color: ink(p), degree: graph.neighbours.get(p.id)?.size ?? 0 },
      })),
      ...graph.edges
        .filter((e) => visible.has(e.a) && visible.has(e.b))
        .map((e) => ({ data: { id: `${e.a}|${e.b}`, source: e.a, target: e.b, weight: e.weight } })),
    ]
    const text = tokenColor('--ink')
    const paper = tokenColor('--paper')
    const rule = tokenColor('--rule-strong')
    const focus = tokenColor('--focus')
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const instance = cytoscape({
      container: host.current,
      elements: els,
      minZoom: 0.2,
      maxZoom: 3,
      wheelSensitivity: 0.3,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            width: 'mapData(degree, 0, 12, 14, 42)',
            height: 'mapData(degree, 0, 12, 14, 42)',
            label: 'data(label)',
            color: text,
            'font-family': 'Archivo Variable, system-ui, sans-serif',
            'font-size': 11,
            'font-weight': 600,
            'text-valign': 'bottom',
            'text-margin-y': 4,
            'text-outline-color': paper,
            'text-outline-width': 3,
            'text-max-width': '120px',
            'text-wrap': 'ellipsis',
            'border-width': 2,
            'border-color': paper,
          },
        },
        {
          selector: 'edge',
          style: {
            width: 'mapData(weight, 1, 4, 1, 3)',
            'line-color': rule,
            'curve-style': 'haystack',
            opacity: 0.8,
          },
        },
        { selector: '.faded', style: { opacity: 0.12 } },
        { selector: 'node.focus', style: { 'border-color': focus, 'border-width': 3, 'z-index': 10 } },
        { selector: 'edge.focus', style: { 'line-color': focus, opacity: 1, 'z-index': 9 } },
      ],
      layout: {
        name: 'fcose',
        animate: !reduce,
        animationDuration: 500,
        randomize: true,
        nodeRepulsion: () => 16000,
        idealEdgeLength: () => 120,
        fit: true,
        padding: 40,
      } as cytoscape.LayoutOptions,
    })
    instance.one('layoutstop', () => {
      instance.resize()
      instance.fit(undefined, 30)
    })
    instance.on('tap', 'node', (e) => setSelected(e.target.id()))
    instance.on('dbltap', 'node', (e) => navigate(`/w/${world.id}/p/${e.target.id()}`))
    instance.on('tap', (e) => {
      if (e.target === instance) setSelected(null)
    })
    // Keep the drawing centred when the container size changes (fonts, rotation, sidebars).
    const ro = new ResizeObserver(() => {
      instance.resize()
      instance.fit(undefined, 30)
    })
    ro.observe(host.current)
    cy.current = instance
    return () => {
      ro.disconnect()
      instance.destroy()
      cy.current = null
    }
  }, [view, visiblePages, graph, byCat, pages, themeKey, navigate, world.id])

  // Highlight the selected page and its neighbours.
  useEffect(() => {
    const c = cy.current
    if (!c) return
    c.elements().removeClass('faded focus')
    if (!selected) return
    const node = c.getElementById(selected)
    if (node.empty()) return
    const hood = node.closedNeighborhood()
    c.elements().not(hood).addClass('faded')
    hood.addClass('focus')
  }, [selected, visiblePages, themeKey])

  const toggle = (id: ID) =>
    setHidden((h) => {
      const next = new Set(h)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const selectedPage = selected ? byPage.get(selected) : undefined
  const selectedNeighbours = selected
    ? [...(graph.neighbours.get(selected) ?? [])].map((id) => byPage.get(id)).filter((p): p is Page => !!p)
    : []
  const collator = contentCollator(world.contentLanguage)
  const listPages = [...visiblePages].sort((a, b) => collator.compare(a.title, b.title))
  const base = `/w/${world.id}`

  if (pages && linkedCount < 2) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>{t('encyclopedia:graph.title')}</h1>
        <section className={styles.empty}>
          <svg viewBox="0 0 160 90" className={styles.emptyArt} aria-hidden="true">
            <line x1="30" y1="60" x2="80" y2="25" />
            <line x1="80" y1="25" x2="130" y2="62" />
            <circle cx="30" cy="60" r="9" data-ink="cyan" />
            <circle cx="80" cy="25" r="12" data-ink="jade" />
            <circle cx="130" cy="62" r="9" data-ink="violet" />
          </svg>
          <h2 className={styles.emptyTitle}>{t('encyclopedia:graph.emptyTitle')}</h2>
          <p>{t('encyclopedia:graph.emptyBody')}</p>
          <ButtonLink to={`${base}/new`} variant="primary">
            {t('encyclopedia:page.new')}
          </ButtonLink>
        </section>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>{t('encyclopedia:graph.title')}</h1>
          <p className={styles.lede}>{t('encyclopedia:graph.lede', { pages: visiblePages.length, links: graph.edges.length })}</p>
        </div>
        <div className={styles.viewSwitch} role="group" aria-label={t('encyclopedia:graph.view')}>
          <button type="button" aria-pressed={view === 'graph'} onClick={() => setView('graph')}>
            <Network aria-hidden="true" />
            {t('encyclopedia:graph.viewGraph')}
          </button>
          <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>
            <List aria-hidden="true" />
            {t('encyclopedia:graph.viewList')}
          </button>
        </div>
      </header>

      <div className={styles.controls}>
        <fieldset className={styles.filters}>
          <legend className="visually-hidden">{t('encyclopedia:graph.filter')}</legend>
          {presentCats.map((id) => {
            const c = byCat.get(id)
            if (!c) return null
            return (
              <label key={id} className={styles.chip} data-ink={c.ink}>
                <input type="checkbox" checked={!hidden.has(id)} onChange={() => toggle(id)} />
                <span className={styles.dot} aria-hidden="true" />
                {categoryName(c, t, true)}
              </label>
            )
          })}
        </fieldset>
        <label className={styles.switch}>
          <input type="checkbox" checked={showOrphans} onChange={(e) => setShowOrphans(e.target.checked)} />
          {t('encyclopedia:graph.showOrphans')}
        </label>
      </div>

      {view === 'graph' ? (
        <div className={styles.stage}>
          <div ref={host} className={styles.canvas} role="img" aria-label={t('encyclopedia:graph.canvasLabel', { pages: visiblePages.length })} />
          <p className={styles.hint}>{t('encyclopedia:graph.hint')}</p>
          {selectedPage && (
            <aside className={styles.panel} data-ink={byCat.get(selectedPage.categoryId)?.ink} aria-live="polite">
              <button type="button" className={styles.close} onClick={() => setSelected(null)} aria-label={t('common:action.close')}>
                <X aria-hidden="true" />
              </button>
              <p className={styles.panelCat}>{byCat.get(selectedPage.categoryId) && categoryName(byCat.get(selectedPage.categoryId)!, t)}</p>
              <h2 className={styles.panelTitle} lang={world.contentLanguage}>{selectedPage.title}</h2>
              {selectedPage.excerpt && <p className={styles.panelExcerpt} lang={world.contentLanguage}>{selectedPage.excerpt}</p>}
              <h3 className={styles.panelSub}>{t('encyclopedia:graph.connections', { count: selectedNeighbours.length })}</h3>
              <ul role="list" className={styles.panelList}>
                {selectedNeighbours.map((p) => (
                  <li key={p.id} data-ink={byCat.get(p.categoryId)?.ink}>
                    <button type="button" onClick={() => setSelected(p.id)} lang={world.contentLanguage}>
                      <span className={styles.dot} aria-hidden="true" />
                      {p.title}
                    </button>
                  </li>
                ))}
              </ul>
              <ButtonLink to={`${base}/p/${selectedPage.id}`} variant="primary" size="sm" icon={<ExternalLink aria-hidden="true" />}>
                {t('encyclopedia:graph.open')}
              </ButtonLink>
            </aside>
          )}
        </div>
      ) : (
        <table className={styles.table} lang={world.contentLanguage}>
          <thead>
            <tr>
              <th scope="col">{t('encyclopedia:graph.colPage')}</th>
              <th scope="col">{t('encyclopedia:graph.colConnections')}</th>
            </tr>
          </thead>
          <tbody>
            {listPages.map((p) => {
              const c = byCat.get(p.categoryId)
              const ns = [...(graph.neighbours.get(p.id) ?? [])].map((id) => byPage.get(id)).filter((x): x is Page => !!x)
              return (
                <tr key={p.id} data-ink={c?.ink}>
                  <th scope="row">
                    {c && <CategoryIcon name={c.icon} className={styles.rowIcon} />}
                    <Link to={`${base}/p/${p.id}`}>{p.title}</Link>
                  </th>
                  <td>
                    {ns.length === 0
                      ? <span className={styles.none}>{t('encyclopedia:graph.noConnections')}</span>
                      : ns.sort((a, b) => collator.compare(a.title, b.title)).map((n, i) => (
                          <span key={n.id}>
                            {i > 0 && ', '}
                            <Link to={`${base}/p/${n.id}`}>{n.title}</Link>
                          </span>
                        ))}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

import cytoscape, { type Core, type ElementDefinition } from 'cytoscape'
import fcose from 'cytoscape-fcose'
import { ExternalLink, List, Network, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { useWorldContext } from '../../../app/shell/WorldLayout'
import { useDocumentTitle } from '../../../app/shell/useDocumentTitle'
import { contentCollator } from '../../../core/i18n/format'
import { foldKey } from '../../../core/lore/normalize'
import { usePages, useWorldLinks } from '../../../core/lore/api'
import { categoryName } from '../../../core/lore/categories'
import type { Category, ID, Page } from '../../../core/lore/types'
import { ButtonLink } from '../../../ui/Button'
import { CategoryIcon } from '../../../ui/CategoryIcon'
import { tokenColor } from '../components/inkColor'
import styles from './Graph.module.css'

cytoscape.use(fcose)

/** Node shape per chapter, so category is a mark and not colour alone. */
const SHAPES = ['ellipse', 'round-rectangle', 'diamond', 'triangle', 'hexagon', 'star', 'pentagon', 'vee', 'octagon', 'tag'] as const

/** Layout positions per world for this browser session, so returning to the graph keeps its shape. */
const positions = new Map<string, Record<string, { x: number; y: number }>>()

function applyStyle(instance: Core, byCat: Map<ID, Category>, pages: Page[]) {
  const text = tokenColor('--ink')
  const paper = tokenColor('--paper')
  const rule = tokenColor('--rule-strong')
  const focus = tokenColor('--focus')
  const colours = new Map<string, string>()
  instance.batch(() => {
    for (const p of pages) {
      const ink = byCat.get(p.categoryId)?.ink ?? 'graphite'
      if (!colours.has(ink)) colours.set(ink, tokenColor(`--ink-${ink}`))
      instance.getElementById(p.id).data('color', colours.get(ink))
    }
  })
  instance.style([
    {
      selector: 'node',
      style: {
        'background-color': 'data(color)',
        shape: 'data(shape)' as never,
        width: 'mapData(degree, 0, 12, 16, 44)',
        height: 'mapData(degree, 0, 12, 16, 44)',
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
        'min-zoomed-font-size': 7,
      },
    },
    { selector: 'edge', style: { width: 'mapData(weight, 1, 4, 1, 3)', 'line-color': rule, 'curve-style': 'haystack', opacity: 0.75 } },
    { selector: '.faded', style: { opacity: 0.1 } },
    { selector: 'node.focus', style: { 'border-color': focus, 'border-width': 3, 'z-index': 10 } },
    { selector: 'edge.focus', style: { 'line-color': focus, opacity: 1, 'z-index': 9 } },
  ])
}

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
  const [ready, setReady] = useState(0)
  const [find, setFind] = useState('')
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

  const visibleIds = useMemo(() => new Set(visiblePages.map((p) => p.id)), [visiblePages])
  const visibleEdges = useMemo(() => graph.edges.filter((e) => visibleIds.has(e.a) && visibleIds.has(e.b)), [graph, visibleIds])
  const order = useMemo(() => new Map(categories.map((c, i) => [c.id, i])), [categories])

  // Build Cytoscape once per data set; filters and theme changes never re-run the layout.
  useEffect(() => {
    if (view !== 'graph' || !host.current || !pages) return
    const els: ElementDefinition[] = [
      ...pages.map((p) => ({
        data: {
          id: p.id,
          label: p.title,
          degree: graph.neighbours.get(p.id)?.size ?? 0,
          shape: SHAPES[(order.get(p.categoryId) ?? 0) % SHAPES.length],
        },
      })),
      ...graph.edges.map((e) => ({ data: { id: `${e.a}|${e.b}`, source: e.a, target: e.b, weight: e.weight } })),
    ]
    const instance = cytoscape({ container: host.current, elements: els, minZoom: 0.2, maxZoom: 3 })
    applyStyle(instance, byCat, pages)
    const saved = positions.get(world.id)
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (saved && pages.every((p) => saved[p.id])) {
      instance.nodes().positions((n) => saved[n.id()])
      instance.fit(undefined, 30)
    } else {
      instance
        .layout({
          name: 'fcose',
          animate: !reduce,
          animationDuration: 500,
          randomize: true,
          nodeRepulsion: () => 16000,
          idealEdgeLength: () => 120,
          fit: true,
          padding: 30,
        } as cytoscape.LayoutOptions)
        .run()
    }
    const remember = () => {
      const pos: Record<string, { x: number; y: number }> = {}
      instance.nodes().forEach((n) => {
        pos[n.id()] = { ...n.position() }
      })
      positions.set(world.id, pos)
    }
    instance.on('layoutstop dragfree', remember)
    instance.on('tap', 'node', (e) => setSelected(e.target.id()))
    instance.on('dbltap', 'node', (e) => navigate(`/w/${world.id}/p/${e.target.id()}`))
    instance.on('tap', (e) => {
      if (e.target === instance) setSelected(null)
    })
    const ro = new ResizeObserver(() => instance.resize())
    ro.observe(host.current)
    cy.current = instance
    setReady((r) => r + 1)
    return () => {
      ro.disconnect()
      instance.destroy()
      cy.current = null
    }
    // byCat/order only change with categories, which also change `pages` identity via live query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, pages, graph, world.id, navigate])

  // Theme: restyle in place.
  useEffect(() => {
    if (cy.current && pages) applyStyle(cy.current, byCat, pages)
  }, [themeKey, byCat, pages, ready])

  // Filters: hide nodes in place, keep positions, refit to what is visible.
  useEffect(() => {
    const c = cy.current
    if (!c) return
    c.batch(() => {
      c.nodes().forEach((n) => {
        n.style('display', visibleIds.has(n.id()) ? 'element' : 'none')
      })
    })
    const shown = c.nodes(':visible')
    if (shown.nonempty()) c.fit(shown, 30)
  }, [visibleIds, ready])

  // A page that gets filtered out is no longer selected.
  useEffect(() => {
    if (selected && !visibleIds.has(selected)) setSelected(null)
  }, [selected, visibleIds])

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
    c.animate({ center: { eles: node } }, { duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 250 })
  }, [selected, ready])

  const toggle = (id: ID) =>
    setHidden((h) => {
      const next = new Set(h)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const selectedPage = selected ? byPage.get(selected) : undefined
  const selectedNeighbours = selected
    ? [...(graph.neighbours.get(selected) ?? [])]
        .filter((id) => visibleIds.has(id))
        .map((id) => byPage.get(id))
        .filter((p): p is Page => !!p)
    : []
  const collator = contentCollator(world.contentLanguage)
  selectedNeighbours.sort((a, b) => collator.compare(a.title, b.title))
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
          <p className={styles.lede}>{t('encyclopedia:graph.lede', { pages: visiblePages.length, links: visibleEdges.length })}</p>
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
                <ShapeGlyph shape={SHAPES[(order.get(c.id) ?? 0) % SHAPES.length]} />
                {categoryName(c, t, true)}
              </label>
            )
          })}
        </fieldset>
        {view === 'graph' && (
          <form
            className={styles.find}
            onSubmit={(e) => {
              e.preventDefault()
              const hit = visiblePages.find((p) => foldKey(p.title) === foldKey(find)) ?? visiblePages.find((p) => foldKey(p.title).includes(foldKey(find)))
              if (hit) setSelected(hit.id)
            }}
          >
            <label className="visually-hidden" htmlFor="graph-find">{t('encyclopedia:graph.find')}</label>
            <input id="graph-find" list="graph-find-list" value={find} onChange={(e) => setFind(e.target.value)}
              placeholder={t('encyclopedia:graph.find')} lang={world.contentLanguage} autoComplete="off" />
            <datalist id="graph-find-list">
              {visiblePages.map((p) => <option key={p.id} value={p.title} />)}
            </datalist>
          </form>
        )}
        <label className={styles.switch}>
          <input type="checkbox" checked={showOrphans} onChange={(e) => setShowOrphans(e.target.checked)} />
          {t('encyclopedia:graph.showOrphans')}
        </label>
      </div>

      {view === 'graph' ? (
        <div className={styles.stage}>
          <div ref={host} className={styles.canvas} role="img" aria-label={t('encyclopedia:graph.canvasLabel', { pages: visiblePages.length })} />
          <p className={styles.hint}>{t('encyclopedia:graph.hint')}</p>
          <p className="visually-hidden" role="status">
            {selectedPage ? t('encyclopedia:graph.selected', { title: selectedPage.title, count: selectedNeighbours.length }) : ''}
          </p>
          {selectedPage && (
            <aside className={styles.panel} data-ink={byCat.get(selectedPage.categoryId)?.ink} aria-labelledby="graph-panel-title">
              <button type="button" className={styles.close} onClick={() => setSelected(null)} aria-label={t('common:action.close')}>
                <X aria-hidden="true" />
              </button>
              <h2 id="graph-panel-title" className={styles.panelTitle} lang={world.contentLanguage}>{selectedPage.title}</h2>
              <p className={styles.panelCat}>
                {byCat.get(selectedPage.categoryId) && categoryName(byCat.get(selectedPage.categoryId)!, t)}
                {' · '}
                {t('encyclopedia:graph.connections', { count: selectedNeighbours.length })}
              </p>
              {selectedPage.excerpt && <p className={styles.panelExcerpt} lang={world.contentLanguage}>{selectedPage.excerpt}</p>}
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
              const ns = [...(graph.neighbours.get(p.id) ?? [])].filter((id) => visibleIds.has(id)).map((id) => byPage.get(id)).filter((x): x is Page => !!x)
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

/** Small legend glyph matching a node shape. */
function ShapeGlyph({ shape }: { shape: (typeof SHAPES)[number] }) {
  const paths: Record<string, string> = {
    ellipse: 'M6 1a5 5 0 1 0 0 10A5 5 0 0 0 6 1z',
    'round-rectangle': 'M3 1h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2z',
    diamond: 'M6 0l6 6-6 6-6-6z',
    triangle: 'M6 0.5l5.5 11h-11z',
    hexagon: 'M3 1h6l3 5-3 5H3L0 6z',
    star: 'M6 0l1.8 3.9 4.2.4-3.2 2.8.9 4.1L6 9.1 2.3 11.2l.9-4.1L0 4.3l4.2-.4z',
    pentagon: 'M6 0l6 4.4-2.3 7.1H2.3L0 4.4z',
    vee: 'M0 1l6 3 6-3-6 10z',
    octagon: 'M3.5 0h5L12 3.5v5L8.5 12h-5L0 8.5v-5z',
    tag: 'M0 1h8l4 5-4 5H0z',
  }
  return (
    <svg viewBox="0 0 12 12" className={styles.glyph} aria-hidden="true">
      <path d={paths[shape]} />
    </svg>
  )
}

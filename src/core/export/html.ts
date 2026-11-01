import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { foldKey } from '../lore/normalize'
import { parseWikiLinks } from '../lore/wikilinks'
import type { WorldBackup } from './backup'
import { fieldText, type ExportLabels } from './labels'

const processor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeSanitize).use(rehypeStringify)

/**
 * One self-contained, readable HTML file: a contents list by chapter and every
 * page with its stat block. Wiki links become in-page links; missing pages
 * stay as plain text. Map images are embedded.
 */
export async function buildHtml(b: WorldBackup, labels: ExportLabels): Promise<Blob> {
  const bodies = new Map(b.bodies.map((x) => [x.pageId, x.body]))
  const collator = new Intl.Collator(b.world.contentLanguage, { sensitivity: 'base', numeric: true })
  const anchor = new Map<string, string>()
  for (const p of b.pages) for (const k of p.keys) anchor.set(k, `p-${p.id}`)

  const linkify = (md: string) => {
    const links = parseWikiLinks(md)
    let out = md
    for (let i = links.length - 1; i >= 0; i--) {
      const l = links[i]
      const id = anchor.get(l.key)
      const text = (l.label ?? l.target).replace(/[[\]]/g, '')
      const rep = id ? `[${text}](#${id})` : text
      out = out.slice(0, l.index) + rep + out.slice(l.index + l.length)
    }
    return out
  }

  const chapters = [...b.categories]
    .sort((a, c) => a.order - c.order)
    .map((c) => ({ c, pages: b.pages.filter((p) => p.categoryId === c.id).sort((x, y) => collator.compare(x.title, y.title)) }))
    .filter((x) => x.pages.length)

  const backlinks = new Map<string, Set<string>>()
  for (const p of b.pages) {
    for (const l of parseWikiLinks(bodies.get(p.id) ?? '')) {
      const id = anchor.get(l.key)
      if (id && id !== `p-${p.id}`) {
        const set = backlinks.get(id) ?? new Set()
        set.add(p.id)
        backlinks.set(id, set)
      }
    }
  }
  const titleOf = new Map(b.pages.map((p) => [p.id, p.title]))

  const sections: string[] = []
  for (const { c, pages } of chapters) {
    sections.push(`<section class="chapter"><h2 class="chapter-title">${esc(labels.category(c, true))}</h2>`)
    for (const p of pages) {
      const facts: string[] = []
      if (p.date) facts.push(row(labels.dateLabel, labels.date(p.date) + (p.endDate ? ` – ${labels.date(p.endDate)}` : '')))
      if (p.aliases.length) facts.push(row(labels.aliases, p.aliases.join(', ')))
      for (const f of c.fields) {
        const raw = fieldText(f, p.fields[f.id], labels, true)
        if (raw) facts.push(`<tr><th>${esc(labels.field(f))}</th><td>${inlineLinks(raw, anchor)}</td></tr>`)
      }
      const html = String(await processor.process(linkify(bodies.get(p.id) ?? '')))
      const back = [...(backlinks.get(`p-${p.id}`) ?? [])].map((id) => `<a href="#p-${id}">${esc(titleOf.get(id) ?? '')}</a>`)
      sections.push(`<article id="p-${p.id}" class="entry">
<h3 class="headword">${esc(p.title)}</h3>
${facts.length ? `<table class="stats">${facts.join('')}</table>` : ''}
<div class="body">${html}</div>
${back.length ? `<p class="backlinks"><strong>${esc(labels.linksHere)}:</strong> ${back.join(', ')}</p>` : ''}
</article>`)
    }
    sections.push('</section>')
  }

  const mapSections = b.maps.map((m) => {
    const img = b.mapImages.find((x) => x.id === m.imageId)
    const pins = b.markers.filter((x) => x.mapId === m.id)
    const list = pins.map((x) => `<li>${x.pageTitle ? inlineLinks(`[[${x.pageTitle}]]`, anchor) : esc(x.label ?? '')}</li>`).join('')
    return `<figure class="map"><figcaption>${esc(m.name)}</figcaption>${img ? `<img src="${img.dataUrl}" alt="${esc(m.name)}">` : ''}${list ? `<ul>${list}</ul>` : ''}</figure>`
  })

  const toc = chapters
    .map(({ c, pages }) => `<li><strong>${esc(labels.category(c, true))}</strong><ul>${pages.map((p) => `<li><a href="#p-${p.id}">${esc(p.title)}</a></li>`).join('')}</ul></li>`)
    .join('')

  const doc = `<!doctype html>
<html lang="${esc(b.world.contentLanguage)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(b.world.name)}</title>
<style>${CSS}</style>
</head>
<body>
<header class="title-page">
<h1>${esc(b.world.name)}</h1>
<p class="meta">${esc([b.world.genre, b.world.tone].filter(Boolean).join(' · '))}</p>
${b.world.summary ? `<p class="summary">${esc(b.world.summary)}</p>` : ''}
</header>
<nav class="toc" lang="${esc(labels.lang)}"><h2>${esc(labels.contents)}</h2><ol>${toc}</ol></nav>
<main>${sections.join('\n')}
${mapSections.length ? `<section class="chapter"><h2 class="chapter-title" lang="${esc(labels.lang)}">${esc(labels.maps)}</h2>${mapSections.join('')}</section>` : ''}
</main>
<footer lang="${esc(labels.lang)}">${esc(labels.generated)}</footer>
</body>
</html>`
  return new Blob([doc], { type: 'text/html;charset=utf-8' })
}

function row(label: string, value: string) {
  return `<tr><th>${esc(label)}</th><td>${esc(value)}</td></tr>`
}

function inlineLinks(text: string, anchor: Map<string, string>) {
  return esc(text).replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, target: string, label?: string) => {
    const id = anchor.get(foldKey(target))
    const shown = label ?? target
    return id ? `<a href="#${id}">${shown}</a>` : shown
  })
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

const CSS = `
:root{color-scheme:light dark;--paper:#fafbfd;--ink:#1c2230;--ink2:#4a5263;--rule:#c9ced8;--accent:#1d3a6b}
@media (prefers-color-scheme:dark){:root{--paper:#121826;--ink:#ece8df;--ink2:#c7c2b8;--rule:#323a4d;--accent:#9db6e8}}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:17px/1.65 Georgia,"Iowan Old Style",serif}
header,nav,main,footer{max-width:46rem;margin:0 auto;padding:0 1.25rem}
h1,h2,h3{font-family:"Arial Narrow","Helvetica Neue",Arial,sans-serif;font-stretch:condensed;text-transform:uppercase;line-height:1.05;overflow-wrap:anywhere}
.title-page{padding-top:4rem;padding-bottom:2rem;border-bottom:6px double var(--accent)}
h1{font-size:3rem;margin:0;color:var(--accent)}.meta{color:var(--ink2);font-family:Arial,sans-serif;font-size:.9rem}.summary{font-size:1.15rem;color:var(--ink2)}
.toc{padding-top:2rem}.toc ol,.toc ul{padding-left:1.2rem;margin-inline-start:0}.toc>ol{columns:2 14rem}.toc li{break-inside:avoid}
.chapter{margin-top:3rem}.chapter-title{font-size:1.8rem;border-bottom:3px solid var(--accent);padding-bottom:.3rem}
.entry{margin-top:2.5rem;break-inside:avoid-page}.headword{font-size:1.6rem;margin-bottom:.5rem}
.stats{border-collapse:collapse;border-block:3px double var(--accent);margin:.75rem 0 1rem;font-family:Arial,sans-serif;font-size:.85rem;width:100%}
.stats th{text-align:start;text-transform:uppercase;letter-spacing:.06em;font-size:.72rem;color:var(--ink2);padding:.35rem .6rem;width:9rem;vertical-align:top}
.stats td{padding:.35rem .6rem}.stats tr+tr{border-top:1px solid var(--rule)}
blockquote{margin:1rem 0;padding:.75rem 1rem;border-top:3px solid var(--accent);background:color-mix(in srgb,var(--accent) 8%,var(--paper))}
a{color:inherit;text-decoration-color:var(--accent)}table:not(.stats){border-collapse:collapse;font-family:Arial,sans-serif;font-size:.9rem}td,th{padding:.3rem .6rem;border-bottom:1px solid var(--rule)}
.backlinks{font-family:Arial,sans-serif;font-size:.85rem;color:var(--ink2)}
.map img{max-width:100%;height:auto;border:1px solid var(--rule)}.map figcaption{font-weight:700;font-family:Arial,sans-serif}
footer{margin-top:4rem;padding-bottom:3rem;color:var(--ink2);font-family:Arial,sans-serif;font-size:.8rem}
@media print{body{font-size:11pt}.toc{break-after:page}.chapter{break-before:page}a{text-decoration:none}}
`

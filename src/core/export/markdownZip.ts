import { strToU8, zipSync, type Zippable } from 'fflate'
import { safeFileName, type WorldBackup } from './backup'
import { fieldText, type ExportLabels } from './labels'

/**
 * A zip with one Markdown file per page, in a folder per chapter. Each file
 * starts with YAML front matter (category, aliases, status, dates, stat block)
 * and keeps [[wiki links]] as written, so it works in Obsidian and similar tools.
 */
export async function buildMarkdownZip(b: WorldBackup, labels: ExportLabels): Promise<Blob> {
  const files: Zippable = {}
  const root = safeFileName(b.world.name)
  const byCat = new Map(b.categories.map((c) => [c.id, c]))
  const bodies = new Map(b.bodies.map((x) => [x.pageId, x.body]))
  const used = new Set<string>()

  for (const p of b.pages) {
    const cat = byCat.get(p.categoryId)
    const folder = safeFileName(cat ? labels.category(cat, true) : 'Pages')
    let name = `${folder}/${safeFileName(p.title)}.md`
    for (let n = 2; used.has(name.toLowerCase()); n++) name = `${folder}/${safeFileName(p.title)} (${n}).md`
    used.add(name.toLowerCase())
    const fm: string[] = ['---', `title: ${yaml(p.title)}`, `category: ${yaml(cat ? labels.category(cat) : '')}`, `status: ${p.status}`]
    if (p.aliases.length) fm.push(`aliases: [${p.aliases.map(yaml).join(', ')}]`)
    if (p.date) fm.push(`date: ${yaml(labels.date(p.date))}`)
    if (p.endDate) fm.push(`end_date: ${yaml(labels.date(p.endDate))}`)
    for (const f of cat?.fields ?? []) {
      const text = fieldText(f, p.fields[f.id], labels, true)
      if (text) fm.push(`${yaml(labels.field(f))}: ${yaml(text)}`)
    }
    fm.push('---', '')
    files[`${root}/${name}`] = strToU8(`${fm.join('\n')}# ${p.title}\n\n${bodies.get(p.id) ?? ''}\n`)
  }

  const readme = [`# ${b.world.name}`, '', [b.world.genre, b.world.tone].filter(Boolean).join(' · '), '', b.world.summary, ''].join('\n')
  files[`${root}/README.md`] = strToU8(readme)

  for (const m of b.maps) {
    const img = b.mapImages.find((x) => x.id === m.imageId)
    if (!img) continue
    const ext = img.dataUrl.match(/^data:image\/(\w+)/)?.[1]?.replace('jpeg', 'jpg') ?? 'png'
    const bytes = Uint8Array.from(atob(img.dataUrl.split(',')[1]), (c) => c.charCodeAt(0))
    files[`${root}/${safeFileName(labels.maps)}/${safeFileName(m.name)}.${ext}`] = [bytes, { level: 0 }]
    const pins = b.markers.filter((x) => x.mapId === m.id)
    if (pins.length) {
      const list = pins.map((x) => `- ${x.pageTitle ? `[[${x.pageTitle}]]` : (x.label ?? '')} (${x.x}, ${x.y})`).join('\n')
      files[`${root}/${safeFileName(labels.maps)}/${safeFileName(m.name)}.md`] = strToU8(`# ${m.name}\n\n![[${safeFileName(m.name)}.${ext}]]\n\n${list}\n`)
    }
  }
  const zipped = zipSync(files, { level: 6 })
  return new Blob([zipped as BlobPart], { type: 'application/zip' })
}

/** Quote a YAML scalar safely. */
function yaml(s: string): string {
  return /^[\p{L}\p{N} _.,'()-]+$/u.test(s) && !/^[-?:,[\]{}#&*!|>'"%@`]/.test(s) && !/:\s/.test(s) ? s : JSON.stringify(s)
}

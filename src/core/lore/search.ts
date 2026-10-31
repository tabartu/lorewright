import MiniSearch from 'minisearch'
import { foldKey, markdownToPlain } from './normalize'
import type { ID, Page } from './types'

export interface SearchDoc {
  id: ID
  title: string
  aliases: string
  body: string
  categoryId: ID
}

export interface SearchHit {
  id: ID
  title: string
  categoryId: ID
  score: number
  /** Short body fragment around the first match, or the start of the text. */
  snippet: string
}

/** Split on anything that is not a letter or digit (works for every script). */
const tokenize = (text: string) => text.split(/[^\p{L}\p{N}]+/u).filter(Boolean)

/**
 * Full-text index for one world. Terms are folded with `foldKey`, so case
 * and diacritics never matter: "istanbul" finds "İstanbul", "isik" finds "Işık".
 */
export function buildSearchIndex(pages: Page[], bodies: Map<ID, string>) {
  const index = new MiniSearch<SearchDoc>({
    fields: ['title', 'aliases', 'body'],
    storeFields: ['title', 'categoryId', 'body'],
    tokenize,
    processTerm: (term) => foldKey(term) || null,
    searchOptions: {
      boost: { title: 4, aliases: 3, body: 1 },
      prefix: true,
      fuzzy: (term) => (term.length > 4 ? 0.2 : false),
      combineWith: 'AND',
    },
  })
  index.addAll(
    pages.map((p) => ({
      id: p.id,
      title: p.title,
      aliases: p.aliases.join(' '),
      body: markdownToPlain(bodies.get(p.id) ?? ''),
      categoryId: p.categoryId,
    })),
  )
  return index
}

export function searchPages(index: MiniSearch<SearchDoc>, query: string, limit = 30): SearchHit[] {
  const q = query.trim()
  if (!q) return []
  const folded = foldKey(q)
  return index
    .search(q)
    .slice(0, limit)
    .map((r) => {
      const body = String(r.body ?? '')
      return {
        id: String(r.id),
        title: String(r.title),
        categoryId: String(r.categoryId),
        score: r.score + (foldKey(String(r.title)) === folded ? 100 : foldKey(String(r.title)).startsWith(folded) ? 20 : 0),
        snippet: makeSnippet(body, r.terms),
      }
    })
    .sort((a, b) => b.score - a.score)
}

/** Find the first matched term in the body (folded) and cut a window around it. */
function makeSnippet(body: string, terms: string[], width = 140): string {
  if (!body) return ''
  const folded = foldKey(body)
  let at = -1
  for (const term of terms) {
    const i = folded.indexOf(term)
    if (i >= 0 && (at < 0 || i < at)) at = i
  }
  if (at < 0) return body.length > width ? `${body.slice(0, width).trimEnd()}…` : body
  // foldKey keeps length close to the original for Latin text; clamp for safety.
  let start = Math.max(0, Math.min(at - 40, body.length - width))
  // Start and end on word boundaries so the fragment never opens mid-word.
  if (start > 0) {
    const space = body.indexOf(' ', start)
    if (space >= 0 && space < at) start = space + 1
  }
  let end = Math.min(body.length, start + width)
  if (end < body.length) {
    const space = body.lastIndexOf(' ', end)
    if (space > start + width / 2) end = space
  }
  return `${start > 0 ? '…' : ''}${body.slice(start, end).trim()}${end < body.length ? '…' : ''}`
}

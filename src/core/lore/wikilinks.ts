import { foldKey } from './normalize'

/** `[[Target]]` or `[[Target|label]]`. Targets cannot contain brackets, pipes or newlines. */
const WIKILINK = /\[\[([^[\]|\n]+?)(?:\|([^[\]\n]+?))?\]\]/g

export interface WikiLinkMatch {
  target: string
  label?: string
  key: string
  index: number
  length: number
}

/**
 * Replace fenced code blocks and inline code with spaces of equal length,
 * so links inside code are ignored while indexes stay aligned.
 */
function maskCode(md: string): string {
  const blank = (m: string) => m.replace(/[^\n]/g, ' ')
  return md.replace(/(^|\n)(```|~~~)[\s\S]*?(\n\2|$)/g, blank).replace(/`[^`\n]*`/g, blank)
}

export function parseWikiLinks(md: string): WikiLinkMatch[] {
  const masked = maskCode(md)
  const out: WikiLinkMatch[] = []
  for (const m of masked.matchAll(WIKILINK)) {
    const target = m[1].trim()
    if (!target) continue
    out.push({
      target,
      label: m[2]?.trim() || undefined,
      key: foldKey(target),
      index: m.index ?? 0,
      length: m[0].length,
    })
  }
  return out
}

/**
 * Point every link whose folded target equals `fromKey` at `toTitle`,
 * keeping explicit labels. Returns the new text and how many links changed.
 */
export function rewriteWikiLinks(md: string, fromKey: string, toTitle: string): { text: string; count: number } {
  const matches = parseWikiLinks(md).filter((m) => m.key === fromKey)
  if (matches.length === 0) return { text: md, count: 0 }
  let text = md
  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i]
    const replacement = m.label ? `[[${toTitle}|${m.label}]]` : `[[${toTitle}]]`
    text = text.slice(0, m.index) + replacement + text.slice(m.index + m.length)
  }
  return { text, count: matches.length }
}

/** Split a text run into plain strings and link tokens (used by the Markdown renderer). */
export type WikiToken = { type: 'text'; value: string } | { type: 'link'; target: string; label: string; key: string }

export function tokenizeWikiLinks(text: string): WikiToken[] {
  const tokens: WikiToken[] = []
  let last = 0
  for (const m of text.matchAll(WIKILINK)) {
    const target = m[1].trim()
    const start = m.index ?? 0
    if (!target) continue
    if (start > last) tokens.push({ type: 'text', value: text.slice(last, start) })
    tokens.push({ type: 'link', target, label: m[2]?.trim() || target, key: foldKey(target) })
    last = start + m[0].length
  }
  if (last < text.length) tokens.push({ type: 'text', value: text.slice(last) })
  return tokens
}

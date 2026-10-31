/**
 * Locale-independent folding used for page keys, link resolution and search.
 *
 * Folds case and diacritics so that "istanbul", "İstanbul" and "ISTANBUL" are
 * the same key, and "isik" matches "Işık". Turkish dotted/dotless i are mapped
 * explicitly because generic lower-casing turns "İ" into "i̇" (i + combining dot).
 */
export function foldKey(input: string): string {
  return input
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/[\s_]+/g, ' ')
    .trim()
}

/** Short random id, URL-safe. */
export function newId(): string {
  const bytes = new Uint8Array(9)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/** Rough plain-text version of Markdown, for excerpts and word counts. */
export function markdownToPlain(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
    .replace(/[*_~|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function countWords(plain: string): number {
  if (!plain) return 0
  return plain.split(/\s+/u).filter(Boolean).length
}

export function makeExcerpt(plain: string, max = 220): string {
  if (plain.length <= max) return plain
  const cut = plain.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : max).trimEnd()}…`
}

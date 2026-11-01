#!/usr/bin/env node
/**
 * Translation check.
 *  1. Every locale has the same files and keys as `en` (plural suffixes may
 *     differ per language, so `_one`/`_other`/… are compared by base key).
 *  2. Every static key used in the source (t('ns:key')) exists in `en`.
 *  3. Dynamic keys (t(`ns:prefix.${x}`)) must match at least one key.
 * Exits 1 on any problem.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const localesDir = join(root, 'src/locales')
const PLURAL = /_(zero|one|two|few|many|other)$/

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out)
    else out[key] = v
  }
  return out
}

function loadLocale(code) {
  const dir = join(localesDir, code)
  const keys = new Map()
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const ns = file.replace(/\.json$/, '')
    if (ns === 'meta') continue
    const flat = flatten(JSON.parse(readFileSync(join(dir, file), 'utf8')))
    for (const [k, v] of Object.entries(flat)) keys.set(`${ns}:${k}`, v)
  }
  return keys
}

const base = (k) => k.replace(PLURAL, '')
const problems = []
const codes = readdirSync(localesDir).filter((d) => statSync(join(localesDir, d)).isDirectory())
const en = loadLocale('en')
const enBase = new Set([...en.keys()].map(base))

for (const code of codes) {
  const meta = join(localesDir, code, 'meta.json')
  try {
    const m = JSON.parse(readFileSync(meta, 'utf8'))
    if (!m.name || !m.nativeName || !['ltr', 'rtl'].includes(m.dir)) problems.push(`${code}/meta.json: needs name, nativeName and dir ("ltr" | "rtl")`)
  } catch {
    problems.push(`${code}: missing meta.json`)
  }
  if (code === 'en') continue
  const loc = loadLocale(code)
  const locBase = new Set([...loc.keys()].map(base))
  for (const k of enBase) if (!locBase.has(k)) problems.push(`${code}: missing ${k}`)
  for (const k of locBase) if (!enBase.has(k)) problems.push(`${code}: extra ${k} (not in en)`)
  for (const [k, v] of loc) if (typeof v === 'string' && !v.trim()) problems.push(`${code}: empty ${k}`)
  // Interpolation variables must match the English string.
  for (const [k, v] of loc) {
    const enKey = en.has(k) ? k : [...en.keys()].find((e) => base(e) === base(k))
    if (!enKey || typeof v !== 'string') continue
    const vars = (s) => [...s.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]).sort().join(',')
    if (vars(v) !== vars(String(en.get(enKey)))) problems.push(`${code}: ${k} uses {{${vars(v)}}}, en uses {{${vars(String(en.get(enKey)))}}}`)
  }
}

function walk(dir, files = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) walk(p, files)
    else if (/\.(tsx?|jsx?)$/.test(f) && !/\.test\./.test(f)) files.push(p)
  }
  return files
}

const STATIC = /\bt\(\s*['"]([a-z]+:[\w.-]+)['"]/g
const DYNAMIC = /\bt\(\s*`([a-z]+:[^`]*)`/g
for (const file of walk(join(root, 'src'))) {
  const src = readFileSync(file, 'utf8')
  const rel = relative(root, file)
  for (const m of src.matchAll(STATIC)) if (!enBase.has(base(m[1]))) problems.push(`${rel}: unknown key ${m[1]}`)
  for (const m of src.matchAll(DYNAMIC)) {
    const pattern = new RegExp('^' + m[1].replace(/[.*+?^()|[\]\\]/g, '\\$&').replace(/\$\{[^}]+\}/g, '[\\w-]+') + '$')
    if (![...enBase].some((k) => pattern.test(k))) problems.push(`${rel}: dynamic key ${m[1]} matches nothing`)
  }
}

// Hard-coded UI text heuristic: JSX text nodes made of letters.
const JSX_TEXT = />\s*([A-Za-zÀ-ž][^<>{}]*[A-Za-zÀ-ž.!?])\s*</g
for (const file of walk(join(root, 'src')).filter((f) => f.endsWith('.tsx'))) {
  const src = readFileSync(file, 'utf8')
  for (const m of src.matchAll(JSX_TEXT)) {
    if (/=>|&&|\|\||\(|\)/.test(m[1]) || src[m.index - 1] === '=' || /^(return|const|let|if|else|export|import)\b/.test(m[1].trim())) continue
    problems.push(`${relative(root, file)}: possible hard-coded text "${m[1].trim().slice(0, 40)}"`)
  }
}

if (problems.length) {
  console.error(`i18n check failed (${problems.length}):\n  ` + problems.join('\n  '))
  process.exit(1)
}
console.log(`i18n check passed: ${codes.length} locales (${codes.join(', ')}), ${enBase.size} keys.`)

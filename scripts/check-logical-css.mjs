#!/usr/bin/env node
/**
 * RTL readiness: fail on physical CSS properties and values in src/**.css.
 * Use logical ones instead (margin-inline-start, inset-inline-end, text-align: start …).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const RULES = [
  [/(?<![-\w])(margin|padding|border)-(left|right|top|bottom)(?![-\w]*:\s*0\s*;)(?=[-\w]*\s*:)/, 'use *-inline-* / *-block-* instead'],
  [/(?<![-\w])(left|right|top|bottom)\s*:/, 'use inset-inline-* / inset-block-*'],
  [/text-align\s*:\s*(left|right)/, 'use text-align: start | end'],
  [/float\s*:\s*(left|right)/, 'use float: inline-start | inline-end'],
  [/(?<![-\w])(width|height|min-width|max-width|min-height|max-height)\s*:/, 'use inline-size / block-size'],
]

function walk(dir, files = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) walk(p, files)
    else if (f.endsWith('.css')) files.push(p)
  }
  return files
}

const problems = []
for (const file of walk(join(root, 'src'))) {
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (line.trim().startsWith('/*') || line.trim().startsWith('*') || line.trim().startsWith('@media')) return
      for (const [re, hint] of RULES) if (re.test(line)) problems.push(`${relative(root, file)}:${i + 1}: ${line.trim()} — ${hint}`)
    })
}
if (problems.length) {
  console.error(`Physical CSS found (${problems.length}):\n  ` + problems.join('\n  '))
  process.exit(1)
}
console.log('Logical CSS check passed.')

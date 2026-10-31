import { describe, expect, it } from 'vitest'
import { parseWikiLinks, rewriteWikiLinks, tokenizeWikiLinks } from './wikilinks'

describe('parseWikiLinks', () => {
  it('finds plain and labelled links', () => {
    const links = parseWikiLinks('See [[Queen Maelis]] and [[Varnhold|the capital]].')
    expect(links.map((l) => [l.target, l.label])).toEqual([
      ['Queen Maelis', undefined],
      ['Varnhold', 'the capital'],
    ])
  })
  it('ignores links in code', () => {
    expect(parseWikiLinks('`[[Nope]]`\n```\n[[Nope]]\n```\n[[Yes]]').map((l) => l.target)).toEqual(['Yes'])
  })
})

describe('rewriteWikiLinks', () => {
  it('renames matching links case- and diacritic-insensitively, keeping labels', () => {
    const { text, count } = rewriteWikiLinks('[[Old Name]], [[old name|him]], [[Other]]', 'old name', 'New Name')
    expect(text).toBe('[[New Name]], [[New Name|him]], [[Other]]')
    expect(count).toBe(2)
  })
})

describe('tokenizeWikiLinks', () => {
  it('splits text and links', () => {
    expect(tokenizeWikiLinks('a [[B|c]] d')).toEqual([
      { type: 'text', value: 'a ' },
      { type: 'link', target: 'B', label: 'c', key: 'b' },
      { type: 'text', value: ' d' },
    ])
  })
})

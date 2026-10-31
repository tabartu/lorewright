import { describe, expect, it } from 'vitest'
import { buildSearchIndex, searchPages } from './search'
import type { Page } from './types'

function page(id: string, title: string, aliases: string[] = []): Page {
  return {
    id, worldId: 'w', categoryId: 'c', title, titleKey: title, aliases, keys: [], fields: {},
    status: 'draft', wordCount: 0, excerpt: '', createdAt: 0, updatedAt: 0,
  }
}

const pages = [page('1', 'İstanbul'), page('2', 'Işıklı Liman'), page('3', 'Queen Maelis Varn', ['The Salt Queen']), page('4', 'Saltspire')]
const bodies = new Map([
  ['1', 'Boğazın iki yakasına kurulmuş şehir.'],
  ['2', 'Kül denizinin kıyısındaki en büyük liman.'],
  ['3', 'Maelis wears [[The Drowned Crown]].'],
  ['4', 'A lighthouse fortress.'],
])
const index = buildSearchIndex(pages, bodies)
const ids = (q: string) => searchPages(index, q).map((h) => h.id)

describe('searchPages', () => {
  it('ignores Turkish case and dots', () => {
    expect(ids('istanbul')).toContain('1')
    expect(ids('ISTANBUL')).toContain('1')
    expect(ids('isikli')).toContain('2')
    expect(ids('ışıklı')).toContain('2')
  })
  it('matches prefixes, aliases and body text', () => {
    expect(ids('salt')).toEqual(expect.arrayContaining(['3', '4']))
    expect(ids('drowned crown')).toEqual(['3'])
    expect(ids('kıyı')).toEqual(['2'])
  })
  it('ranks exact title matches first', () => {
    expect(ids('saltspire')[0]).toBe('4')
  })
})

import { describe, expect, it } from 'vitest'
import { buildTimeline, groupByEra } from './timeline'
import type { Category, Era, Page } from './types'

const cat: Category = { id: 'c', worldId: 'w', ink: 'amber', icon: '', order: 0, fields: [{ id: 'born', key: 'born', type: 'worldDate', builtIn: true }] }
const page = (id: string, extra: Partial<Page>): Page => ({
  id, worldId: 'w', categoryId: 'c', title: id, titleKey: id, aliases: [], keys: [], fields: {}, status: 'draft',
  wordCount: 0, excerpt: '', createdAt: 0, updatedAt: 0, ...extra,
})
const pages = [page('flood', { date: { year: 212 } }), page('founding', { date: { year: 0 } }), page('maelis', { fields: { born: { year: 289 } } })]
const eras: Era[] = [
  { id: 'a', worldId: 'w', name: 'Founding', startYear: 0, endYear: 211, ink: 'jade', order: 0 },
  { id: 'b', worldId: 'w', name: 'Water', startYear: 212, endYear: 308, ink: 'cobalt', order: 1 },
  { id: 'c', worldId: 'w', name: 'Ash', startYear: 309, ink: 'sienna', order: 2 },
]

describe('timeline', () => {
  it('sorts events and optionally includes stat-block dates', () => {
    expect(buildTimeline(pages, [cat], false).map((e) => e.pageId)).toEqual(['founding', 'flood'])
    expect(buildTimeline(pages, [cat], true).map((e) => e.pageId)).toEqual(['founding', 'flood', 'maelis'])
  })
  it('groups by era and keeps empty eras as bands', () => {
    const groups = groupByEra(buildTimeline(pages, [cat], true), eras)
    expect(groups.map((g) => [g.era?.name, g.entries.length])).toEqual([['Founding', 1], ['Water', 2], ['Ash', 0]])
  })
})

import { describe, expect, it } from 'vitest'
import { foldKey, makeExcerpt, markdownToPlain } from './normalize'

describe('foldKey', () => {
  it('matches Turkish dotted and dotless i in both directions', () => {
    expect(foldKey('İstanbul')).toBe(foldKey('istanbul'))
    expect(foldKey('ISTANBUL')).toBe('istanbul')
    expect(foldKey('Işık')).toBe('isik')
    expect(foldKey('ŞAFAK TAŞI')).toBe('safak tasi')
    expect(foldKey('Gölge Loncası')).toBe('golge loncasi')
  })
  it('folds other diacritics, ß and whitespace', () => {
    expect(foldKey('Straße')).toBe('strasse')
    expect(foldKey('  Café   Noir ')).toBe('cafe noir')
  })
})

describe('markdownToPlain / makeExcerpt', () => {
  it('strips links and syntax', () => {
    expect(markdownToPlain('# Head\n\nThe [[Varnhold|capital]] and [[Saltspire]] *burn*.')).toBe(
      'Head The capital and Saltspire burn.',
    )
  })
  it('cuts on a word boundary', () => {
    const e = makeExcerpt('word '.repeat(100), 30)
    expect(e.endsWith('…')).toBe(true)
    expect(e.length).toBeLessThanOrEqual(31)
  })
})

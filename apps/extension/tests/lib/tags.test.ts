import { describe, it, expect } from 'vitest'
import { parseTags } from '../../lib/tags'

describe('parseTags', () => {
  it('splits comma-separated tags', () => {
    expect(parseTags('tech, design, dev')).toEqual(['tech', 'design', 'dev'])
  })

  it('lowercases and trims whitespace', () => {
    expect(parseTags('  Tech , DESIGN  ')).toEqual(['tech', 'design'])
  })

  it('filters empty strings', () => {
    expect(parseTags('tech,,,')).toEqual(['tech'])
  })

  it('returns empty array for empty input', () => {
    expect(parseTags('')).toEqual([])
  })
})

import { describe, it, expect, vi } from 'vitest'
import { domainFromUrl } from '../../lib/fetch-title'

describe('domainFromUrl', () => {
  it('extracts hostname without www', () => {
    expect(domainFromUrl('https://www.example.com/path')).toBe('example.com')
  })

  it('returns full hostname when no www', () => {
    expect(domainFromUrl('https://github.com/user/repo')).toBe('github.com')
  })

  it('returns the URL itself on parse error', () => {
    expect(domainFromUrl('not-a-url')).toBe('not-a-url')
  })
})

import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import {
  addLink, getAllLinks, getRecent, updateLink, deleteLink,
  searchLinks, getAllTags, getTagCounts, getLinkByUrl,
} from '../../lib/db'

// Each test file gets a fresh in-memory DB from fake-indexeddb/auto

describe('addLink', () => {
  it('returns link with generated id and savedAt', async () => {
    const link = await addLink({ url: 'https://example.com', title: 'Example', tags: [] })
    expect(link.id).toBeTruthy()
    expect(link.savedAt).toBeGreaterThan(0)
    expect(link.url).toBe('https://example.com')
  })
})

describe('getAllLinks', () => {
  it('returns links sorted newest first', async () => {
    const a = await addLink({ url: 'https://first.com', title: 'First', tags: [] })
    const b = await addLink({ url: 'https://second.com', title: 'Second', tags: [] })
    const all = await getAllLinks()
    expect(all[0].id).toBe(b.id)
    expect(all[1].id).toBe(a.id)
  })
})

describe('getRecent', () => {
  it('returns at most N links', async () => {
    for (let i = 0; i < 5; i++) {
      await addLink({ url: `https://site${i}.com`, title: `Site ${i}`, tags: [] })
    }
    const recent = await getRecent(3)
    expect(recent.length).toBe(3)
  })
})

describe('updateLink', () => {
  it('updates a field on an existing link', async () => {
    const link = await addLink({ url: 'https://update.com', title: 'Old', tags: [] })
    await updateLink(link.id, { title: 'New' })
    const all = await getAllLinks()
    expect(all.find(l => l.id === link.id)?.title).toBe('New')
  })
})

describe('deleteLink', () => {
  it('removes a link by id', async () => {
    const link = await addLink({ url: 'https://delete.com', title: 'Del', tags: [] })
    await deleteLink(link.id)
    const all = await getAllLinks()
    expect(all.find(l => l.id === link.id)).toBeUndefined()
  })
})

describe('searchLinks', () => {
  it('finds links matching title', async () => {
    await addLink({ url: 'https://search-t.com', title: 'React Testing', tags: [] })
    const results = await searchLinks('react')
    expect(results.some(l => l.title === 'React Testing')).toBe(true)
  })

  it('finds links matching tag', async () => {
    await addLink({ url: 'https://search-g.com', title: 'Tagged', tags: ['vitest'] })
    const results = await searchLinks('vitest')
    expect(results.some(l => l.url === 'https://search-g.com')).toBe(true)
  })

  it('finds links matching comment', async () => {
    await addLink({ url: 'https://search-c.com', title: 'X', tags: [], comment: 'great read' })
    const results = await searchLinks('great')
    expect(results.some(l => l.url === 'https://search-c.com')).toBe(true)
  })
})

describe('getAllTags', () => {
  it('returns unique sorted tags across all links', async () => {
    await addLink({ url: 'https://tags1.com', title: 'T1', tags: ['b', 'a'] })
    await addLink({ url: 'https://tags2.com', title: 'T2', tags: ['a', 'c'] })
    const tags = await getAllTags()
    expect(tags).toContain('a')
    expect(tags).toContain('b')
    expect(tags).toContain('c')
    expect(tags).toEqual([...tags].sort())
  })
})

describe('getTagCounts', () => {
  it('counts tags across all links', async () => {
    await addLink({ url: 'https://tc1.com', title: 'TC1', tags: ['x'] })
    await addLink({ url: 'https://tc2.com', title: 'TC2', tags: ['x', 'y'] })
    const counts = await getTagCounts()
    expect(counts['x']).toBeGreaterThanOrEqual(2)
    expect(counts['y']).toBeGreaterThanOrEqual(1)
  })
})

describe('getLinkByUrl', () => {
  it('finds existing link by URL', async () => {
    await addLink({ url: 'https://byurl.com', title: 'ByUrl', tags: [] })
    const found = await getLinkByUrl('https://byurl.com')
    expect(found?.title).toBe('ByUrl')
  })

  it('returns undefined for unknown URL', async () => {
    const found = await getLinkByUrl('https://notexist-xyz.com')
    expect(found).toBeUndefined()
  })
})

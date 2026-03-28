import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import App from '../../entrypoints/options/App'

vi.mock('../../lib/db', () => ({
  getAllLinks: vi.fn().mockResolvedValue([
    { id: '1', url: 'https://a.com', title: 'A', tags: ['dev', 'react'], savedAt: 1000 },
    { id: '2', url: 'https://b.com', title: 'B', tags: ['dev'], savedAt: 2000 },
  ]),
  getTagCounts: vi.fn().mockResolvedValue({ dev: 2, react: 1 }),
  deleteLink: vi.fn(),
  updateLink: vi.fn(),
}))

vi.mock('../../lib/fetch-title', () => ({
  domainFromUrl: vi.fn((url: string) => new URL(url).hostname),
}))

describe('Options App — Tag Counts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders tag counts next to each tag', async () => {
    render(<App />)
    await waitFor(() => {
      const counts = document.querySelectorAll('.tag-count')
      expect(counts.length).toBe(2)
      const countValues = Array.from(counts).map(el => el.textContent)
      expect(countValues).toContain('2')
      expect(countValues).toContain('1')
    })
    expect(screen.getAllByText('dev').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('react').length).toBeGreaterThanOrEqual(1)
  })

  it('calls getTagCounts to load tag data', async () => {
    const { getTagCounts } = await import('../../lib/db')
    render(<App />)
    await waitFor(() => {
      expect(getTagCounts).toHaveBeenCalled()
    })
  })

  it('renders tag count spans with tag-count class', async () => {
    render(<App />)
    await waitFor(() => {
      const counts = document.querySelectorAll('.tag-count')
      expect(counts.length).toBe(2)
    })
  })
})

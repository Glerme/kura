import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import App from '../../entrypoints/options/App'

vi.mock('../../lib/db', () => ({
  getAllLinks: vi.fn().mockResolvedValue([
    { id: '1', url: 'https://a.com', title: 'A', tags: ['dev', 'react'], savedAt: 1000 },
    { id: '2', url: 'https://b.com', title: 'B', tags: ['dev'], savedAt: 2000 },
  ]),
  getAllTags: vi.fn().mockResolvedValue(['dev', 'react']),
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
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
    })
    // Both tags should be visible
    expect(screen.getByText('dev')).toBeInTheDocument()
    expect(screen.getByText('react')).toBeInTheDocument()
  })

  it('renders tag count spans with tag-count class', async () => {
    render(<App />)
    await waitFor(() => {
      const counts = document.querySelectorAll('.tag-count')
      expect(counts.length).toBe(2)
    })
  })
})

import { render, screen, waitFor, act } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import App from '../../entrypoints/options/App'
import { exportJSON, importJSON as _importJSON, importBookmarksHTML as _importBookmarksHTML } from '../../lib/import-export'

vi.mock('../../lib/db', () => ({
  getAllLinks: vi.fn().mockResolvedValue([
    { id: '1', url: 'https://a.com', title: 'A', tags: ['dev', 'react'], savedAt: 1000 },
    { id: '2', url: 'https://b.com', title: 'B', tags: ['dev'], savedAt: 2000 },
  ]),
  getTagCounts: vi.fn().mockResolvedValue({ dev: 2, react: 1 }),
  deleteLink: vi.fn(),
  updateLink: vi.fn(),
}))

vi.mock('../../lib/import-export', () => ({
  exportJSON: vi.fn(),
  importJSON: vi.fn().mockResolvedValue({ imported: 3, skipped: 1 }),
  importBookmarksHTML: vi.fn().mockResolvedValue({ imported: 5, skipped: 2 }),
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

describe('Options App — Import/Export', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders Exportar and Importar buttons in sidebar', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText(/Exportar/)).toBeInTheDocument()
      expect(screen.getByText(/Importar/)).toBeInTheDocument()
    })
  })

  it('calls exportJSON with current links on Exportar click', async () => {
    render(<App />)
    await waitFor(() => screen.getByText(/Exportar/))
    fireEvent.click(screen.getByText(/Exportar/))
    expect(exportJSON).toHaveBeenCalledWith(expect.any(Array))
  })

  it('has hidden file input with correct accept attribute', async () => {
    render(<App />)
    await waitFor(() => screen.getByText(/Importar/))
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(fileInput).toBeTruthy()
    expect(fileInput.accept).toBe('.json,.html')
  })

  it('shows import banner after JSON import', async () => {
    render(<App />)
    await waitFor(() => screen.getByText(/Importar/))

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['[]'], 'test.json', { type: 'application/json' })
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true })
    fireEvent.change(fileInput)

    await waitFor(() => {
      expect(screen.getByText(/3 importados, 1 ignorados/)).toBeInTheDocument()
    })
  })

  it('hides import banner after 4 seconds', async () => {
    render(<App />)
    await waitFor(() => screen.getByText(/Importar/))

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['[]'], 'test.json', { type: 'application/json' })
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true })
    fireEvent.change(fileInput)

    await waitFor(() => screen.getByText(/3 importados/))
    await act(async () => { vi.advanceTimersByTime(4001) })
    expect(screen.queryByText(/3 importados/)).not.toBeInTheDocument()
  })
})

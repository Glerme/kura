// apps/extension/tests/popup/LinksTab.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { LinksTab } from '../../entrypoints/popup/LinksTab'
import { mockBrowser } from './mocks'

vi.mock('../../lib/db', () => ({
  getAllLinks: vi.fn().mockResolvedValue([
    { id: '1', url: 'https://github.com/a', title: 'GitHub Article', tags: ['dev'], savedAt: 3000, readAt: undefined },
    { id: '2', url: 'https://medium.com/b', title: 'Medium Post', tags: ['leitura'], savedAt: 2000, readAt: 1500 },
    { id: '3', url: 'https://rust-lang.org', title: 'Rust Docs', tags: ['dev', 'rust'], savedAt: 1000, readAt: undefined },
  ]),
  getAllTags: vi.fn().mockResolvedValue(['dev', 'leitura', 'rust']),
  updateLink: vi.fn().mockResolvedValue(undefined),
  deleteLink: vi.fn().mockResolvedValue(undefined),
}))

describe('LinksTab', () => {
  beforeEach(() => {
    mockBrowser()
  })

  it('renders all links on load', async () => {
    render(<LinksTab />)
    await waitFor(() => expect(screen.getByText('GitHub Article')).toBeInTheDocument())
    expect(screen.getByText('Medium Post')).toBeInTheDocument()
    expect(screen.getByText('Rust Docs')).toBeInTheDocument()
  })

  it('filters to unread only', async () => {
    render(<LinksTab />)
    await waitFor(() => screen.getByText('GitHub Article'))
    fireEvent.click(screen.getByText('não lidos'))
    expect(screen.getByText('GitHub Article')).toBeInTheDocument()
    expect(screen.getByText('Rust Docs')).toBeInTheDocument()
    expect(screen.queryByText('Medium Post')).not.toBeInTheDocument()
  })

  it('filters by tag', async () => {
    render(<LinksTab />)
    await waitFor(() => screen.getByText('GitHub Article'))
    fireEvent.click(screen.getAllByText('leitura')[0])
    expect(screen.getByText('Medium Post')).toBeInTheDocument()
    expect(screen.queryByText('GitHub Article')).not.toBeInTheDocument()
    expect(screen.queryByText('Rust Docs')).not.toBeInTheDocument()
  })

  it('filters by search query matching title', async () => {
    render(<LinksTab />)
    await waitFor(() => screen.getByText('GitHub Article'))
    fireEvent.change(screen.getByPlaceholderText('🔍 buscar...'), { target: { value: 'rust' } })
    expect(screen.getByText('Rust Docs')).toBeInTheDocument()
    expect(screen.queryByText('GitHub Article')).not.toBeInTheDocument()
  })

  it('shows empty state when no links match search', async () => {
    render(<LinksTab />)
    await waitFor(() => screen.getByText('GitHub Article'))
    fireEvent.change(screen.getByPlaceholderText('🔍 buscar...'), { target: { value: 'zzznomatch' } })
    expect(screen.getByText(/Nenhum link salvo/)).toBeInTheDocument()
  })
})

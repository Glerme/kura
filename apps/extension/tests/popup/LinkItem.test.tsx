// apps/extension/tests/popup/LinkItem.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { LinkItem } from '../../entrypoints/popup/LinkItem'
import { mockBrowser } from './mocks'
import type { KuraLink } from '../../lib/types'

vi.mock('../../lib/db', () => ({
  updateLink: vi.fn().mockResolvedValue(undefined),
  deleteLink: vi.fn().mockResolvedValue(undefined),
}))

const link: KuraLink = {
  id: 'abc',
  url: 'https://github.com/test',
  title: 'Test Repo',
  tags: ['dev'],
  savedAt: 1000,
  readAt: undefined,
}

describe('LinkItem', () => {
  let b: ReturnType<typeof mockBrowser>
  const onToggle = vi.fn()
  const onRefresh = vi.fn()

  beforeEach(() => {
    b = mockBrowser()
    vi.clearAllMocks()
  })

  it('renders title and domain', () => {
    render(<LinkItem link={link} isExpanded={false} onToggle={onToggle} onRefresh={onRefresh} />)
    expect(screen.getByText('Test Repo')).toBeInTheDocument()
    expect(screen.getByText('github.com')).toBeInTheDocument()
  })

  it('shows unread dot when readAt is undefined', () => {
    render(<LinkItem link={link} isExpanded={false} onToggle={onToggle} onRefresh={onRefresh} />)
    expect(document.querySelector('.unread-dot')).toBeInTheDocument()
  })

  it('hides unread dot when readAt is set', () => {
    render(<LinkItem link={{ ...link, readAt: 2000 }} isExpanded={false} onToggle={onToggle} onRefresh={onRefresh} />)
    expect(document.querySelector('.unread-dot')).not.toBeInTheDocument()
  })

  it('calls onToggle when chevron is clicked', () => {
    render(<LinkItem link={link} isExpanded={false} onToggle={onToggle} onRefresh={onRefresh} />)
    fireEvent.click(screen.getByLabelText('expandir'))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('opens URL in new tab when link row is clicked', () => {
    render(<LinkItem link={link} isExpanded={false} onToggle={onToggle} onRefresh={onRefresh} />)
    fireEvent.click(screen.getByText('Test Repo'))
    expect(b.tabs.create).toHaveBeenCalledWith({ url: 'https://github.com/test' })
  })

  it('shows action buttons when expanded', () => {
    render(<LinkItem link={link} isExpanded={true} onToggle={onToggle} onRefresh={onRefresh} />)
    expect(screen.getByText('↗ Abrir')).toBeInTheDocument()
    expect(screen.getByText('✓ Lido')).toBeInTheDocument()
    expect(screen.getByText('✕ Deletar')).toBeInTheDocument()
  })

  it('calls deleteLink and onRefresh when Deletar is clicked', async () => {
    const { deleteLink } = await import('../../lib/db')
    render(<LinkItem link={link} isExpanded={true} onToggle={onToggle} onRefresh={onRefresh} />)
    fireEvent.click(screen.getByText('✕ Deletar'))
    await waitFor(() => expect(deleteLink).toHaveBeenCalledWith('abc'))
    await waitFor(() => expect(onRefresh).toHaveBeenCalled())
  })

  it('calls updateLink with readAt when Lido is clicked', async () => {
    const { updateLink } = await import('../../lib/db')
    render(<LinkItem link={link} isExpanded={true} onToggle={onToggle} onRefresh={onRefresh} />)
    fireEvent.click(screen.getByText('✓ Lido'))
    await waitFor(() =>
      expect(updateLink).toHaveBeenCalledWith('abc', expect.objectContaining({ readAt: expect.any(Number) }))
    )
  })
})

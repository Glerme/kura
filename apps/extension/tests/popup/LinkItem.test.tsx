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

const noteLink: KuraLink = {
  id: 'note-1',
  url: 'kura://note/1234567890',
  title: 'My selected text snippet',
  comment: 'Full text of the selection here',
  tags: [],
  savedAt: 2000,
  readAt: undefined,
}

describe('LinkItem', () => {
  let b: ReturnType<typeof mockBrowser>
  const onToggle = vi.fn()
  const onRefresh = vi.fn()

  beforeEach(() => {
    b = mockBrowser()
    vi.clearAllMocks()
    Object.defineProperty(navigator, 'share', { value: undefined, writable: true, configurable: true })
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    })
  })

  it('renders title and domain', () => {
    render(<LinkItem link={link} isExpanded={false} onToggle={onToggle} onRefresh={onRefresh} />)
    expect(screen.getByText('Test Repo')).toBeInTheDocument()
    expect(screen.getByText('github.com')).toBeInTheDocument()
  })

  it('shows unread dot when readAt is undefined', () => {
    render(<LinkItem link={link} isExpanded={false} onToggle={onToggle} onRefresh={onRefresh} />)
    expect(document.querySelector('.unread-dot')).toBeInTheDocument()
    expect(document.querySelector('.read-dot')).not.toBeInTheDocument()
  })

  it('shows read dot and hides unread dot when readAt is set', () => {
    render(<LinkItem link={{ ...link, readAt: 2000 }} isExpanded={false} onToggle={onToggle} onRefresh={onRefresh} />)
    expect(document.querySelector('.read-dot')).toBeInTheDocument()
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
    expect(screen.getByText('⎘ Compartilhar')).toBeInTheDocument()
    expect(screen.getByText('✕ Deletar')).toBeInTheDocument()
  })

  it('hides Lido button when already read', () => {
    render(<LinkItem link={{ ...link, readAt: 2000 }} isExpanded={true} onToggle={onToggle} onRefresh={onRefresh} />)
    expect(screen.queryByText('✓ Lido')).not.toBeInTheDocument()
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

  it('copies URL to clipboard when share is clicked (no navigator.share)', async () => {
    render(<LinkItem link={link} isExpanded={true} onToggle={onToggle} onRefresh={onRefresh} />)
    fireEvent.click(screen.getByText('⎘ Compartilhar'))
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://github.com/test'))
    expect(screen.getByText('✓ Copiado')).toBeInTheDocument()
  })

  it('uses navigator.share when available for regular links', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { value: shareMock, writable: true, configurable: true })
    render(<LinkItem link={link} isExpanded={true} onToggle={onToggle} onRefresh={onRefresh} />)
    fireEvent.click(screen.getByText('⎘ Compartilhar'))
    await waitFor(() => expect(shareMock).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://github.com/test' })
    ))
  })

  describe('note items (kura:// URLs)', () => {
    it('shows ✎ icon instead of favicon', () => {
      render(<LinkItem link={noteLink} isExpanded={false} onToggle={onToggle} onRefresh={onRefresh} />)
      expect(screen.getByText('✎')).toBeInTheDocument()
    })

    it('shows "nota" as domain', () => {
      render(<LinkItem link={noteLink} isExpanded={false} onToggle={onToggle} onRefresh={onRefresh} />)
      expect(screen.getByText('nota')).toBeInTheDocument()
    })

    it('calls onToggle when note row is clicked', () => {
      render(<LinkItem link={noteLink} isExpanded={false} onToggle={onToggle} onRefresh={onRefresh} />)
      fireEvent.click(screen.getByText('My selected text snippet'))
      expect(onToggle).toHaveBeenCalledOnce()
      expect(b.tabs.create).not.toHaveBeenCalled()
    })

    it('does not show ↗ Abrir button when expanded', () => {
      render(<LinkItem link={noteLink} isExpanded={true} onToggle={onToggle} onRefresh={onRefresh} />)
      expect(screen.queryByText('↗ Abrir')).not.toBeInTheDocument()
    })

    it('copies comment text to clipboard when sharing a note', async () => {
      render(<LinkItem link={noteLink} isExpanded={true} onToggle={onToggle} onRefresh={onRefresh} />)
      fireEvent.click(screen.getByText('⎘ Compartilhar'))
      await waitFor(() =>
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Full text of the selection here')
      )
    })

    it('copies title when note has no comment', async () => {
      const noteNoComment = { ...noteLink, comment: undefined }
      render(<LinkItem link={noteNoComment} isExpanded={true} onToggle={onToggle} onRefresh={onRefresh} />)
      fireEvent.click(screen.getByText('⎘ Compartilhar'))
      await waitFor(() =>
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('My selected text snippet')
      )
    })
  })
})

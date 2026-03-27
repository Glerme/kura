// apps/extension/tests/popup/SaveTab.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { SaveTab } from '../../entrypoints/popup/SaveTab'
import { mockBrowser } from './mocks'
import { getLinkByUrl, addLink, updateLink } from '../../lib/db'

const existingLink = {
  id: 'existing-id',
  url: 'https://example.com',
  title: 'Old Title',
  tags: ['dev'],
  savedAt: 1000,
}

vi.mock('../../lib/db', () => ({
  getLinkByUrl: vi.fn().mockResolvedValue(undefined),
  addLink: vi.fn().mockResolvedValue({ id: 'new-id' }),
  updateLink: vi.fn().mockResolvedValue(undefined),
}))

describe('SaveTab', () => {
  beforeEach(() => {
    mockBrowser()
    vi.clearAllMocks()
    vi.mocked(getLinkByUrl).mockResolvedValue(undefined)
  })

  it('pre-fills URL and title from current tab', async () => {
    render(<SaveTab />)
    await waitFor(() => {
      expect(screen.getByDisplayValue('https://example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Example')).toBeInTheDocument()
    })
  })

  it('calls addLink with correct data on submit', async () => {
    render(<SaveTab />)
    await waitFor(() => screen.getByDisplayValue('https://example.com'))
    fireEvent.change(screen.getByDisplayValue('Example'), { target: { value: 'My Title' } })
    fireEvent.change(screen.getByPlaceholderText('Adicione um comentário...'), { target: { value: 'great article' } })
    fireEvent.change(screen.getByPlaceholderText('dev, leitura'), { target: { value: 'dev, tips' } })
    fireEvent.click(screen.getByText('Salvar esta página'))
    await waitFor(() =>
      expect(addLink).toHaveBeenCalledWith(expect.objectContaining({
        url: 'https://example.com',
        title: 'My Title',
        comment: 'great article',
        tags: ['dev', 'tips'],
      }))
    )
  })

  it('shows duplicate alert when URL already saved', async () => {
    vi.mocked(getLinkByUrl).mockResolvedValue(existingLink as any)
    render(<SaveTab />)
    await waitFor(() => screen.getByDisplayValue('https://example.com'))
    fireEvent.click(screen.getByText('Salvar esta página'))
    await waitFor(() => expect(screen.getByText('Este link já foi salvo.')).toBeInTheDocument())
    expect(screen.getByText('Atualizar')).toBeInTheDocument()
    expect(screen.getByText('Cancelar')).toBeInTheDocument()
  })

  it('calls updateLink when Atualizar is clicked', async () => {
    vi.mocked(getLinkByUrl).mockResolvedValue(existingLink as any)
    render(<SaveTab />)
    await waitFor(() => screen.getByDisplayValue('https://example.com'))
    fireEvent.click(screen.getByText('Salvar esta página'))
    await waitFor(() => screen.getByText('Atualizar'))
    fireEvent.click(screen.getByText('Atualizar'))
    await waitFor(() =>
      expect(updateLink).toHaveBeenCalledWith('existing-id', expect.objectContaining({ title: 'Example' }))
    )
  })

  it('dismisses duplicate alert when Cancelar is clicked', async () => {
    vi.mocked(getLinkByUrl).mockResolvedValue(existingLink as any)
    render(<SaveTab />)
    await waitFor(() => screen.getByDisplayValue('https://example.com'))
    fireEvent.click(screen.getByText('Salvar esta página'))
    await waitFor(() => screen.getByText('Cancelar'))
    fireEvent.click(screen.getByText('Cancelar'))
    expect(screen.queryByText('Este link já foi salvo.')).not.toBeInTheDocument()
  })
})

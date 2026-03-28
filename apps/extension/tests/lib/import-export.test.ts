// apps/extension/tests/lib/import-export.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { KuraLink } from '../../lib/types'
import { exportJSON } from '../../lib/import-export'

vi.mock('../../lib/db', () => ({
  getLinkByUrl: vi.fn().mockResolvedValue(undefined),
  addLink: vi.fn().mockImplementation(async (data) => ({
    ...data,
    id: crypto.randomUUID(),
    savedAt: Date.now(),
  })),
}))

const sampleLinks: KuraLink[] = [
  { id: '1', url: 'https://a.com', title: 'A', tags: ['dev'], savedAt: 1000 },
  { id: '2', url: 'https://b.com', title: 'B', tags: [], savedAt: 2000 },
]

describe('exportJSON', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a downloadable JSON file with correct filename', () => {
    const createElementSpy = vi.spyOn(document, 'createElement')
    const clickMock = vi.fn()
    const revokeURLMock = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const createURLMock = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url')

    const fakeAnchor = { href: '', download: '', click: clickMock } as any
    createElementSpy.mockReturnValueOnce(fakeAnchor)

    exportJSON(sampleLinks)

    expect(createURLMock).toHaveBeenCalledWith(expect.any(Blob))
    expect(fakeAnchor.download).toMatch(/^kura-export-\d{4}-\d{2}-\d{2}\.json$/)
    expect(clickMock).toHaveBeenCalled()
    expect(revokeURLMock).toHaveBeenCalledWith('blob:fake-url')
  })

  it('serializes links as JSON blob with correct type', () => {
    const createURLMock = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const fakeAnchor = { href: '', download: '', click: vi.fn() } as any
    vi.spyOn(document, 'createElement').mockReturnValueOnce(fakeAnchor)

    exportJSON(sampleLinks)

    const blobArg = createURLMock.mock.calls[0][0] as Blob
    expect(blobArg.type).toBe('application/json')
  })
})

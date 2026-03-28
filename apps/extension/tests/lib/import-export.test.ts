// apps/extension/tests/lib/import-export.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { KuraLink } from '../../lib/types'
import { exportJSON } from '../../lib/import-export'
import { getLinkByUrl, addLink } from '../../lib/db'

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

describe('importJSON', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getLinkByUrl).mockResolvedValue(undefined)
  })

  it('imports valid JSON links and returns counts', async () => {
    const { importJSON } = await import('../../lib/import-export')
    const data = JSON.stringify([
      { url: 'https://new1.com', title: 'New 1', tags: ['a'] },
      { url: 'https://new2.com', title: 'New 2', tags: [] },
    ])
    const file = new File([data], 'test.json', { type: 'application/json' })

    const result = await importJSON(file)

    expect(result).toEqual({ imported: 2, skipped: 0 })
    expect(addLink).toHaveBeenCalledTimes(2)
  })

  it('skips duplicates by URL', async () => {
    vi.mocked(getLinkByUrl).mockImplementation(async (url) =>
      url === 'https://dup.com'
        ? { id: 'x', url: 'https://dup.com', title: 'Dup', tags: [], savedAt: 1 }
        : undefined
    )

    const { importJSON } = await import('../../lib/import-export')
    const data = JSON.stringify([
      { url: 'https://dup.com', title: 'Dup', tags: [] },
      { url: 'https://fresh.com', title: 'Fresh', tags: [] },
    ])
    const file = new File([data], 'test.json', { type: 'application/json' })

    const result = await importJSON(file)

    expect(result).toEqual({ imported: 1, skipped: 1 })
    expect(addLink).toHaveBeenCalledTimes(1)
  })

  it('rejects invalid JSON (not an array)', async () => {
    const { importJSON } = await import('../../lib/import-export')
    const data = JSON.stringify({ url: 'https://x.com', title: 'X' })
    const file = new File([data], 'test.json', { type: 'application/json' })

    await expect(importJSON(file)).rejects.toThrow('Invalid format')
  })

  it('skips items missing url or title', async () => {
    const { importJSON } = await import('../../lib/import-export')
    const data = JSON.stringify([
      { url: 'https://ok.com', title: 'OK', tags: [] },
      { url: 'https://no-title.com' },
      { title: 'No URL' },
    ])
    const file = new File([data], 'test.json', { type: 'application/json' })

    const result = await importJSON(file)

    expect(result).toEqual({ imported: 1, skipped: 2 })
  })
})

describe('importBookmarksHTML', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getLinkByUrl).mockResolvedValue(undefined)
  })

  const bookmarksHTML = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
  <DT><H3>Dev</H3>
  <DL><p>
    <DT><A HREF="https://react.dev" ADD_DATE="1700000000">React Docs</A>
    <DT><A HREF="https://vuejs.org" ADD_DATE="1700001000">Vue.js</A>
  </DL><p>
  <DT><H3>News</H3>
  <DL><p>
    <DT><A HREF="https://hn.com" ADD_DATE="1700002000">Hacker News</A>
  </DL><p>
</DL><p>`

  it('imports bookmarks with folder names as tags', async () => {
    const { importBookmarksHTML } = await import('../../lib/import-export')
    const file = new File([bookmarksHTML], 'bookmarks.html', { type: 'text/html' })

    const result = await importBookmarksHTML(file)

    expect(result).toEqual({ imported: 3, skipped: 0 })
    expect(addLink).toHaveBeenCalledTimes(3)
    expect(addLink).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://react.dev',
        title: 'React Docs',
        tags: ['Dev'],
      })
    )
    expect(addLink).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://hn.com',
        tags: ['News'],
      })
    )
  })

  it('skips duplicate URLs', async () => {
    vi.mocked(getLinkByUrl).mockImplementation(async (url) =>
      url === 'https://react.dev'
        ? { id: 'x', url: 'https://react.dev', title: 'R', tags: [], savedAt: 1 }
        : undefined
    )

    const { importBookmarksHTML } = await import('../../lib/import-export')
    const file = new File([bookmarksHTML], 'bookmarks.html', { type: 'text/html' })

    const result = await importBookmarksHTML(file)

    expect(result).toEqual({ imported: 2, skipped: 1 })
  })

  it('imports bookmarks without folder (no tags)', async () => {
    const { importBookmarksHTML } = await import('../../lib/import-export')
    const simpleHTML = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<DL><p>
  <DT><A HREF="https://example.com">Example</A>
</DL><p>`
    const file = new File([simpleHTML], 'bookmarks.html', { type: 'text/html' })

    const result = await importBookmarksHTML(file)

    expect(result).toEqual({ imported: 1, skipped: 0 })
    expect(addLink).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://example.com',
        title: 'Example',
        tags: [],
      })
    )
  })
})

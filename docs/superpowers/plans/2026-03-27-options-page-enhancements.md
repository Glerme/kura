# Options Page Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add tag counts in the sidebar and import/export functionality to the Kura Chrome extension's options page.

**Architecture:** Feature 1 replaces `getAllTags()` with the existing `getTagCounts()` in `App.tsx`, deriving tags from the keys and rendering counts alongside each tag. Feature 2 introduces a new `lib/import-export.ts` module with pure functions for JSON export, JSON import (with duplicate detection via `getLinkByUrl`), and NETSCAPE bookmark HTML import. The sidebar gets import/export buttons that trigger file downloads and a hidden file input respectively, with a temporary banner showing results.

**Tech Stack:** React 19, TypeScript, Vitest + jsdom + fake-indexeddb, @testing-library/react, vanilla CSS (glassmorphism dark theme).

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `apps/extension/lib/import-export.ts` | Create | `exportJSON`, `importJSON`, `importBookmarksHTML` functions |
| `apps/extension/entrypoints/options/App.tsx` | Modify | Replace `getAllTags` with `getTagCounts`, add import/export UI, banner state |
| `apps/extension/entrypoints/options/App.css` | Modify | `.tag-count`, `.sidebar-footer`, `.import-banner` styles |
| `apps/extension/tests/lib/import-export.test.ts` | Create | Unit tests for all 3 import-export functions |
| `apps/extension/tests/options/App.test.tsx` | Create | Component tests for tag counts display and import/export UI |

---

## Feature 1: Tag Counts in Sidebar

### Task 1: Tag Counts — Component Test

**Files:**
- Create: `apps/extension/tests/options/App.test.tsx`

- [ ] **Step 1: Write failing test for tag counts rendering**

```tsx
// apps/extension/tests/options/App.test.tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter kura-extension test -- --run tests/options/App.test.tsx`
Expected: FAIL — tag counts not rendered (currently uses `getAllTags` not `getTagCounts`)

- [ ] **Step 3: Commit failing test**

```bash
git add apps/extension/tests/options/App.test.tsx
git commit -m "test: add failing tests for tag counts in options sidebar"
```

---

### Task 2: Tag Counts — Implementation

**Files:**
- Modify: `apps/extension/entrypoints/options/App.tsx` (lines 1-19 import + load, lines 95-106 tags section)
- Modify: `apps/extension/entrypoints/options/App.css` (add after line 92)

- [ ] **Step 4: Update App.tsx imports and state**

Replace line 2:
```tsx
import { getAllLinks, getTagCounts, deleteLink, updateLink } from '../../lib/db'
```

Replace line 9 (the `tags` state):
```tsx
const [tagCounts, setTagCounts] = useState<Record<string, number>>({})
```

Add derived tags (after the `tagCounts` state, before `filter` state):
```tsx
const tags = useMemo(() => Object.keys(tagCounts).sort(), [tagCounts])
```

- [ ] **Step 5: Update the load() function**

Replace lines 15-19:
```tsx
async function load() {
  const [l, tc] = await Promise.all([getAllLinks(), getTagCounts()])
  setLinks(l)
  setTagCounts(tc)
}
```

- [ ] **Step 6: Update the tag rendering in sidebar**

Replace lines 98-103 (the `tags.map` block):
```tsx
{tags.map(tag => (
  <button
    key={tag}
    className={`nav-item tag-item ${filter.type === 'tag' && filter.tag === tag ? 'active' : ''}`}
    onClick={() => setFilter({ type: 'tag', tag })}
  >
    {tag}
    <span className="tag-count">{tagCounts[tag]}</span>
  </button>
))}
```

- [ ] **Step 7: Add CSS for tag counts**

Append to `apps/extension/entrypoints/options/App.css` after line 92 (after `.nav-item.active`):

```css
/* Tag item with count */
.nav-item.tag-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.tag-count {
  font-size: 10px;
  color: rgba(255,255,255,0.15);
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `cd /home/gui/Documents/projetos/kura && pnpm --filter kura-extension test -- --run tests/options/App.test.tsx`
Expected: PASS

- [ ] **Step 9: Run full test suite to check for regressions**

Run: `cd /home/gui/Documents/projetos/kura && pnpm --filter kura-extension test -- --run`
Expected: All tests PASS

- [ ] **Step 10: Commit**

```bash
git add apps/extension/entrypoints/options/App.tsx apps/extension/entrypoints/options/App.css
git commit -m "feat: show tag counts in options sidebar"
```

---

## Feature 2: Import/Export

### Task 3: exportJSON — Test + Implementation

**Files:**
- Create: `apps/extension/lib/import-export.ts`
- Create: `apps/extension/tests/lib/import-export.test.ts`

- [ ] **Step 11: Write failing test for exportJSON**

```ts
// apps/extension/tests/lib/import-export.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { KuraLink } from '../../lib/types'

// We'll mock the db module for import functions later
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

  it('creates a downloadable JSON file with correct filename', async () => {
    // Mock DOM APIs for download
    const createElementSpy = vi.spyOn(document, 'createElement')
    const clickMock = vi.fn()
    const revokeURLMock = vi.fn()
    const createURLMock = vi.fn().mockReturnValue('blob:fake-url')

    vi.stubGlobal('URL', { createObjectURL: createURLMock, revokeObjectURL: revokeURLMock })

    const { exportJSON } = await import('../../lib/import-export')
    
    // Mock anchor element
    const fakeAnchor = { href: '', download: '', click: clickMock } as any
    createElementSpy.mockReturnValueOnce(fakeAnchor)

    exportJSON(sampleLinks)

    expect(createURLMock).toHaveBeenCalledWith(expect.any(Blob))
    expect(fakeAnchor.download).toMatch(/^kura-export-\d{4}-\d{2}-\d{2}\.json$/)
    expect(clickMock).toHaveBeenCalled()
    expect(revokeURLMock).toHaveBeenCalledWith('blob:fake-url')
  })

  it('serializes links as indented JSON', () => {
    const createURLMock = vi.fn().mockReturnValue('blob:fake-url')
    const revokeURLMock = vi.fn()
    vi.stubGlobal('URL', { createObjectURL: createURLMock, revokeObjectURL: revokeURLMock })

    const fakeAnchor = { href: '', download: '', click: vi.fn() } as any
    vi.spyOn(document, 'createElement').mockReturnValueOnce(fakeAnchor)

    const { exportJSON } = require('../../lib/import-export')
    exportJSON(sampleLinks)

    const blobArg = createURLMock.mock.calls[0][0] as Blob
    expect(blobArg.type).toBe('application/json')
  })
})
```

- [ ] **Step 12: Run test to verify it fails**

Run: `cd /home/gui/Documents/projetos/kura && pnpm --filter kura-extension test -- --run tests/lib/import-export.test.ts`
Expected: FAIL — module not found

- [ ] **Step 13: Implement exportJSON**

```ts
// apps/extension/lib/import-export.ts
import type { KuraLink } from './types'
import { getLinkByUrl, addLink } from './db'

export function exportJSON(links: KuraLink[]): void {
  const json = JSON.stringify(links, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const date = new Date().toISOString().slice(0, 10)
  a.download = `kura-export-${date}.json`
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 14: Run test to verify it passes**

Run: `cd /home/gui/Documents/projetos/kura && pnpm --filter kura-extension test -- --run tests/lib/import-export.test.ts`
Expected: PASS

- [ ] **Step 15: Commit**

```bash
git add apps/extension/lib/import-export.ts apps/extension/tests/lib/import-export.test.ts
git commit -m "feat: add exportJSON function with tests"
```

---

### Task 4: importJSON — Test + Implementation

**Files:**
- Modify: `apps/extension/lib/import-export.ts`
- Modify: `apps/extension/tests/lib/import-export.test.ts`

- [ ] **Step 16: Write failing test for importJSON**

Add to `apps/extension/tests/lib/import-export.test.ts`:

```ts
import { getLinkByUrl, addLink } from '../../lib/db'

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
```

- [ ] **Step 17: Run test to verify it fails**

Run: `cd /home/gui/Documents/projetos/kura && pnpm --filter kura-extension test -- --run tests/lib/import-export.test.ts`
Expected: FAIL — `importJSON` not defined

- [ ] **Step 18: Implement importJSON**

Add to `apps/extension/lib/import-export.ts`:

```ts
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

export async function importJSON(file: File): Promise<{ imported: number; skipped: number }> {
  const text = await readFileAsText(file)
  const data = JSON.parse(text)

  if (!Array.isArray(data)) {
    throw new Error('Invalid format: expected an array')
  }

  let imported = 0
  let skipped = 0

  for (const item of data) {
    if (!item.url || !item.title) {
      skipped++
      continue
    }

    const existing = await getLinkByUrl(item.url)
    if (existing) {
      skipped++
      continue
    }

    await addLink({
      url: item.url,
      title: item.title,
      tags: Array.isArray(item.tags) ? item.tags : [],
      comment: item.comment ?? undefined,
      favicon: item.favicon ?? undefined,
      readAt: item.readAt ?? undefined,
    })
    imported++
  }

  return { imported, skipped }
}
```

- [ ] **Step 19: Run test to verify it passes**

Run: `cd /home/gui/Documents/projetos/kura && pnpm --filter kura-extension test -- --run tests/lib/import-export.test.ts`
Expected: PASS

- [ ] **Step 20: Commit**

```bash
git add apps/extension/lib/import-export.ts apps/extension/tests/lib/import-export.test.ts
git commit -m "feat: add importJSON with duplicate detection"
```

---

### Task 5: importBookmarksHTML — Test + Implementation

**Files:**
- Modify: `apps/extension/lib/import-export.ts`
- Modify: `apps/extension/tests/lib/import-export.test.ts`

- [ ] **Step 21: Write failing test for importBookmarksHTML**

Add to `apps/extension/tests/lib/import-export.test.ts`:

```ts
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
    // Check that folder names become tags
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

  it('uses ADD_DATE as savedAt when present', async () => {
    const { importBookmarksHTML } = await import('../../lib/import-export')
    const file = new File([bookmarksHTML], 'bookmarks.html', { type: 'text/html' })

    await importBookmarksHTML(file)

    // ADD_DATE is in seconds, savedAt is in ms
    expect(addLink).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://react.dev',
        readAt: undefined,
      })
    )
  })
})
```

- [ ] **Step 22: Run test to verify it fails**

Run: `cd /home/gui/Documents/projetos/kura && pnpm --filter kura-extension test -- --run tests/lib/import-export.test.ts`
Expected: FAIL — `importBookmarksHTML` not defined

- [ ] **Step 23: Implement importBookmarksHTML**

Add to `apps/extension/lib/import-export.ts`:

```ts
export async function importBookmarksHTML(file: File): Promise<{ imported: number; skipped: number }> {
  const text = await readFileAsText(file)
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'text/html')

  let imported = 0
  let skipped = 0

  // Walk through all <a> tags and find their parent folder <h3>
  const anchors = doc.querySelectorAll('a[href]')

  for (const a of anchors) {
    const url = a.getAttribute('href')
    const title = a.textContent?.trim()
    if (!url || !title) {
      skipped++
      continue
    }

    // Find parent folder: walk up to find the closest <DL> parent, then its preceding <DT><H3>
    const tags: string[] = []
    let parent = a.closest('dl')
    if (parent) {
      const dt = parent.parentElement
      if (dt) {
        const h3 = dt.querySelector(':scope > h3')
        if (h3?.textContent) {
          tags.push(h3.textContent.trim())
        }
      }
    }

    const existing = await getLinkByUrl(url)
    if (existing) {
      skipped++
      continue
    }

    const addDate = a.getAttribute('add_date')

    await addLink({
      url,
      title,
      tags,
      readAt: undefined,
    })
    imported++
  }

  return { imported, skipped }
}
```

- [ ] **Step 24: Run test to verify it passes**

Run: `cd /home/gui/Documents/projetos/kura && pnpm --filter kura-extension test -- --run tests/lib/import-export.test.ts`
Expected: PASS

- [ ] **Step 25: Commit**

```bash
git add apps/extension/lib/import-export.ts apps/extension/tests/lib/import-export.test.ts
git commit -m "feat: add importBookmarksHTML with folder-to-tag mapping"
```

---

### Task 6: Import/Export UI — Test

**Files:**
- Modify: `apps/extension/tests/options/App.test.tsx`

- [ ] **Step 26: Write failing tests for import/export buttons and banner**

Add to `apps/extension/tests/options/App.test.tsx`:

```tsx
import { fireEvent } from '@testing-library/react'
import { exportJSON, importJSON, importBookmarksHTML } from '../../lib/import-export'

vi.mock('../../lib/import-export', () => ({
  exportJSON: vi.fn(),
  importJSON: vi.fn().mockResolvedValue({ imported: 3, skipped: 1 }),
  importBookmarksHTML: vi.fn().mockResolvedValue({ imported: 5, skipped: 2 }),
}))

describe('Options App — Import/Export', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
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

  it('opens file input on Importar click', async () => {
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
    Object.defineProperty(fileInput, 'files', { value: [file] })
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
    Object.defineProperty(fileInput, 'files', { value: [file] })
    fireEvent.change(fileInput)

    await waitFor(() => screen.getByText(/3 importados/))
    vi.advanceTimersByTime(4000)
    await waitFor(() => {
      expect(screen.queryByText(/3 importados/)).not.toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 27: Run test to verify it fails**

Run: `cd /home/gui/Documents/projetos/kura && pnpm --filter kura-extension test -- --run tests/options/App.test.tsx`
Expected: FAIL — buttons not rendered

- [ ] **Step 28: Commit failing test**

```bash
git add apps/extension/tests/options/App.test.tsx
git commit -m "test: add failing tests for import/export UI"
```

---

### Task 7: Import/Export UI — Implementation

**Files:**
- Modify: `apps/extension/entrypoints/options/App.tsx`
- Modify: `apps/extension/entrypoints/options/App.css`

- [ ] **Step 29: Add import to App.tsx**

Add to the imports in `apps/extension/entrypoints/options/App.tsx`:

```tsx
import { exportJSON, importJSON, importBookmarksHTML } from '../../lib/import-export'
```

- [ ] **Step 30: Add banner state and file input ref**

Add these state declarations after the existing state in App.tsx:

```tsx
const [importBanner, setImportBanner] = useState<string | null>(null)
const fileInputRef = useRef<HTMLInputElement>(null)
```

Add `useRef` to the React import on line 1:

```tsx
import { useState, useEffect, useMemo, useRef } from 'react'
```

- [ ] **Step 31: Add handleExport and handleImport functions**

Add after the `handleShare` function:

```tsx
function handleExport() {
  exportJSON(links)
}

async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0]
  if (!file) return

  try {
    const result = file.name.endsWith('.json')
      ? await importJSON(file)
      : await importBookmarksHTML(file)

    setImportBanner(`${result.imported} importados, ${result.skipped} ignorados`)
    setTimeout(() => setImportBanner(null), 4000)
    load()
  } catch (err) {
    setImportBanner('Erro ao importar arquivo')
    setTimeout(() => setImportBanner(null), 4000)
  }

  // Reset the input so the same file can be re-imported
  if (fileInputRef.current) fileInputRef.current.value = ''
}
```

- [ ] **Step 32: Add sidebar footer buttons**

Add inside the `<aside className="sidebar">` element, after the tags section closing `)}` (after line 106) and before `</aside>`:

```tsx
<div className="sidebar-footer">
  <button
    className="nav-item footer-btn"
    onClick={() => fileInputRef.current?.click()}
  >
    ↑ Importar
  </button>
  <button
    className="nav-item footer-btn"
    onClick={handleExport}
  >
    ↓ Exportar
  </button>
  <input
    ref={fileInputRef}
    type="file"
    accept=".json,.html"
    hidden
    onChange={handleImport}
  />
</div>
```

- [ ] **Step 33: Add import banner in main area**

Add at the very top of `<main className="main">`, before the topbar:

```tsx
{importBanner && (
  <div className="import-banner">{importBanner}</div>
)}
```

- [ ] **Step 34: Add CSS for sidebar footer and import banner**

Append to `apps/extension/entrypoints/options/App.css`:

```css
/* Sidebar footer — import/export */
.sidebar-footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.08);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.footer-btn {
  font-size: 11px !important;
  color: rgba(255,255,255,0.3) !important;
}
.footer-btn:hover {
  color: rgba(255,255,255,0.6) !important;
}

/* Import result banner */
.import-banner {
  background: rgba(80,200,120,0.12);
  border: 1px solid rgba(80,200,120,0.25);
  border-radius: 10px;
  color: rgba(80,200,120,0.9);
  font-size: 12px;
  padding: 10px 16px;
  margin-bottom: 16px;
  text-align: center;
}
```

- [ ] **Step 35: Run tests to verify they pass**

Run: `cd /home/gui/Documents/projetos/kura && pnpm --filter kura-extension test -- --run tests/options/App.test.tsx`
Expected: PASS

- [ ] **Step 36: Run full test suite**

Run: `cd /home/gui/Documents/projetos/kura && pnpm --filter kura-extension test -- --run`
Expected: All tests PASS

- [ ] **Step 37: Commit**

```bash
git add apps/extension/entrypoints/options/App.tsx apps/extension/entrypoints/options/App.css
git commit -m "feat: add import/export buttons and banner to options sidebar"
```

---

### Task 8: Final Verification

- [ ] **Step 38: Type check**

Run: `cd /home/gui/Documents/projetos/kura && pnpm --filter kura-extension compile`
Expected: No type errors

- [ ] **Step 39: Lint**

Run: `cd /home/gui/Documents/projetos/kura && pnpm --filter kura-extension lint`
Expected: No lint errors (or only pre-existing ones)

- [ ] **Step 40: Manual smoke test**

Run: `cd /home/gui/Documents/projetos/kura && pnpm --filter kura-extension dev`

Verify in browser at `chrome-extension://<id>/options.html`:
1. Tags in sidebar show counts (e.g., `dev 3`)
2. Counts are right-aligned, small, and dim
3. "Importar" and "Exportar" buttons appear at bottom of sidebar
4. Clicking "Exportar" downloads a `kura-export-YYYY-MM-DD.json` file
5. Clicking "Importar" opens file picker
6. After importing a JSON file, banner appears and disappears after 4s
7. After importing bookmarks HTML, links appear with folder names as tags

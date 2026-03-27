# Kura — Popup + Context Menu + Toast Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Kura popup (Links + Save tabs), context menu, and Shadow DOM toast — deixando a extensão 100% utilizável.

**Architecture:** Popup is a React SPA with tab state in App.tsx. LinksTab reads from IndexedDB on mount; SaveTab writes on submit. Background registers context menu and sends messages to content.ts, which injects a Shadow DOM toast into the active page. All persistence goes through lib/db.ts (already implemented).

**Tech Stack:** React 19, TypeScript, WXT (Chrome MV3 + Firefox MV2), custom CSS (backdrop-filter glassmorphism), idb via lib/db.ts, @testing-library/react, vitest/jsdom.

**Scope:** Popup UI + context menu + toast only. Options Page, Sharing, Import/Export → separate plan.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `entrypoints/popup/App.css` | Rewrite | Todos os estilos glassmorphism (compartilhado pelos componentes do popup) |
| `entrypoints/popup/App.tsx` | Rewrite | Root component — tab switching, blobs, panel shell |
| `entrypoints/popup/LinkItem.tsx` | Create | Single link row: estados collapsed + expanded |
| `entrypoints/popup/LinksTab.tsx` | Create | Lista de links com busca, chips de filtro, empty state, footer |
| `entrypoints/popup/SaveTab.tsx` | Create | Formulário de salvar com detecção de duplicata |
| `entrypoints/background.ts` | Rewrite | Registro do context menu + message passing para content |
| `entrypoints/content.ts` | Rewrite | Shadow DOM toast (LINK_SAVED + ALREADY_SAVED) |
| `wxt.config.ts` | Modify | Adicionar permissões: contextMenus, tabs |
| `tests/popup/mocks.ts` | Create | Mocks de browser API compartilhados pelos popup tests |
| `tests/popup/LinkItem.test.tsx` | Create | expand/collapse, abrir, deletar, marcar lido |
| `tests/popup/LinksTab.test.tsx` | Create | filtro all/unread/tag, busca |
| `tests/popup/SaveTab.test.tsx` | Create | salvar novo, alert de duplicata, atualizar |

---

### Task 1: Glassmorphism CSS

**Files:**
- Rewrite: `entrypoints/popup/App.css`

- [ ] **Step 1: Rewrite App.css**

```css
/* entrypoints/popup/App.css */
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  width: 300px;
  min-height: 420px;
  background: #080808;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #fff;
  overflow-x: hidden;
}

/* Background blobs — sem eles o blur não aparece */
.popup { position: relative; min-height: 100vh; overflow: hidden; }
.blob {
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}
.blob-1 { width: 200px; height: 200px; background: #fff; top: -60px; left: -60px; opacity: 0.06; }
.blob-2 { width: 180px; height: 180px; background: #aaa; bottom: -40px; right: -40px; opacity: 0.08; }
.blob-3 { width: 120px; height: 120px; background: #ddd; top: 50%; left: 60%; opacity: 0.05; }

/* Glass panel */
.panel {
  position: relative;
  z-index: 1;
  background: rgba(255,255,255,0.06);
  backdrop-filter: blur(32px) saturate(180%);
  -webkit-backdrop-filter: blur(32px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.13);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.12);
  min-height: 100vh;
}
.panel::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  pointer-events: none;
}

/* Header */
.popup-header {
  padding: 14px 16px;
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid rgba(255,255,255,0.07);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: rgba(255,255,255,0.85);
  display: flex;
  align-items: center;
  gap: 8px;
}
.header-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.5);
  box-shadow: 0 0 6px rgba(255,255,255,0.4);
}

/* Tabs */
.tab-bar { display: flex; border-bottom: 1px solid rgba(255,255,255,0.07); }
.tab-btn {
  flex: 1;
  padding: 10px 0;
  font-size: 11px;
  text-align: center;
  color: rgba(255,255,255,0.3);
  background: none;
  border: none;
  cursor: pointer;
  letter-spacing: 0.3px;
  font-family: inherit;
  transition: color 0.15s;
}
.tab-btn.active {
  color: rgba(255,255,255,0.85);
  border-bottom: 1.5px solid rgba(255,255,255,0.6);
  margin-bottom: -1px;
}
.tab-content { padding: 12px; }

/* Form elements */
.field { margin-bottom: 10px; }
.g-label {
  display: block;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255,255,255,0.25);
  margin-bottom: 4px;
}
.g-input, .g-textarea, .g-search {
  width: 100%;
  background: rgba(255,255,255,0.055);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 8px;
  color: rgba(255,255,255,0.8);
  padding: 8px 10px;
  font-size: 12px;
  font-family: inherit;
  outline: none;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.3);
  transition: border-color 0.15s, background 0.15s;
}
.g-input:focus, .g-textarea:focus, .g-search:focus {
  border-color: rgba(255,255,255,0.22);
  background: rgba(255,255,255,0.08);
}
.g-input.mono {
  font-family: 'SF Mono', 'Consolas', monospace;
  font-size: 10px;
  color: rgba(255,255,255,0.4);
}
.g-textarea { min-height: 64px; resize: vertical; line-height: 1.55; }
.g-search { margin-bottom: 10px; }

/* Buttons */
.g-btn {
  width: 100%;
  background: rgba(255,255,255,0.10);
  color: rgba(255,255,255,0.9);
  border: 1px solid rgba(255,255,255,0.16);
  border-radius: 8px;
  padding: 9px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
  transition: background 0.15s;
  text-align: center;
}
.g-btn:hover { background: rgba(255,255,255,0.16); }
.g-btn.ghost {
  background: transparent;
  border-color: rgba(255,255,255,0.09);
  color: rgba(255,255,255,0.35);
}

/* Filter chips */
.chips { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 10px; }
.chip {
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 10px;
  border: 1px solid rgba(255,255,255,0.10);
  color: rgba(255,255,255,0.35);
  background: rgba(255,255,255,0.04);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.chip.active {
  background: rgba(255,255,255,0.11);
  color: rgba(255,255,255,0.85);
  border-color: rgba(255,255,255,0.22);
}

/* Link items */
.link-item {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px;
  margin-bottom: 6px;
  overflow: hidden;
  transition: border-color 0.15s;
}
.link-item.open { border-color: rgba(255,255,255,0.14); }
.link-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  cursor: pointer;
}
.link-row:hover { background: rgba(255,255,255,0.03); }
.favicon {
  width: 16px; height: 16px;
  border-radius: 3px;
  flex-shrink: 0;
  object-fit: cover;
}
.favicon-fallback {
  width: 16px; height: 16px;
  border-radius: 3px;
  flex-shrink: 0;
  background: rgba(255,255,255,0.10);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  color: rgba(255,255,255,0.4);
  text-transform: uppercase;
}
.link-info { flex: 1; min-width: 0; }
.link-title {
  font-size: 11.5px;
  color: rgba(255,255,255,0.82);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  margin-bottom: 2px;
}
.link-domain { font-size: 9.5px; color: rgba(255,255,255,0.28); margin-bottom: 4px; }
.link-tags { display: flex; gap: 3px; flex-wrap: wrap; }
.link-tag {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 6px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.35);
}
.unread-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: rgba(255,255,255,0.5);
  box-shadow: 0 0 5px rgba(255,255,255,0.3);
  flex-shrink: 0;
}
.chevron-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(255,255,255,0.2);
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 10px;
  line-height: 1;
  flex-shrink: 0;
  transition: color 0.15s, transform 0.2s;
}
.chevron-btn:hover { color: rgba(255,255,255,0.5); }
.link-item.open .chevron-btn { transform: rotate(180deg); color: rgba(255,255,255,0.45); }
.link-detail {
  border-top: 1px solid rgba(255,255,255,0.06);
  padding: 10px;
  background: rgba(255,255,255,0.02);
}
.link-comment {
  font-size: 11px;
  color: rgba(255,255,255,0.4);
  font-style: italic;
  line-height: 1.5;
  margin-bottom: 8px;
}
.action-btns { display: flex; gap: 5px; }
.action-btn {
  flex: 1;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 7px;
  color: rgba(255,255,255,0.5);
  font-size: 10px;
  padding: 5px 4px;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  text-align: center;
}
.action-btn:hover { background: rgba(255,255,255,0.11); color: rgba(255,255,255,0.85); }
.action-btn.danger:hover {
  background: rgba(255,60,60,0.15);
  border-color: rgba(255,60,60,0.25);
  color: rgba(255,100,100,0.9);
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 32px 16px;
  color: rgba(255,255,255,0.22);
  font-size: 12px;
  line-height: 1.7;
}

/* Footer */
.popup-footer { padding: 8px 12px; border-top: 1px solid rgba(255,255,255,0.06); }
.footer-btn {
  width: 100%;
  background: none;
  border: none;
  color: rgba(255,255,255,0.22);
  font-size: 11px;
  cursor: pointer;
  font-family: inherit;
  text-align: center;
  padding: 4px;
  transition: color 0.15s;
}
.footer-btn:hover { color: rgba(255,255,255,0.5); }

/* Inline alert */
.alert {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 11px;
  color: rgba(255,255,255,0.6);
  margin-bottom: 8px;
}
.alert-actions { display: flex; gap: 6px; margin-top: 8px; }
```

- [ ] **Step 2: Commit**

```bash
git add apps/extension/entrypoints/popup/App.css
git commit -m "style: add glassmorphism CSS for popup"
```

---

### Task 2: App.tsx — Popup Shell

**Files:**
- Rewrite: `entrypoints/popup/App.tsx`

- [ ] **Step 1: Rewrite App.tsx**

```tsx
// entrypoints/popup/App.tsx
import { useState } from 'react'
import { LinksTab } from './LinksTab'
import { SaveTab } from './SaveTab'
import './App.css'

type Tab = 'links' | 'save'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('links')

  return (
    <div className="popup">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <div className="panel">
        <header className="popup-header">
          <div className="header-dot" />
          KURA
        </header>
        <div className="tab-bar">
          <button
            className={`tab-btn ${activeTab === 'links' ? 'active' : ''}`}
            onClick={() => setActiveTab('links')}
          >
            Links
          </button>
          <button
            className={`tab-btn ${activeTab === 'save' ? 'active' : ''}`}
            onClick={() => setActiveTab('save')}
          >
            Salvar
          </button>
        </div>
        <div className="tab-content">
          {activeTab === 'links' ? <LinksTab /> : <SaveTab />}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/extension/entrypoints/popup/App.tsx
git commit -m "feat: add popup shell with tab switching"
```

---

### Task 3: LinkItem Component

**Files:**
- Create: `entrypoints/popup/LinkItem.tsx`
- Create: `tests/popup/mocks.ts`
- Create: `tests/popup/LinkItem.test.tsx`

- [ ] **Step 1: Create browser mocks file**

```ts
// apps/extension/tests/popup/mocks.ts
import { vi } from 'vitest'

export function mockBrowser() {
  const b = {
    tabs: {
      create: vi.fn(),
      query: vi.fn().mockResolvedValue([{ url: 'https://example.com', title: 'Example' }]),
    },
    runtime: {
      getURL: vi.fn((path: string) => `chrome-extension://fake-id/${path}`),
      sendMessage: vi.fn(),
      onMessage: { addListener: vi.fn() },
    },
    contextMenus: {
      create: vi.fn(),
      onClicked: { addListener: vi.fn() },
    },
  }
  vi.stubGlobal('browser', b)
  return b
}
```

- [ ] **Step 2: Write failing tests**

```tsx
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
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
cd apps/extension && pnpm vitest run tests/popup/LinkItem.test.tsx
```
Expected: FAIL — `LinkItem` module not found.

- [ ] **Step 4: Create LinkItem.tsx**

```tsx
// entrypoints/popup/LinkItem.tsx
import { useState } from 'react'
import { updateLink, deleteLink } from '../../lib/db'
import { domainFromUrl } from '../../lib/fetch-title'
import type { KuraLink } from '../../lib/types'

interface Props {
  link: KuraLink
  isExpanded: boolean
  onToggle: () => void
  onRefresh: () => void
}

export function LinkItem({ link, isExpanded, onToggle, onRefresh }: Props) {
  const domain = domainFromUrl(link.url)

  function openLink() {
    browser.tabs.create({ url: link.url })
  }

  async function markRead() {
    await updateLink(link.id, { readAt: Date.now() })
    onRefresh()
  }

  async function handleDelete() {
    await deleteLink(link.id)
    onRefresh()
  }

  return (
    <div className={`link-item ${isExpanded ? 'open' : ''}`}>
      <div className="link-row" onClick={openLink}>
        <FaviconImg domain={domain} />
        <div className="link-info">
          <div className="link-title">{link.title}</div>
          <div className="link-domain">{domain}</div>
          {link.tags.length > 0 && (
            <div className="link-tags">
              {link.tags.map(t => <span key={t} className="link-tag">{t}</span>)}
            </div>
          )}
        </div>
        {!link.readAt && <div className="unread-dot" />}
        <button
          className="chevron-btn"
          aria-label="expandir"
          onClick={e => { e.stopPropagation(); onToggle() }}
        >▾</button>
      </div>
      {isExpanded && (
        <div className="link-detail">
          {link.comment && <p className="link-comment">"{link.comment}"</p>}
          <div className="action-btns">
            <button className="action-btn" onClick={openLink}>↗ Abrir</button>
            {!link.readAt && (
              <button className="action-btn" onClick={markRead}>✓ Lido</button>
            )}
            <button className="action-btn danger" onClick={handleDelete}>✕ Deletar</button>
          </div>
        </div>
      )}
    </div>
  )
}

function FaviconImg({ domain }: { domain: string }) {
  const [error, setError] = useState(false)
  if (error) {
    return <div className="favicon-fallback">{domain.charAt(0).toUpperCase()}</div>
  }
  return (
    <img
      className="favicon"
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
      onError={() => setError(true)}
      alt=""
    />
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd apps/extension && pnpm vitest run tests/popup/LinkItem.test.tsx
```
Expected: All 8 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/extension/entrypoints/popup/LinkItem.tsx \
        apps/extension/tests/popup/mocks.ts \
        apps/extension/tests/popup/LinkItem.test.tsx
git commit -m "feat: add LinkItem component with expand/collapse"
```

---

### Task 4: LinksTab

**Files:**
- Create: `entrypoints/popup/LinksTab.tsx`
- Create: `tests/popup/LinksTab.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// apps/extension/tests/popup/LinksTab.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { LinksTab } from '../../entrypoints/popup/LinksTab'
import { mockBrowser } from './mocks'
import type { KuraLink } from '../../lib/types'

const links: KuraLink[] = [
  { id: '1', url: 'https://github.com/a', title: 'GitHub Article', tags: ['dev'], savedAt: 3000, readAt: undefined },
  { id: '2', url: 'https://medium.com/b', title: 'Medium Post', tags: ['leitura'], savedAt: 2000, readAt: 1500 },
  { id: '3', url: 'https://rust-lang.org', title: 'Rust Docs', tags: ['dev', 'rust'], savedAt: 1000, readAt: undefined },
]

vi.mock('../../lib/db', () => ({
  getAllLinks: vi.fn().mockResolvedValue(links),
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
    fireEvent.click(screen.getByText('leitura'))
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
```

- [ ] **Step 2: Run to verify they fail**

```bash
cd apps/extension && pnpm vitest run tests/popup/LinksTab.test.tsx
```
Expected: FAIL — `LinksTab` module not found.

- [ ] **Step 3: Create LinksTab.tsx**

```tsx
// entrypoints/popup/LinksTab.tsx
import { useState, useEffect, useMemo } from 'react'
import { getAllLinks, getAllTags } from '../../lib/db'
import type { KuraLink, FilterState } from '../../lib/types'
import { LinkItem } from './LinkItem'

export function LinksTab() {
  const [links, setLinks] = useState<KuraLink[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [filter, setFilter] = useState<FilterState>({ type: 'all' })
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function load() {
    const [l, t] = await Promise.all([getAllLinks(), getAllTags()])
    setLinks(l)
    setTags(t)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let result = links
    if (filter.type === 'unread') result = result.filter(l => !l.readAt)
    if (filter.type === 'tag') result = result.filter(l => l.tags.includes(filter.tag))
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.tags.some(t => t.includes(q)) ||
        (l.comment?.toLowerCase().includes(q) ?? false)
      )
    }
    return result
  }, [links, filter, search])

  return (
    <>
      <input
        className="g-search"
        placeholder="🔍 buscar..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="chips">
        <button
          className={`chip ${filter.type === 'all' ? 'active' : ''}`}
          onClick={() => setFilter({ type: 'all' })}
        >todos</button>
        <button
          className={`chip ${filter.type === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter({ type: 'unread' })}
        >não lidos</button>
        {tags.map(tag => (
          <button
            key={tag}
            className={`chip ${filter.type === 'tag' && filter.tag === tag ? 'active' : ''}`}
            onClick={() => setFilter({ type: 'tag', tag })}
          >{tag}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state">
          Nenhum link salvo ainda.<br />
          Use o ícone ou clique com botão direito em qualquer página.
        </div>
      ) : (
        filtered.map(link => (
          <LinkItem
            key={link.id}
            link={link}
            isExpanded={expandedId === link.id}
            onToggle={() => setExpandedId(expandedId === link.id ? null : link.id)}
            onRefresh={load}
          />
        ))
      )}
      <div className="popup-footer">
        <button
          className="footer-btn"
          onClick={() => browser.tabs.create({ url: browser.runtime.getURL('options.html') })}
        >Ver todos os links →</button>
      </div>
    </>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd apps/extension && pnpm vitest run tests/popup/LinksTab.test.tsx
```
Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/extension/entrypoints/popup/LinksTab.tsx \
        apps/extension/tests/popup/LinksTab.test.tsx
git commit -m "feat: add LinksTab with search and filter"
```

---

### Task 5: SaveTab

**Files:**
- Create: `entrypoints/popup/SaveTab.tsx`
- Create: `tests/popup/SaveTab.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
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
  getLinkByUrl: vi.fn().mockResolvedValue(null),
  addLink: vi.fn().mockResolvedValue({ id: 'new-id' }),
  updateLink: vi.fn().mockResolvedValue(undefined),
}))

describe('SaveTab', () => {
  beforeEach(() => {
    mockBrowser()
    vi.clearAllMocks()
    vi.mocked(getLinkByUrl).mockResolvedValue(null)
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
```

- [ ] **Step 2: Run to verify they fail**

```bash
cd apps/extension && pnpm vitest run tests/popup/SaveTab.test.tsx
```
Expected: FAIL — `SaveTab` module not found.

- [ ] **Step 3: Create SaveTab.tsx**

```tsx
// entrypoints/popup/SaveTab.tsx
import { useState, useEffect } from 'react'
import { addLink, getLinkByUrl, updateLink } from '../../lib/db'
import { parseTags } from '../../lib/tags'
import { domainFromUrl } from '../../lib/fetch-title'
import type { KuraLink } from '../../lib/types'

export function SaveTab() {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [existing, setExisting] = useState<KuraLink | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.url) setUrl(tab.url)
      if (tab?.title) setTitle(tab.title)
    })
  }, [])

  async function handleSave() {
    const domain = domainFromUrl(url)
    const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    const found = await getLinkByUrl(url)
    if (found) { setExisting(found); return }
    await addLink({ url, title, comment: comment || undefined, tags: parseTags(tagsInput), favicon })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleUpdate() {
    if (!existing) return
    await updateLink(existing.id, { title, comment: comment || undefined, tags: parseTags(tagsInput) })
    setExisting(null)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <>
      <div className="field">
        <label className="g-label">URL</label>
        <input
          className="g-input mono"
          value={url}
          onChange={e => { setUrl(e.target.value); setExisting(null) }}
        />
      </div>
      <div className="field">
        <label className="g-label">Título</label>
        <input className="g-input" value={title} onChange={e => setTitle(e.target.value)} />
      </div>
      <div className="field">
        <label className="g-label">Comentário</label>
        <textarea
          className="g-textarea"
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Adicione um comentário..."
        />
      </div>
      <div className="field">
        <label className="g-label">Tags</label>
        <input
          className="g-input"
          value={tagsInput}
          onChange={e => setTagsInput(e.target.value)}
          placeholder="dev, leitura"
        />
      </div>

      {existing && (
        <div className="alert">
          Este link já foi salvo.
          <div className="alert-actions">
            <button className="g-btn ghost" onClick={() => setExisting(null)}>Cancelar</button>
            <button className="g-btn" onClick={handleUpdate}>Atualizar</button>
          </div>
        </div>
      )}

      {saved && <div className="alert">✓ Salvo!</div>}

      {!existing && !saved && (
        <button className="g-btn" onClick={handleSave}>Salvar esta página</button>
      )}
    </>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd apps/extension && pnpm vitest run tests/popup/SaveTab.test.tsx
```
Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/extension/entrypoints/popup/SaveTab.tsx \
        apps/extension/tests/popup/SaveTab.test.tsx
git commit -m "feat: add SaveTab with duplicate detection"
```

---

### Task 6: Permissions (wxt.config.ts)

**Files:**
- Modify: `wxt.config.ts`

- [ ] **Step 1: Read the current wxt.config.ts**

```bash
cat apps/extension/wxt.config.ts
```

- [ ] **Step 2: Add permissions to manifest**

Adicionar `permissions: ['contextMenus', 'tabs']` dentro do objeto `manifest`. Se o arquivo não tiver a chave `manifest`, criá-la. Resultado esperado:

```ts
// apps/extension/wxt.config.ts
import { defineConfig } from 'wxt'

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: '__MSG_ext_name__',
    description: '__MSG_ext_description__',
    default_locale: 'en',
    permissions: ['contextMenus', 'tabs'],
  },
})
```

- [ ] **Step 3: Commit**

```bash
git add apps/extension/wxt.config.ts
git commit -m "chore: add contextMenus and tabs permissions to manifest"
```

---

### Task 7: Background — Context Menu

**Files:**
- Rewrite: `entrypoints/background.ts`

- [ ] **Step 1: Rewrite background.ts**

```ts
// entrypoints/background.ts
import { addLink, getLinkByUrl } from '../lib/db'
import { domainFromUrl } from '../lib/fetch-title'

export default defineBackground(() => {
  browser.contextMenus.create({
    id: 'save-to-kura',
    title: 'Salvar no Kura',
    contexts: ['page', 'link'],
  })

  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    // Strip fragment from URL — fragments are client-side only
    const url = (info.linkUrl ?? info.pageUrl ?? tab?.url ?? '').split('#')[0]
    const title = tab?.title ?? ''
    const tabId = tab?.id
    if (!url || !tabId) return

    const existing = await getLinkByUrl(url)

    if (existing) {
      browser.tabs.sendMessage(tabId, { type: 'ALREADY_SAVED', link: existing })
      return
    }

    const domain = domainFromUrl(url)
    const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    const link = await addLink({ url, title, tags: [], favicon })
    browser.tabs.sendMessage(tabId, { type: 'LINK_SAVED', link })
  })
})
```

- [ ] **Step 2: Verify build succeeds**

```bash
cd apps/extension && pnpm build 2>&1 | tail -10
```
Expected: sem erros TypeScript, `.output/chrome-mv3/` gerado.

- [ ] **Step 3: Commit**

```bash
git add apps/extension/entrypoints/background.ts
git commit -m "feat: add context menu with save-to-kura action"
```

---

### Task 8: Content Script — Toast

**Files:**
- Rewrite: `entrypoints/content.ts`

- [ ] **Step 1: Rewrite content.ts**

```ts
// entrypoints/content.ts
import { updateLink } from '../lib/db'
import { parseTags } from '../lib/tags'
import type { KuraLink } from '../lib/types'

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    let host: HTMLElement | null = null
    let timer: ReturnType<typeof setTimeout> | null = null

    browser.runtime.onMessage.addListener((msg: { type: string; link: KuraLink }) => {
      if (msg.type === 'LINK_SAVED') showToast('saved', msg.link)
      if (msg.type === 'ALREADY_SAVED') showToast('existing', msg.link)
    })

    function showToast(mode: 'saved' | 'existing', link: KuraLink) {
      host?.remove()
      if (timer) clearTimeout(timer)

      host = document.createElement('div')
      const shadow = host.attachShadow({ mode: 'open' })
      shadow.innerHTML = buildToastHTML(mode, link)
      document.body.appendChild(host)

      const close = () => {
        host?.remove()
        host = null
        if (timer) clearTimeout(timer)
      }

      shadow.getElementById('kura-close')?.addEventListener('click', close)
      shadow.getElementById('kura-nothanks')?.addEventListener('click', close)
      shadow.getElementById('kura-skip')?.addEventListener('click', close)

      const expand = () => {
        if (timer) clearTimeout(timer)
        shadow.getElementById('kura-collapsed')!.style.display = 'none'
        shadow.getElementById('kura-expanded')!.style.display = 'block'
      }

      shadow.getElementById('kura-add')?.addEventListener('click', expand)
      shadow.getElementById('kura-update')?.addEventListener('click', expand)

      shadow.getElementById('kura-confirm')?.addEventListener('click', async () => {
        const tagsEl = shadow.getElementById('kura-tags') as HTMLInputElement
        const commentEl = shadow.getElementById('kura-comment') as HTMLTextAreaElement
        await updateLink(link.id, {
          tags: parseTags(tagsEl.value),
          comment: commentEl.value || undefined,
        })
        close()
      })

      shadow.getElementById('kura-view')?.addEventListener('click', () => {
        browser.runtime.sendMessage({ type: 'OPEN_POPUP' })
        close()
      })

      if (mode === 'saved') {
        timer = setTimeout(close, 6000)
      }
    }
  },
})

function buildToastHTML(mode: 'saved' | 'existing', link: KuraLink): string {
  const truncUrl = link.url.length > 42 ? link.url.slice(0, 42) + '…' : link.url
  const isSaved = mode === 'saved'

  return `
<style>
:host {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 2147483647;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.toast {
  width: 300px;
  border-radius: 14px;
  background: rgba(18,18,18,0.88);
  backdrop-filter: blur(32px) saturate(180%);
  -webkit-backdrop-filter: blur(32px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.12);
  box-shadow: 0 4px 6px rgba(0,0,0,0.4), 0 16px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.10);
  color: #fff;
  overflow: hidden;
  animation: slide-in 0.25s ease-out;
}
@keyframes slide-in { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
.progress { height: 2px; background: rgba(255,255,255,0.08); }
.bar { height: 100%; background: rgba(255,255,255,0.35); ${isSaved ? 'animation: drain 6s linear forwards;' : 'width:0'} }
@keyframes drain { from { width: 100%; } to { width: 0%; } }
.body { padding: 12px 13px 13px; }
.top { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.icon { width: 26px; height: 26px; border-radius: 7px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
.txt { flex: 1; min-width: 0; }
.ttl { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.85); }
.url { font-size: 9.5px; color: rgba(255,255,255,0.28); font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.x { background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.2); font-size: 13px; padding: 2px 5px; border-radius: 4px; line-height: 1; }
.x:hover { color: rgba(255,255,255,0.5); }
.acts { display: flex; gap: 5px; }
.btn { flex: 1; border-radius: 7px; padding: 6px 4px; font-size: 10.5px; font-weight: 600; cursor: pointer; text-align: center; border: 1px solid rgba(255,255,255,0.12); font-family: inherit; }
.primary { background: rgba(255,255,255,0.11); color: rgba(255,255,255,0.9); }
.ghost { background: transparent; color: rgba(255,255,255,0.3); }
.fields { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
.inp, .ta { width: 100%; background: rgba(255,255,255,0.055); border: 1px solid rgba(255,255,255,0.09); border-radius: 7px; color: rgba(255,255,255,0.8); padding: 6px 9px; font-size: 11px; font-family: inherit; outline: none; box-sizing: border-box; }
.ta { min-height: 48px; resize: none; }
</style>
<div class="toast">
  <div class="progress"><div class="bar"></div></div>
  <div class="body">
    <div class="top">
      <div class="icon">◆</div>
      <div class="txt">
        <div class="ttl">${isSaved ? 'Link salvo!' : 'Já salvo!'}</div>
        <div class="url">${truncUrl}</div>
      </div>
      <button class="x" id="kura-close">✕</button>
    </div>
    <div id="kura-collapsed">
      ${isSaved
        ? `<div class="acts">
             <button class="btn ghost" id="kura-nothanks">Não, obrigado</button>
             <button class="btn primary" id="kura-add">Adicionar →</button>
           </div>`
        : `<div class="acts">
             <button class="btn ghost" id="kura-view">Ver</button>
             <button class="btn primary" id="kura-update">Atualizar</button>
           </div>`
      }
    </div>
    <div id="kura-expanded" style="display:none">
      <div class="fields">
        <input class="inp" id="kura-tags" placeholder="Tags (ex: dev, leitura)" value="${link.tags.join(', ')}">
        <textarea class="ta" id="kura-comment" placeholder="Comentário...">${link.comment ?? ''}</textarea>
      </div>
      <div class="acts">
        <button class="btn ghost" id="kura-skip">Pular</button>
        <button class="btn primary" id="kura-confirm">Confirmar</button>
      </div>
    </div>
  </div>
</div>`
}
```

- [ ] **Step 2: Verify build succeeds**

```bash
cd apps/extension && pnpm build 2>&1 | tail -10
```
Expected: sem erros, `.output/chrome-mv3/` gerado.

- [ ] **Step 3: Commit**

```bash
git add apps/extension/entrypoints/content.ts
git commit -m "feat: add toast via Shadow DOM for context menu saves"
```

---

### Task 9: Full Test Suite + Builds

- [ ] **Step 1: Run all tests**

```bash
cd apps/extension && pnpm vitest run
```
Expected: todos os testes passam (lib tests existentes + popup tests novos). Se algum teste falhar por diferença de import path ou mock, corrigir antes de continuar.

- [ ] **Step 2: Build Chrome**

```bash
cd apps/extension && pnpm build
```
Expected: `.output/chrome-mv3/` sem erros TypeScript.

- [ ] **Step 3: Build Firefox**

```bash
cd apps/extension && pnpm build:firefox
```
Expected: `.output/firefox-mv2/` sem erros.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Kura extension MVP — popup + context menu + toast"
```

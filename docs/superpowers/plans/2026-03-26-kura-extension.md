# Kura Extension MVP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome + Firefox browser extension that lets users save links with comments and tags via context menu, manage them in a reading list, and share via social platforms.

**Architecture:** Offline-first extension using WXT framework with React + TypeScript. Data persisted in IndexedDB via `idb`. Three surfaces: background service worker (context menu), popup (quick save + recents), options page (full manager with sidebar + list).

**Tech Stack:** WXT, React 18, TypeScript, Tailwind CSS v3, idb, Vitest, fake-indexeddb, @testing-library/react

**Monorepo:** pnpm workspaces + Turborepo. Extension lives at `apps/extension/`. Landing page (`apps/landing/`) and backend (`apps/web/`) are added in future phases.

> **Note:** All file paths from Task 1 onwards are relative to `apps/extension/` unless stated otherwise.

---

## Monorepo Structure

```
kura/                          ← repo root
├── apps/
│   ├── extension/             ← this plan
│   └── landing/               ← Phase 2 (future)
├── packages/                  ← shared libs (future)
├── docs/                      ← specs + plans
├── AGENTS.md
├── package.json               ← root (workspaces)
├── pnpm-workspace.yaml
└── turbo.json
```

## File Map (relative to `apps/extension/`)

| File | Responsibility |
|---|---|
| `wxt.config.ts` | Extension manifest, permissions |
| `assets/global.css` | Tailwind base styles |
| `lib/types.ts` | Shared TypeScript interfaces (`KuraLink`, `FilterState`) |
| `lib/db.ts` | IndexedDB CRUD via `idb` |
| `lib/fetch-title.ts` | Fetch page `<title>` from URL with domain fallback |
| `lib/tags.ts` | Tag parsing and normalization |
| `lib/import-export.ts` | JSON/CSV export + JSON/HTML import |
| `entrypoints/background.ts` | Context menu + pendingUrl session storage |
| `components/ShareSheet.tsx` | Reusable share modal (WhatsApp, Twitter, copy) |
| `entrypoints/popup/index.html` | Popup HTML entry |
| `entrypoints/popup/main.tsx` | React mount point for popup |
| `entrypoints/popup/App.tsx` | Popup root: tab state + pendingUrl detection |
| `entrypoints/popup/SaveTab.tsx` | Save link form |
| `entrypoints/popup/RecentTab.tsx` | Recent links list with search |
| `entrypoints/options/index.html` | Options page HTML entry |
| `entrypoints/options/main.tsx` | React mount point for options page |
| `entrypoints/options/App.tsx` | Options root: filter state + layout |
| `entrypoints/options/Sidebar.tsx` | Filter nav + tag counts + import/export |
| `entrypoints/options/LinkList.tsx` | Full link list with edit/delete/share/filter |
| `entrypoints/options/AddLinkModal.tsx` | Modal to manually add a link |
| `tests/setup.ts` | Vitest global setup |
| `tests/lib/db.test.ts` | DB layer tests |
| `tests/lib/tags.test.ts` | Tag utility tests |
| `tests/lib/fetch-title.test.ts` | fetch-title utility tests |
| `tests/lib/import-export.test.ts` | Import/export tests |
| `lib/i18n.ts` | Typed `useI18n()` hook wrapping `@wxt-dev/i18n` |
| `public/_locales/en/messages.json` | English strings (default locale) |
| `public/_locales/pt_BR/messages.json` | Portuguese (Brazil) strings |

---

### Task 0: Monorepo setup

**Files (repo root):**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`

- [ ] **Step 1: Initialize root package.json**

Run from `/home/gui/Documents/projetos/kura`:

```bash
pnpm init
```

Then replace `package.json` with:

```json
{
  "name": "kura",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test"
  },
  "devDependencies": {
    "turbo": "latest"
  }
}
```

- [ ] **Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

- [ ] **Step 3: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".output/**", ".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "outputs": []
    }
  }
}
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
.output/
.next/
dist/
.turbo/
*.local
```

- [ ] **Step 5: Create apps directory and install turbo**

```bash
mkdir -p apps packages
pnpm install
```

Expected: `node_modules/` created at root, `turbo` available.

- [ ] **Step 6: Init git and commit**

```bash
git init
git add .
git commit -m "chore: initialize pnpm + Turborepo monorepo"
```

---

### Task 1: Project scaffolding

**Files:**
- Create: `wxt.config.ts` (modified after init)
- Create: `tailwind.config.ts`
- Create: `assets/global.css`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`

- [ ] **Step 1: Scaffold WXT project inside apps/extension**

```bash
mkdir -p /home/gui/Documents/projetos/kura/apps/extension
cd /home/gui/Documents/projetos/kura/apps/extension
npx wxt@latest init . --template react-ts
```

Expected: WXT project created inside `apps/extension/` with `entrypoints/`, `public/`, `wxt.config.ts`, `package.json`. Answer any prompts with defaults.

- [ ] **Step 2: Install additional dependencies**

```bash
pnpm add idb @wxt-dev/i18n
pnpm add -D tailwindcss postcss autoprefixer vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom fake-indexeddb
npx tailwindcss init -p --ts
```

- [ ] **Step 3: Configure Tailwind**

Replace the generated `tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss'

export default {
  content: [
    './entrypoints/**/*.{tsx,ts,html}',
    './components/**/*.{tsx,ts}',
  ],
  theme: { extend: {} },
  plugins: [],
} satisfies Config
```

- [ ] **Step 4: Create global CSS**

Create `assets/global.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ── Carbon Glassmorphism Theme ── */
@layer base {
  body {
    background: linear-gradient(135deg, #0a0a0a 0%, #111111 50%, #0d0d0d 100%);
    min-height: 100vh;
    color: #f1f5f9;
  }
}

@layer components {
  /* Surfaces */
  .glass-panel {
    @apply bg-white/[0.04] border border-white/[0.07] backdrop-blur-xl;
  }
  .glass-card {
    @apply bg-white/[0.04] border border-white/[0.08] backdrop-blur-md rounded-xl;
  }

  /* Inputs */
  .glass-input {
    @apply w-full bg-white/[0.06] border border-white/[0.10] rounded-lg px-3 py-2
           text-sm text-slate-100 placeholder:text-white/30
           focus:outline-none focus:border-white/25 focus:ring-1 focus:ring-white/[0.15]
           backdrop-blur-sm;
  }
  .glass-textarea {
    @apply glass-input resize-none;
  }

  /* Buttons */
  .glass-btn {
    @apply bg-white/[0.12] border border-white/[0.18] rounded-lg text-white
           font-medium text-sm hover:bg-white/[0.18] transition-colors backdrop-blur-sm;
  }
  .glass-btn-ghost {
    @apply text-white/50 hover:bg-white/[0.06] rounded-lg transition-colors text-sm px-3 py-1.5;
  }

  /* Tags */
  .glass-tag {
    @apply bg-white/[0.10] border border-white/[0.12] text-white/70 text-xs px-2 py-0.5 rounded-full;
  }

  /* Sidebar navigation */
  .glass-nav-item {
    @apply text-left px-3 py-1.5 rounded-lg text-sm text-white/55
           hover:bg-white/[0.07] transition-colors w-full border border-transparent;
  }
  .glass-nav-item-active {
    @apply glass-nav-item bg-white/[0.10] border-white/[0.10] text-white;
  }
  .glass-section-label {
    @apply text-xs text-white/30 uppercase tracking-wider px-1 my-1;
  }
}
```

- [ ] **Step 5: Configure Vitest**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
})
```

Create `tests/setup.ts`:
```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Update wxt.config.ts**

```ts
import { defineConfig } from 'wxt'

export default defineConfig({
  modules: ['@wxt-dev/module-react', '@wxt-dev/i18n/module'],
  manifest: {
    name: '__MSG_ext_name__',
    description: '__MSG_ext_description__',
    default_locale: 'en',
    permissions: ['contextMenus', 'storage', 'tabs'],
    action: {},
  },
})
```

- [ ] **Step 7: Verify dev build runs**

```bash
npm run dev
```

Expected: WXT dev server starts, browser opens with extension loaded, no errors in terminal.

- [ ] **Step 8: Commit**

```bash
cd /home/gui/Documents/projetos/kura
git add apps/extension/
git commit -m "feat: scaffold WXT + React + Tailwind extension in apps/extension"
```

---

### Task 2: Shared types

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Write types**

Create `lib/types.ts`:
```ts
export interface KuraLink {
  id: string
  url: string
  title: string
  comment?: string
  tags: string[]
  favicon?: string
  savedAt: number     // Unix ms timestamp
  readAt?: number     // undefined = unread; timestamp = read
}

export type FilterState =
  | { type: 'all' }
  | { type: 'unread' }
  | { type: 'tag'; tag: string }
```

- [ ] **Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add KuraLink type and FilterState"
```

---

### Task 3: DB layer

**Files:**
- Create: `lib/db.ts`
- Create: `tests/lib/db.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/db.test.ts`:
```ts
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import {
  addLink, getAllLinks, getRecent, updateLink, deleteLink,
  searchLinks, getAllTags, getTagCounts, getLinkByUrl,
} from '../../lib/db'

// Each test file gets a fresh in-memory DB from fake-indexeddb/auto

describe('addLink', () => {
  it('returns link with generated id and savedAt', async () => {
    const link = await addLink({ url: 'https://example.com', title: 'Example', tags: [] })
    expect(link.id).toBeTruthy()
    expect(link.url).toBe('https://example.com')
    expect(link.savedAt).toBeTypeOf('number')
  })
})

describe('getAllLinks', () => {
  it('returns links ordered by savedAt descending', async () => {
    await addLink({ url: 'https://a.com', title: 'A', tags: [] })
    await addLink({ url: 'https://b.com', title: 'B', tags: [] })
    const links = await getAllLinks()
    expect(links.length).toBeGreaterThanOrEqual(2)
    expect(links[0].savedAt).toBeGreaterThanOrEqual(links[1].savedAt)
  })
})

describe('getRecent', () => {
  it('returns at most N links', async () => {
    const links = await getRecent(2)
    expect(links.length).toBeLessThanOrEqual(2)
  })
})

describe('updateLink', () => {
  it('updates a field on an existing link', async () => {
    const link = await addLink({ url: 'https://update.com', title: 'Old', tags: [] })
    await updateLink(link.id, { title: 'New' })
    const all = await getAllLinks()
    expect(all.find(l => l.id === link.id)?.title).toBe('New')
  })
})

describe('deleteLink', () => {
  it('removes a link by id', async () => {
    const link = await addLink({ url: 'https://delete.com', title: 'Del', tags: [] })
    await deleteLink(link.id)
    const all = await getAllLinks()
    expect(all.find(l => l.id === link.id)).toBeUndefined()
  })
})

describe('searchLinks', () => {
  it('finds links matching title', async () => {
    await addLink({ url: 'https://search-t.com', title: 'React Testing', tags: [] })
    const results = await searchLinks('react')
    expect(results.some(l => l.title === 'React Testing')).toBe(true)
  })

  it('finds links matching tag', async () => {
    await addLink({ url: 'https://search-g.com', title: 'Tagged', tags: ['vitest'] })
    const results = await searchLinks('vitest')
    expect(results.some(l => l.url === 'https://search-g.com')).toBe(true)
  })

  it('finds links matching comment', async () => {
    await addLink({ url: 'https://search-c.com', title: 'X', tags: [], comment: 'great read' })
    const results = await searchLinks('great')
    expect(results.some(l => l.url === 'https://search-c.com')).toBe(true)
  })
})

describe('getAllTags', () => {
  it('returns unique sorted tags across all links', async () => {
    await addLink({ url: 'https://tags1.com', title: 'T1', tags: ['b', 'a'] })
    await addLink({ url: 'https://tags2.com', title: 'T2', tags: ['a', 'c'] })
    const tags = await getAllTags()
    expect(tags).toContain('a')
    expect(tags).toContain('b')
    expect(tags).toContain('c')
    expect(tags).toEqual([...tags].sort())
  })
})

describe('getTagCounts', () => {
  it('counts tags across all links', async () => {
    await addLink({ url: 'https://tc1.com', title: 'TC1', tags: ['x'] })
    await addLink({ url: 'https://tc2.com', title: 'TC2', tags: ['x', 'y'] })
    const counts = await getTagCounts()
    expect(counts['x']).toBeGreaterThanOrEqual(2)
    expect(counts['y']).toBeGreaterThanOrEqual(1)
  })
})

describe('getLinkByUrl', () => {
  it('finds existing link by URL', async () => {
    await addLink({ url: 'https://byurl.com', title: 'ByUrl', tags: [] })
    const found = await getLinkByUrl('https://byurl.com')
    expect(found?.title).toBe('ByUrl')
  })

  it('returns undefined for unknown URL', async () => {
    const found = await getLinkByUrl('https://notexist-xyz.com')
    expect(found).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run tests/lib/db.test.ts
```

Expected: FAIL with "Cannot find module '../../lib/db'"

- [ ] **Step 3: Implement lib/db.ts**

Create `lib/db.ts`:
```ts
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { KuraLink } from './types'

interface KuraDB extends DBSchema {
  links: {
    key: string
    value: KuraLink
    indexes: {
      'by-savedAt': number
      'by-tags': string
      'by-readAt': number
    }
  }
}

let _db: Promise<IDBPDatabase<KuraDB>> | null = null

function getDB(): Promise<IDBPDatabase<KuraDB>> {
  if (!_db) {
    _db = openDB<KuraDB>('kura', 1, {
      upgrade(db) {
        const store = db.createObjectStore('links', { keyPath: 'id' })
        store.createIndex('by-savedAt', 'savedAt')
        store.createIndex('by-tags', 'tags', { multiEntry: true })
        store.createIndex('by-readAt', 'readAt')
      },
    })
  }
  return _db
}

export async function addLink(
  data: Omit<KuraLink, 'id' | 'savedAt'>
): Promise<KuraLink> {
  const db = await getDB()
  const link: KuraLink = { ...data, id: crypto.randomUUID(), savedAt: Date.now() }
  await db.add('links', link)
  return link
}

export async function getAllLinks(): Promise<KuraLink[]> {
  const db = await getDB()
  const links = await db.getAllFromIndex('links', 'by-savedAt')
  return links.sort((a, b) => b.savedAt - a.savedAt)
}

export async function getRecent(limit: number): Promise<KuraLink[]> {
  return (await getAllLinks()).slice(0, limit)
}

export async function updateLink(
  id: string,
  data: Partial<Omit<KuraLink, 'id' | 'savedAt'>>
): Promise<void> {
  const db = await getDB()
  const existing = await db.get('links', id)
  if (!existing) return
  await db.put('links', { ...existing, ...data })
}

export async function deleteLink(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('links', id)
}

export async function searchLinks(query: string): Promise<KuraLink[]> {
  const q = query.toLowerCase()
  return (await getAllLinks()).filter(
    l =>
      l.title.toLowerCase().includes(q) ||
      l.url.toLowerCase().includes(q) ||
      (l.comment?.toLowerCase().includes(q) ?? false) ||
      l.tags.some(t => t.includes(q))
  )
}

export async function getAllTags(): Promise<string[]> {
  const links = await getAllLinks()
  return Array.from(new Set(links.flatMap(l => l.tags))).sort()
}

export async function getTagCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}
  for (const link of await getAllLinks()) {
    for (const tag of link.tags) {
      counts[tag] = (counts[tag] ?? 0) + 1
    }
  }
  return counts
}

export async function getLinkByUrl(url: string): Promise<KuraLink | undefined> {
  return (await getAllLinks()).find(l => l.url === url)
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run tests/lib/db.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/db.ts tests/lib/db.test.ts
git commit -m "feat: add IndexedDB CRUD layer with search and tag counts"
```

---

### Task 4: Utility libraries — tags and fetch-title

**Files:**
- Create: `lib/tags.ts`
- Create: `lib/fetch-title.ts`
- Create: `tests/lib/tags.test.ts`
- Create: `tests/lib/fetch-title.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/tags.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { parseTags } from '../../lib/tags'

describe('parseTags', () => {
  it('splits by comma, trims, and lowercases', () => {
    expect(parseTags('Tech, Design, REACT')).toEqual(['tech', 'design', 'react'])
  })

  it('replaces spaces within a tag with hyphens', () => {
    expect(parseTags('para ler')).toEqual(['para-ler'])
  })

  it('filters empty entries from extra commas', () => {
    expect(parseTags(',,')).toEqual([])
  })

  it('returns empty array for empty string', () => {
    expect(parseTags('')).toEqual([])
  })
})
```

Create `tests/lib/fetch-title.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { domainFromUrl } from '../../lib/fetch-title'

describe('domainFromUrl', () => {
  it('extracts hostname and strips www', () => {
    expect(domainFromUrl('https://www.example.com/path?q=1')).toBe('example.com')
  })

  it('returns the input for an invalid URL', () => {
    expect(domainFromUrl('not-a-url')).toBe('not-a-url')
  })

  it('handles URL without www', () => {
    expect(domainFromUrl('https://github.com/user/repo')).toBe('github.com')
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run tests/lib/tags.test.ts tests/lib/fetch-title.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Implement lib/tags.ts**

Create `lib/tags.ts`:
```ts
export function parseTags(input: string): string[] {
  return input
    .split(',')
    .map(t => t.trim().toLowerCase().replace(/\s+/g, '-'))
    .filter(Boolean)
}
```

- [ ] **Step 4: Implement lib/fetch-title.ts**

Create `lib/fetch-title.ts`:
```ts
export function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export async function fetchTitle(url: string): Promise<string> {
  try {
    const res = await fetch(url)
    const html = await res.text()
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (match?.[1]) return match[1].trim()
  } catch {
    // network error or CORS — fall through to domain
  }
  return domainFromUrl(url)
}
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
npx vitest run tests/lib/tags.test.ts tests/lib/fetch-title.test.ts
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/tags.ts lib/fetch-title.ts tests/lib/tags.test.ts tests/lib/fetch-title.test.ts
git commit -m "feat: add parseTags and fetchTitle utilities"
```

---

### Task 4b: i18n Setup

**Files:**
- Create: `public/_locales/en/messages.json`
- Create: `public/_locales/pt_BR/messages.json`
- Create: `lib/i18n.ts`

- [ ] **Step 1: Create English messages**

Create `public/_locales/en/messages.json`:
```json
{
  "ext_name": { "message": "Kura" },
  "ext_description": { "message": "Save links with comments and tags" },
  "tab_save": { "message": "Save" },
  "tab_recent": { "message": "Recent" },
  "save_success": { "message": "✓ Link saved successfully!" },
  "no_url_hint": { "message": "Right-click any link and select \"Save to Kura\"" },
  "already_saved": { "message": "This link was already saved." },
  "label_url": { "message": "URL" },
  "label_title": { "message": "Title" },
  "label_comment": { "message": "Comment" },
  "label_tags": { "message": "Tags" },
  "placeholder_title": { "message": "Page title" },
  "placeholder_comment": { "message": "Add a comment..." },
  "placeholder_tags": { "message": "tech, design, to-read" },
  "btn_save": { "message": "Save to Kura" },
  "btn_saving": { "message": "Saving..." },
  "search_placeholder": { "message": "🔍 Quick search..." },
  "no_results": { "message": "No results." },
  "no_links": { "message": "No links saved yet." },
  "no_links_found": { "message": "No links found." },
  "view_all": { "message": "View all links →" },
  "filter_all": { "message": "📋 All" },
  "filter_unread": { "message": "📖 Unread" },
  "section_filters": { "message": "Filters" },
  "section_tags": { "message": "Tags" },
  "section_data": { "message": "Data" },
  "export_json": { "message": "📤 Export JSON" },
  "export_csv": { "message": "📤 Export CSV" },
  "import": { "message": "📥 Import" },
  "search_all": { "message": "🔍 Search by title, tag, comment..." },
  "btn_add_link": { "message": "+ Add link" },
  "btn_cancel": { "message": "Cancel" },
  "btn_save_edit": { "message": "Save" },
  "confirm_delete": { "message": "Remove this link?" },
  "share_title": { "message": "Share" },
  "share_whatsapp": { "message": "WhatsApp" },
  "share_twitter": { "message": "Twitter/X" },
  "share_copy": { "message": "Copy link" },
  "modal_add_title": { "message": "Add link" },
  "placeholder_url": { "message": "https://..." },
  "placeholder_comment_optional": { "message": "Comment (optional)" },
  "error_already_saved": { "message": "This link was already saved." },
  "error_invalid_url": { "message": "Invalid URL." },
  "mark_read": { "message": "Mark as read" },
  "mark_unread": { "message": "Mark as unread" }
}
```

- [ ] **Step 2: Create Portuguese messages**

Create `public/_locales/pt_BR/messages.json`:
```json
{
  "ext_name": { "message": "Kura" },
  "ext_description": { "message": "Salve links com comentários e tags" },
  "tab_save": { "message": "Salvar" },
  "tab_recent": { "message": "Recentes" },
  "save_success": { "message": "✓ Link salvo com sucesso!" },
  "no_url_hint": { "message": "Clique com botão direito em um link e selecione \"Salvar no Kura\"" },
  "already_saved": { "message": "Este link já foi salvo anteriormente." },
  "label_url": { "message": "URL" },
  "label_title": { "message": "Título" },
  "label_comment": { "message": "Comentário" },
  "label_tags": { "message": "Tags" },
  "placeholder_title": { "message": "Título da página" },
  "placeholder_comment": { "message": "Adicione um comentário..." },
  "placeholder_tags": { "message": "tech, design, para-ler" },
  "btn_save": { "message": "Salvar no Kura" },
  "btn_saving": { "message": "Salvando..." },
  "search_placeholder": { "message": "🔍 Busca rápida..." },
  "no_results": { "message": "Nenhum resultado." },
  "no_links": { "message": "Nenhum link salvo ainda." },
  "no_links_found": { "message": "Nenhum link encontrado." },
  "view_all": { "message": "Ver todos os links →" },
  "filter_all": { "message": "📋 Todos" },
  "filter_unread": { "message": "📖 Não lidos" },
  "section_filters": { "message": "Filtros" },
  "section_tags": { "message": "Tags" },
  "section_data": { "message": "Dados" },
  "export_json": { "message": "📤 Exportar JSON" },
  "export_csv": { "message": "📤 Exportar CSV" },
  "import": { "message": "📥 Importar" },
  "search_all": { "message": "🔍 Buscar por título, tag, comentário..." },
  "btn_add_link": { "message": "+ Adicionar link" },
  "btn_cancel": { "message": "Cancelar" },
  "btn_save_edit": { "message": "Salvar" },
  "confirm_delete": { "message": "Remover este link?" },
  "share_title": { "message": "Compartilhar" },
  "share_whatsapp": { "message": "WhatsApp" },
  "share_twitter": { "message": "Twitter/X" },
  "share_copy": { "message": "Copiar link" },
  "modal_add_title": { "message": "Adicionar link" },
  "placeholder_url": { "message": "https://..." },
  "placeholder_comment_optional": { "message": "Comentário (opcional)" },
  "error_already_saved": { "message": "Este link já foi salvo." },
  "error_invalid_url": { "message": "URL inválida." },
  "mark_read": { "message": "Marcar como lido" },
  "mark_unread": { "message": "Marcar como não lido" }
}
```

- [ ] **Step 3: Create lib/i18n.ts**

Create `lib/i18n.ts`:
```ts
import { createI18n } from '@wxt-dev/i18n'

export const { useI18n } = createI18n<
  typeof import('../public/_locales/en/messages.json')
>()
```

- [ ] **Step 4: Verify build picks up locales**

```bash
pnpm --filter extension build
```

Expected: `.output/chrome-mv3/_locales/en/messages.json` and `.output/chrome-mv3/_locales/pt_BR/messages.json` exist.

- [ ] **Step 5: Commit**

```bash
git add public/_locales/ lib/i18n.ts wxt.config.ts
git commit -m "feat: add i18n with English (default) and pt-BR support"
```

---

### Task 5: Import / Export

**Files:**
- Create: `lib/import-export.ts`
- Create: `tests/lib/import-export.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/import-export.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import type { KuraLink } from '../../lib/types'
import { exportToJson, exportToCsv, parseJsonImport, parseHtmlImport } from '../../lib/import-export'

const sampleLinks: KuraLink[] = [
  { id: '1', url: 'https://example.com', title: 'Example', tags: ['tech'], comment: 'A comment', savedAt: 1700000000000 },
  { id: '2', url: 'https://other.com', title: 'Other', tags: [], savedAt: 1700000001000 },
]

describe('exportToJson', () => {
  it('returns parseable JSON with all links', () => {
    const json = exportToJson(sampleLinks)
    const parsed = JSON.parse(json)
    expect(parsed).toHaveLength(2)
    expect(parsed[0].url).toBe('https://example.com')
  })
})

describe('exportToCsv', () => {
  it('includes header and one row per link', () => {
    const csv = exportToCsv(sampleLinks)
    const lines = csv.split('\n')
    expect(lines[0]).toBe('title,url,tags,comment,savedAt')
    expect(lines).toHaveLength(3) // header + 2 links
  })

  it('wraps fields containing commas in double quotes', () => {
    const links: KuraLink[] = [{ id: '3', url: 'https://c.com', title: 'A, B', tags: [], savedAt: 0 }]
    expect(exportToCsv(links)).toContain('"A, B"')
  })
})

describe('parseJsonImport', () => {
  it('parses a valid JSON array of links', () => {
    const result = parseJsonImport(JSON.stringify(sampleLinks))
    expect(result).toHaveLength(2)
  })

  it('filters out entries missing required fields', () => {
    const result = parseJsonImport(JSON.stringify([{ notALink: true }, sampleLinks[0]]))
    expect(result).toHaveLength(1)
  })

  it('throws when JSON is not an array', () => {
    expect(() => parseJsonImport('{"key":"val"}')).toThrow('Expected a JSON array')
  })
})

describe('parseHtmlImport', () => {
  it('parses links from NETSCAPE bookmark HTML', () => {
    const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<DL>
  <DT><A HREF="https://mozilla.org">Mozilla</A>
  <DT><A HREF="https://github.com">GitHub</A>
</DL>`
    const result = parseHtmlImport(html)
    expect(result).toHaveLength(2)
    expect(result[0].url).toBe('https://mozilla.org')
    expect(result[0].title).toBe('Mozilla')
  })

  it('ignores non-http links', () => {
    const html = `<DL><DT><A HREF="javascript:void(0)">JS</A></DL>`
    expect(parseHtmlImport(html)).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run tests/lib/import-export.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement lib/import-export.ts**

Create `lib/import-export.ts`:
```ts
import type { KuraLink } from './types'

function csvEscape(val: unknown): string {
  const s = String(val ?? '')
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s
}

function isKuraLink(obj: unknown): obj is KuraLink {
  return (
    typeof obj === 'object' && obj !== null &&
    typeof (obj as KuraLink).url === 'string' &&
    typeof (obj as KuraLink).title === 'string' &&
    typeof (obj as KuraLink).savedAt === 'number'
  )
}

export function exportToJson(links: KuraLink[]): string {
  return JSON.stringify(links, null, 2)
}

export function exportToCsv(links: KuraLink[]): string {
  const header = 'title,url,tags,comment,savedAt'
  const rows = links.map(l =>
    [l.title, l.url, l.tags.join(';'), l.comment ?? '', l.savedAt].map(csvEscape).join(',')
  )
  return [header, ...rows].join('\n')
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  URL.revokeObjectURL(url)
}

export function exportJsonFile(links: KuraLink[]): void {
  const date = new Date().toISOString().split('T')[0]
  downloadFile(exportToJson(links), `kura-export-${date}.json`, 'application/json')
}

export function exportCsvFile(links: KuraLink[]): void {
  const date = new Date().toISOString().split('T')[0]
  downloadFile(exportToCsv(links), `kura-export-${date}.csv`, 'text/csv')
}

export function parseJsonImport(text: string): KuraLink[] {
  const data: unknown = JSON.parse(text)
  if (!Array.isArray(data)) throw new Error('Expected a JSON array')
  return data.filter(isKuraLink)
}

export function parseHtmlImport(html: string): Omit<KuraLink, 'id' | 'savedAt'>[] {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return Array.from(doc.querySelectorAll('a'))
    .filter(a => a.href.startsWith('http'))
    .map(a => ({
      url: a.href,
      title: a.textContent?.trim() || a.href,
      tags: [],
      comment: undefined,
      favicon: undefined,
      readAt: undefined,
    }))
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run tests/lib/import-export.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/import-export.ts tests/lib/import-export.test.ts
git commit -m "feat: add import/export for JSON, CSV, and bookmark HTML"
```

---

### Task 6: Background service worker

**Files:**
- Create: `entrypoints/background.ts`

- [ ] **Step 1: Implement background.ts**

Create `entrypoints/background.ts`:
```ts
export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({
      id: 'save-to-kura',
      title: 'Salvar no Kura',
      contexts: ['link'],
    })
  })

  browser.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId === 'save-to-kura' && info.linkUrl) {
      browser.storage.session.set({ pendingUrl: info.linkUrl })
    }
  })
})
```

- [ ] **Step 2: Build and verify**

```bash
npm run build
```

Check `.output/chrome-mv3/background.js` exists. Load the extension in Chrome (`chrome://extensions` → Developer mode → Load unpacked → select `.output/chrome-mv3`). Right-click any link — "Salvar no Kura" should appear in the context menu.

- [ ] **Step 3: Commit**

```bash
git add entrypoints/background.ts
git commit -m "feat: register context menu and store pendingUrl in session storage"
```

---

### Task 7: ShareSheet component

**Files:**
- Create: `components/ShareSheet.tsx`

- [ ] **Step 1: Implement ShareSheet**

Create `components/ShareSheet.tsx`:
```tsx
import type { KuraLink } from '../lib/types'
import { useI18n } from '../lib/i18n'

interface Props {
  link: KuraLink
  onClose: () => void
}

export function ShareSheet({ link, onClose }: Props) {
  const t = useI18n()
  const text = [link.title, link.url, link.comment].filter(Boolean).join('\n')

  function shareWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`)
    onClose()
  }

  function shareTwitter() {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(link.title)}&url=${encodeURIComponent(link.url)}`
    )
    onClose()
  }

  async function copyLink() {
    await navigator.clipboard.writeText(link.url)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-end justify-center z-50"
      onClick={onClose}
    >
      <div
        className="glass-panel rounded-t-2xl w-full p-4 flex flex-col gap-3"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-semibold text-sm text-slate-100">{t('share_title')}</h3>
        <p className="text-xs text-white/40 truncate">{link.title}</p>
        <div className="flex gap-2">
          <button
            className="flex-1 bg-green-600/80 hover:bg-green-600 text-white rounded-lg py-2 text-sm font-medium transition-colors border border-green-500/30"
            onClick={shareWhatsApp}
          >
            {t('share_whatsapp')}
          </button>
          <button
            className="flex-1 bg-sky-600/80 hover:bg-sky-600 text-white rounded-lg py-2 text-sm font-medium transition-colors border border-sky-500/30"
            onClick={shareTwitter}
          >
            {t('share_twitter')}
          </button>
          <button
            className="flex-1 glass-btn py-2"
            onClick={copyLink}
          >
            {t('share_copy')}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ShareSheet.tsx
git commit -m "feat: add ShareSheet component (WhatsApp, Twitter, copy link)"
```

---

### Task 8: Popup — App shell

**Files:**
- Create: `entrypoints/popup/index.html`
- Create: `entrypoints/popup/main.tsx`
- Create: `entrypoints/popup/App.tsx`

- [ ] **Step 1: Create popup entry files**

Create `entrypoints/popup/index.html`:
```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Kura</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

Create `entrypoints/popup/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import '../../assets/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 2: Implement App.tsx**

Create `entrypoints/popup/App.tsx`:
```tsx
import { useState, useEffect } from 'react'
import { SaveTab } from './SaveTab'
import { RecentTab } from './RecentTab'
import { useI18n } from '../../lib/i18n'

type Tab = 'save' | 'recent'

export function App() {
  const t = useI18n()
  const [activeTab, setActiveTab] = useState<Tab>('recent')
  const [pendingUrl, setPendingUrl] = useState('')
  const [savedToast, setSavedToast] = useState(false)

  useEffect(() => {
    browser.storage.session.get('pendingUrl').then((result) => {
      const url = result.pendingUrl as string | undefined
      if (url) {
        setActiveTab('save')
        setPendingUrl(url)
        browser.storage.session.remove('pendingUrl')
      }
    })
  }, [])

  function handleSaved() {
    setSavedToast(true)
    setTimeout(() => {
      setSavedToast(false)
      setActiveTab('recent')
    }, 1500)
  }

  const tabClass = (tab: Tab) =>
    `px-3 py-1 transition-colors ${
      activeTab === tab ? 'bg-white/[0.15] text-white' : 'text-white/40 hover:text-white'
    }`

  return (
    <div className="w-[380px] h-[480px] flex flex-col">
      <div className="glass-panel px-3 py-2 flex items-center gap-2 flex-shrink-0">
        <span className="text-slate-100 font-bold text-base">⚡ Kura</span>
        <div className="ml-auto flex rounded overflow-hidden border border-white/[0.12] text-xs">
          <button className={tabClass('save')} onClick={() => setActiveTab('save')}>
            {t('tab_save')}
          </button>
          <button className={tabClass('recent')} onClick={() => setActiveTab('recent')}>
            {t('tab_recent')}
          </button>
        </div>
      </div>

      {savedToast && (
        <div className="bg-white/[0.12] border-b border-white/[0.08] text-white/80 text-xs text-center py-1.5 flex-shrink-0">
          {t('save_success')}
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {activeTab === 'save'
          ? <SaveTab initialUrl={pendingUrl} onSaved={handleSaved} />
          : <RecentTab />}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Delete the default popup files WXT generated**

WXT generates a default popup. Remove it to avoid conflicts:

```bash
rm -f entrypoints/popup.html
```

- [ ] **Step 4: Build and verify popup renders**

```bash
npm run build
```

Reload extension in Chrome. Click the extension icon — popup should open showing the "Recentes" tab with the dark header.

- [ ] **Step 5: Commit**

```bash
git add entrypoints/popup/
git commit -m "feat: add popup shell with tab navigation and pendingUrl detection"
```

---

### Task 9: Popup — SaveTab

**Files:**
- Create: `entrypoints/popup/SaveTab.tsx`

- [ ] **Step 1: Implement SaveTab.tsx**

Create `entrypoints/popup/SaveTab.tsx`:
```tsx
import { useState, useEffect } from 'react'
import { addLink, getAllTags, getLinkByUrl } from '../../lib/db'
import { fetchTitle } from '../../lib/fetch-title'
import { parseTags } from '../../lib/tags'
import { useI18n } from '../../lib/i18n'

interface Props {
  initialUrl: string
  onSaved: () => void
}

export function SaveTab({ initialUrl, onSaved }: Props) {
  const t = useI18n()
  const [url] = useState(initialUrl)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [alreadySaved, setAlreadySaved] = useState(false)
  const [existingTags, setExistingTags] = useState<string[]>([])

  useEffect(() => {
    if (!initialUrl) return
    fetchTitle(initialUrl).then(setTitle)
    getLinkByUrl(initialUrl).then(existing => setAlreadySaved(!!existing))
    getAllTags().then(setExistingTags)
  }, [initialUrl])

  async function handleSave() {
    if (!url || !title || loading) return
    setLoading(true)
    try {
      await addLink({
        url,
        title,
        comment: comment.trim() || undefined,
        tags: parseTags(tagsInput),
        favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`,
      })
      onSaved()
    } finally {
      setLoading(false)
    }
  }

  if (!url) {
    return (
      <div className="flex items-center justify-center h-full p-6 text-center text-sm text-white/40">
        {t('no_url_hint')}
      </div>
    )
  }

  return (
    <div className="p-3 flex flex-col gap-3 overflow-y-auto h-full">
      {alreadySaved && (
        <div className="text-xs bg-white/[0.08] text-white/60 border border-white/[0.12] rounded px-2 py-1.5">
          {t('already_saved')}
        </div>
      )}

      <div>
        <label className="text-xs text-white/50 mb-1 block">{t('label_url')}</label>
        <div className="glass-input py-1.5 text-xs text-white/40 truncate">{url}</div>
      </div>

      <div>
        <label className="text-xs text-white/50 mb-1 block">{t('label_title')}</label>
        <input
          className="glass-input"
          placeholder={t('placeholder_title')}
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs text-white/50 mb-1 block">{t('label_comment')}</label>
        <textarea
          className="glass-textarea"
          rows={3}
          placeholder={t('placeholder_comment')}
          value={comment}
          onChange={e => setComment(e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs text-white/50 mb-1 block">{t('label_tags')}</label>
        <input
          className="glass-input"
          placeholder={t('placeholder_tags')}
          value={tagsInput}
          onChange={e => setTagsInput(e.target.value)}
          list="kura-tags-datalist"
        />
        <datalist id="kura-tags-datalist">
          {existingTags.map(tag => <option key={tag} value={tag} />)}
        </datalist>
      </div>

      <button
        className="glass-btn w-full py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleSave}
        disabled={loading || !url || !title}
      >
        {loading ? t('btn_saving') : t('btn_save')}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Test manually**

Right-click a link → "Salvar no Kura" → click extension icon. Popup opens on Salvar tab with URL pre-filled and title loading. Fill in comment and tags, click Salvar — toast appears and tab switches to Recentes.

- [ ] **Step 3: Commit**

```bash
git add entrypoints/popup/SaveTab.tsx
git commit -m "feat: add SaveTab with auto title fetch, tag autocomplete, and duplicate warning"
```

---

### Task 10: Popup — RecentTab

**Files:**
- Create: `entrypoints/popup/RecentTab.tsx`

- [ ] **Step 1: Implement RecentTab.tsx**

Create `entrypoints/popup/RecentTab.tsx`:
```tsx
import { useState, useEffect, useCallback } from 'react'
import { getRecent, searchLinks } from '../../lib/db'
import type { KuraLink } from '../../lib/types'
import { ShareSheet } from '../../components/ShareSheet'
import { useI18n } from '../../lib/i18n'

function timeAgo(ms: number): string {
  const diff = Date.now() - ms
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export function RecentTab() {
  const t = useI18n()
  const [links, setLinks] = useState<KuraLink[]>([])
  const [query, setQuery] = useState('')
  const [shareLink, setShareLink] = useState<KuraLink | null>(null)

  const load = useCallback(async () => {
    setLinks(query ? await searchLinks(query) : await getRecent(10))
  }, [query])

  useEffect(() => { load() }, [load])

  function openOptions() {
    browser.tabs.create({ url: browser.runtime.getURL('/options.html') })
    window.close()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 flex-shrink-0">
        <input
          className="glass-input"
          placeholder={t('search_placeholder')}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-3 flex flex-col gap-2 pb-2">
        {links.length === 0 && (
          <p className="text-xs text-white/40 text-center mt-10">
            {query ? t('no_results') : t('no_links')}
          </p>
        )}
        {links.map(link => (
          <div
            key={link.id}
            className="glass-card p-2.5 hover:bg-white/[0.07] transition-colors"
          >
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-sm text-slate-100 hover:text-white line-clamp-1 block"
            >
              {link.title}
            </a>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-xs text-white/40">
                {new URL(link.url).hostname.replace('www.', '')}
              </span>
              {link.tags.slice(0, 2).map(tag => (
                <span key={tag} className="glass-tag">
                  {tag}
                </span>
              ))}
              <span className="text-xs text-white/25 ml-auto">{timeAgo(link.savedAt)}</span>
              <button
                className="text-white/30 hover:text-white/70 text-xs transition-colors"
                onClick={() => setShareLink(link)}
              >
                📤
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/[0.07] p-3 flex-shrink-0">
        <button
          className="w-full text-sm text-white/60 hover:text-white font-medium transition-colors"
          onClick={openOptions}
        >
          {t('view_all')}
        </button>
      </div>

      {shareLink && (
        <ShareSheet link={shareLink} onClose={() => setShareLink(null)} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Test manually**

Save 3+ links via context menu. Open popup → Recentes — links appear. Type to search — list filters. Click "Ver todos" — options page opens.

- [ ] **Step 3: Commit**

```bash
git add entrypoints/popup/RecentTab.tsx
git commit -m "feat: add RecentTab with live search and share sheet"
```

---

### Task 11: Options page — App + Sidebar

**Files:**
- Create: `entrypoints/options/index.html`
- Create: `entrypoints/options/main.tsx`
- Create: `entrypoints/options/App.tsx`
- Create: `entrypoints/options/Sidebar.tsx`

- [ ] **Step 1: Create options entry files**

Create `entrypoints/options/index.html`:
```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Kura — Minha lista</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

Create `entrypoints/options/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import '../../assets/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 2: Implement Sidebar.tsx**

Create `entrypoints/options/Sidebar.tsx`:
```tsx
import { useEffect, useState, useRef } from 'react'
import { getAllLinks, getTagCounts, addLink } from '../../lib/db'
import { exportJsonFile, exportCsvFile, parseJsonImport, parseHtmlImport } from '../../lib/import-export'
import type { KuraLink, FilterState } from '../../lib/types'
import { useI18n } from '../../lib/i18n'

interface Props {
  filter: FilterState
  onFilterChange: (f: FilterState) => void
  onDataChange: () => void
}

export function Sidebar({ filter, onFilterChange, onDataChange }: Props) {
  const t = useI18n()
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({})
  const [totalCount, setTotalCount] = useState(0)
  const importRef = useRef<HTMLInputElement>(null)

  async function refresh() {
    setTagCounts(await getTagCounts())
    setTotalCount((await getAllLinks()).length)
  }

  useEffect(() => { refresh() }, [filter])

  async function handleExportJson() {
    exportJsonFile(await getAllLinks())
  }

  async function handleExportCsv() {
    exportCsvFile(await getAllLinks())
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const toImport: Omit<KuraLink, 'id' | 'savedAt'>[] =
      file.name.endsWith('.json') ? parseJsonImport(text) : parseHtmlImport(text)
    for (const link of toImport) {
      await addLink(link)
    }
    e.target.value = ''
    onDataChange()
    refresh()
  }

  const isActive = (active: boolean) =>
    active ? 'glass-nav-item-active' : 'glass-nav-item'

  return (
    <div className="w-48 flex-shrink-0 border-r border-white/[0.07] h-full flex flex-col glass-panel">
      <div className="p-4 border-b border-white/[0.07]">
        <span className="text-slate-100 font-bold text-lg">⚡ Kura</span>
      </div>

      <nav className="p-3 flex flex-col gap-1 flex-1 overflow-y-auto">
        <p className="glass-section-label mb-2">{t('section_filters')}</p>
        <button className={isActive(filter.type === 'all')} onClick={() => onFilterChange({ type: 'all' })}>
          {t('filter_all')} ({totalCount})
        </button>
        <button className={isActive(filter.type === 'unread')} onClick={() => onFilterChange({ type: 'unread' })}>
          {t('filter_unread')}
        </button>

        {Object.keys(tagCounts).length > 0 && (
          <>
            <p className="glass-section-label mt-4 mb-2">{t('section_tags')}</p>
            {Object.entries(tagCounts)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([tag, count]) => (
                <button
                  key={tag}
                  className={isActive(filter.type === 'tag' && filter.tag === tag)}
                  onClick={() => onFilterChange({ type: 'tag', tag })}
                >
                  🏷 {tag} ({count})
                </button>
              ))}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-white/[0.07] flex flex-col gap-1">
        <p className="glass-section-label mb-1">{t('section_data')}</p>
        <button className="glass-nav-item" onClick={handleExportJson}>{t('export_json')}</button>
        <button className="glass-nav-item" onClick={handleExportCsv}>{t('export_csv')}</button>
        <button className="glass-nav-item" onClick={() => importRef.current?.click()}>{t('import')}</button>
        <input
          ref={importRef}
          type="file"
          accept=".json,.html,.htm"
          className="hidden"
          onChange={handleImport}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Implement App.tsx**

Create `entrypoints/options/App.tsx`:
```tsx
import { useState, useCallback } from 'react'
import { Sidebar } from './Sidebar'
import { LinkList } from './LinkList'
import type { FilterState } from '../../lib/types'
import { useI18n } from '../../lib/i18n'

export function App() {
  const t = useI18n()
  const [filter, setFilter] = useState<FilterState>({ type: 'all' })
  const [search, setSearch] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [showAdd, setShowAdd] = useState(false)

  const handleDataChange = useCallback(() => setRefreshKey(k => k + 1), [])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar filter={filter} onFilterChange={setFilter} onDataChange={handleDataChange} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="glass-panel border-b border-white/[0.07] px-4 py-3 flex gap-3 items-center flex-shrink-0">
          <input
            className="glass-input py-1.5 flex-1"
            placeholder={t('search_all')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            className="glass-btn px-3 py-1.5 flex-shrink-0"
            onClick={() => setShowAdd(true)}
          >
            {t('btn_add_link')}
          </button>
        </div>
        <LinkList
          key={refreshKey}
          filter={filter}
          search={search}
          onDataChange={handleDataChange}
          showAddModal={showAdd}
          onCloseAddModal={() => setShowAdd(false)}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add entrypoints/options/
git commit -m "feat: add options page shell with sidebar, filters, tag counts, and import/export"
```

---

### Task 12: Options page — LinkList + AddLinkModal

**Files:**
- Create: `entrypoints/options/AddLinkModal.tsx`
- Create: `entrypoints/options/LinkList.tsx`

- [ ] **Step 1: Implement AddLinkModal.tsx**

Create `entrypoints/options/AddLinkModal.tsx`:
```tsx
import { useState } from 'react'
import { addLink, getLinkByUrl } from '../../lib/db'
import { fetchTitle } from '../../lib/fetch-title'
import { parseTags } from '../../lib/tags'
import { useI18n } from '../../lib/i18n'

interface Props {
  onClose: () => void
  onSaved: () => void
}

export function AddLinkModal({ onClose, onSaved }: Props) {
  const t = useI18n()
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleUrlBlur() {
    if (!url) return
    const existing = await getLinkByUrl(url)
    if (existing) { setError(t('error_already_saved')); return }
    setError('')
    if (!title) fetchTitle(url).then(setTitle)
  }

  async function handleSave() {
    if (!url || !title || loading) return
    setLoading(true)
    try {
      await addLink({
        url,
        title,
        comment: comment.trim() || undefined,
        tags: parseTags(tagsInput),
        favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`,
      })
      onSaved()
      onClose()
    } catch {
      setError(t('error_invalid_url'))
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="glass-panel rounded-xl w-full max-w-md p-5 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-semibold text-slate-100">{t('modal_add_title')}</h2>

        {error && (
          <p className="text-xs text-red-400 bg-white/[0.08] rounded px-2 py-1.5">{error}</p>
        )}

        <input
          className="glass-input"
          placeholder={t('placeholder_url')}
          value={url}
          onChange={e => { setUrl(e.target.value); setError('') }}
          onBlur={handleUrlBlur}
        />
        <input
          className="glass-input"
          placeholder={t('label_title')}
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <textarea
          className="glass-textarea"
          rows={3}
          placeholder={t('placeholder_comment_optional')}
          value={comment}
          onChange={e => setComment(e.target.value)}
        />
        <input
          className="glass-input"
          placeholder={t('placeholder_tags')}
          value={tagsInput}
          onChange={e => setTagsInput(e.target.value)}
        />

        <div className="flex gap-3 justify-end">
          <button
            className="glass-btn-ghost px-4 py-2"
            onClick={onClose}
          >
            {t('btn_cancel')}
          </button>
          <button
            className="glass-btn px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={loading || !url || !title}
          >
            {loading ? t('btn_saving') : t('btn_save_edit')}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Implement LinkList.tsx**

Create `entrypoints/options/LinkList.tsx`:
```tsx
import { useState, useEffect, useCallback } from 'react'
import { getAllLinks, searchLinks, updateLink, deleteLink } from '../../lib/db'
import { parseTags } from '../../lib/tags'
import type { KuraLink, FilterState } from '../../lib/types'
import { ShareSheet } from '../../components/ShareSheet'
import { AddLinkModal } from './AddLinkModal'
import { useI18n } from '../../lib/i18n'

interface Props {
  filter: FilterState
  search: string
  onDataChange: () => void
  showAddModal: boolean
  onCloseAddModal: () => void
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m atrás`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h atrás`
  return `${Math.floor(hours / 24)}d atrás`
}

export function LinkList({ filter, search, onDataChange, showAddModal, onCloseAddModal }: Props) {
  const t = useI18n()
  const [links, setLinks] = useState<KuraLink[]>([])
  const [shareLink, setShareLink] = useState<KuraLink | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editComment, setEditComment] = useState('')
  const [editTags, setEditTags] = useState('')

  const load = useCallback(async () => {
    let result = search ? await searchLinks(search) : await getAllLinks()
    if (filter.type === 'unread') result = result.filter(l => l.readAt === undefined)
    if (filter.type === 'tag') result = result.filter(l => l.tags.includes(filter.tag))
    setLinks(result)
  }, [filter, search])

  useEffect(() => { load() }, [load])

  function startEdit(link: KuraLink) {
    setEditingId(link.id)
    setEditTitle(link.title)
    setEditComment(link.comment ?? '')
    setEditTags(link.tags.join(', '))
  }

  async function saveEdit(id: string) {
    await updateLink(id, {
      title: editTitle,
      comment: editComment.trim() || undefined,
      tags: parseTags(editTags),
    })
    setEditingId(null)
    load()
    onDataChange()
  }

  async function handleDelete(id: string) {
    if (!confirm(t('confirm_delete'))) return
    await deleteLink(id)
    load()
    onDataChange()
  }

  async function toggleRead(link: KuraLink) {
    await updateLink(link.id, { readAt: link.readAt ? undefined : Date.now() })
    load()
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {links.length === 0 && (
        <p className="text-sm text-white/40 text-center mt-16">{t('no_links_found')}</p>
      )}

      <div className="flex flex-col gap-3 max-w-3xl mx-auto">
        {links.map(link => (
          <div
            key={link.id}
            className={`glass-card p-4 transition-colors ${link.readAt ? 'opacity-60' : ''}`}
          >
            {editingId === link.id ? (
              <div className="flex flex-col gap-2">
                <input
                  className="glass-input"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                />
                <textarea
                  className="glass-textarea"
                  rows={2}
                  placeholder={t('placeholder_comment')}
                  value={editComment}
                  onChange={e => setEditComment(e.target.value)}
                />
                <input
                  className="glass-input"
                  placeholder={t('placeholder_tags')}
                  value={editTags}
                  onChange={e => setEditTags(e.target.value)}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    className="glass-btn-ghost px-3 py-1"
                    onClick={() => setEditingId(null)}
                  >
                    {t('btn_cancel')}
                  </button>
                  <button
                    className="glass-btn px-3 py-1"
                    onClick={() => saveEdit(link.id)}
                  >
                    {t('btn_save_edit')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                {link.favicon && (
                  <img
                    src={link.favicon}
                    alt=""
                    className="w-5 h-5 rounded mt-0.5 flex-shrink-0"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-slate-100 hover:text-white/80 line-clamp-1 block"
                    onClick={() => updateLink(link.id, { readAt: Date.now() }).then(load)}
                  >
                    {link.title}
                  </a>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-white/40">
                      {new URL(link.url).hostname.replace('www.', '')}
                    </span>
                    {link.tags.map(t => (
                      <span key={t} className="glass-tag">
                        {t}
                      </span>
                    ))}
                    <span className="text-xs text-white/25">{timeAgo(link.savedAt)}</span>
                  </div>
                  {link.comment && (
                    <p className="text-sm text-white/50 mt-1.5 italic">"{link.comment}"</p>
                  )}
                </div>
                <div className="flex gap-2 items-start flex-shrink-0 text-white/30 text-sm">
                  <button className="hover:text-white/70 transition-colors" onClick={() => setShareLink(link)} title="Compartilhar">📤</button>
                  <button className="hover:text-white/70 transition-colors" onClick={() => startEdit(link)} title="Editar">✏️</button>
                  <button className="hover:text-white/70 transition-colors" onClick={() => toggleRead(link)} title={link.readAt ? t('mark_unread') : t('mark_read')}>
                    {link.readAt ? '📕' : '📗'}
                  </button>
                  <button className="hover:text-red-400 transition-colors" onClick={() => handleDelete(link.id)} title="Excluir">🗑</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {shareLink && <ShareSheet link={shareLink} onClose={() => setShareLink(null)} />}
      {showAddModal && (
        <AddLinkModal onClose={onCloseAddModal} onSaved={() => { load(); onDataChange() }} />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Build and run full test suite**

```bash
npm run build
npx vitest run
```

Expected: Build succeeds. All tests PASS.

- [ ] **Step 4: Manual end-to-end verification**

Load `.output/chrome-mv3` in Chrome. Verify:
- [ ] Right-click link → "Salvar no Kura" → popup opens on Salvar tab with URL filled
- [ ] Save a link → toast appears → switches to Recentes
- [ ] Recentes tab shows link; search filters in real time
- [ ] "Ver todos" opens options page
- [ ] Sidebar tags appear with correct counts
- [ ] Sidebar filter by tag works
- [ ] "Não lidos" filter works; clicking a link marks it read
- [ ] Edit link inline works
- [ ] Delete link works (confirm dialog)
- [ ] Share button opens share sheet; WhatsApp/Twitter open correct URLs
- [ ] "+ Adicionar link" modal works with auto-title fetch
- [ ] Export JSON downloads file; re-import works (duplicates skipped)
- [ ] Export CSV downloads file

- [ ] **Step 5: Build Firefox version**

```bash
npm run build -- --browser firefox
```

Expected: Build succeeds in `.output/firefox-mv2`. Load in Firefox via `about:debugging` → Load Temporary Add-on → select `manifest.json`.

- [ ] **Step 6: Final commit**

```bash
git add entrypoints/options/LinkList.tsx entrypoints/options/AddLinkModal.tsx
git commit -m "feat: add full link manager with edit, delete, filter by tag/status, and add modal"
```

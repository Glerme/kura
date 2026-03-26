# Kura — Project Rules

## Project Overview

Monorepo (pnpm workspaces + Turborepo) for the Kura product suite.

- **Phase 1 (current):** Browser extension — Chrome + Firefox, offline-first, IndexedDB
- **Phase 2:** Landing page — Next.js + Tailwind, Vercel
- **Phase 3:** Backend + auth + sync — Next.js API Routes, PostgreSQL, Prisma, Auth.js

## Monorepo Structure

```
kura/
├── apps/
│   ├── extension/          # WXT browser extension (Phase 1)
│   └── landing/            # Next.js landing page (Phase 2)
├── packages/               # Shared types + utils (Phase 3+ — ex: types compartilhados entre extension e web)
├── docs/
│   └── superpowers/
│       ├── specs/
│       └── plans/
├── AGENTS.md
├── package.json            # Root — workspaces + turbo scripts
├── pnpm-workspace.yaml
└── turbo.json
```

## Extension Stack (`apps/extension/`)

- **Framework:** WXT (browser extension framework)
- **UI:** React 18 + TypeScript
- **Styling:** Tailwind CSS v3
- **Storage:** IndexedDB via `idb`
- **Testing:** Vitest + fake-indexeddb + @testing-library/react
- **Build targets:** Chrome MV3, Firefox MV2

## Extension Structure (`apps/extension/`)

```
apps/extension/
├── entrypoints/
│   ├── background.ts       # Context menu + session storage
│   ├── popup/              # Popup UI (tabs: Salvar / Recentes)
│   └── options/            # Full manager (sidebar + list)
├── components/             # Shared React components
├── lib/                    # Pure business logic (no browser APIs)
│   ├── types.ts
│   ├── db.ts
│   ├── fetch-title.ts
│   ├── tags.ts
│   └── import-export.ts
├── assets/
│   └── global.css
├── tests/
│   └── lib/
└── public/
    └── icons/
```

## Coding Rules

- **TypeScript strict mode** — no `any`, no implicit types
- **No inline styles** — use Tailwind classes only
- **lib/ is pure** — files in `lib/` must not import browser APIs (`browser.*`). Only entrypoints and components may use them.
- **No backend calls** — MVP is offline-first; all data lives in IndexedDB
- **Prefer small, focused files** — one clear responsibility per file
- **No unused exports** — if it's not used, remove it
- **No `console.log` in production code** — use structured error handling

## Commands

### Root (runs all apps via Turborepo)
- `pnpm dev` — start all apps in dev mode
- `pnpm build` — build all apps
- `pnpm test` — run all tests

### Extension only (`apps/extension/`)
- `pnpm --filter extension dev` — start extension dev mode (Chrome)
- `pnpm --filter extension build` — build Chrome + Firefox
- `pnpm --filter extension build -- --browser firefox` — build Firefox only
- `pnpm --filter extension test` — run extension tests

### Landing page only (`apps/landing/`)
- `pnpm --filter landing dev` — start Next.js dev server
- `pnpm --filter landing build` — production build

## Testing Rules

- Write tests for all `lib/` modules (db, tags, fetch-title, import-export)
- Use `fake-indexeddb/auto` for IndexedDB tests
- Tests live in `tests/lib/` mirroring `lib/`
- Run tests before committing: `pnpm --filter extension test`

## Git Rules

- Commit after each completed task
- Commit messages follow: `feat:`, `fix:`, `refactor:`, `test:`, `chore:`
- Never commit `.output/`, `.turbo/`, `.next/`, or `node_modules/`

## Data Model

```ts
interface KuraLink {
  id: string        // crypto.randomUUID()
  url: string
  title: string
  comment?: string
  tags: string[]    // lowercase, hyphenated (ex: "para-ler")
  favicon?: string
  savedAt: number   // Unix ms
  readAt?: number   // undefined = unread
}
```

## i18n (Internationalization)

- **Module:** `@wxt-dev/i18n` (wrapper type-safe sobre a API nativa de i18n do Chrome/Firefox)
- **Idiomas:** `en` (English), `pt_BR` (Português do Brasil)
- **Idioma padrão:** `en` (English) — detecta idioma do navegador e muda automaticamente
- **Arquivos de tradução:** `apps/extension/public/_locales/{locale}/messages.json`
- **Uso em componentes:** `const t = useI18n()` → `t('key')`
- Todas as strings visíveis ao usuário devem usar o sistema de i18n — nunca hardcode strings na UI

## Out of Scope (MVP)

- Backend / authentication / sync
- Side Panel
- Clipboard watcher
- Mobile / desktop app

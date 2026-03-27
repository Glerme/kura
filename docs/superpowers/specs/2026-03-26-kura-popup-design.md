# Kura Extension — Popup & Context Menu Design

**Date:** 2026-03-26
**Status:** Approved

---

## Overview

Implement the full UI for the Kura Chrome extension: popup com duas abas (Links + Salvar) e context menu com toast não-bloqueante. A lib layer (`db.ts`, `fetch-title.ts`, `tags.ts`, `types.ts`, `i18n.ts`) já está completa — este spec cobre apenas a camada de UI e integração.

---

## Visual Style

**Black Glassmorphism + Dark Mode**

- Fundo da página: `#080808`
- Blobs de luz branca difusa no fundo (`filter: blur(80px)`, opacidade 0.05–0.08) — necessários para o efeito de vidro aparecer
- Painéis: `backdrop-filter: blur(32px) saturate(180%)`, `background: rgba(255,255,255,0.06)`, `border: 1px solid rgba(255,255,255,0.13)`
- Reflexo no topo dos painéis: `inset 0 1px 0 rgba(255,255,255,0.12)` + `::before` com gradiente branco
- Inputs: `background: rgba(255,255,255,0.055)`, `border: 1px solid rgba(255,255,255,0.09)`, `box-shadow: inset 0 1px 2px rgba(0,0,0,0.3)`
- Sem cor de destaque colorida — tudo em tons de branco/cinza sobre preto

---

## Popup (`entrypoints/popup/App.tsx`)

### Comportamento geral

- Sempre abre na **aba Links**
- Largura: 300px (padrão WXT)

### Aba Links

**Estrutura:**

1. Barra de busca (texto livre — filtra título, tags, comentário)
2. Chips de filtro: `todos` | `não lidos` | uma chip por tag existente
3. Lista de links

**Item de link (collapsed):**

- Favicon via `https://www.google.com/s2/favicons?domain=<domínio>&sz=32` — não editável. Fallback: placeholder com inicial do domínio
- Título (clicável — abre URL em nova aba)
- Domínio
- Tags como chips
- Ponto branco se `readAt` for undefined (não lido)
- Botão chevron ▾ para expandir

**Item de link (expanded):**

- Comentário em itálico (se houver)
- Botões: `↗ Abrir` (nova aba) · `✓ Lido` (seta `readAt = Date.now()`) · `✕ Deletar` (vermelho no hover, remove via `deleteLink()`)
- Chevron rotaciona 180° quando expandido

**Estado vazio:** mensagem "Nenhum link salvo ainda." com instrução para usar o ícone ou menu de contexto.

### Aba Salvar

**Campos (em ordem):**

1. **URL** — pré-preenchida com a URL da aba ativa (`chrome.tabs.query`), editável, fonte monospace
2. **Título** — pré-preenchido com `tab.title` de `chrome.tabs.query` (evita CORS), editável. `fetchTitle(url)` fica como fallback se `tab.title` estiver vazio
3. **Comentário** — `<textarea>` redimensionável
4. **Tags** — input de texto, formato `tag1, tag2, tag3` (parseado por `parseTags()`)

**Botão:** "Salvar esta página"

**Fluxo de duplicata:**

- Antes de salvar, chama `getLinkByUrl(url)`
- Se existir: mostra aviso inline "Este link já foi salvo." + botões `Atualizar` / `Cancelar`
- `Atualizar` chama `updateLink(id, { title, comment, tags })` — mantém `id` e `savedAt`
- Se não existir: chama `addLink({ url, title, comment, tags, favicon })`

---

## Context Menu

### Background (`entrypoints/background.ts`)

- Registra item de menu de contexto: `"Salvar no Kura"` em `contexts: ['page', 'link']`
- Ao clicar:
  1. Obtém URL e título da aba ativa (ou do link clicado)
  2. Verifica duplicata via `getLinkByUrl(url)` — se existir, **não** salva de novo, envia mensagem ao content script com `{ type: 'ALREADY_SAVED', link }`
  3. Se não existir: chama `addLink({ url, title, tags: [], favicon })` e envia `{ type: 'LINK_SAVED', link }` ao content script

### Content Script (`entrypoints/content.ts`)

- Matches: `<all_urls>` (atualizar de `*://*.google.com/*` para `<all_urls>` no `content.ts`)
- Escuta mensagens do background
- Injeta toast via **Shadow DOM** (para isolar CSS da página hospedeira)

### Toast

**Estado 1 — Collapsed (ao receber `LINK_SAVED`):**

- Ícone ◆ + "Link salvo!" + URL truncada
- Barra de progresso que esvazia em 6s
- Botões: `Não, obrigado` (fecha) · `Adicionar →` (expande)

**Estado 2 — Expanded (ao clicar "Adicionar →"):**

- Timer pausa
- Aparece input de Tags + textarea de Comentário
- Botões: `Pular` (fecha sem salvar tags/comentário) · `Confirmar` (chama `updateLink()` com tags/comentário e fecha)

**Ao receber `ALREADY_SAVED`:**

- Toast diferente: "Já salvo!" + botões `Ver` (abre popup) · `Atualizar` (expande campos para editar)

**Posição:** canto superior direito, `position: fixed`, `z-index: 2147483647`
**Animação:** slide-in da direita ao aparecer, fade-out ao fechar

---

## Arquivos a criar/modificar

| Arquivo                     | Ação                                         |
| --------------------------- | -------------------------------------------- |
| `entrypoints/popup/App.tsx` | Reescrever — implementar popup com duas abas |
| `entrypoints/background.ts` | Implementar context menu + mensagens         |
| `entrypoints/content.ts`    | Implementar toast via Shadow DOM             |
| `entrypoints/popup/App.css` | Estilos glassmorphism do popup               |

---

## Fora do escopo

- Exportar/importar links
- Sincronização entre dispositivos
- Editar favicon
- Ordenação manual da lista

## 7. Página completa (Options Page)

### Sidebar (esquerda, 180px)

- Logo Kura
- Filtros fixos: Todos, Não lidos, Favoritos
- Lista de tags com contagem (ex: `tech (6)`)
- Ações: Importar, Exportar

### Lista principal (direita, flex)

- Barra superior: busca full-text + botão **"+ Adicionar link"**
- Ordenação: mais recentes primeiro
- Cada item exibe:
  - Favicon + título (clicável, abre URL)
  - Domínio + tags coloridas + data relativa
  - Comentário (se houver)
  - Ações: compartilhar, editar, excluir

---

## 8. Import / Export

| Ação   | Formato | Detalhes                                                                                          |
| ------ | ------- | ------------------------------------------------------------------------------------------------- |
| Export | JSON    | `kura-export-YYYY-MM-DD.json` — array de `KuraLink`                                               |
| Export | CSV     | Campos: título, url, tags, comentário, savedAt                                                    |
| Import | JSON    | Valida schema; ignora duplicatas por URL                                                          |
| Import | HTML    | Parse de bookmarks no formato `NETSCAPE-Bookmark-file-1` (exportação padrão de todos os browsers) |

---

## 9. Fora do escopo (MVP)

- Backend / autenticação / sync entre dispositivos
- App mobile ou desktop
- Sistema de recomendação
- Compartilhamento direto com outros usuários do Kura (requer backend)
- Pastas (substituídas por tags no MVP)
- Side Panel (Chrome-only, post-MVP)
- Clipboard watcher automático (post-MVP, após validar adoção do context menu)

---

## 11. Roadmap pós-MVP

### Fase 2 — Landing page

Site público de apresentação da extensão Kura, com objetivo de converter visitantes em instalações.

**Stack sugerida:** Next.js (App Router) + Tailwind CSS — hospedagem na Vercel.

**Seções mínimas:**

- Hero com headline + CTA "Instalar no Chrome / Firefox"
- Demo visual (GIF ou vídeo curto do fluxo: context menu → popup → lista)
- Features principais (salvar, comentar, tags, compartilhar)
- FAQ
- Rodapé com links para Chrome Web Store e Firefox Add-ons

**Observações:**

- Repositório separado (`kura-web`) ou monorepo com `apps/landing`
- Deploy automático via Vercel a cada push na `main`

---

### Fase 3 — Backend + autenticação + sync

Sistema web para gerenciar os links salvos com conta, acessível de qualquer dispositivo. A extensão passa a sincronizar com o backend em vez de usar apenas o IndexedDB local.

**Stack sugerida:** Next.js (App Router) com API Routes + PostgreSQL + Prisma + Auth.js (autenticação social: Google, GitHub).

**Funcionalidades:**

- Cadastro/login (Google, GitHub, email+senha)
- Dashboard web: mesma UX da Options Page da extensão, mas no browser
- Sync automático: extensão envia links para a API ao salvar; puxa alterações ao abrir
- Compartilhamento real entre usuários: enviar coleção/link para outro usuário por username
- Coleções públicas: lista de links com URL pública compartilhável

**Impacto na extensão (quando chegar nessa fase):**

- Adicionar tela de login no popup (ou redirect para a web)
- `lib/db.ts` precisa de uma camada de abstração (`StorageAdapter`) que alterne entre IndexedDB (offline) e API (online) — o schema `KuraLink` já está preparado para isso
- Manter modo offline como fallback quando sem conexão

---

## 10. Estrutura de arquivos (WXT)

```
kura/
├── entrypoints/
│   ├── background.ts        # Service worker: context menu + mensagens
│   ├── content.ts           # Clipboard watcher (post-MVP, placeholder)
│   ├── popup/
│   │   ├── index.html
│   │   ├── App.tsx          # Popup root com abas
│   │   ├── SaveTab.tsx      # Aba Salvar
│   │   └── RecentTab.tsx    # Aba Recentes
│   └── options/
│       ├── index.html
│       ├── App.tsx          # Options page root
│       ├── Sidebar.tsx
│       ├── LinkList.tsx
│       └── ShareSheet.tsx
├── lib/
│   ├── db.ts                # IndexedDB (idb) — CRUD de links
│   ├── import-export.ts     # Import/export JSON, CSV, HTML
│   └── fetch-title.ts       # Fetch automático do <title>
├── public/
│   └── icons/               # Ícones da extensão (16, 32, 48, 128px)
└── wxt.config.ts
```

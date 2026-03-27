# Kura Extension — Design Spec (MVP)

**Data:** 2026-03-26
**Status:** Aprovado

---

## 1. Visão Geral

Extensão Chrome (MV3) para salvar links com comentários, tags e compartilhamento social. Offline-first via IndexedDB, sem backend no MVP. A lib layer (`db.ts`, `fetch-title.ts`, `tags.ts`, `types.ts`, `i18n.ts`) já está completa — este spec cobre a camada de UI e integração.

---

## 2. Visual Style — Black Glassmorphism

- Fundo: `#080808`
- Blobs de luz branca difusa no fundo (`filter: blur(80px)`, opacidade 0.05–0.08) — necessários para o blur aparecer
- Painéis: `backdrop-filter: blur(32px) saturate(180%)`, `background: rgba(255,255,255,0.06)`, `border: 1px solid rgba(255,255,255,0.13)`
- Reflexo no topo: `inset 0 1px 0 rgba(255,255,255,0.12)` + `::before` com gradiente branco
- Inputs: `background: rgba(255,255,255,0.055)`, `border: 1px solid rgba(255,255,255,0.09)`, `box-shadow: inset 0 1px 2px rgba(0,0,0,0.3)`
- Sem cor de destaque colorida — tudo em tons de branco/cinza sobre preto

**Referências:**
- https://medium.com/design-bootcamp/glassmorphism-the-most-beautiful-trap-in-modern-ui-design-a472818a7c0a
- https://onepagelove.com/tag/glassmorphism

---

## 3. Popup (`entrypoints/popup/`)

### Comportamento geral

- Sempre abre na **aba Links**
- Largura: 300px

### Aba Links

1. Barra de busca (filtra título, tags, comentário em tempo real)
2. Chips de filtro: `todos` | `não lidos` | uma chip por tag existente
3. Lista de links

**Item collapsed:**
- Favicon via `https://www.google.com/s2/favicons?domain=<domínio>&sz=32` — não editável. Fallback: inicial do domínio
- Título (clicável → abre URL em nova aba)
- Domínio
- Tags como chips
- Ponto branco se `readAt` for `undefined` (não lido)
- Botão chevron ▾ para expandir

**Item expanded:**
- Comentário em itálico (se houver)
- Botões: `↗ Abrir` (nova aba) · `✓ Lido` (`readAt = Date.now()`) · `✕ Deletar` (vermelho no hover, `deleteLink()`)
- Chevron rotaciona 180°

**Estado vazio:** mensagem orientando a usar o ícone ou menu de contexto.

**Rodapé:** botão `Ver todos os links →` abre a Options Page em nova aba.

### Aba Salvar

**Campos (em ordem):**
1. **URL** — editável, pré-preenchida via `chrome.tabs.query`, fonte monospace
2. **Título** — editável, pré-preenchido com `tab.title`; fallback `fetchTitle(url)` se vazio
3. **Comentário** — `<textarea>` redimensionável
4. **Tags** — input texto, formato `tag1, tag2`, parseado por `parseTags()`

**Botão:** "Salvar esta página"

**Fluxo de duplicata:**
- Antes de salvar: `getLinkByUrl(url)`
- Se existir: aviso inline "Este link já foi salvo." + botões `Atualizar` / `Cancelar`
- `Atualizar`: `updateLink(id, { title, comment, tags })` — mantém `id` e `savedAt`
- Se não existir: `addLink({ url, title, comment, tags, favicon })`

---

## 4. Context Menu + Toast

### Background (`entrypoints/background.ts`)

- Registra `"Salvar no Kura"` em `contexts: ['page', 'link']`
- Ao clicar:
  1. Obtém URL e título da aba ativa (ou do link clicado)
  2. Verifica duplicata via `getLinkByUrl(url)`
  3. Se existir: envia `{ type: 'ALREADY_SAVED', link }` ao content script — não salva de novo
  4. Se não existir: `addLink(...)` → envia `{ type: 'LINK_SAVED', link }` ao content script

### Content Script (`entrypoints/content.ts`)

- Matches: `<all_urls>`
- Escuta mensagens do background
- Injeta toast via **Shadow DOM** (isola CSS da página hospedeira)

### Toast

**Estado 1 — Collapsed (`LINK_SAVED`):**
- Ícone ◆ + "Link salvo!" + URL truncada
- Barra de progresso que esvazia em 6s → fecha automaticamente
- Botões: `Não, obrigado` (fecha) · `Adicionar →` (expande)
- Posição: canto superior direito, `position: fixed`, `z-index: 2147483647`

**Estado 2 — Expanded:**
- Timer pausa ao clicar "Adicionar →"
- Input de Tags + textarea de Comentário
- Botões: `Pular` (fecha sem alterar) · `Confirmar` (`updateLink()` → fecha)

**Estado `ALREADY_SAVED`:**
- "Já salvo!" + botões `Ver` (`chrome.action.openPopup()`) · `Atualizar` (expande campos)

**Animação:** slide-in da direita ao aparecer, fade-out ao fechar.

---

## 5. Options Page (`entrypoints/options/`)

### Sidebar (esquerda, 180px)

- Logo Kura
- Filtros: Todos · Não lidos
- Lista de tags com contagem (ex: `dev (6)`)
- Ações: Importar, Exportar

### Lista principal

- Barra: busca full-text + botão `+ Adicionar link`
- Ordenação: mais recentes primeiro
- Cada item: favicon + título (clicável) + domínio + tags + data relativa + comentário (se houver)
- Ações por item: compartilhar · editar · excluir

---

## 6. Compartilhamento

Modal share sheet em qualquer item (popup ou Options Page):

- **WhatsApp:** `https://wa.me/?text={título}%0A{url}%0A{comentário}`
- **Twitter/X:** `https://twitter.com/intent/tweet?text={título}&url={url}`
- **Copiar link:** copia URL para clipboard + toast de confirmação

---

## 7. Import / Export

| Ação | Formato | Detalhes |
|---|---|---|
| Export | JSON | `kura-export-YYYY-MM-DD.json` — array de `KuraLink` |
| Export | CSV | título, url, tags, comentário, savedAt |
| Import | JSON | Valida schema; ignora duplicatas por URL silenciosamente |
| Import | HTML | Parse de bookmarks `NETSCAPE-Bookmark-file-1` (exportação padrão de todos os browsers) |

---

## 8. Estrutura de arquivos

```
apps/extension/
├── entrypoints/
│   ├── background.ts          # Context menu + mensagens para content script
│   ├── content.ts             # Toast via Shadow DOM
│   ├── popup/
│   │   ├── index.html
│   │   ├── App.tsx            # Root com abas Links / Salvar
│   │   ├── LinksTab.tsx
│   │   └── SaveTab.tsx
│   └── options/
│       ├── index.html
│       ├── App.tsx
│       ├── Sidebar.tsx
│       ├── LinkList.tsx
│       └── ShareSheet.tsx
├── lib/
│   ├── db.ts                  # já implementado
│   ├── fetch-title.ts         # já implementado
│   ├── tags.ts                # já implementado
│   ├── types.ts               # já implementado
│   ├── i18n.ts                # já implementado
│   └── import-export.ts       # a implementar
└── wxt.config.ts
```

---

## 9. Fora do escopo (MVP)

- Backend / autenticação / sync entre dispositivos
- App mobile ou desktop
- Editar favicon
- Ordenação manual da lista
- Pastas (substituídas por tags)
- Side Panel
- Firefox

---

## 10. Roadmap pós-MVP

### Fase 2 — Landing page

Site público de apresentação, objetivo de converter visitantes em instalações.

**Stack:** Next.js (App Router) + Tailwind CSS — Vercel.

**Seções:** Hero + CTA "Instalar no Chrome" · Demo visual (GIF/vídeo) · Features · FAQ · Rodapé com links para Chrome Web Store.

Repositório separado (`kura-web`) ou `apps/landing` no monorepo. Deploy automático via Vercel a cada push na `main`.

### Fase 3 — Backend + autenticação + sync

**Stack:** Next.js API Routes + PostgreSQL + Prisma + Auth.js (Google, GitHub).

**Funcionalidades:**
- Cadastro/login (Google, GitHub, email+senha)
- Dashboard web espelhando a Options Page
- Sync automático: extensão envia links ao salvar, puxa alterações ao abrir
- Compartilhamento entre usuários por username
- Coleções públicas com URL compartilhável

**Impacto na extensão:** tela de login no popup + `StorageAdapter` em `lib/db.ts` alternando entre IndexedDB (offline) e API (online) — schema `KuraLink` já preparado.

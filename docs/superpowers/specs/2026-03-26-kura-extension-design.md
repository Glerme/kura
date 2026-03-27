# Kura — Extensão de navegador (MVP)

**Data:** 2026-03-26
**Escopo:** Extensão para Chrome e Firefox — salvar links com comentários, tags, e compartilhamento social. Offline-first, sem backend no MVP.

---

## 1. Visão geral

Kura é uma extensão de navegador que permite salvar links de qualquer página com um comentário e tags, organizar numa lista de leitura e compartilhar via redes sociais. O MVP é 100% offline (dados no IndexedDB do browser), com estrutura de dados pensada para migrar para backend futuramente.

---

## 2. Stack tecnológica

| Camada                | Tecnologia                   |
| --------------------- | ---------------------------- |
| Framework de extensão | [WXT](https://wxt.dev/)      |
| UI                    | React + TypeScript           |
| Build                 | Vite                         |
| Persistência          | IndexedDB via `idb`          |
| Estilo                | Tailwind CSS                 |
| Compatibilidade       | Chrome (MV3) + Firefox (MV2) |

---

## 3. Componentes da extensão

| Componente     | Arquivo                     | Descrição                                   |
| -------------- | --------------------------- | ------------------------------------------- |
| Manifest       | `wxt.config.ts`             | Permissões, context menu, ícones            |
| Popup          | `entrypoints/popup/`        | Popup com abas Salvar / Recentes            |
| Options Page   | `entrypoints/options/`      | Página completa: sidebar + lista            |
| Background     | `entrypoints/background.ts` | Registra context menu, repassa URL ao popup |
| Content Script | `entrypoints/content.ts`    | Detecta link copiado no clipboard           |

**Permissões necessárias:** `contextMenus`, `storage`, `tabs`, `clipboardRead`

---

## 4. Modelo de dados

```ts
interface KuraLink {
  id: string; // uuid v4
  url: string; // URL completa
  title: string; // Auto-preenchido via fetch do <title> da página
  comment?: string; // Comentário livre do usuário
  tags: string[]; // Strings lowercase sem espaços (ex: ["tech", "para-ler"])
  favicon?: string; // URL do favicon
  savedAt: number; // Unix timestamp (ms)
  readAt?: number; // null = não lido; timestamp = marcado como lido
}
```

**IndexedDB stores:**

| Store   | Índices                                         |
| ------- | ----------------------------------------------- |
| `links` | `savedAt` (desc), `tags` (multiEntry), `readAt` |

**Regras:**

- Tags: lowercase, sem espaços, separadas por vírgula no input
- Título: fetch automático do `<title>` da página; fallback = domínio extraído da URL
- Sem pastas no MVP — tags substituem pastas
- Duplicatas: identificadas por URL; import ignora duplicatas silenciosamente

---

## 5. Fluxo principal

### 5.1 Salvar via context menu

1. Usuário clica com botão direito em qualquer link na página
2. Menu de contexto exibe **"Salvar no Kura"**
3. Background service worker captura a URL e a grava em `chrome.storage.session` (`{ pendingUrl }`)
4. Usuário clica no ícone da extensão (ou o popup abre via `chrome.action.openPopup()` se disponível)
5. Popup detecta `pendingUrl` no storage → abre na aba **Salvar** com URL pré-preenchida e limpa `pendingUrl`
6. Título é buscado automaticamente (`fetch` + parse do `<title>`)
7. Usuário edita título, adiciona comentário (opcional) e tags
8. Clica **Salvar no Kura** → link gravado no IndexedDB → toast de confirmação → popup fecha

### 5.2 Navegar a lista (popup)

1. Usuário clica no ícone da extensão na barra do browser
2. Popup abre na aba **Recentes**
3. Exibe os 10 links mais recentes com busca rápida
4. Clicando em **"Ver todos os links →"** abre a página completa em nova aba

### 5.3 Compartilhar

1. Usuário clica no botão compartilhar em qualquer link (popup ou página completa)
2. Modal share sheet abre com opções:
   - **WhatsApp:** `https://wa.me/?text={título}%0A{url}%0A{comentário}`
   - **Twitter/X:** `https://twitter.com/intent/tweet?text={título}&url={url}`
   - **Copiar link:** copia URL para o clipboard com toast de confirmação

---

## 6. Popup

### Aba Salvar

- Campo URL: read-only, exibe domínio resumido
- Campo título: editável, auto-preenchido
- Textarea comentário: opcional, placeholder "Adicione um comentário..."
- Campo tags: input com autocomplete das tags já existentes, separadas por vírgula
- Botão primário: **Salvar no Kura**
- Dimensões: ~380×480px

### Aba Recentes

- Campo de busca: filtra por título, tags e comentário em tempo real
- Lista: 10 links mais recentes, cada um com título + domínio + tags + botão compartilhar
- Rodapé: botão **Ver todos os links →**
- Dimensões: ~380×480px

**Comportamento de abertura:**

- Vindo do context menu → aba Salvar
- Clicando no ícone → aba Recentes

---

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

- Sistema de recomendação
- Compartilhamento direto com outros usuários do Kura (requer backend)
- Pastas (substituídas por tags no MVP)
- Side Panel (Chrome-only, post-MVP)
- Clipboard watcher automático (post-MVP, após validar adoção do context menu)

---

## 10. Roadmap pós-MVP

### Fase 2 — Landing page

Site público de apresentação, objetivo de converter visitantes em instalações.

**Stack:** Next.js (App Router) + Tailwind CSS — Vercel.

**Seções:** Hero + CTA "Instalar no Chrome" · Demo visual (GIF/vídeo) · Features · FAQ · Rodapé com links para Chrome Web Store.

**Seções mínimas:**

- Hero com headline + CTA "Instalar no Chrome / Firefox"
- Demo visual (GIF ou vídeo curto do fluxo: context menu → popup → lista)
- Features principais (salvar, comentar, tags, compartilhar)
- FAQ
- Rodapé com links para Chrome Web Store e Firefox Add-ons

`apps/landing` no monorepo. Deploy automático via Vercel a cada push na `main`.

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

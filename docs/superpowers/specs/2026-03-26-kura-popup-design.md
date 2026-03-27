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

| Arquivo | Ação |
|---|---|
| `entrypoints/popup/App.tsx` | Reescrever — implementar popup com duas abas |
| `entrypoints/background.ts` | Implementar context menu + mensagens |
| `entrypoints/content.ts` | Implementar toast via Shadow DOM |
| `entrypoints/popup/App.css` | Estilos glassmorphism do popup |

---

## Fora do escopo

- Exportar/importar links
- Sincronização entre dispositivos
- Editar favicon
- Ordenação manual da lista

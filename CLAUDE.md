# Kura — Contexto do Projeto

## O que é
Extensão Chrome (WXT + React + Tailwind) para salvar links com comentários e tags.

## Decisões de Design

### Visual
- **Estilo:** Glassmorphism com dark mode — tons pretos (não roxo/índigo)
- **Referências:**
  - https://medium.com/design-bootcamp/glassmorphism-the-most-beautiful-trap-in-modern-ui-design-a472818a7c0a
  - https://onepagelove.com/tag/glassmorphism
- Fundo `#080808` com blobs de luz branca difusa (`filter: blur(80px)`, opacidade 0.05–0.08) — sem eles o blur não aparece
- Painéis: `backdrop-filter: blur(32px) saturate(180%)`, `background: rgba(255,255,255,0.06)`, `border: 1px solid rgba(255,255,255,0.13)`
- Reflexo no topo do painel: `inset 0 1px 0 rgba(255,255,255,0.12)` + linha `::before` com gradiente branco
- Inputs com `box-shadow: inset 0 1px 2px rgba(0,0,0,0.3)` para profundidade
- **Menu de contexto:** "Salvar no Kura" salva silenciosamente (URL + título) via background, depois injeta um toast via content script na página atual
- **Toast:** não-bloqueante, injetado no canto superior direito da página via content script (Shadow DOM para isolar CSS)
  - **Estado 1 (collapsed):** "Link salvo!" + URL truncada + barra de progresso 6s + botões "Não, obrigado" / "Adicionar →"
  - **Estado 2 (expandido):** ao clicar "Adicionar →" o timer pausa, aparecem inputs de Tags e Comentário + botões "Pular" / "Confirmar"
  - Fechar (✕) ou "Não, obrigado" ou timeout → fecha sem modificar o link já salvo
  - "Confirmar" → atualiza o link com tags/comentário via `updateLink()`
- **Layout:** Duas abas — aba "Salvar" e aba "Links"
- **Aba padrão ao abrir o popup:** sempre abre na aba Links
- **Item de link:** favicon + título + domínio + tags
- **Clique no item:** abre URL em nova aba
- **Botão expandir (chevron):** expande o item mostrando comentário + ações (abrir, deletar, marcar como lido)
- **Favicon:** buscado automaticamente via `https://www.google.com/s2/favicons?domain=<domínio>&sz=32`, não editável pelo usuário. Fallback: placeholder genérico
- **URL duplicada:** avisa que já existe e pergunta se quer atualizar o link existente (mantém id/savedAt, atualiza título/comentário/tags)
- **Aba Salvar:** campos URL (editável, pré-preenchido com a página atual), Título, Comentário (textarea redimensionável), Tags + botão Salvar

## Estado Atual
- Lib layer completa: `db.ts`, `fetch-title.ts`, `tags.ts`, `types.ts`, `i18n.ts`
- Popup ainda é scaffold padrão do WXT (a ser implementado)
- `background.ts` e `content.ts` são stubs

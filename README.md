# Kura

> Salve links, textos e notas diretamente do browser — com tags, comentários e lista de leitura. Rápido, local e sem contas.

Kura é uma extensão para Chrome e Firefox que resolve um problema simples: você encontra algo interessante na web e quer guardar para ler depois, com contexto de por que salvou.

---

## Funcionalidades

### Salvar

- **Popup** — salva a página atual com URL, título, comentário e tags
- **Menu de contexto** — clique direito em qualquer página ou link para salvar silenciosamente
- **Seleção de texto** — selecione um trecho e clique direito para salvar como nota (sem URL)
- **Detecção de duplicata** — avisa se o link já foi salvo e oferece atualizar

### Organizar

- **Tags** — formato `tag1, tag2` com autoparse
- **Comentários** — campo livre para contexto pessoal
- **Status lido/não lido** — ponto vermelho (não lido) ou verde (lido) em cada item
- **Busca em tempo real** — filtra por título, tags e comentário
- **Filtros** — todos, não lidos, ou por tag específica

### Visualizar

- **Popup** com duas abas: Links e Salvar
- **Options Page** completa — lista paginada, sidebar com filtros e tags, busca
- **Compartilhar** — via Web Share API ou cópia para clipboard
- **Notas de texto** — salvas com ícone ✎ e abertas inline (sem abrir URL)

### Toast não-bloqueante

Ao salvar via menu de contexto, um toast aparece no canto superior direito da página:

- **Estado 1 — Collapsed:** confirmação com barra de progresso de 6s e botões "Não, obrigado" / "Adicionar →"
- **Estado 2 — Expandido:** timer pausa, aparecem inputs de Tags e Comentário para enriquecer o link antes de confirmar

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework de extensão | [WXT](https://wxt.dev/) (Chrome MV3 + Firefox MV2) |
| UI | React 19 + Tailwind CSS |
| Storage | IndexedDB via [idb](https://github.com/jakearchibald/idb) |
| Testes | Vitest + Testing Library |
| Lint / Types | ESLint + typescript-eslint + tsc |
| Monorepo | pnpm + Turborepo |
| Git hooks | Husky (pre-commit: lint + tsc · pre-push: testes) |

**Design:** Black Glassmorphism — fundo `#080808`, `backdrop-filter: blur(32px)`, painéis com `rgba(255,255,255,0.06)`, sem cor de destaque colorida.

---

## Desenvolvimento

### Pré-requisitos

- Node.js 20+
- pnpm 10+

### Setup

```bash
git clone https://github.com/Glerme/kura
cd kura
pnpm install
```

### Comandos

```bash
# Desenvolvimento (Chrome)
pnpm --filter kura-extension dev

# Desenvolvimento (Firefox)
pnpm --filter kura-extension dev:firefox

# Build (Chrome)
pnpm --filter kura-extension build

# Build (Firefox)
pnpm --filter kura-extension build:firefox

# Testes
pnpm --filter kura-extension test

# Lint
pnpm --filter kura-extension lint

# Type check
pnpm --filter kura-extension compile
```

### Carregar no browser

**Chrome:**
1. Acesse `chrome://extensions`
2. Ative o "Modo desenvolvedor"
3. "Carregar sem compactação" → selecione `.output/chrome-mv3/`

**Firefox:**
1. Acesse `about:debugging#/runtime/this-firefox`
2. "Carregar extensão temporária" → selecione `.output/firefox-mv2/manifest.json`

---

## Estrutura

```
apps/extension/
├── entrypoints/
│   ├── popup/          # Popup (App.tsx, SaveTab, LinksTab, LinkItem)
│   ├── options/        # Options Page completa (React)
│   ├── background.ts   # Context menu + mensagens entre scripts
│   └── content.ts      # Toast via Shadow DOM
├── lib/
│   ├── db.ts           # IndexedDB (addLink, getAllLinks, updateLink, ...)
│   ├── types.ts        # KuraLink, FilterState
│   ├── fetch-title.ts  # domainFromUrl, fetchTitle
│   └── tags.ts         # parseTags
└── tests/
    ├── lib/            # db, tags, fetch-title
    └── popup/          # LinkItem, LinksTab, SaveTab
```

---

## Roadmap

O projeto segue um modelo **free + Pro**:

**Free (para sempre)**
- Tudo que existe hoje: salvar, tags, comentários, busca, leitura, compartilhamento, armazenamento local ilimitado

**Kura Pro** _(futuro)_
- Cloud sync entre dispositivos
- Full-text search no conteúdo das páginas
- Import/export JSON e CSV
- Backup automático com histórico
- Coleções compartilháveis com URL pública
- Leitura offline (reader mode)
- Estatísticas de leitura

**Kura Teams** _(fase 3)_
- Workspaces compartilhados, coleções de equipe, permissões por membro

> Pocket encerrou em julho/2025 — há uma janela real para capturar usuários que ficaram sem uma alternativa simples e local-first.

---

## Testes

```bash
pnpm --filter kura-extension test run
```

49 testes cobrindo: lib layer (db, tags, fetch-title), popup (LinkItem, LinksTab, SaveTab) incluindo notas `kura://`, botões de share, dots de leitura e filtros.

---

## Licença

MIT

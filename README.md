<p align="center">
  <img src="apps/extension/assets/Kura.png" alt="Kura" width="96" />
</p>

<h1 align="center">Kura</h1>

<p align="center">
  Salve links, textos e notas diretamente do browser — com tags, comentários e lista de leitura.<br/>
  Rápido, local e sem contas.
</p>

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-0.2.13-white?style=flat-square" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-white?style=flat-square" />
  <img alt="Chrome" src="https://img.shields.io/badge/Chrome-MV3-white?style=flat-square&logo=googlechrome&logoColor=white" />
  <img alt="Firefox" src="https://img.shields.io/badge/Firefox-MV2-white?style=flat-square&logo=firefox&logoColor=white" />
</p>

---

## Screenshots

<!-- Substitua os blocos abaixo pelas imagens reais após capturar os prints -->

| Popup — Aba Links | Popup — Aba Salvar |
|:-----------------:|:------------------:|
| ![Aba Links](docs/screenshots/popup-links.png) | ![Aba Salvar](docs/screenshots/popup-save.png) |

| Toast colapsado | Toast expandido |
|:---------------:|:---------------:|
| ![Toast collapsed](docs/screenshots/toast-collapsed.png) | ![Toast expanded](docs/screenshots/toast-expanded.png) |

| Options Page | Menu de contexto |
|:------------:|:----------------:|
| ![Options](docs/screenshots/options.png) | ![Context menu](docs/screenshots/context-menu.png) |

> **Para adicionar screenshots:** salve as imagens em `docs/screenshots/` com os nomes acima.

---

## Instalação

### Chrome Web Store / Firefox AMO

> Em breve. Por ora, instale manualmente via modo desenvolvedor (veja abaixo).

### Instalação manual

**Pré-requisitos:** Node.js 20+ e pnpm 10+

```bash
git clone https://github.com/Glerme/kura
cd kura
pnpm install
pnpm --filter kura-extension build
```

**Chrome:**
1. Acesse `chrome://extensions`
2. Ative o "Modo desenvolvedor" (canto superior direito)
3. Clique em "Carregar sem compactação"
4. Selecione a pasta `apps/extension/.output/chrome-mv3/`

**Firefox:**
1. Acesse `about:debugging#/runtime/this-firefox`
2. Clique em "Carregar extensão temporária"
3. Selecione `apps/extension/.output/firefox-mv2/manifest.json`

---

## Como usar

### Salvar a página atual

Clique no ícone do Kura na barra do browser para abrir o popup. Na aba **Salvar**:

1. A URL e o título da página atual são preenchidos automaticamente
2. Adicione tags separadas por vírgula (ex: `dev, artigos, leitura`)
3. Escreva um comentário opcional para lembrar por que salvou
4. Clique em **Salvar**

### Salvar via menu de contexto

Clique com o botão direito em qualquer página ou link e selecione **"Salvar no Kura"**. O link é salvo silenciosamente e um **toast** aparece no canto superior direito:

- Clique em **"Adicionar →"** para pausar o timer e enriquecer o link com tags e comentário
- Clique em **"Não, obrigado"** ou aguarde 6 segundos para fechar sem modificar

### Navegar pelos links salvos

Abra o popup na aba **Links** ou acesse a **Options Page** (clique com o botão direito no ícone > Opções) para a visualização completa com:

- Busca em tempo real por título, tags e comentário
- Filtros: todos, não lidos, ou por tag específica
- Clique em um link para abrir em nova aba
- Clique no chevron (›) para expandir e ver comentário, marcar como lido ou deletar

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

### Setup

```bash
git clone https://github.com/Glerme/kura
cd kura
pnpm install
```

### Comandos

```bash
# Desenvolvimento com hot-reload (Chrome)
pnpm --filter kura-extension dev

# Desenvolvimento com hot-reload (Firefox)
pnpm --filter kura-extension dev:firefox

# Build (Chrome)
pnpm --filter kura-extension build

# Build (Firefox)
pnpm --filter kura-extension build:firefox

# Gerar .zip para publicação
pnpm --filter kura-extension zip
pnpm --filter kura-extension zip:firefox

# Testes
pnpm --filter kura-extension test

# Lint
pnpm --filter kura-extension lint

# Type check
pnpm --filter kura-extension compile
```

### Estrutura

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

### Testes

49 testes cobrindo a lib layer (db, tags, fetch-title) e o popup (LinkItem, LinksTab, SaveTab), incluindo notas `kura://`, botões de share, dots de leitura e filtros.

```bash
pnpm --filter kura-extension test run
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

---

## Licença

MIT

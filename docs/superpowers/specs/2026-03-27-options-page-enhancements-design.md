# Options Page — Tag Counts + Import/Export

**Data:** 2026-03-27
**Escopo:** Duas melhorias incrementais na options page existente (`entrypoints/options/`).

---

## 1. Tag counts na sidebar

### Objetivo
Mostrar a contagem de links ao lado de cada tag na sidebar (ex: `tech (6)`).

### Implementação
- `lib/db.ts` já expõe `getTagCounts(): Promise<Record<string, number>>` — reutilizar diretamente
- Em `options/App.tsx`, trocar `getAllTags()` por `getTagCounts()` no `load()`
- Guardar o resultado em estado `tagCounts: Record<string, number>`
- Derivar a lista de tags a partir das chaves de `tagCounts` (ordenadas alfabeticamente)
- Renderizar cada tag na sidebar como: `<button>tag <span class="tag-count">N</span></button>`
- CSS: `.tag-count` com `font-size: 10px; color: rgba(255,255,255,0.15)` alinhado à direita via `justify-content: space-between` no botão

### Arquivo modificado
- `apps/extension/entrypoints/options/App.tsx`
- `apps/extension/entrypoints/options/App.css`

---

## 2. Import / Export

### Objetivo
Botões na sidebar para exportar links (JSON) e importar links (JSON ou HTML bookmarks).

### 2.1 Nova lib: `lib/import-export.ts`

#### `exportJSON(links: KuraLink[]): void`
- Serializa o array como JSON indentado
- Dispara download como `kura-export-YYYY-MM-DD.json` via `Blob` + `URL.createObjectURL` + `<a>` temporário

#### `importJSON(file: File): Promise<{ imported: number; skipped: number }>`
- Lê o arquivo via `FileReader`
- Faz parse JSON e valida que é um array de objetos com pelo menos `url` e `title`
- Para cada item: checa se `getLinkByUrl(url)` retorna resultado — se sim, pula (duplicata)
- Itens novos são inseridos via `addLink()` com os campos mapeados
- Retorna contagem de importados vs ignorados

#### `importBookmarksHTML(file: File): Promise<{ imported: number; skipped: number }>`
- Lê o arquivo como texto
- Parse via `DOMParser` — extrai todos os `<a>` com `href`
- Para cada `<a>`: extrai `href` como URL, `textContent` como título, `ADD_DATE` (se presente) como `savedAt`
- Tags: extrai de pastas `<DT><H3>` pai — cada pasta vira uma tag
- Checa duplicata por URL via `getLinkByUrl()`
- Insere novos via `addLink()`
- Retorna contagem

### 2.2 UI na sidebar

#### Botões
- Dois botões no rodapé da sidebar, separados do restante por `border-top`
- "↑ Importar" e "↓ Exportar"
- Estilo: mesmo `.nav-item` mas com `font-size: 11px; color: rgba(255,255,255,0.3)`

#### Fluxo — Exportar
1. Clique no botão → chama `exportJSON(links)` com os links já carregados em memória
2. Download inicia automaticamente

#### Fluxo — Importar
1. Clique no botão → dispara `<input type="file" accept=".json,.html" hidden>`
2. Usuário seleciona arquivo
3. Se `.json` → `importJSON(file)`; se `.html`/`.htm` → `importBookmarksHTML(file)`
4. Resultado exibido em um banner temporário no topo da main area: "X links importados, Y ignorados" (some após 4s)
5. Chama `load()` para atualizar a lista

### 2.3 Tratamento de duplicatas
- Identificação por URL exata
- Duplicatas são ignoradas silenciosamente
- O resultado mostra a contagem de `skipped` para transparência

### Arquivos criados
- `apps/extension/lib/import-export.ts`

### Arquivos modificados
- `apps/extension/entrypoints/options/App.tsx`
- `apps/extension/entrypoints/options/App.css`

---

## 3. Fora do escopo
- Export CSV (pode ser adicionado depois)
- Modal de confirmação por duplicata
- Edição inline de links
- Botão "+ Adicionar link"

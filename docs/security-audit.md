# Auditoria de Segurança — Kura Extension

**Data:** 2026-03-28
**Escopo:** `apps/extension` (WXT + React + Tailwind, Chrome MV3 / Firefox MV2)
**Versão auditada:** branch `main`, commit `27e284b`

---

## Resumo executivo

A extensão Kura possui uma superfície de ataque razoavelmente contida: sem dependências de runtime pesadas, sem chaves hardcoded, sem listeners de mensagens externas, e React evita XSS automaticamente em todos os componentes de popup. Foram encontradas **3 vulnerabilidades de severidade MÉDIA** e **5 de severidade BAIXA**, além de **4 pontos informativos**. Nenhuma vulnerabilidade crítica ou de execução remota de código foi identificada.

---

## Tabela resumo

| # | Severidade | Título | Arquivo(s) |
|---|-----------|--------|------------|
| 1 | **MÉDIA** | Injeção de URL com esquema malicioso (`javascript:`, `data:`) | `LinkItem.tsx`, `options/App.tsx`, `import-export.ts`, `SaveTab.tsx` |
| 2 | **MÉDIA** | Content Security Policy não declarada explicitamente | `wxt.config.ts` |
| 3 | **MÉDIA** | SSRF via `fetchTitle()` | `lib/fetch-title.ts` |
| 4 | **BAIXA** | `innerHTML` no content script (mitigado, mas não ideal) | `entrypoints/content.ts` |
| 5 | **BAIXA** | Importação JSON sem validação de schema/tipos | `lib/import-export.ts` |
| 6 | **BAIXA** | Dados em plaintext no IndexedDB | `lib/db.ts` |
| 7 | **BAIXA** | Permissão `tabs` potencialmente excessiva | `wxt.config.ts` |
| 8 | **BAIXA** | Content script com match `<all_urls>` | `entrypoints/content.ts` |
| 9 | INFO | Permissão `storage` declarada mas não utilizada | `wxt.config.ts` |
| 10 | INFO | Favicon URL sem `encodeURIComponent` | múltiplos |
| 11 | INFO | Domínios do usuário vazados para Google via favicon API | múltiplos |
| 12 | INFO | Dependência `turbo` sem versão fixada | `package.json` (raiz) |

---

## Vulnerabilidades detalhadas

---

### #1 — Injeção de URL com esquema malicioso

**Severidade:** MÉDIA
**CWE:** CWE-79 (XSS via navegação), CWE-601 (Open Redirect)

#### Descrição

Nenhum ponto do código valida o esquema da URL antes de abrir ou salvar um link. Isso permite que uma URL como `javascript:alert(document.cookie)` ou `data:text/html,<script>...</script>` seja salva e depois executada ao clicar "Abrir".

#### Localizações

| Arquivo | Linha | Código |
|---------|-------|--------|
| `apps/extension/entrypoints/popup/LinkItem.tsx` | 21 | `browser.tabs.create({ url: link.url })` |
| `apps/extension/entrypoints/options/App.tsx` | 194, 224 | `window.open(link.url, '_blank')` |
| `apps/extension/lib/import-export.ts` | 36–43 | `addLink({ url: item.url, ... })` sem validação |
| `apps/extension/entrypoints/popup/SaveTab.tsx` | campo URL | input editável, nenhuma validação de esquema |

#### Impacto

- Chrome bloqueia `javascript:` em `browser.tabs.create`, mas `window.open` e `data:` URLs podem não ser bloqueados dependendo do contexto e versão do browser.
- Arquivos JSON importados de fontes não confiáveis podem injetar URLs maliciosas em massa.
- Um usuário poderia ser enganado a importar um export manipulado contendo URLs `data:text/html,...`.

#### Solução recomendada

Adicionar uma função auxiliar de validação e aplicá-la em todos os pontos de entrada:

```typescript
// lib/url-utils.ts
const SAFE_SCHEMES = ['http:', 'https:', 'kura:']

export function isSafeUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url)
    return SAFE_SCHEMES.includes(protocol)
  } catch {
    return false
  }
}
```

Aplicar em:

```typescript
// LinkItem.tsx — antes de browser.tabs.create
function openLink() {
  if (isNote) return
  if (!isSafeUrl(link.url)) return
  browser.tabs.create({ url: link.url })
}

// import-export.ts — no loop de importação
if (!item.url || !item.title || !isSafeUrl(item.url)) {
  skipped++
  continue
}

// SaveTab.tsx — antes de salvar
if (!isSafeUrl(url)) {
  setError('URL inválida. Use http:// ou https://')
  return
}
```

---

### #2 — Content Security Policy não declarada explicitamente

**Severidade:** MÉDIA
**CWE:** CWE-693 (Falha de mecanismo de proteção)

#### Descrição

O arquivo `wxt.config.ts` não declara `content_security_policy` no manifest. A extensão depende inteiramente do CSP padrão do Chrome MV3 (`script-src 'self'; object-src 'self'`), que é restritivo hoje, mas pode variar entre versões e browsers.

#### Localização

- `apps/extension/wxt.config.ts` — ausência de `content_security_policy`

#### Impacto

- Sem CSP explícita, uma mudança no padrão do browser pode abrir vetores de injeção sem aviso.
- Não há restrição explícita de `connect-src`, permitindo requisições a qualquer origem (relevante para o ponto #3).
- Dificulta auditorias futuras: revisores da Chrome Web Store e auditores externos não conseguem ver intenção de segurança documentada.

#### Solução recomendada

```typescript
// wxt.config.ts
export default defineConfig({
  manifest: {
    // ...
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'; connect-src 'self' https://www.google.com;",
    },
  },
})
```

> **Nota:** Para MV2 (Firefox), o campo é uma string em vez de objeto. O WXT lida com isso automaticamente.

---

### #3 — SSRF via `fetchTitle()`

**Severidade:** MÉDIA
**CWE:** CWE-918 (Server-Side Request Forgery — aqui, "Extension-Side Request Forgery")

#### Descrição

A função `fetchTitle()` em `lib/fetch-title.ts` executa um `fetch()` para qualquer URL fornecida sem validação de esquema ou hostname. No contexto de uma extensão Chrome, esse fetch tem origem privilegiada e pode ignorar restrições de CORS.

```typescript
// lib/fetch-title.ts:9-18
export async function fetchTitle(url: string): Promise<string> {
  try {
    const res = await fetch(url)   // ← qualquer URL, sem validação
    const html = await res.text()
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    return match?.[1]?.trim() || domainFromUrl(url)
  } catch {
    return domainFromUrl(url)
  }
}
```

#### Impacto

- A extensão pode ser induzida a fazer requisições para `http://192.168.1.1`, `http://localhost:8080`, `http://169.254.169.254` (metadata AWS), etc.
- A resposta não é exibida diretamente, mas a requisição em si pode causar efeitos colaterais em servidores internos (ex: acionar endpoints GET sem autenticação).
- Se `fetchTitle` for chamada com URL de um campo editável pelo usuário, o vetor se torna direto.

#### Localização

- `apps/extension/lib/fetch-title.ts:11`

#### Solução recomendada

```typescript
export async function fetchTitle(url: string): Promise<string> {
  // Bloquear esquemas não-HTTP e hosts privados
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return domainFromUrl(url)
    }
    // Bloquear IPs privados e localhost
    const privatePatterns = [/^localhost$/i, /^127\./, /^192\.168\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^::1$/]
    if (privatePatterns.some(p => p.test(parsed.hostname))) {
      return domainFromUrl(url)
    }
  } catch {
    return url
  }

  try {
    const res = await fetch(url)
    const html = await res.text()
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    return match?.[1]?.trim() || domainFromUrl(url)
  } catch {
    return domainFromUrl(url)
  }
}
```

---

### #4 — `innerHTML` no content script (mitigado, não ideal)

**Severidade:** BAIXA
**CWE:** CWE-79 (Cross-site Scripting — potencial)

#### Descrição

O content script usa `shadow.innerHTML = buildToastHTML(mode, link)` para renderizar o toast. Embora todos os valores dinâmicos passem pela função `esc()` (que escapa corretamente `&`, `<`, `>`, `"`, `'`), o uso de `innerHTML` é uma prática de risco que pode introduzir XSS se um futuro desenvolvedor esquecer de aplicar `esc()` em novos campos.

```typescript
// content.ts:23
shadow.innerHTML = buildToastHTML(mode, link)

// content.ts:65-68 (mitigação atual)
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}
```

#### Impacto

Atualmente baixo devido à `esc()`. O risco aumenta com manutenção futura: qualquer adição de novo campo dinâmico que esqueça o `esc()` cria um XSS real no content script, que roda em **todas as páginas**.

#### Solução recomendada

A solução ideal é substituir `innerHTML` por construção programática do DOM com `createElement`/`textContent`. Isso elimina a classe de vulnerabilidade independentemente de `esc()`.

Como alternativa de curto prazo (se manter `innerHTML`): documentar explicitamente no código que **todo valor dinâmico deve usar `esc()`**, e adicionar um lint rule ou teste que verifique isso.

---

### #5 — Importação JSON sem validação de schema/tipos

**Severidade:** BAIXA
**CWE:** CWE-20 (Improper Input Validation)

#### Descrição

`importJSON()` em `lib/import-export.ts` valida que o dado é um array e que cada item tem `url` e `title`, mas não valida:
- Se `url` é uma string (poderia ser um objeto)
- Se `tags` contém apenas strings (só verifica `Array.isArray`)
- Limites de tamanho de campos (título de 10MB, etc.)
- Tipos de `comment`, `favicon`, `readAt`

```typescript
// import-export.ts:36-43
await addLink({
  url: item.url,            // pode ser qualquer tipo
  title: item.title,        // pode ser qualquer tipo
  tags: Array.isArray(item.tags) ? item.tags : [],  // elementos não validados
  comment: item.comment ?? undefined,
  favicon: item.favicon ?? undefined,
  readAt: item.readAt ?? undefined,
})
```

#### Impacto

- Dados malformados podem corromper o IndexedDB.
- Tags não-string podem causar erros em runtime em qualquer lugar que chame `.join()`, `.map()`, etc.
- Strings enormes podem degradar a performance.

#### Solução recomendada

```typescript
const MAX_LEN = 2048

function sanitizeImportItem(item: unknown): Partial<KuraLink> | null {
  if (typeof item !== 'object' || item === null) return null
  const i = item as Record<string, unknown>

  const url = typeof i.url === 'string' ? i.url.trim().slice(0, MAX_LEN) : null
  const title = typeof i.title === 'string' ? i.title.trim().slice(0, 500) : null
  if (!url || !title || !isSafeUrl(url)) return null

  return {
    url,
    title,
    tags: Array.isArray(i.tags)
      ? i.tags.filter((t): t is string => typeof t === 'string').map(t => t.slice(0, 100))
      : [],
    comment: typeof i.comment === 'string' ? i.comment.slice(0, 2000) : undefined,
  }
}
```

---

### #6 — Dados em plaintext no IndexedDB

**Severidade:** BAIXA
**CWE:** CWE-312 (Cleartext Storage of Sensitive Information)

#### Descrição

Todos os dados salvos pelo Kura (URLs, títulos, comentários, tags) são armazenados sem criptografia no IndexedDB do browser. Qualquer extensão com permissão de acesso ao storage de outra extensão, ou qualquer acesso físico ao dispositivo com o perfil do Chrome desbloqueado, pode ler esses dados.

#### Localização

- `apps/extension/lib/db.ts` — toda a camada de persistência

#### Impacto

- Histórico de links e comentários pessoais acessível em caso de comprometimento do browser ou do sistema.
- Exports JSON também expõem tudo em plaintext.

#### Solução recomendada

Para uma extensão de bookmarks pessoal, esse nível de proteção é **aceitável** para a maioria dos modelos de ameaça. Criptografia client-side (ex: Web Crypto API com senha derivada) aumentaria a segurança mas adicionaria complexidade significativa (gerenciamento de chave, UX de senha).

**Ação mínima recomendada:** documentar essa limitação na página de privacidade/opções para que o usuário esteja ciente.

---

### #7 — Permissão `tabs` potencialmente excessiva

**Severidade:** BAIXA
**CWE:** CWE-250 (Execution with Unnecessary Privileges)

#### Descrição

A permissão `tabs` concede acesso à URL e título de **todas as abas abertas**, não apenas a ativa. O context menu do background script só precisa da aba atual.

```typescript
// wxt.config.ts:9
permissions: ['contextMenus', 'storage', 'tabs'],
```

#### Impacto

- Maior surface area de permissões visível ao usuário na instalação.
- A Chrome Web Store pode rejeitar ou questionar a necessidade da permissão.
- Se a extensão for comprometida, um atacante teria acesso às URLs de todas as abas abertas.

#### Solução recomendada

Avaliar se `activeTab` (concedida automaticamente em contexto de context menu) é suficiente. Se for, remover `tabs` do manifest. Testar especialmente o fluxo de salvar via context menu em páginas com múltiplas abas.

---

### #8 — Content script com match `<all_urls>`

**Severidade:** BAIXA
**CWE:** CWE-250 (Execução com privilégios desnecessários)

#### Descrição

O content script é injetado em **todas as páginas** que o usuário visita, incluindo páginas de banco, sistemas corporativos, etc. Sua função é apenas exibir um toast quando acionado pelo background.

```typescript
// content.ts:7
matches: ['<all_urls>'],
```

#### Impacto

- Qualquer vulnerabilidade introduzida no content script afeta universalmente todas as páginas visitadas.
- Aumenta o scope de permissões percebido pelo usuário e auditores.

#### Solução recomendada

O match `<all_urls>` é **necessário** para o toast funcionar em qualquer página após salvar pelo context menu. Não é possível reduzir sem quebrar a funcionalidade. A mitigação é manter o content script com o mínimo de código possível e revisar qualquer adição cuidadosamente.

**Documentar** esse tradeoff no código:

```typescript
// content.ts
// ATENÇÃO: <all_urls> é necessário para exibir o toast em qualquer página.
// Mantenha este arquivo mínimo — qualquer bug aqui afeta todas as páginas do usuário.
matches: ['<all_urls>'],
```

---

## Pontos informativos

### #9 — Permissão `storage` declarada mas não utilizada

A extensão usa **IndexedDB** (via `idb`), não a `chrome.storage` API. A permissão `storage` no manifest é desnecessária e deveria ser removida para minimizar permissões declaradas.

**Ação:** remover `'storage'` do array `permissions` em `wxt.config.ts`.

---

### #10 — Favicon URL sem `encodeURIComponent`

Em quatro locais, o domínio é interpolado diretamente na URL da Google Favicons API:

```typescript
`https://www.google.com/s2/favicons?domain=${domain}&sz=32`
```

Na prática, hostnames não contêm caracteres especiais que quebrariam a URL, mas encoding defensivo seria melhor:

```typescript
`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`
```

---

### #11 — Domínios visitados vazados para Google via favicon API

Cada link exibido na UI carrega um favicon via `https://www.google.com/s2/favicons?domain=<domínio>`. Isso faz uma requisição de rede para os servidores do Google para **cada domínio salvo pelo usuário**, potencialmente revelando o histórico de bookmarks.

**Alternativas:**
- Usar a API `chrome.favicon` (disponível em MV3) para buscar favicons já cacheados localmente pelo browser: `chrome-extension://[extensionId]/_favicon/?pageUrl=<url>&size=32`
- Buscar e cachear o favicon localmente na primeira vez que o link é salvo.
- Oferecer ao usuário a opção de desabilitar favicons.

---

### #12 — Dependência `turbo` sem versão fixada

```json
// package.json (raiz)
"devDependencies": {
  "turbo": "latest"
}
```

`latest` resolve para a versão mais recente no momento do install, podendo introduzir breaking changes ou, em um cenário extremo, pegar uma versão comprometida de um supply chain attack.

**Ação:** fixar para uma versão específica, ex: `"turbo": "2.5.4"`.

---

## Boas práticas já aplicadas

A extensão já implementa corretamente diversas proteções importantes:

| Proteção | Detalhe |
|----------|---------|
| Sem `dangerouslySetInnerHTML` | Nenhum uso em toda a codebase React |
| React JSX auto-escape | Todos os dados de usuário renderizados via `{variável}` são escapados automaticamente |
| Função `esc()` em content.ts | Escapa corretamente os 5 caracteres críticos HTML antes de `innerHTML` |
| Shadow DOM no toast | Isola CSS e DOM do toast da página host |
| Sem `eval()` / `Function()` / `document.write()` | Nenhum uso identificado |
| Sem listeners externos (`onMessageExternal`) | A extensão não aceita mensagens de páginas web |
| Sem `externally_connectable` no manifest | Nenhuma página externa pode se conectar à extensão |
| `crypto.randomUUID()` para IDs | IDs criptograficamente seguros |
| `.gitignore` cobre secrets | `.env`, `*.local` e outros arquivos sensíveis cobertos |
| Sem chaves ou segredos hardcoded | Auditoria não encontrou credenciais no código |
| Dependências runtime mínimas | `react`, `react-dom`, `idb`, `@wxt-dev/i18n` — superfície pequena |

---

## Recomendações priorizadas

1. **Imediato:** Implementar `isSafeUrl()` e aplicar em `LinkItem.tsx`, `options/App.tsx`, `import-export.ts`, e `SaveTab.tsx` — evita execução de `javascript:` e `data:` URLs.
2. **Imediato:** Remover permissão `storage` não utilizada do `wxt.config.ts`.
3. **Curto prazo:** Adicionar `content_security_policy` explícita ao manifest via `wxt.config.ts`.
4. **Curto prazo:** Adicionar validação de tipos e limites de tamanho na `importJSON()`.
5. **Curto prazo:** Adicionar blocklist de hosts privados na `fetchTitle()`.
6. **Médio prazo:** Avaliar substituição da Google Favicons API por `chrome-extension://_favicon/` para eliminar vazamento de domínios.
7. **Médio prazo:** Fixar versão do `turbo` no `package.json` raiz.
8. **Documentação:** Adicionar comentário em `content.ts` explicando o tradeoff de `<all_urls>`.

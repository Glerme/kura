# Kura — Estratégia de Monetização

**Data:** 2026-03-26

---

## 1. Modelos de Monetização para Extensões

| Modelo           | Pros                                             | Contras                                  | Exemplos                                     |
| ---------------- | ------------------------------------------------ | ---------------------------------------- | -------------------------------------------- |
| **Freemium**     | 5-7x mais installs que paid-only; conversão 2-5% | Precisa de features premium claras       | Raindrop.io, Grammarly, LastPass             |
| **Assinatura**   | Receita recorrente e previsível                  | Usuários resistem a subscription fatigue | Pocket Premium (encerrou Jul/2025), start.me |
| **Compra única** | Simples, sem friction de cobrança mensal         | Sem receita recorrente; difícil escalar  | Pinboard ($22 one-time)                      |
| **Doações**      | Zero friction; boa vontade da comunidade         | Receita imprevisível e baixa             | Wikipedia model, extensões open-source       |
| **Afiliados**    | Não cobra do usuário                             | Pode parecer spam; baixa receita         | Honey (adquirido pelo PayPal por $4B)        |

**Conclusão:** Freemium com assinatura é o modelo dominante e mais sustentável para extensões de produtividade.

---

## 2. Análise de Concorrentes

| App             | Free                        | Pago                                                    | Preço                   | Gate Principal                     |
| --------------- | --------------------------- | ------------------------------------------------------- | ----------------------- | ---------------------------------- |
| **Raindrop.io** | Save, tags, coleções        | Full-text search, nested collections, backup permanente | $3/mês ou $28/ano       | Cloud sync + full-text search      |
| **Pocket**      | Save, tags, leitura offline | Encerrou em Jul/2025                                    | —                       | **Oportunidade para o Kura**       |
| **Instapaper**  | Save, leitura               | Full-text search, highlights ilimitados, speed reading  | $5.99/mês ou $59.99/ano | Search + highlights                |
| **Toby**        | Tabs organizadas (até 200)  | Ilimitado, sync, teams                                  | $4.50/mês               | Limite de quantidade + sync        |
| **start.me**    | Dashboard pessoal           | Remover ads, múltiplas páginas                          | $2/mês ou $20/ano       | Sem ads + features extras          |
| **Papaly**      | Save, boards públicos       | Sem plano pago aparente                                 | —                       | Modelo puramente free (sem tração) |

**Padrões observados:**

- Cloud sync é o gate premium **#1** — todos os players cobram por isso
- Full-text search é o gate **#2**
- Preço médio do mercado: **$3–6/mês**
- Pocket saiu do mercado em julho/2025 — janela de oportunidade real para capturar usuários órfãos

---

## 3. Políticas das Stores

### Chrome Web Store

- Chrome Payment API **descontinuada** — necessário usar processador externo
- **[ExtensionPay](https://extensionpay.com/)** recomendado: open-source, Stripe-based, sem comissão da store
- Ads são permitidos mas AdSense está banido dentro de extensões
- Extensões não podem mais ser listadas como "paid" diretamente na store

### Firefox Add-ons (AMO)

- Sem restrições significativas de monetização
- Aceita qualquer modelo com disclosure adequado ao usuário
- Mercado menos competitivo que Chrome — boa oportunidade de nicho

---

## 4. Free vs Kura Pro — Divisão de Features

### Free (para sempre)

- Salvar links via context menu e popup
- Tags e comentários
- Lista de leitura com status lido/não-lido
- Busca básica (título, tags, comentário)
- Compartilhamento via WhatsApp, Twitter e cópia de link
- Armazenamento local ilimitado (IndexedDB)
- i18n (EN + PT-BR)

### Kura Pro (premium)

- **Import/export JSON e CSV** - importação e exportação de links
- **Cloud sync** entre dispositivos — _killer feature_, requer backend (Fase 3)
- **Full-text search** no conteúdo das páginas salvas (não só título/tags)
- **Backup automático** na nuvem com histórico de versões
- **Coleções compartilháveis** com URL pública
- **Leitura offline** do conteúdo das páginas (reader mode)
- **Estatísticas de leitura** (links salvos por semana, tags mais usadas, tempo médio de leitura)
- Temas visuais adicionais

### Kura Teams (Fase 3+)

- Workspaces compartilhados
- Coleções de equipe
- Permissões por membro (viewer / editor / admin)
- Dashboard de atividade do time

---

## 5. Estratégia por Fase

### Fase 1 — Growth (Meses 1–6)

**Objetivo:** aquisição de usuários, nenhuma cobrança.

- Extensão 100% gratuita
- Meta: 1.000–5.000 usuários ativos
- Página de doações opcional (Buy Me a Coffee / GitHub Sponsors)
- Landing page com **"Kura Pro — Coming Soon"** para captar e-mails
- Coletar feedback: quais features os usuários pagariam?

### Fase 2 — Lançamento Pro (Meses 6–12)

**Objetivo:** receita recorrente, cloud sync como produto central.

- Lançar **Kura Pro** junto com o backend (Fase 3 do roadmap)
- **Preço: $3/mês ou $30/ano** (undercut direto do Raindrop.io)
- Cloud sync como feature principal de conversão
- Pagamentos via **ExtensionPay + Stripe**
- Trial de 14 dias do Pro para novos usuários
- Regra fundamental: **nunca retroagir features que já eram free**

### Fase 3 — Escala (Meses 12–24)

**Objetivo:** expansão para times e parcerias.

- Lançar **Kura Teams** a $5–8/usuário/mês
- Deal no **AppSumo** para burst de crescimento (lifetime deal pontual)
- Programa de referral: indique um amigo → 1 mês grátis
- API pública para integrações com Notion, Obsidian, etc.

### Projeção de Receita (conservadora)

```
10.000 usuários free
×  4% taxa de conversão
=  400 assinantes Pro
×  $3/mês
=  $1.200/mês MRR  (~$14.400/ano)
```

Cenário realista para 18–24 meses após lançamento.

---

## 6. Ações Imediatas (durante o MVP)

Nenhuma bloqueia o desenvolvimento atual, mas devem ser decididas agora:

1. **Definir o que é free para sempre** — comunicar claramente na landing page para gerar confiança
2. **Analytics básico opt-in** — tracking anônimo de uso para entender comportamento antes de lançar Pro
3. **Waitlist na landing page** — "Kura Pro coming soon" com campo de e-mail
4. **Licença do código** — decidir entre:
   - **Open-source (MIT/GPL):** gera confiança mas complica monetização
   - **Open core:** core free e open, features Pro closed — modelo adotado por GitLab, Metabase, etc.
   - **Closed-source:** mais simples para monetizar, menos confiança inicial

---

## 7. Stack de Monetização Recomendada

| Componente             | Ferramenta                                              |
| ---------------------- | ------------------------------------------------------- |
| Pagamentos na extensão | [ExtensionPay](https://extensionpay.com/) (open-source) |
| Processador            | Stripe                                                  |
| Doações                | Buy Me a Coffee ou GitHub Sponsors                      |
| E-mails/Waitlist       | Resend + banco de e-mails próprio                       |
| Analytics              | PostHog (self-hosted, privacy-friendly)                 |

# CLAUDE.md — Rota 606 · mybreak by Delta Cafés

> Ficheiro de contexto operacional para o Claude Code.
> Lê este ficheiro antes de qualquer tarefa relacionada com este projecto.

---

## 🧑 Operador

**Leo** — Repositor (route operator) da **Rota 606**, mybreak by Delta Cafés (marca interna: VDLE).
Localização: **Marinha Grande, Portugal**.

---

## 🎯 Objectivos do projecto

- Minimizar quebra (*quebra* = desperdício de frescos) e desperdício por PDV
- Optimizar decisões de reposição por máquina
- Registar e gerir assistência técnica (*chamados técnicos*) estruturada no Notion
- Manter dashboard web operacional (Vite + React) conectado ao Notion

---

## 🏗️ Arquitectura técnica

### Dashboard
- **Repo GitHub:** `leonardoohider/rota606-dashboard` (público)
- **Deploy:** Vercel → `https://rota606-dashboard.vercel.app/`
- **Stack:** Vite + React
- **Proxies serverless Vercel:**
  - `api/notion.js` — chamadas à API do Notion via `NOTION_TOKEN`
  - `api/anthropic.js` — chamadas à API Anthropic via `ANTHROPIC_API_KEY`
- **Login:** removido — renderiza `Dashboard` directamente
- **Tabs activas:** 🏠 Início · 🔧 A.T. · 📦 BA Vidros · ⚙️ Config. Frescos · 🥐 Frescos · 📊 Produtos · 🗺️ Rota

### Tema (NUNCA alterar sem pedido explícito)

```
background:  #0D1117
accent:      #10D9A0
cards:       #161B22
```

Tema dark fixo — qualquer alteração ao tema ou layout requer pedido explícito do Leo.

---

## 🗄️ Notion — IDs principais

| Recurso | ID |
|---|---|
| Rota 606 root | `37493fb1601f8115814be9b61144a3ef` |
| Frescos config folder | `38893fb1601f81ebbd7ac56637d8e95a` |
| Assistência Técnica folder | `38793fb1601f81c4b22adee0f464d232` |
| AT Jun/2026 subfolder | `38793fb1601f8137b406efc68d97b49e` |
| Registo de Chamados DB | `e23c2dda18c547d6b023b09165eef552` |
| PDV 806477 (BA Vidros Young) | `37493fb1601f80649eeeffcd6d4c3772` |
| PDV 807542 (BA Vidros 1050) | `37493fb1601f818ca971d90764e2752c` |
| Lembretes da Rota 606 | `38893fb1601f81e6b510eaae7e1af99d` |
| PDV 814082 (Saica FAS 900) | `38a93fb1601f81ac89f9e6b9aa58297b` |
| PDV 811869 (Saica Caneladora) | `38a93fb1601f8118a767ce7c3be0d752` |

**Lembretes:** adicionados como bullets sob o heading `## 🔔 Lembretes Ativos` na página de Lembretes.
URL directo: `https://app.notion.com/p/38893fb1601f81e6b510eaae7e1af99d`

---

## 🏭 Clientes da Rota 606

Saica Pack Portugal · BA Vidros · Innovcoating · Promoplas · HRV · Mego Indústria Moldes · IMV · Famolde · Vidromolde · IPL Marinha Grande · IEFP-C.E. Marinha Grande · PES · NGZ2

> "Innovcoating" pode aparecer referido foneticamente como "i nove coaching".

---

## 🥐 Configuração de Frescos por PDV

### Terminologia
- Slots = **espirais** (nunca "molas")
- 🟡 **Tentação** = linha rotativa — sugerir sempre o produto Tentação com mais vendas e menos quebra. **Excepção:** PDV 806066 espiral 15 → fixo exclusivamente a Hambúrguer Tentação
- ⭐ **Gourmet** = categoria premium separada

### Tabela de configuração

| PDV | Cliente / Local | Doces | Salgados | Especial |
|---|---|---|---|---|
| 809404 | Famolde P1 | 21,22,24,25,27 | 41–47 | 48 🟡Tentação |
| 809403 | Famolde P3 | 21,22,24,25,27 | — | — |
| 809449 | BA Vidros Entrada | — | 41–46 | — |
| 806066 | BA Vidros Entrada | 11,13,17,19,51–56 | 40–49 | 15 🟡Tentação (Hambúrguer exclusivo, sem rotação) |
| 812420 | Innovcoating | mixed same price | — | A13🟡 A14🟡 |
| 813878 | IMV | A13,A14 | A15–A18 | — |
| 815691 | PES | mixed: 21,22,24,25,28,41–48 | — | — |
| 813267 | Promoplas | mixed: A22,A24,A26,A41–A46 | — | — |
| 815504 | HRV Administração | A31,A32 | A33–A37 | A38 ⭐Gourmet |
| 807540 | BA MG2 | 21,22 | 41,42,43 | 44,45,46 🟡Tentação |
| 814082 | Saica Pack FAS 900 | 21,22,24,25,27 | 41,42,43,44,45,47,48 | 46 ⭐Gourmet |
| 811869 | Saica Caneladora | 21,23,25 | 11,13,15,40,41,42,43,44 | 45 ⭐Gourmet |
| 811867 | Saica Combi | (config por sessão) | — | — |
| 807542 | BA Vidros Refeitório 1050 | — | — | — |
| 815507 | HRV Fabricação | (config por sessão; espirais 50/51/52 NÃO são frescos) | — | — |
| 817004 | Vidrimolde | (config por sessão) | — | — |

### Formato das páginas Notion de Frescos (NUNCA alterar)
- Título: `PDV [número] — Configuração Frescos`
- Ícone: 🏪
- Secções: `📋 Informações do PDV` · `🥐 Frescos Doces` · `🥪 Frescos Salgados` · `🟡 Tentação` · `⭐ Gourmet` (se aplicável) · rodapé padrão

### Lógica de reposição de frescos
1. Buscar config de espirais do PDV no Notion
2. Analisar ficheiro semanal: quebra e vendas por produto
3. Sugerir apenas os produtos com mais vendas e menos quebra por tipo de espiral

---

## 🔧 Assistência Técnica (Chamados)

### Formato do título
`🔧 Chamado Técnico – [Cliente] | Máq. [número] – [Descrição curta]`

### Secções da página Notion
- **Informações do Chamado** (tabela): Cliente · Número da Máquina · Data do Chamado · Status
- Descrição do Problema
- Ação Necessária
- Observações

> Sem campo "Tipo de Máquina". Referência de formato: *Innovcoating | Máq. 812422 – Erro Cabo USB*

### Formato WhatsApp (sempre exactamente este)

```
*CHAMADO TÉCNICO*

*Cliente:* [cliente]
*Máquina:* [número]
*Data:* [data]

*Ocorrência verificada:*
• [problema 1]
• [problema 2 se houver]

⚠️ Solicito visita técnica para avaliação e resolução.

At.
```

### Regras de chamados
- Quando o Leo reporta um chamado: analisar o formato do chamado anterior e replicar directamente — sem perguntas de esclarecimento
- Gerar automaticamente: entrada no Notion + mensagem WhatsApp
- Incluir sempre botão de partilha WhatsApp (`wa.me` links — sem Business API)

---

## 🔄 Workflow de reposição (quando Leo menciona reposição ou lista de produtos)

> Pergunta sempre primeiro: **PDV 806477 (BA Vidros Refeitório Young) ou PDV 807542 (BA Vidros Refeitório 1050)?**

---

## 🛠️ Ferramentas e integrações

| Ferramenta | Uso |
|---|---|
| **Notion** | Base de dados operacional — chamados, configs PDV, frescos, rota, lembretes |
| **Vercel** | Hosting do dashboard |
| **GitHub** | `leonardoohider/rota606-dashboard` |
| **Google Drive** | Pasta ROTA 606 (ID: `1XNdQMLOmTQUzzr11Tpgk7WbcVV57WCHh`) — relatórios e ficheiros |
| **Anthropic API** | Server-side via `api/anthropic.js` — análise de PDFs no dashboard |
| **WhatsApp** | `wa.me` links para comunicação com técnicos |

---

## 📋 Notas técnicas Notion

- `replace_content` numa página completa é mais fiável do que `update_content` para alterações estruturais/tabelas
- `update_content` com `old_str`/`new_str` funciona para edições simples e pontuais
- Subpastas de AT criadas mensalmente dentro de `38793fb1601f81c4b22adee0f464d232`

---

## 📦 Folha de Rota Semanal (resumo)

| Dia | Clientes principais |
|---|---|
| 2ª Feira | Saica Pack · Famolde · BA Vidros Entrada · BA Vidros Refeitório · Vidrimolde · Mego · PES · HRV · MG2 BA · IEFP |
| 3ª Feira | Saica Pack · BA Vidros Entrada · BA Vidros Refeitório · Palbase · Innovcoating · IMV · HRV · Promoplas |
| 4ª Feira | Saica Pack · BA Vidros Entrada · BA Vidros Refeitório · BA Vidros Engenheiros · Armazém 3 BA · Innovcoating · IMV · HRV · PES · Vidromolde · IPL MG |
| 5ª Feira | Saica Pack · Famolde · BA Vidros Entrada · BA Vidros Refeitório · HRV · Mego · MG2 BA · IEFP |
| 6ª Feira | Saica Pack · BA Vidros Entrada · BA Vidros Refeitório · Innovcoating · IMV · HRV · PES · Vidromolde · Promoplas |

---

*Última actualização: Junho 2026*

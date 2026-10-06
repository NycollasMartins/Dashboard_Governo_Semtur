# SemTur Dashboard — Mídia Programática

Dashboard de performance das campanhas de mídia programática da **Secretaria Municipal de Turismo de Maceió (SemTur)**. Mostra impressões, cliques, CTR, distribuição por cidade (mapa) e performance por criativo, a partir de dados que chegam de uma **planilha do Google Sheets**.

O app roda na plataforma **[Base44](https://base44.com)** (hospedagem, autenticação, banco de dados, funções serverless e agendamentos). Este repositório é a fonte do código e está conectado ao Base44 via integração com o GitHub.

---

## Sumário

1. [TL;DR: como colocar uma alteração no ar](#1-tldr-como-colocar-uma-alteração-no-ar)
2. [Arquitetura em 1 minuto](#2-arquitetura-em-1-minuto)
3. [Stack](#3-stack)
4. [Estrutura de pastas: onde fica cada coisa](#4-estrutura-de-pastas-onde-fica-cada-coisa)
5. [Fluxo de dados (planilha → tela)](#5-fluxo-de-dados-planilha--tela)
6. [Guia de alterações comuns ("quero mudar X, onde mexo?")](#6-guia-de-alterações-comuns-quero-mudar-x-onde-mexo)
7. [Rodando localmente (opcional)](#7-rodando-localmente-opcional)
8. [Autenticação](#8-autenticação)
9. [Código legado / não utilizado](#9-código-legado--não-utilizado)
10. [Limitações conhecidas e débitos técnicos](#10-limitações-conhecidas-e-débitos-técnicos)
11. [Convenções do projeto](#11-convenções-do-projeto)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. TL;DR: como colocar uma alteração no ar

**Não existe build manual, servidor nem pipeline de deploy para configurar.** O Base44 lê o código direto deste repositório.

```bash
git clone https://github.com/NycollasMartins/Dashboard_Governo_Semtur.git
cd Dashboard_Governo_Semtur
# ...faça suas alterações...
git add .
git commit -m "descrição da alteração"
git push origin main
```

Depois do `push`:

1. O Base44 sincroniza automaticamente o código do repositório com o app (frontend, entidades, funções e workflows da pasta `base44/`).
2. Abra o app no [Base44](https://app.base44.com), confira o preview e clique em **Publish** se a alteração precisar ir para a versão publicada.

> ⚠️ **A branch `main` é a branch conectada ao Base44.** Tudo o que entra em `main` vai para o app. Para alterações grandes, trabalhe em outra branch e faça merge em `main` só quando estiver pronto.

> ℹ️ Não é preciso configurar variáveis de ambiente para o app hospedado: o Base44 injeta `app_id`, URL e token de sessão sozinho. O `.env.local` só é necessário para rodar **localmente** ([seção 7](#7-rodando-localmente-opcional)).

---

## 2. Arquitetura em 1 minuto

```
┌────────────────────┐   a cada 30 min    ┌──────────────────────────┐
│  Google Sheets     │ ◄───────────────── │ Workflow Base44          │
│  aba "Report"      │                    │ "Sync Google Sheets ..." │
│  colunas A:E       │                    └────────────┬─────────────┘
└─────────┬──────────┘                                 │ chama
          │ lê via conector "googlesheets"             ▼
          │                               ┌──────────────────────────┐
          └─────────────────────────────► │ Função syncSheetsData    │
                                          │ (Deno, roda no Base44)   │
                                          │ apaga tudo + reinsere    │
                                          └────────────┬─────────────┘
                                                       │ grava
                                                       ▼
                                          ┌──────────────────────────┐
                                          │ Entidade CampaignData    │
                                          │ (banco do Base44)        │
                                          └────────────┬─────────────┘
                                                       │ base44.entities.CampaignData.list()
                                                       ▼
                                          ┌──────────────────────────┐
                                          │ Frontend React (Vite)    │
                                          │ src/pages/Dashboard.jsx  │
                                          │ agrega e distribui p/    │
                                          │ as abas                  │
                                          └──────────────────────────┘
```

- **Não há backend próprio.** Toda a "infra" é Base44, definida como código na pasta [`base44/`](base44/).
- **A planilha é a fonte da verdade.** Para corrigir um número no dashboard, corrija na planilha; na próxima sincronização (até 30 min) o dashboard reflete.

---

## 3. Stack

| Camada | Tecnologia | Onde é configurada |
| --- | --- | --- |
| Build / dev server | Vite 6 + `@base44/vite-plugin` | [`vite.config.js`](vite.config.js) |
| UI | React 18 (JSX, sem TypeScript nos componentes) | [`src/`](src/) |
| Estilo | Tailwind CSS 3 + tokens HSL em CSS variables | [`tailwind.config.js`](tailwind.config.js), [`src/index.css`](src/index.css) |
| Componentes base | shadcn/ui (estilo *new-york*) sobre Radix UI | [`components.json`](components.json), [`src/components/ui/`](src/components/ui/) |
| Gráficos | Recharts | componentes em `src/components/dashboard/` |
| Mapa | Leaflet + react-leaflet (tiles CARTO *light_all*) | [`CityMap.jsx`](src/components/dashboard/CityMap.jsx) |
| Animações | Framer Motion | espalhado nos componentes |
| Ícones | lucide-react | — |
| Rotas | react-router-dom v6 | [`src/App.jsx`](src/App.jsx) |
| Backend / BaaS | Base44 SDK (`@base44/sdk`) | [`src/api/base44Client.js`](src/api/base44Client.js) |
| Funções serverless | Deno (runtime do Base44) | [`base44/functions/`](base44/functions/) |
| Lint | ESLint 9 (flat config) | [`eslint.config.js`](eslint.config.js) |
| Fontes | Sora (títulos), Inter (texto), via Google Fonts | topo de [`src/index.css`](src/index.css) |

Import alias: `@/` aponta para `src/` (ex.: `import { cn } from "@/lib/utils"`).

---

## 4. Estrutura de pastas: onde fica cada coisa

```
.
├── base44/                               ← INFRA COMO CÓDIGO (sincronizada com o Base44)
│   ├── config.jsonc                      → comandos de install/build/serve do app
│   ├── entities/
│   │   └── CampaignData.jsonc            → schema da tabela que guarda os dados da planilha
│   ├── functions/
│   │   └── syncSheetsData/entry.ts       → função que lê o Google Sheets e popula CampaignData
│   └── workflows/
│       └── Sync Google Sheets - Campaign Data.jsonc  → agendamento (a cada 30 min) que chama a função
│
├── src/
│   ├── main.jsx                          → ponto de entrada do React
│   ├── App.jsx                           → providers (Auth, React Query, Router) + ROTAS
│   ├── index.css                         → tokens de cor/tema (light e dark), fontes, utilitários globais
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx                 → ★ PÁGINA PRINCIPAL: busca dados, agrega, controla abas
│   │   └── OAuthConsent.jsx              → (não roteada, ver seção 9)
│   │
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── Sidebar.jsx               → menu lateral (itens das abas, logo, badge LIVE)
│   │   │   ├── tabs/
│   │   │   │   ├── OverviewTab.jsx       → aba "Visão Geral"
│   │   │   │   ├── CitiesTab.jsx         → aba "Cidades" (mapa ↔ detalhe da cidade)
│   │   │   │   ├── CreativesTab.jsx      → aba "Criativos" (+ gráficos de gênero/idade)
│   │   │   │   └── CampaignsTab.jsx      → (não usada)
│   │   │   ├── MetricCard.jsx            → card de KPI (Visão Geral)
│   │   │   ├── TrendChart.jsx            → gráfico de tendência diária (Visão Geral)
│   │   │   ├── TopCityCard.jsx           → destaque das cidades top (Visão Geral)
│   │   │   ├── CityMap.jsx               → mapa Leaflet com círculos por cidade (Cidades)
│   │   │   ├── CityDetailPanel.jsx       → painel de detalhe de uma cidade (Cidades)
│   │   │   └── CampaignTable / CityTable / TopCreatives / DashboardHeader  → (não usados)
│   │   ├── AIAssistant.jsx               → botão flutuante "Nexus" (chat, hoje só visual)
│   │   ├── UserNotRegisteredError.jsx    → tela de usuário sem acesso ao app
│   │   ├── AuthLayout.jsx, ProtectedRoute.jsx → (não usados)
│   │   └── ui/                           → componentes shadcn/ui (button, card, dialog, ...)
│   │
│   ├── api/
│   │   └── base44Client.js               → instância única do SDK Base44 (use sempre esta)
│   │
│   ├── lib/
│   │   ├── AuthContext.jsx               → fluxo de autenticação (provider + hook useAuth)
│   │   ├── app-params.js                 → lê app_id / token / URLs (URL → localStorage → .env)
│   │   ├── query-client.js               → configuração do TanStack Query
│   │   ├── mockData.js                   → dados FAKE usados como fallback (ver seção 10)
│   │   ├── PageNotFound.jsx              → página 404
│   │   └── utils.js                      → cn() (merge de classes Tailwind) e isIframe
│   │
│   ├── hooks/use-mobile.jsx              → hook de breakpoint (usado pelo ui/sidebar)
│   └── utils/index.ts                    → createPageUrl() (não usado)
│
├── index.html                            → HTML base (título, favicon)
├── PONTOS_DE_ATENCAO.md                  → backlog técnico detalhado (débitos e melhorias)
└── package.json                          → dependências e scripts
```

---

## 5. Fluxo de dados (planilha → tela)

### 5.1 Origem: Google Sheets

- **Planilha:** ID `1S4e3Q5fiwNKvsKJzGm0CLqzMTjp9c5fv3wqu4QExlLY`, aba **`Report`**, colunas **A até E**.
- Definidos como constantes no topo de [`base44/functions/syncSheetsData/entry.ts`](base44/functions/syncSheetsData/entry.ts).
- A **primeira linha é o cabeçalho**. As colunas são encontradas **pelo nome** (não pela posição), por correspondência parcial e sem diferenciar maiúsculas/minúsculas:

| Cabeçalho na planilha precisa conter… | Vira o campo | Tipo |
| --- | --- | --- |
| `dia` | `dia` | texto, formato **`dd/mm/aaaa`** |
| `criativo` | `criativo` | texto |
| `impress` | `impressoes_display` | número |
| `clique` | `cliques_display` | número |
| `estado` **ou** `cidade` | `estado` | texto (na prática é o **nome da cidade**) |

- Números em formato brasileiro são aceitos (`1.234,56` → `1234.56`).
- Linhas com a primeira coluna vazia são ignoradas.
- O acesso à planilha usa o **conector `googlesheets`** configurado no painel do Base44 (OAuth da conta Google). Não há credencial no código.

### 5.2 Sincronização: função `syncSheetsData`

1. Valida o usuário com `base44.auth.me()` (retorna 401 se não houver).
2. Lê a planilha com o token do conector.
3. **Apaga todos os registros** de `CampaignData` (até 1000) e **reinsere tudo** com `bulkCreate`.
4. Retorna JSON com `synced`, `headers_found` e `col_indexes`, úteis para depurar mapeamento de colunas.

**Agendamento:** [`base44/workflows/Sync Google Sheets - Campaign Data.jsonc`](base44/workflows/Sync%20Google%20Sheets%20-%20Campaign%20Data.jsonc) roda a função **a cada 30 minutos** (`interval_value` / `interval_unit`).

### 5.3 Armazenamento: entidade `CampaignData`

Schema em [`base44/entities/CampaignData.jsonc`](base44/entities/CampaignData.jsonc). Cada registro = uma linha da planilha (dia × criativo × cidade). O Base44 adiciona automaticamente `id`, `created_date` etc.

### 5.4 Frontend: `Dashboard.jsx`

[`src/pages/Dashboard.jsx`](src/pages/Dashboard.jsx) é o **único lugar que busca dados**:

```js
base44.entities.CampaignData.list('created_date', 1000)
```

E transforma os registros brutos com quatro funções puras, no mesmo arquivo:

| Função | Gera | Consumido por |
| --- | --- | --- |
| `buildMetrics(data)` | 4 KPIs (impressões, cliques, CTR, investimento) | `OverviewTab` → `MetricCard` |
| `buildTrendData(data)` | série diária (últimos **11 dias**) | `OverviewTab` → `TrendChart` |
| `buildTopCities(data)` | agregado por cidade + lat/lng + top criativo | `OverviewTab`, `CitiesTab` |
| (bruto) `campaignData` | registros sem agregação | `CreativesTab` (agrega por criativo internamente) |

As coordenadas das cidades vêm do dicionário **`GEO_COORDS`** no mesmo arquivo (ver [6.3](#63-apareceu-uma-cidade-nova-na-planilha-e-ela-não-aparece-no-mapa)).

A troca de abas é feita por estado local (`activeTab`), **não** por rota. Toda a navegação acontece em `/`.

---

## 6. Guia de alterações comuns ("quero mudar X, onde mexo?")

### 6.1 Trocar a planilha de origem ou a aba

[`base44/functions/syncSheetsData/entry.ts`](base44/functions/syncSheetsData/entry.ts): altere `SPREADSHEET_ID` e/ou `SHEET_NAME`. A conta Google conectada no Base44 precisa ter acesso de leitura à nova planilha.

### 6.2 Adicionar uma coluna nova da planilha (ex.: "Investimento")

São **4 passos**, nesta ordem:

1. **Entidade:** adicione o campo em [`base44/entities/CampaignData.jsonc`](base44/entities/CampaignData.jsonc):
   ```jsonc
   "investimento": { "type": "number", "description": "Valor investido (R$)" }
   ```
2. **Sync:** em [`entry.ts`](base44/functions/syncSheetsData/entry.ts), amplie o range (`A:E` → `A:F`), localize a coluna (`headers.findIndex(h => h.includes('invest'))`) e inclua o campo no `.map(row => ({ ... }))`, usando a mesma conversão numérica das impressões.
3. **Agregação:** em [`Dashboard.jsx`](src/pages/Dashboard.jsx), some o novo campo em `buildMetrics` / `buildTopCities` (hoje `spend` é fixo em `0` e o KPI "Investimento Total" mostra `"R$ 0"`).
4. **Tela:** exiba o valor no componente desejado.

Faça push. Na próxima execução do workflow, os dados já vêm com a coluna nova.

### 6.3 Apareceu uma cidade nova na planilha e ela não aparece no mapa

O mapa depende de `GEO_COORDS` em [`src/pages/Dashboard.jsx`](src/pages/Dashboard.jsx). A **chave precisa ser idêntica** ao texto da coluna "estado/cidade" da planilha (acentos, espaços e sufixos como `" SP"` inclusos):

```js
"Nome Exato Da Planilha": { lat: -00.0000, lng: -00.0000, state: "UF" },
```

Cidades sem coordenada continuam nos KPIs e rankings, mas **não aparecem no mapa**.

### 6.4 Mudar os KPIs da Visão Geral

`buildMetrics()` em [`Dashboard.jsx`](src/pages/Dashboard.jsx). Cada item do array vira um `MetricCard` (`title`, `value`, `subtitle`, `icon` do lucide-react, `color`, `trend`, `trendValue`).

### 6.5 Mudar quantos dias aparecem no gráfico de tendência

`buildTrendData()` em [`Dashboard.jsx`](src/pages/Dashboard.jsx): o `.slice(-11)` no final. As datas precisam estar em `dd/mm/aaaa` para ordenar corretamente.

### 6.6 Adicionar / remover / renomear uma aba

1. Item do menu: array `NAV_ITEMS` em [`Sidebar.jsx`](src/components/dashboard/Sidebar.jsx) (`id`, `label`, `icon`).
2. Componente da aba: crie em `src/components/dashboard/tabs/NomeTab.jsx`.
3. Renderização: em [`Dashboard.jsx`](src/pages/Dashboard.jsx), adicione `{activeTab === "id" && <NomeTab ... />}`.

### 6.7 Adicionar uma página nova (rota)

Crie o componente em `src/pages/` e registre em [`src/App.jsx`](src/App.jsx), dentro de `<Routes>`, **antes** da rota `*` (404):

```jsx
<Route path="/minha-pagina" element={<MinhaPagina />} />
```

### 6.8 Cores, tema e identidade visual

- **Cores:** variáveis HSL em [`src/index.css`](src/index.css) (`:root` = tema claro, `.dark` = tema escuro). A cor principal laranja da SemTur é `--primary`. Mudar ali muda o app inteiro.
- **Novos tokens:** declare em `index.css` **e** registre em [`tailwind.config.js`](tailwind.config.js) (`colors: { nome: 'hsl(var(--nome))' }`).
- **Fontes:** `@import` do Google Fonts no topo de `index.css`; use as classes `font-sora` / `font-inter`.
- **Exceções com cor fixa (hex)** que não seguem o tema: `AIAssistant.jsx` (gradiente verde/azul), `CreativesTab.jsx` (paleta `COLORS` e gráfico de gênero).
- **Nome/logo do menu:** [`Sidebar.jsx`](src/components/dashboard/Sidebar.jsx). **Título da aba do navegador e favicon:** [`index.html`](index.html).

### 6.9 Mudar a frequência da sincronização

[`base44/workflows/Sync Google Sheets - Campaign Data.jsonc`](base44/workflows/Sync%20Google%20Sheets%20-%20Campaign%20Data.jsonc): `interval_value` e `interval_unit` (ex.: `15` / `"minutes"`, `1` / `"hours"`). Também é possível disparar a função manualmente pelo painel do Base44.

### 6.10 Gráficos de gênero e faixa etária (aba Criativos)

São **dados fixos** (`GENDER_DATA` e `AGE_DATA`) no topo de [`CreativesTab.jsx`](src/components/dashboard/tabs/CreativesTab.jsx). Não vêm da planilha. Para torná-los reais, siga o mesmo caminho da [6.2](#62-adicionar-uma-coluna-nova-da-planilha-ex-investimento).

### 6.11 Adicionar um componente shadcn/ui

```bash
npx shadcn@latest add <componente>
```

Ele é gerado em `src/components/ui/` (configuração em [`components.json`](components.json)). Os componentes ali são código do projeto e podem ser editados livremente.

### 6.12 Criar uma nova entidade / função / workflow no Base44

Siga o padrão dos arquivos existentes em `base44/entities/`, `base44/functions/<nome>/entry.ts` e `base44/workflows/`. No frontend, use sempre o cliente de [`src/api/base44Client.js`](src/api/base44Client.js):

```js
import { base44 } from "@/api/base44Client";
await base44.entities.MinhaEntidade.list();
await base44.functions.invoke("minhaFuncao", { ... });
```

Docs: <https://docs.base44.com>

---

## 7. Rodando localmente (opcional)

**Não é necessário para publicar.** Serve apenas para desenvolver com hot-reload antes do push.

**Pré-requisitos:** Node.js 20+ e npm.

```bash
npm install
```

Crie um arquivo **`.env.local`** na raiz (ele está no `.gitignore`, então nunca é commitado):

```env
VITE_BASE44_APP_ID=<id do app no Base44>
VITE_BASE44_APP_BASE_URL=<url do app, ex.: https://nome-do-app.base44.app>
```

Os dois valores ficam no painel do Base44, nas configurações do app (o ID também aparece na URL do editor).

```bash
npm run dev        # servidor local (Vite)
```

| Script | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento com hot-reload |
| `npm run build` | build de produção em `dist/` (o Base44 roda isso sozinho) |
| `npm run preview` | serve o build localmente |
| `npm run lint` / `lint:fix` | ESLint (componentes e páginas) |
| `npm run typecheck` | checagem de tipos via `jsconfig.json` |

> Localmente o login redireciona para o Base44. O usuário precisa estar cadastrado no app (ver seção 8).

---

## 8. Autenticação

Gerenciada 100% pelo Base44. Fluxo em [`src/lib/AuthContext.jsx`](src/lib/AuthContext.jsx):

1. Busca as configurações públicas do app (`/api/apps/public/prod/public-settings/by-id/<appId>`).
2. Se houver token, valida o usuário com `base44.auth.me()`.
3. Erros 403 do Base44 viram estados tratados em [`App.jsx`](src/App.jsx):
   - `auth_required` → redireciona para o login do Base44;
   - `user_not_registered` → mostra [`UserNotRegisteredError`](src/components/UserNotRegisteredError.jsx).

**Para dar acesso a alguém:** convide o usuário pelo painel do Base44 (Users / Settings do app). Não há tela de cadastro no código.

[`src/lib/app-params.js`](src/lib/app-params.js) resolve `app_id`, `access_token`, `functions_version` e `app_base_url` nesta ordem: **query string da URL → valor padrão (`.env`) → `localStorage`**. O token recebido via URL é removido da barra de endereço automaticamente.

Use `useAuth()` em qualquer componente para obter `user`, `isAuthenticated`, `logout()` etc.

---

## 9. Código legado / não utilizado

Herdado do template Base44 ou de versões anteriores do dashboard. **Nada aqui é importado pelo app hoje.** Pode ser removido com segurança ou reaproveitado:

| Arquivo | Situação |
| --- | --- |
| `src/components/dashboard/tabs/CampaignsTab.jsx` | aba de campanhas, removida do menu |
| `src/components/dashboard/CampaignTable.jsx`, `TopCreatives.jsx` | usados só pela `CampaignsTab` |
| `src/components/dashboard/CityTable.jsx` | ranking de cidades antigo |
| `src/components/dashboard/DashboardHeader.jsx` | cabeçalho antigo (botão "Atualizar dados" sem ação) |
| `src/pages/OAuthConsent.jsx` + `src/components/AuthLayout.jsx` | tela de consentimento OAuth, **não registrada em rota** |
| `src/components/ProtectedRoute.jsx` | guard de rota nunca aplicado |
| `src/utils/index.ts` | `createPageUrl()` nunca chamado |

Várias dependências do `package.json` também não são usadas (`three`, `jspdf`, `html2canvas`, `react-quill`, Stripe etc.). A lista completa está em [`PONTOS_DE_ATENCAO.md`](PONTOS_DE_ATENCAO.md), item QW-03.

> Antes de apagar qualquer coisa, confirme com: `grep -rn "NomeDoArquivo" src/`

---

## 10. Limitações conhecidas e débitos técnicos

| # | Limitação | Onde | Impacto |
| --- | --- | --- | --- |
| 1 | **Limite de 1000 registros**, tanto no sync (delete) quanto no `list()` do frontend | `entry.ts`, `Dashboard.jsx` | Se a planilha passar de 1000 linhas, os dados ficam **incompletos** e o sync deixa registros antigos. Precisa de paginação. |
| 2 | Sync faz **delete + insert** sem transação | `entry.ts` | Durante a sincronização o dashboard pode mostrar dados zerados ou parciais por alguns segundos. |
| 3 | **Fallback silencioso para dados fake** | `Dashboard.jsx` (`DAILY_TREND`, `CITIES_DATA` de `mockData.js`) | Se `CampaignData` estiver vazia, as abas Visão Geral (tendência) e Cidades mostram **números fictícios** sem aviso. |
| 4 | Sem tratamento de erro/loading no fetch | `Dashboard.jsx` (`useEffect` sem `.catch`) | Falha de rede = tela com zeros, sem mensagem. TanStack Query está instalado mas não é usado. |
| 5 | Investimento sempre `R$ 0` | `buildMetrics`, `buildTopCities` | A planilha não tem essa coluna (ver [6.2](#62-adicionar-uma-coluna-nova-da-planilha-ex-investimento)). |
| 6 | Gênero / faixa etária fixos | `CreativesTab.jsx` | Dados ilustrativos, não reais. |
| 7 | Assistente "Nexus" só visual | `AIAssistant.jsx` | Não chama nenhuma IA: a mensagem do usuário aparece no chat, mas não há resposta. |
| 8 | Coordenadas manuais | `GEO_COORDS` em `Dashboard.jsx` | Cidade nova sem entrada não aparece no mapa. |
| 9 | Abas sem URL própria | `Dashboard.jsx` | Não dá para compartilhar link direto de uma aba; voltar do navegador não troca de aba. |
| 10 | Função `fmt()` duplicada em ~6 arquivos | componentes do dashboard | Mudar a formatação de números exige editar todos. |
| 11 | `index.html` genérico | `index.html` | Título "Base44 APP", favicon do Base44, `manifest.json` inexistente. |

O plano detalhado de melhorias (com prioridade e estimativa) está em **[`PONTOS_DE_ATENCAO.md`](PONTOS_DE_ATENCAO.md)**. Parte dele já foi feita: o dashboard já lê dados reais de `CampaignData`, com a ressalva do item 3 acima.

---

## 11. Convenções do projeto

- **Idioma:** textos de interface e comentários em **português**; nomes de variáveis e componentes misturam inglês (`impressions`, `clicks`) e português (`criativo`, `dia`), espelhando os campos da planilha. Mantenha esse padrão.
- **Componentes:** um componente por arquivo, `PascalCase.jsx`, `export default`.
- **Imports:** sempre com alias `@/` (ex.: `@/components/dashboard/MetricCard`).
- **Estilo:** apenas classes Tailwind usando os tokens do tema (`bg-card`, `text-muted-foreground`, `bg-primary`...). Evite cores hex soltas.
- **Classes condicionais:** use `cn()` de `@/lib/utils`.
- **Acesso a dados:** sempre via `base44` de `@/api/base44Client`. Nunca crie outro cliente.
- **Lint:** rode `npm run lint` antes do push.
- **Segredos:** nunca commite `.env*` nem `base44/.app.jsonc` (já estão no `.gitignore`). Credenciais externas (Google etc.) ficam nos **conectores do Base44**, nunca no código.

---

## 12. Troubleshooting

| Sintoma | Causa provável | O que fazer |
| --- | --- | --- |
| Dashboard todo zerado | `CampaignData` vazia ou sync falhou | No Base44, rode a função `syncSheetsData` manualmente e veja o retorno/logs. |
| Retorno do sync com `col_indexes` = `-1` | Cabeçalho da planilha mudou de nome | Ajuste o cabeçalho na planilha ou o `findIndex` em `entry.ts` (ver tabela 5.1). |
| `Sheets API error` (401/403) | Conector Google expirou ou perdeu acesso à planilha | Reconecte o conector `googlesheets` no painel do Base44 e confirme o compartilhamento da planilha. |
| Cidade nos KPIs mas não no mapa | Falta entrada em `GEO_COORDS` ou o nome difere | Ver [6.3](#63-apareceu-uma-cidade-nova-na-planilha-e-ela-não-aparece-no-mapa). |
| Gráfico de tendência fora de ordem | Datas fora do padrão `dd/mm/aaaa` | Padronize a coluna "dia" na planilha. |
| Tela "usuário não registrado" | Usuário não foi convidado no app | Convide-o pelo painel do Base44. |
| Alteração enviada não aparece no app | Push em branch diferente de `main` ou falta **Publish** | Confira a branch e publique no Base44. |
| Erro local "app_id null" / loop de login | `.env.local` ausente ou errado | Ver [seção 7](#7-rodando-localmente-opcional). |

---

**Links úteis:** [Base44 Docs](https://docs.base44.com) · [Integração GitHub do Base44](https://docs.base44.com/Integrations/Using-GitHub) · [Suporte Base44](https://app.base44.com/support)

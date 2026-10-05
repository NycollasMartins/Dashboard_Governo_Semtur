# Pontos de Atenção — SemTur Dashboard

> Documento de trabalho com todas as observações técnicas levantadas na revisão do projeto.
> Use como checklist. Itens estão organizados por **prioridade** e **camada**.

---

## Sumário

1. [Diagnóstico em uma frase](#diagnóstico-em-uma-frase)
2. [O que MANTER (já está bom)](#o-que-manter-já-está-bom)
3. [Quick Wins (1–2h cada)](#quick-wins-12h-cada)
4. [Médio prazo (1–2 dias cada)](#médio-prazo-12-dias-cada)
5. [Longo prazo (1+ semana)](#longo-prazo-1-semana)
6. [Riscos latentes](#riscos-latentes)
7. [Plano de execução sugerido](#plano-de-execução-sugerido)

---

## Diagnóstico em uma frase

> A **casca visual** está sólida. O **esqueleto de composição** está OK com ajustes pontuais. Os **órgãos internos** (camada de dados, tipos, integração com API real) precisam ser construídos. Hoje o projeto é um *storyboard interativo de alta fidelidade*; com ~1 semana de engenharia vira produto.

---

## O que MANTER (já está bom)

Não reescrever. Estes itens estão bem feitos:

- [x] **Stack moderna** — Vite 6 + React 18 + Tailwind 3 + shadcn/ui + Radix + TanStack Query + Recharts + Leaflet + Framer Motion.
- [x] **Sistema de design** — `src/index.css` com tokens HSL e tema dark mapeado; `tailwind.config.js` consumindo via `hsl(var(--token))`. Trocar tema/white-label é trivial.
- [x] **Componentes shadcn/ui** em `src/components/ui/` — código próprio, customizável.
- [x] **Identidade visual dos blocos** — `MetricCard`, `TrendChart`, `CampaignTable`, `TopCreatives`, `TopCityCard`, `CityTable`, `CityMap`. Não tocar.
- [x] **Separação container/presentational** — `Dashboard → tabs/* → blocos/*`.
- [x] **AuthContext** — três fases (`public settings → token check → user hydration`) com mapeamento de erros 403 do Base44.
- [x] **Tipografia** — Sora (títulos) + Inter (texto), carregadas via Google Fonts.
- [x] **ESLint flat config** — moderno, com `unused-imports` e `react-hooks`.

---

## Quick Wins (1–2h cada)

### QW-01 · Centralizar `fmt` (DRY)

**Problema:** A função abaixo está duplicada em **6 arquivos**:

```js
function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return n;
}
```

Aparece em: `src/pages/Dashboard.jsx`, `src/components/dashboard/CityMap.jsx`, `src/components/dashboard/CityTable.jsx`, `src/components/dashboard/tabs/CitiesTab.jsx`, `src/components/dashboard/TopCreatives.jsx`, `src/components/dashboard/TopCityCard.jsx`.

**Ação:** Criar `src/lib/format.js` com `fmt`, `formatCurrencyBRL`, `formatPct`. Remover duplicatas.

- [ ] Criar `src/lib/format.js`
- [ ] Substituir as 6 cópias por `import { fmt } from "@/lib/format"`

---

### QW-02 · Customizar `index.html`

**Problema atual:**

- `<title>Base44 APP</title>` (genérico)
- `favicon` ainda é o do Base44 (`https://base44.com/logo_v2.svg`)
- `<link rel="manifest" href="/manifest.json" />` referencia arquivo inexistente
- Sem `meta description`, OG tags, theme-color

**Ação:**

- [ ] Trocar `<title>` para "SemTur — Mídia Programática"
- [ ] Adicionar favicon próprio em `public/favicon.svg`
- [ ] Criar `public/manifest.json` ou remover a tag
- [ ] Adicionar `<meta name="description" content="...">`, `<meta name="theme-color" content="#E68A40">` e OG tags

---

### QW-03 · Limpar dependências mortas

**Problema:** O `package.json` tem várias libs **instaladas mas nunca importadas**, herdadas do template Base44:

- [ ] `three`
- [ ] `jspdf`
- [ ] `html2canvas`
- [ ] `react-quill`
- [ ] `embla-carousel-react`
- [ ] `@hello-pangea/dnd`
- [ ] `vaul`
- [ ] `canvas-confetti`
- [ ] `react-markdown`
- [ ] `input-otp`
- [ ] `@stripe/react-stripe-js`, `@stripe/stripe-js`
- [ ] Avaliar duplicatas de toast: `@radix-ui/react-toast` (em uso), `sonner`, `react-hot-toast` (não usados)

**Como verificar:** `rg -l "from ['\"]<nome-pacote>" src/` antes de remover.

---

### QW-04 · `.env.example`

**Problema:** README pede `VITE_BASE44_APP_ID` e `VITE_BASE44_APP_BASE_URL`, mas não há template versionado.

- [ ] Criar `.env.example` com as duas variáveis (valores em branco)
- [ ] Documentar no README como copiar para `.env.local`

---

### QW-05 · Remover código órfão

- [ ] **`src/utils/index.ts`** — `createPageUrl()` nunca é importada. Remover ou usar.
- [ ] **`src/components/ProtectedRoute.jsx`** — definido mas nunca aplicado. Decidir: aplicar nas rotas privadas ou remover.

---

### QW-06 · Corrigir `eslint.config.js`

**Problema:**

```js
files: [
  "src/components/**/*.{js,mjs,cjs,jsx}",
  "src/pages/**/*.{js,mjs,cjs,jsx}",
  "src/Layout.jsx",   // ← arquivo não existe
],
```

- [ ] Remover referência a `src/Layout.jsx`
- [ ] Considerar habilitar `react-hooks/exhaustive-deps` (hoje só `rules-of-hooks` está ativo)

---

### QW-07 · `.gitignore` com duplicata

```
.env          ← linha 2
.env.*        ← linha 3
...
.env          ← linha 30 (duplicata)
```

- [ ] Remover linha 30

---

### QW-08 · Respeitar `prefers-reduced-motion`

**Problema:** Praticamente todo bloco usa Framer Motion sem checar a preferência do usuário. Falha de acessibilidade para usuários com sensibilidade vestibular.

**Ação:** Wrapper que desliga animações quando o SO sinaliza:

- [ ] Criar `src/lib/motion.js` exportando wrapper sobre `motion.div` que respeita `useReducedMotion()` do Framer Motion
- [ ] Substituir `motion.div` direto pelos blocos do dashboard

---

### QW-09 · `utils.js` com side-effect questionável

```js
// src/lib/utils.js linha 9
export const isIframe = window.self !== window.top;
```

**Problemas:** Avaliado no carregamento do módulo; quebra em ambientes sem `window` (SSR, testes).

- [ ] Transformar em função: `export const isIframe = () => window.self !== window.top`
- [ ] Mover para arquivo próprio (`src/lib/runtime.js`) — `cn()` é helper visual, não pertence junto

---

## Médio prazo (1–2 dias cada)

### MP-01 · Camada de dados (substituir mocks por API)

**Estado atual:** `src/pages/Dashboard.jsx` importa `CAMPAIGNS, CITIES_DATA, CREATIVES, DAILY_TREND` direto de `mockData.js` e calcula KPIs no escopo do módulo:

```js
const totalImpressions = CITIES_DATA.reduce((s, c) => s + c.impressions, 0);
const totalClicks = CITIES_DATA.reduce((s, c) => s + c.clicks, 0);
// ...
const METRICS = [...];  // constante module-scoped — não reage a dados frescos
```

Consequências:
- Cálculo é executado **uma única vez** no carregamento do JS
- TanStack Query está instalado mas **não é usado em lugar algum**
- `@base44/sdk` está configurado mas não chama nenhuma entity
- Botão "Atualizar dados" do `DashboardHeader.jsx` é decorativo

**Estrutura proposta:**

```
src/
  data/
    queries.js          → useCities(), useCampaigns(), useCreatives(), useDailyTrend()
    selectors.js        → computeKPIs(cities, campaigns), top5(cities)
    mockAdapter.js      → mocks que satisfazem o mesmo contrato
    apiAdapter.js       → chamadas Base44 reais
```

E o componente:

```jsx
const { data: cities = [], isLoading } = useCities();
const metrics = useMemo(() => computeKPIs(cities, campaigns), [cities, campaigns]);
```

- [ ] Criar `src/data/queries.js` com TanStack Query
- [ ] Criar `src/data/selectors.js` para KPIs e ordenações
- [ ] Refatorar `Dashboard.jsx` para consumir hooks
- [ ] Refatorar `OverviewTab.jsx`, `CitiesTab.jsx`, `CampaignsTab.jsx`
- [ ] Implementar **loading states** (Skeletons já existem em `components/ui/skeleton.jsx`)
- [ ] Implementar **error states**
- [ ] Conectar botão "Atualizar dados" (`refetch` do TanStack Query)

---

### MP-02 · Trocar abas por rotas reais

**Estado atual:** As 3 abas trocam por `useState("overview"|"cities"|"campaigns")`. Não há deep-link, back/forward não funciona, analytics não distingue visitas.

**Ação:**

- [ ] Criar rotas: `/`, `/cities`, `/campaigns`
- [ ] Usar `<NavLink>` do react-router no `Sidebar.jsx`
- [ ] Aplicar `<ProtectedRoute>` (ou equivalente) nas rotas privadas
- [ ] Adicionar fallback para rotas inválidas (já existe `PageNotFound`)

---

### MP-03 · Error Boundary por aba

**Problema:** Se o Leaflet (ou qualquer outro componente pesado) explodir, a tela inteira fica branca.

- [ ] Criar `src/components/ErrorBoundary.jsx`
- [ ] Embrulhar cada `Outlet`/aba
- [ ] Considerar usar `errorElement` do React Router v6

---

### MP-04 · `useMemo` para derived data

**Problema:** Sort, max e KPIs são recalculados a cada render:

- `CityMap.jsx` linha 113: `Math.max(...cities.map(...))`
- `CitiesTab.jsx` linha 12: `[...cities].sort(...)`
- `OverviewTab.jsx` linha 8: `[...cities].sort(...).slice(0, 5)`
- `TopCreatives.jsx` linha 13: `[...creatives].sort(...).slice(0, 6)`
- `TopCityCard.jsx` linha 20: `[...cities].sort(...)`

Em 10 cidades não importa; em 1000 vira problema.

- [ ] Aplicar `useMemo` em todos os derived data
- [ ] Mover sorts/maxes para `src/data/selectors.js` (depois de MP-01)

---

### MP-05 · Quebrar `CityMap.jsx` em arquivos menores

**Problema:** 197 linhas com 4 componentes amontoados:

- `InvalidateSize` (helper Leaflet)
- `MapMarkers`
- `CityDetailsSidebar` (60 linhas — merece arquivo próprio)
- `CityMap` (orquestrador + lógica de fullscreen)

Bug latente: hoje, ao entrar em fullscreen, o card normal mostra texto "Mapa em tela cheia" (gambiarra). O ideal é Portal para overlay, mantendo um único `<MapContainer>` montado.

- [ ] Extrair `src/components/dashboard/CityDetailsSidebar.jsx`
- [ ] Extrair `src/components/dashboard/MapMarkers.jsx`
- [ ] Extrair helper `src/components/dashboard/leaflet/InvalidateSize.jsx`
- [ ] Refatorar fullscreen com `createPortal`

---

### MP-06 · Acessibilidade básica

- [ ] **`Sidebar.jsx`** — adicionar `aria-current="page"` ao botão da aba ativa
- [ ] **Cards interativos** com `onClick` em `<motion.div>` → trocar por `<button>` ou adicionar `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter/Space). Afetados:
  - `CitiesTab.jsx` (linhas das cidades)
  - `CityTable.jsx` (PodiumCard e linhas)
  - `CityMap.jsx` (CircleMarker — opções limitadas, mas o painel lateral conta)
- [ ] **Mapa Leaflet** — adicionar `aria-label` no container e oferecer alternativa textual (a tabela de ranking abaixo já cumpre, mas linkar com `aria-describedby`)
- [ ] **Recharts CustomTooltip** — verificar leitor de tela
- [ ] **Focus rings** consistentes (Tailwind `focus-visible:ring-2 ring-primary`)

---

### MP-07 · Tipos do domínio + validação Zod

> Pré-requisito conceitual para LP-01 (TypeScript). Pode começar antes da migração total.

- [ ] Criar `src/types/domain.js` com schemas Zod (Zod já está instalado)
- [ ] Modelar: `City`, `Campaign`, `Creative`, `DailyTrendPoint`, `CampaignStatus`, `Channel`
- [ ] Validar dados na borda da API (`apiAdapter.js`)
- [ ] Garantir que mocks satisfaçam os mesmos schemas

**Por que importa:** quando a API real chegar, qualquer drift de schema (ex.: `status: "PAUSED"` em vez de `"paused"`, `latitude` em vez de `lat`) vai estourar com mensagem clara em vez de virar bug silencioso.

---

## Longo prazo (1+ semana)

### LP-01 · Migrar para TypeScript

**Por que neste projeto especificamente:** o app é tubulação de dados (`API → fetch → render`). Sem TS, qualquer typo em prop ou divergência de schema vira `undefined` em runtime. Com TS + Zod, o contrato é encodado uma vez e o compilador valida em todo lugar.

**Custo realista:** 1–2 dias para migrar todo o projeto (12 componentes de domínio, sem lógica complexa).

**Tudo já está instalado:**
- [x] `typescript: ^5.8.2`
- [x] `@types/react`, `@types/react-dom`, `@types/node`
- [x] `zod: ^3.24.2`
- [x] Script `npm run typecheck` já existe

**Ordem sugerida:**

- [ ] Renomear `jsconfig.json` → `tsconfig.json` com `allowJs: true, strict: true, noUncheckedIndexedAccess: true`
- [ ] Criar `src/types/domain.ts` (schemas Zod + `z.infer`)
- [ ] Converter `src/lib/mockData.js` → `mockData.ts`
- [ ] Converter `src/lib/format.js` → `format.ts` (se já criado em QW-01)
- [ ] Converter `src/data/*` (criados em MP-01)
- [ ] Tipar componentes do dashboard (12 arquivos), começando pelos folhas (blocos) e subindo
- [ ] Tipar `AuthContext`, `app-params`, cliente Base44

---

### LP-02 · Testes

**Estado atual:** zero testes.

- [ ] Configurar **Vitest** (já há suporte natural ao Vite)
- [ ] Testes unitários para `src/data/selectors.ts` (KPIs, sorts, formatação)
- [ ] Testes para `src/lib/format.ts`
- [ ] Considerar **Playwright** para fluxos críticos (login, navegação entre abas, filtro de cidade)

---

### LP-03 · Storybook (opcional)

- [ ] Subir Storybook para os componentes em `src/components/ui/` e blocos do dashboard
- [ ] Vira documentação viva e ambiente de desenvolvimento isolado para componentes

---

### LP-04 · CI

- [ ] GitHub Actions com: `npm ci` → `lint` → `typecheck` → `build` → (testes quando existirem)
- [ ] Bloquear merge em PRs com erro

---

## Riscos latentes

| Risco | Probabilidade | Impacto | Mitigação |
| :--- | :---: | :---: | :--- |
| Drift de schema entre mocks e API real | **Alta** | Médio | MP-07 + LP-01 |
| Migração TS dolorosa se postergada | Média | Médio | Fazer agora (LP-01) |
| Lentidão com 1000+ cidades | Média | Médio | MP-04 + virtualização |
| Auditoria de a11y externa | Alta | Alto | MP-06 |
| Bundle gordo no Lighthouse | Alta | Baixo | QW-03 |
| Tela branca em produção (sem ErrorBoundary) | Média | Alto | MP-03 |
| Bugs silenciosos por falta de TS | **Alta** | Alto | LP-01 |

---

## Plano de execução sugerido

### Semana 1 — Fundação

**Dia 1 — Limpeza (Quick Wins)**
- [ ] QW-01 (centralizar `fmt`)
- [ ] QW-03 (dependências mortas)
- [ ] QW-04 (.env.example)
- [ ] QW-05 (código órfão)
- [ ] QW-06 (eslint config)
- [ ] QW-07 (.gitignore)
- [ ] QW-09 (utils.js side-effect)

**Dias 2–3 — TypeScript + tipos do domínio**
- [ ] LP-01 (migração TS, parcial — começar pelos tipos)
- [ ] MP-07 (schemas Zod)

**Dias 4–5 — Camada de dados**
- [ ] MP-01 (TanStack Query + adapters)
- [ ] MP-04 (`useMemo` para derived data)

### Semana 2 — Maturação

**Dias 6–7 — Roteamento e resiliência**
- [ ] MP-02 (rotas reais para abas)
- [ ] MP-03 (Error Boundary)

**Dia 8 — UX e polish**
- [ ] QW-02 (index.html)
- [ ] QW-08 (prefers-reduced-motion)
- [ ] MP-06 (a11y básica)

**Dia 9 — Refactor estrutural**
- [ ] MP-05 (quebrar CityMap)

**Dia 10 — Testes e CI**
- [ ] LP-02 (Vitest + selectors)
- [ ] LP-04 (GitHub Actions)

> Total: **~10 dias úteis** para sair do estado de "storyboard interativo" para "produto maduro" — sem que o cliente note diferença visual durante a transição.

---

## Como usar este documento

1. **Marque os checkboxes** conforme avança.
2. **Comente** decisões tomadas (ex.: "QW-03 — mantemos `react-hot-toast` porque será usado no módulo X").
3. **Atualize o diagnóstico** ao final de cada sprint.
4. **Não trate como roteiro rígido** — re-priorize conforme o backend real chegar.

---

_Última atualização: 7 de maio de 2026_

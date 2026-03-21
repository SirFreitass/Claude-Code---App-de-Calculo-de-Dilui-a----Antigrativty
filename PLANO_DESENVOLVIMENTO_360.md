# Plano de Desenvolvimento 360° — Dona Help Hub de Suprimentos

> **Versão**: 1.0
> **Data**: 2026-03-21
> **Autor**: CTO / Product Design Lead
> **Stack**: Next.js 14 · Tailwind CSS 3.4 · Supabase · React Context

---

## Diagnóstico do Estado Atual

### O que já funciona bem
- Arquitetura sólida: Next.js App Router, TypeScript tipado, Context + useReducer
- Calculadora de diluição com wizard 3 passos e cálculos precisos (arredondamento em ml)
- Estoque com status semafórico (ok/baixo/crítico/zerado) e barras de progresso
- Catálogo de produtos com CRUD completo, QR Code e etiquetas
- Compras com análise de tendência e preço médio ponderado
- Supabase sync com optimistic UI

### O que precisa evoluir
- **Branding inexistente**: sem logotipo profissional, naming genérico, sem tom de voz definido
- **Design System ausente**: componentes inline com classes Tailwind repetidas (~15 variações de botão espalhadas)
- **Inconsistências visuais**: STATUS_CFG duplicado em 3 arquivos, SummaryCard definido inline
- **UX de segurança na diluição**: sem confirmação visual de "receita correta", sem warnings de concentração perigosa
- **Estoque sem filtros**: não filtra por status, sem busca, sem export

---

## 1. Fase de Branding e Identidade

### 1.1 Estratégia de Marca

**Posicionamento**: "O hub inteligente que simplifica a operação diária da franquia"

**Atributos de marca**:
| Atributo | Tradução Visual |
|----------|----------------|
| Confiança | Cores sólidas, tipografia estável, espaçamento generoso |
| Eficiência | Interfaces limpas, ações diretas, feedback imediato |
| Segurança | Alertas claros, confirmações em ações críticas, semáforo de status |
| Profissionalismo | Consistência visual, hierarquia tipográfica, micro-interações sutis |

### 1.2 Paleta de Cores (Refinada)

Manter a base teal/brand atual (já estabelecida no tailwind.config.ts), mas **formalizar** com propósito semântico:

```
BRAND (Identidade Principal)
├── brand-500  #14b8a6  → Ações primárias, links, progress bars
├── brand-600  #0d9488  → Hover states, sidebar active
├── brand-700  #0f766e  → Pressed states
├── brand-50   #f0fdf9  → Backgrounds sutis, badges

SEMANTIC (Significado Funcional)
├── success    emerald  → Estoque OK, entrada confirmada, cálculo correto
├── warning    amber    → Estoque baixo, diluição média, atenção
├── danger     red      → Estoque zerado, diluição pesada, erros
├── critical   orange   → Estoque crítico, limiar de perigo
├── info       blue     → Dicas, instruções, água na diluição
├── accent     violet   → Preços, métricas financeiras, ações secundárias

NEUTRAL (Estrutura)
├── gray-900   → Texto primário, sidebar
├── gray-500   → Texto secundário
├── gray-200   → Bordas
├── gray-50    → Fundos de página
├── white      → Cards, modais
```

### 1.3 Tipografia

**Decisão**: Manter Inter (já implementada) — é neutra, altamente legível em telas pequenas e profissional.

**Escala tipográfica padronizada**:
```
display    → text-2xl  font-bold     → Títulos de página (h1)
heading    → text-lg   font-semibold → Títulos de seção
subheading → text-base font-semibold → Subtítulos de card
body       → text-sm   font-normal   → Texto corrido
caption    → text-xs   font-medium   → Labels, metadata
micro      → text-[11px] font-medium → Timestamps, badges menores
overline   → text-[10px] uppercase tracking-widest font-semibold → Seção labels
```

### 1.4 Tom de Voz

**Princípios**:
- **Direto**: "Selecione o produto" (não "Por favor, escolha o produto desejado")
- **Orientado a ação**: "Dar Entrada" / "Registrar Saída" (verbos imperativos)
- **Empático em erros**: "Sem compras registradas — custo indisponível" (explica o porquê)
- **Técnico quando necessário**: Proporções e medidas exatas, sem arredondamentos ambíguos

**Padrão de microcopy**:
| Contexto | Padrão |
|----------|--------|
| Títulos de página | Substantivo ("Estoque", "Dashboard") |
| Subtítulos | Frase curta descritiva ("Controle de saldos e histórico") |
| Botões primários | Verbo + Objeto ("Salvar Produto", "Calcular Diluição") |
| Estados vazios | Descrição + orientação ("Nenhum alerta — todos os estoques estão OK.") |
| Alertas | Gravidade + ação sugerida |

---

## 2. Criação do Design System

### 2.1 Arquitetura de Tokens

Criar um arquivo central `src/lib/design-tokens.ts` que exporte todas as constantes visuais:

```typescript
// Tokens semânticos reutilizáveis
export const tokens = {
  status: {
    ok:      { bg, text, dot, border, label },
    baixo:   { bg, text, dot, border, label },
    critico: { bg, text, dot, border, label },
    zerado:  { bg, text, dot, border, label },
  },
  dilution: {
    Leve:   { color, bgActive, bgIdle, border, ring, dot },
    Media:  { ... },
    Pesada: { ... },
  },
  spacing: { page, section, card, inline },
  radius:  { sm, md, lg, xl, full },
}
```

**Benefício**: Elimina as 3 cópias de `STATUS_CFG` (page.tsx dashboard, estoque/page.tsx, e inline no layout).

### 2.2 Componentes Primitivos (Design System)

Criar `src/components/ui/` com componentes atômicos:

| Componente | Responsabilidade | Substitui |
|-----------|-----------------|-----------|
| `Button` | Variantes: primary, secondary, ghost, danger | ~15 botões inline com classes repetidas |
| `Badge` | Status badges com dot indicator | Badges inline em estoque, dashboard, produtos |
| `Card` | Container padrão com header opcional | Seções `bg-white rounded-2xl border` repetidas |
| `Input` | Text, number, select com estados | Inputs customizados na calculadora e modais |
| `Modal` | Container de modal com overlay | Lógica de modal duplicada em 5+ componentes |
| `ProgressBar` | Barra visual com % e cor semântica | Barras inline no estoque |
| `StatCard` | Card de KPI com trend | StatCard inline no dashboard |
| `StatusBadge` | Badge com cor de status automática | Badges de status inline |
| `SectionHeader` | Cabeçalho de seção padronizado | Headers inline em cada página |
| `EmptyState` | Estado vazio padrão | EmptyState inline no estoque |

### 2.3 Estratégia de Implementação

**Abordagem "Strangler Fig"** — envolver componentes existentes progressivamente:

```
Semana 1: Criar tokens + Button + Badge + Card (fundação)
Semana 2: Migrar Dashboard e Estoque para novos componentes
Semana 3: Migrar Calculadora de Diluição e Produtos
Semana 4: Migrar Modais e Compras
```

Cada migração é um PR isolado. O código antigo continua funcionando enquanto o novo é introduzido.

---

## 3. Auditoria e Refatoração de Código

### 3.1 Mapa de Débito Técnico

| Arquivo | Problema | Prioridade |
|---------|----------|-----------|
| `app/page.tsx` | `StatCard` definido inline, deveria ser componente UI | Alta |
| `app/estoque/page.tsx` | `SummaryCard` + `EmptyState` inline, `STATUS_CFG` duplicado | Alta |
| `app/diluicoes/page.tsx` | `NIVEL_CFG` hardcoded, poderia usar design tokens | Média |
| `components/produtos/*.tsx` | 5 modais com lógica de overlay repetida | Média |
| `contexts/AppContext.tsx` | Estado monolítico (~400 linhas), poderia ser dividido | Baixa |
| `tailwind.config.ts` | Apenas brand colors, falta semantic tokens | Alta |

### 3.2 Estratégia de Refatoração (Sem Interrupção)

**Princípio**: Nunca quebrar o que funciona. Cada PR deve:
1. Adicionar o novo componente/token
2. Migrar 1-2 páginas para usá-lo
3. Remover o código inline antigo
4. Rodar build + verificar visualmente

**Branch strategy**:
```
main
  └── feature/design-system-tokens     (tokens + theme)
  └── feature/ui-primitives            (Button, Badge, Card, etc.)
  └── feature/migrate-dashboard        (refactor dashboard)
  └── feature/migrate-estoque          (refactor estoque)
  └── feature/migrate-diluicoes        (refactor calculadora)
  └── feature/migrate-modais           (refactor modais)
```

### 3.3 Adequação CSS ao Plano de Marca

**Ações imediatas**:

1. **Expandir tailwind.config.ts** com tokens semânticos:
```typescript
colors: {
  brand: { ... },  // já existe
  surface: { page: '#f9fafb', card: '#ffffff', elevated: '#ffffff' },
  semantic: {
    success: colors.emerald,
    warning: colors.amber,
    danger: colors.red,
    info: colors.blue,
  }
}
```

2. **Criar CSS custom properties** em globals.css para temas futuros:
```css
:root {
  --color-brand: 20 184 166;  /* brand-500 em RGB */
  --radius-card: 1rem;        /* rounded-2xl */
  --radius-button: 0.75rem;   /* rounded-xl */
}
```

3. **Padronizar spacing** via tokens:
```
page-padding: p-4 sm:p-6 lg:p-8  (já usado consistentemente - manter)
card-padding: p-5                  (padronizar)
section-gap: gap-6                 (padronizar)
```

---

## 4. UX Específica para as Funcionalidades

### 4.1 Calculadora de Diluição — Melhorias de UX

#### Estado Atual (Bom)
- Wizard 3 passos com progress bar
- Presets de volume rápido
- Barra visual de proporção
- Custo automático

#### Melhorias Propostas

**A) Segurança Visual — "Receita Confirmada"**
```
Após calcular, exibir um card de confirmação com:
┌─────────────────────────────────────┐
│ ✓ Receita Verificada                │
│                                     │
│  PRODUTO:  Desinfetante XYZ         │
│  NÍVEL:    Pesada (1:10)            │
│  VOLUME:   10L                      │
│                                     │
│  → 909ml de concentrado             │
│  → 9.091L de água                   │
│                                     │
│  ⚠ DILUIÇÃO PESADA                  │
│  Use luvas e óculos de proteção.    │
│  Área bem ventilada obrigatória.    │
│                                     │
│  [Imprimir Ficha]  [Nova Receita]   │
└─────────────────────────────────────┘
```

**B) Alertas de EPI por Nível**
- **Leve**: Sem alertas especiais
- **Média**: Banner azul "Recomendado: luvas de borracha"
- **Pesada**: Banner vermelho com ícone de warning "OBRIGATÓRIO: Luvas, óculos, ventilação"

**C) Visualização da Proporção (Aprimorada)**
- Substituir barra simples por **ícone de balde/recipiente** com nível visual
- Animação de "enchimento" ao calcular
- Tooltip mostrando ml exato em cada parte

**D) Checklist de Segurança para Diluição Pesada**
```
Antes de preparar esta solução:
☐ Estou usando luvas de proteção
☐ Estou usando óculos de proteção
☐ O ambiente está ventilado
☐ Tenho o recipiente adequado para {volume}L
[Confirmar e Visualizar Receita]
```

**E) Histórico de Receitas Preparadas** (Feature Futura)
- Log de diluições realizadas com data/hora/responsável
- Vinculado ao consumo de estoque

### 4.2 Gestão de Estoque — Melhorias de UX

#### Estado Atual (Bom)
- Cards com status semafórico e barra de progresso
- Histórico de movimentações
- Entry/exit modals

#### Melhorias Propostas

**A) Filtros e Busca**
```
┌─ Filtros ────────────────────────────────┐
│ [Buscar por nome...]  [Todos ▾] [Status ▾] │
│  ● Todos (24)  ● Crítico (3)  ● Baixo (5) │
└──────────────────────────────────────────┘
```

**B) Vista em Tabela vs Cards**
- Toggle entre visualização em **cards** (atual, bom para mobile) e **tabela** (melhor para desktop com muitos produtos)
- Tabela com colunas: Produto | Qtd Atual | Mínimo | Status | % | Ações

**C) Gráfico de Tendência por Produto**
- Mini sparkline mostrando consumo dos últimos 30 dias
- Previsão simples: "Baseado no consumo, estoque acaba em ~X dias"

**D) Alertas Proativos**
```
┌─ Alerta de Reposição ─────────────────────┐
│ ⚠ 3 produtos precisam de reposição        │
│                                             │
│ • Desinfetante ABC — zerado há 3 dias      │
│ • Detergente XYZ — crítico (2L restantes)  │
│ • Limpador 123 — baixo (5L de 10L mín)    │
│                                             │
│ [Ver Todos]  [Gerar Pedido de Compra]      │
└─────────────────────────────────────────────┘
```

**E) Agrupamento por Categoria**
- Opção de ver estoque agrupado por categoria (Desinfetantes, Detergentes, etc.)
- Accordion com resumo de status por grupo

**F) Exportação**
- Botão "Exportar Relatório" gerando PDF ou CSV com posição atual do estoque
- Útil para auditorias da franqueadora

---

## 5. Roadmap de Implementação

### Sprint 0 — Fundação (Semana 1)
| # | Tarefa | Arquivos | Esforço |
|---|--------|----------|---------|
| 0.1 | Criar `design-tokens.ts` com todos os tokens centralizados | `src/lib/design-tokens.ts` | P |
| 0.2 | Expandir `tailwind.config.ts` com semantic tokens | `tailwind.config.ts` | P |
| 0.3 | Criar CSS variables em `globals.css` para theming | `globals.css` | P |
| 0.4 | Criar componentes base: `Button`, `Badge`, `Card` | `src/components/ui/*` | M |

### Sprint 1 — Design System Core (Semana 2)
| # | Tarefa | Arquivos | Esforço |
|---|--------|----------|---------|
| 1.1 | Criar `Input`, `Select`, `Modal` base | `src/components/ui/*` | M |
| 1.2 | Criar `StatusBadge`, `ProgressBar`, `StatCard` | `src/components/ui/*` | M |
| 1.3 | Migrar Dashboard para usar componentes UI | `app/page.tsx` | M |
| 1.4 | Eliminar `StatCard` inline, usar do Design System | `app/page.tsx` | P |

### Sprint 2 — Refatoração Estoque (Semana 3)
| # | Tarefa | Arquivos | Esforço |
|---|--------|----------|---------|
| 2.1 | Migrar Estoque para componentes UI | `app/estoque/page.tsx` | M |
| 2.2 | Eliminar `SummaryCard` e `EmptyState` inline | `app/estoque/page.tsx` | P |
| 2.3 | Adicionar filtros por status e busca | `app/estoque/page.tsx` | M |
| 2.4 | Unificar `STATUS_CFG` em design-tokens | Vários | M |

### Sprint 3 — Refatoração Calculadora (Semana 4)
| # | Tarefa | Arquivos | Esforço |
|---|--------|----------|---------|
| 3.1 | Migrar Calculadora para componentes UI | `app/diluicoes/page.tsx` | M |
| 3.2 | Adicionar alertas de EPI por nível | `app/diluicoes/page.tsx` | M |
| 3.3 | Migrar `NIVEL_CFG` para design-tokens | `lib/design-tokens.ts` | P |
| 3.4 | Card de "Receita Confirmada" com impressão | `app/diluicoes/page.tsx` | G |

### Sprint 4 — Refatoração Modais + Produtos (Semana 5)
| # | Tarefa | Arquivos | Esforço |
|---|--------|----------|---------|
| 4.1 | Criar `Modal` base e migrar todos os modais | `components/ui/Modal.tsx` + 5 modais | G |
| 4.2 | Migrar Produtos para componentes UI | `app/produtos/page.tsx` | M |
| 4.3 | Migrar Compras para componentes UI | `app/compras/page.tsx` | M |

### Sprint 5 — Novas Features (Semanas 6-8)
| # | Tarefa | Prioridade |
|---|--------|-----------|
| 5.1 | Checklist de segurança para diluição pesada | Alta |
| 5.2 | Filtros avançados no estoque (status, categoria, busca) | Alta |
| 5.3 | Vista tabela vs cards no estoque | Média |
| 5.4 | Previsão de consumo (dias restantes) | Média |
| 5.5 | Histórico de receitas preparadas | Média |
| 5.6 | Export PDF/CSV do estoque | Média |
| 5.7 | Dark mode via CSS variables | Baixa |
| 5.8 | Autenticação + Roles (franqueador vs franqueado) | Alta |
| 5.9 | Notificações push para estoque crítico | Baixa |

### Legenda de Esforço
- **P** = Pequeno (~2h)
- **M** = Médio (~4-8h)
- **G** = Grande (~1-2 dias)

---

## Premissas Técnicas

### Reutilização Máxima
- **100% do estado** (AppContext + useReducer) é reaproveitado
- **100% do backend** (Supabase sync) é reaproveitado
- **100% da lógica de cálculo** (types/index.ts) é reaproveitada
- **~70% do JSX** é reaproveitado, envolvido em componentes do Design System
- **~30% das classes Tailwind** são substituídas por tokens centralizados

### Mudanças Estruturais Recomendadas
1. **Criar `src/components/ui/`** — pasta obrigatória para primitivos
2. **Criar `src/lib/design-tokens.ts`** — single source of truth para tokens visuais
3. **Expandir `tailwind.config.ts`** — semantic colors, spacing presets, font sizes
4. **Adicionar CSS custom properties** — preparação para dark mode e theming por franquia
5. **Extrair modais para componente base** — reduz ~200 linhas de código duplicado

### O que NÃO mudar
- Next.js App Router (arquitetura correta)
- React Context + useReducer (adequado para o tamanho do app)
- Supabase como backend (bem implementado)
- Inter como fonte (profissional e legível)
- Tailwind CSS como engine (eficiente e já dominado pelo time)
- Estrutura de pastas `app/` (convenção Next.js)

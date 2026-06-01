# CRM & Membership Admin — Plano de Construção

Funcionalidade muito grande. Vou entregar em **3 fases**, cada uma testável de forma independente, para evitar uma migração gigante + dezenas de ficheiros num só commit.

---

## Fase 1 — Fundação de dados (migração Supabase)

Sem dados, o CRM mostra apenas mocks. Esta fase cria todo o schema necessário.

### Novas tabelas (todas em `public`, com GRANTs e RLS admin/staff)

- **`customer_profiles`** — vista enriquecida por utilizador
  - `user_id`, `assigned_to` (staff), `lifecycle_stage` (enum: lead, new, active_subscriber, loyal, at_risk, churned), `health_score` (0–100), `churn_risk_score` (0–100), `ltv_estimated`, `total_spent`, `rfm_score`, `last_contact_at`, `tags` (text[])
- **`customer_interactions`** — contactos registados (call, whatsapp, email, in_person)
  - `customer_id`, `type`, `direction` (inbound/outbound), `duration_min`, `subject`, `summary`, `outcome`, `created_by`, `created_at`
- **`customer_notes`** — notas internas com follow-up
  - `customer_id`, `note_type`, `content`, `is_pinned`, `followup_date`, `followup_done`, `linked_appointment_id`, `linked_order_id`, `created_by`
- **`customer_segments`** — segmentos dinâmicos/estáticos
  - `name`, `description`, `segment_type` (dynamic/static), `conditions` (jsonb), `color`, `created_by`
- **`customer_segment_members`** — para segmentos estáticos (`segment_id`, `customer_id`)
- **`customer_health_snapshots`** — snapshot mensal para sparklines/evolução (`customer_id`, `snapshot_date`, `health_score`, `lifecycle_stage`)
- **`customer_bikes`** — bikes registadas (`customer_id`, `model`, `serial`, `color`, `purchased_at`, `km`, `last_service_at`, `next_service_at`, `is_active`)

### RPC
- `fn_register_contact(...)` — insere interaction + atualiza `last_contact_at`
- `fn_recompute_customer_segment(segment_id)` — recalcula membros dinamicamente
- `fn_log_customer_note(...)` — insere nota + opcionalmente cria follow-up

### Seed mínimo
Popula `customer_profiles` a partir das `profiles` existentes (membros activos) com health/churn fake mas realistas, para a UI ter algo para mostrar de imediato.

---

## Fase 2 — Página `/admin/crm` (4 tabs)

### Estrutura de ficheiros

```
src/pages/admin/AdminCrm.tsx                       (shell com Tabs)
src/pages/admin/crm/CrmOverview.tsx                (Tab 1)
src/pages/admin/crm/CrmCustomers.tsx               (Tab 2)
src/pages/admin/crm/CrmSegments.tsx                (Tab 3)
src/pages/admin/crm/CrmMembership.tsx              (Tab 4)
src/pages/admin/crm/AdminCrmCustomerDetail.tsx     (perfil)
src/hooks/crm/useCrmData.ts                        (queries)
src/hooks/crm/useCustomerProfile.ts
src/components/dashboard/crm/
  ├── KpiTrendCard.tsx
  ├── CustomersTable.tsx          (TanStack Table)
  ├── CustomerEvolutionChart.tsx  (AreaChart stacked)
  ├── PlanHealthRadar.tsx         (RadarChart)
  ├── RiskCustomersList.tsx
  ├── FollowupsList.tsx
  ├── SegmentList.tsx
  ├── SegmentDetail.tsx
  ├── SegmentBuilderDialog.tsx
  ├── MembershipHealthChart.tsx   (ComposedChart)
  ├── LtvFunnelChart.tsx
  └── sheets/
      ├── LogContactSheet.tsx
      ├── AddNoteSheet.tsx
      └── SendMessageSheet.tsx
```

### Rotas
- `/dashboard/admin/crm` → `AdminCrm` com Tabs internas (overview default)
- `/dashboard/admin/crm/:customerId` → `AdminCrmCustomerDetail`

### Tab 1 — Overview
- 6 KPI cards (clientes, health médio, churn, LTV médio, alto risco, follow-ups atrasados) usando reciclagem do `AdminKPICard` (estender com slot opcional para deltas)
- AreaChart 12 meses (4 stacked areas) a partir de `customer_health_snapshots`
- RadarChart por plano (agrega health por plano)
- Risk list (top 5 por churn_risk) + Followups list (followup_date <= today, !done)

### Tab 2 — Customers (TanStack Table)
- Adicionar deps: `@tanstack/react-table`
- 9 colunas conforme spec, filtros (Select plano, etapa, tag; Slider health min), search debounced 300ms
- Bulk actions banner quando há linhas seleccionadas
- Exportar CSV reaproveitando `lib/csv.ts`
- Click na row → navega para perfil

### Tab 3 — Segments
- 2 colunas: lista (ScrollArea) + detalhe
- `SegmentBuilderDialog` com builder condicional simples (campo / operador / valor + AND/OR), preview live com debounce

### Tab 4 — Membership
- `ComposedChart` (barras agrupadas + linha health avg) por plano
- `BarChart` horizontal de LTV
- Tabela resumo por plano com mini-sparklines (`LineChart` 60×20 sem eixos)

---

## Fase 3 — Página de perfil do cliente

### Layout 30/70 (em desktop; empilha em mobile)

**Sidebar (30%)**
- Identity card (Avatar grande + nome + plano + lifecycle)
- 4 botões de acção rápida (2 default, 2 outline)
- Scores card com mini RadarChart (160px alto) + Health/Churn/RFM
- Métricas rápidas
- Tags com Popover + Command para adicionar

**Conteúdo (70%) — Tabs internas**
- **Timeline**: scroll cronológico unificado (interactions + notes + appointments + payments + orders), filtro `ToggleGroup`
- **Bikes**: grid de cards a partir de `customer_bikes`
- **Assinatura**: subscription actual + benefícios + histórico de eventos (`subscription_events` já existe)
- **Financeiro**: 2 gráficos + tabela de payments
- **Notas**: lista filtrável + Dialog inline para adicionar

### Sheets (drawer direito `max-w-md`)
- `LogContactSheet` (com follow-up opcional → cria também `customer_notes`)
- `AddNoteSheet`
- `SendMessageSheet` (Email/WhatsApp tabs — UI apenas; envio real fica para depois, com toast informativo)

---

## Detalhes técnicos chave

- **Charts**: usar `recharts` (já no projecto via `src/components/ui/chart.tsx`)
- **Tabela**: `@tanstack/react-table` (instalar). Virtualização (`@tanstack/react-virtual`) só se >100 clientes — adicionar como melhoria futura, não bloqueia
- **Permissões**: novas chaves em `lib/permissions.ts`: `crm.view`, `crm.edit`, `crm.contact`, `crm.segment.manage` — `admin` tem todas, `staff` tem view + contact
- **Sidebar admin**: adicionar item "CRM" no `AdminSidebar` com ícone `Users`
- **Cores**: usar tokens HSL semânticos do `index.css` para tudo excepto as cores fixas dos gráficos (especificadas no prompt — adiciono como constantes em `crm/colors.ts`)
- **Realtime**: subscrever `customer_interactions` e `customer_notes` para refresh automático da timeline
- **Loading**: `Skeleton` shadcn em todos os fetches
- **Empty states**: componente `EmptyState` já existe — reaproveitar
- **Sonner**: já configurado para toasts

---

## Aprovação

Aprovas avançar com a **Fase 1 (migração Supabase)** primeiro? Após aprovação da migração executo Fases 2 e 3 em sequência sem novas pausas, exceto para instalar dependências (`@tanstack/react-table`).

# Plano — Subscription Plans (Híbrido Stripe + Manual, Versionado)

## 1. Visão Geral

Construir um módulo completo de Subscription Plans dentro de `/dashboard/admin/plans`, mantendo o layout actual (KPIs + charts + tabela) como **página principal**, e adicionando subpáginas de CRUD, detalhe de plano e detalhe de subscriber. Pagamentos são processados via **Stripe** (online, recorrente) **ou** registados **manualmente** (cash/transferência/cartão presencial). Cada plano é **versionado** — alterar o preço não afecta subscribers existentes (grandfathering).

---

## 2. Arquitectura de Páginas

```text
/dashboard/admin/plans                         ← Hub (layout actual mantido)
  └─ KPIs (MRR, ARPU, Churn, Active Subs) + Charts + Tabela global de subscribers

/dashboard/admin/plans/manage                  ← CRUD de planos (lista + criar)
/dashboard/admin/plans/:planId                 ← Detalhe do plano + editor inline
  ├─ KPIs específicos do plano
  ├─ Gráficos de evolução
  ├─ Lista de subscribers desse plano
  └─ Histórico de versões (preço/features)

/dashboard/admin/plans/subscriber/:subscriberId
  ├─ Header: nome, plano actual, status, MRR contribution, LTV, churn risk
  ├─ Tabs: Pagamentos | Histórico de Planos | Faturas | Métodos | Notas
  └─ Acções: registar pagamento manual, mudar plano, cancelar, refund

Modais:
  • PlanFormModal           (criar/editar plano — gera nova versão)
  • RegisterManualPaymentModal
  • ChangePlanModal         (upgrade/downgrade com proration opcional)
  • CancelSubscriptionModal
  • RefundModal
```

---

## 3. Modelo de Dados (Supabase)

### Enums
```sql
plan_interval_enum    : monthly | quarterly | yearly | lifetime
plan_status_enum      : draft | active | archived
subscription_status   : trialing | active | past_due | canceled | paused
payment_method_enum   : stripe_card | stripe_sepa | cash | bank_transfer | pos_card | other
payment_status_enum   : pending | succeeded | failed | refunded
```

### Tabelas principais

**`plans`** — definição base (sem preço, sem features detalhadas)
- name, slug, tier_level (int), description, color_hex, icon
- is_active, display_order, stripe_product_id

**`plan_versions`** — versionamento (grandfathering)
- plan_id, version_number, price, currency, interval, trial_days
- features (jsonb: array de strings ou objects)
- stripe_price_id, status (draft/active/archived), effective_from
- Sempre uma versão `active` por plan; ao editar, nova versão é criada e a anterior fica `archived` mas subscribers antigos continuam ligados a ela.

**`subscriptions`** — uma por subscriber
- user_id, plan_version_id (FK — preserva preço grandfathered), status
- started_at, current_period_start, current_period_end, canceled_at
- stripe_subscription_id (nullable), payment_method (enum)
- cancel_at_period_end (bool)

**`subscription_events`** — audit append-only
- subscription_id, event_type (created|upgraded|downgraded|paused|canceled|reactivated|payment_failed)
- from_plan_version_id, to_plan_version_id, metadata jsonb, created_by

**`payments`** — todos os pagamentos (Stripe + manuais)
- subscription_id, user_id, amount, currency, status
- method (enum), stripe_payment_intent_id (nullable)
- paid_at, period_start, period_end
- recorded_by (nullable — staff que registou manual), notes
- invoice_url (Stripe-hosted ou PDF gerado)

**`payment_methods`** — métodos guardados (só Stripe)
- user_id, stripe_payment_method_id, brand, last4, exp_month, exp_year, is_default

### Views
- `v_plan_kpis` — MRR, ARPU, active_subs, churn_30d por plano
- `v_subscriber_summary` — LTV, total_paid, payments_count, current_mrr, churn_risk_score por user
- `v_mrr_timeseries` — MRR mensal agregado (para charts)

### RPCs
- `fn_create_plan_version(plan_id, price, features, ...)` — cria versão + arquiva anterior + cria Stripe Price (via edge function trigger)
- `fn_change_subscription_plan(sub_id, new_plan_version_id, proration_mode)`
- `fn_register_manual_payment(sub_id, amount, method, period_start, period_end, notes)`
- `fn_cancel_subscription(sub_id, at_period_end bool)`

### RLS
- `plans`, `plan_versions` — read público (necessário para `/membership-plans`), write `admin`
- `subscriptions`, `payments` — read próprio + `admin`/`staff`, write admin
- `subscription_events`, `payment_methods` — admin only para escrita

---

## 4. Integração Stripe (Híbrida)

### Edge Functions
- `stripe-create-checkout-session` — gera Checkout Session para nova subscrição
- `stripe-customer-portal` — link para o portal do cliente (gerir cartão, faturas)
- `stripe-webhook` — recebe `customer.subscription.*`, `invoice.payment_succeeded`, `invoice.payment_failed`, `charge.refunded` e sincroniza com `subscriptions` e `payments`
- `stripe-sync-plan-version` — quando admin cria/edita plan_version, cria Stripe Product + Price

### Segredos necessários
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Fluxo manual
Admin abre subscriber → "Registar pagamento manual" → escolhe método (cash/transfer/POS) + valor + período coberto → INSERT em `payments` com `method != stripe_*` + UPDATE `subscriptions.current_period_end`. Não toca em Stripe.

> **Decisão de recomendar Lovable Payments (seamless Stripe) em vez de BYOK**: vou usar `enable_stripe_payments` para não pedir API key e ter compliance handling configurável por sessão. (Confirmar antes de avançar.)

---

## 5. Página Hub — `/dashboard/admin/plans`

**Mantém o layout actual.** Apenas substitui os dados mock por dados reais:

- KPIs ligados a `v_plan_kpis` (agregado): MRR, Active Subscribers, Churn Rate, ARPU
- Chart "Revenue & Growth" → `v_mrr_timeseries`
- "Bike Model Adoption" → renomear para "Plan Adoption" (subscribers por plan)
- Tabela "All Subscribers" → query real com filtros (plan, status, payment method)
- Adicionar botão "Manage Plans" → `/dashboard/admin/plans/manage`
- Cada linha clicável → `/dashboard/admin/plans/subscriber/:id`

---

## 6. Página Plan Detail — `/dashboard/admin/plans/:planId`

Grid 12-col, glassmorphism, tumbler-style:

- **Row 1 (col-span 12)**: Header com nome do plano, badge de status, versão actual, preço, CTA "Edit" (abre PlanFormModal — gera nova versão)
- **Row 2 (col-span 8)**: Chart de evolução de subscribers + MRR
- **Row 2 (col-span 4)**: KPIs específicos (MRR, Subs, Churn, ARPU, Trial→Paid conversion)
- **Row 3 (col-span 12)**: Tabs
  - **Subscribers** — tabela filtrável (status, version, payment method)
  - **Versions** — histórico (preço antigo, qtos subs ainda em cada versão)
  - **Features** — editor inline tipo bullet list
- **Editor inline** num drawer lateral para preço/descrição/features com preview ao vivo da pricing card.

---

## 7. Página Subscriber Detail — `/dashboard/admin/plans/subscriber/:id`

- Header glass card: avatar, nome, email, phone, status badge, current plan, started_at, MRR contribution, LTV total, churn risk (computado: dias desde último pagamento / falhas)
- Quick actions row: Register Manual Payment | Change Plan | Pause | Cancel | Refund Last
- Tabs:
  - **Payments** — tabela ordenada desc (data, valor, método, status, período coberto, recorded_by, notas, link fatura)
  - **Plan History** — timeline de `subscription_events`
  - **Invoices** — links Stripe + PDFs manuais
  - **Methods** — cartões Stripe guardados (read-only)
  - **Notes** — campo livre (staff)

---

## 8. CRUD `/dashboard/admin/plans/manage`

- Lista todos os planos em cards (estilo Inventory): nome, preço actual, subs activos, MRR, status toggle
- Botão "+ New Plan" → modal wizard (name, tier, interval, price, features, trial_days)
- Editar abre o mesmo modal → ao guardar, cria nova `plan_version` e arquiva a anterior (subscribers ficam grandfathered)
- Toggle archive → impede novas subscrições mas mantém existentes

---

## 9. Hooks (React Query)

```text
src/hooks/plans/
  usePlans.ts                  — lista + CRUD
  usePlanVersions.ts           — histórico de versões
  usePlanDetail.ts             — KPIs + subscribers de um plano
  useSubscriptions.ts          — lista global filtrável
  useSubscriberDetail.ts       — dados completos de 1 subscriber
  usePayments.ts               — pagamentos de uma subscription
  useRegisterManualPayment.ts  — mutation
  useChangePlan.ts             — mutation
  useStripeCheckout.ts         — chama edge function
  useMRRTimeseries.ts          — gráfico
```

---

## 10. Fases de Execução

1. **Fase 1 — Migrations**: enums + tabelas + views + RLS + RPCs (sem Stripe ainda)
2. **Fase 2 — Hooks + página Hub** ligada a dados reais (mantém layout, troca mocks)
3. **Fase 3 — CRUD `/manage` + PlanFormModal** com versionamento
4. **Fase 4 — Plan Detail `/plans/:id`** com editor inline, KPIs, subscribers tab, versions tab
5. **Fase 5 — Subscriber Detail `/plans/subscriber/:id`** + RegisterManualPaymentModal + ChangePlanModal + CancelModal
6. **Fase 6 — Integração Stripe**: enable_stripe_payments → edge functions checkout/portal/webhook + sync plan_versions
7. **Fase 7 — Polimento**: charts reais, export CSV, empty states, realtime em `payments`

---

## Perguntas antes de começar

1. Confirmas **Lovable Payments (seamless Stripe)** em vez de BYOK? (Recomendo seamless — sem precisar de conta Stripe própria nesta fase, mas eligibility check é feito antes de activar.)
2. Posso criar **todas as migrations da Fase 1 numa só** (com seed dos 3 tiers actuais Light/Plus/Black como `plan_versions` iniciais)?
3. Para o cálculo de **churn risk score** queres algo simples (dias desde último pagamento > período × 1.5) ou um score 0-100 ponderado (falhas + downgrade + atraso)?
4. As **faturas manuais** devem gerar PDF automático no momento do registo, ou só guardar o registo e o PDF é opcional/anexado depois?

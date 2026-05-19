# Plano Estratégico — Página de Inventory WJ Ecossistema

## 1. Análise do Documento (essencial para Inventory)

O domínio Inventory do WJ envolve **6 tabelas + 1 view + enums** que precisam ser criadas no Supabase antes da UI:

**Tabelas core (Migration 002–004):**
- `categories` + `category_closure` — hierarquia (bikes, accessories, services, parts, insurance)
- `products` — produto pai (nome, slug, preço base, tipo, multilingual NL/EN/PT)
- `product_variants` — SKU real com stock (cor/tamanho/bateria)
- `product_images` / `product_specifications` / `tags` / `product_tag_map`
- `locations` — Armazém Rotterdam, Loja Floor, Virtual
- `inventory` — qty_available / qty_reserved / qty_incoming / low_stock_threshold / reorder_point **por variant × location**
- `inventory_movements` — **append-only** audit trail (sale, return, adjustment, transfer, incoming, reservation)

**Enums críticos:** `product_type_enum`, `category_type_enum`, `location_type_enum`, `movement_type_enum`.

**View essencial:** `v_product_stock` — agrega stock por produto/variante (já consumível pelo frontend).

**Regras de negócio (não-negociáveis):**
- `inventory_movements` NUNCA pode ser UPDATE/DELETE (RLS bloqueia).
- Ajustar stock = INSERT em `movements` + UPDATE em `inventory` (idealmente via RPC transacional).
- `qty_real = qty_available - qty_reserved` é o que importa para "low stock".
- Acesso restrito a `admin` e `staff` (via `has_role`).

---

## 2. Arquitetura de Páginas e Modais

```text
/dashboard/admin/inventory                      ← Hub principal (lista + KPIs)
  ├─ ?tab=stock        Tabela completa de variantes × locations
  ├─ ?tab=low-stock    Filtro: itens abaixo do threshold
  ├─ ?tab=incoming     Itens com qty_incoming > 0
  └─ ?tab=movements    Histórico append-only de movimentações

/dashboard/admin/inventory/products             ← Catálogo (CRUD produtos)
/dashboard/admin/inventory/products/:id         ← Detalhe do produto + variantes + imagens + specs
/dashboard/admin/inventory/products/new         ← Wizard criar produto

/dashboard/admin/inventory/locations            ← Gerir armazéns
/dashboard/admin/inventory/categories           ← Gerir hierarquia de categorias

Modais (sobre a página principal):
  • AdjustStockModal          (ajuste manual + razão)
  • ReceiveStockModal         (entrada — wizard PO simplificado)
  • TransferStockModal        (mover entre locations)
  • ReorderModal              (sugestão de reposição baseada em reorder_point)
  • VariantQuickEditModal     (preço, threshold, ativar/desativar)
  • MovementDetailDrawer      (ver detalhes de uma movimentação)
```

---

## 3. Fluxo de UX (sequência de modais)

**Fluxo 1 — Ajuste rápido de stock (ação mais comum):**
```
Tabela → clica linha → swipe-action "Adjust" → AdjustStockModal
  (qty delta + motivo + notes) → confirma → toast + linha atualiza em real-time
```

**Fluxo 2 — Receber stock novo (Incoming → Available):**
```
KPI "Incoming" → Click → Lista incoming → "Receive" →
  ReceiveStockModal (confirma qty recebida vs esperada) →
  cria movement type='incoming' + zera qty_incoming + soma qty_available
```

**Fluxo 3 — Reorder inteligente:**
```
KPI "Low Stock" pulsa → Click → Lista filtrada por threshold →
  Botão "Generate Reorder" → ReorderModal com qty sugerida
  (reorder_point - qty_available) → exporta CSV/email fornecedor
```

**Fluxo 4 — Auditoria (append-only):**
```
Tab "Movements" → filtros (date range, type, location, variant) →
  Click linha → MovementDetailDrawer (mostra ref order/return/user)
```

---

## 4. KPIs da Página (dados reais via Supabase)

| KPI | Query |
|---|---|
| Total SKUs | `count(product_variants where is_active)` |
| Low Stock | `count(inventory where qty_available - qty_reserved <= low_stock_threshold)` |
| Incoming | `sum(qty_incoming)` |
| Stock Value | `sum(qty_available × variant.price)` |
| Movements (7d) | `count(inventory_movements where created_at > now() - 7d)` |
| Reserved | `sum(qty_reserved)` |

Mobile: usar o `KPICarousel` reutilizável já existente.

---

## 5. Plano de Execução (fases)

### **Fase 1 — Backend (migrations Supabase)**
1. Migration A: enums + `categories` + `category_closure` + trigger + seed
2. Migration B: `products` + `product_variants` + `product_images` + `product_specifications` + `tags` + `product_tag_map` + seed tags
3. Migration C: `locations` + `inventory` + `inventory_movements` + trigger + seed locations
4. Migration D: RLS (admin/staff read+write, movements INSERT-only)
5. Migration E: View `v_product_stock` + RPC `fn_adjust_stock(variant_id, location_id, delta, type, ref)` transacional
6. Migration F: Realtime publication em `inventory` e `inventory_movements`

### **Fase 2 — Hooks de dados**
- `src/hooks/inventory/useInventoryKPIs.ts`
- `src/hooks/inventory/useInventoryList.ts` (com filtros + paginação)
- `src/hooks/inventory/useMovements.ts`
- `src/hooks/inventory/useAdjustStock.ts` (mutation que chama RPC)
- `src/hooks/inventory/useRealtimeInventory.ts` (Supabase channel)

### **Fase 3 — UI Refactor `AdminInventory.tsx`**
- Remover todo o mock (`inventoryKPIs`, `inventoryItems`, `categories`)
- Conectar KPIs reais + `KPICarousel` no mobile
- Tabela: variant_name, SKU, location, qty_available, qty_reserved, threshold, status badge, ações
- Tabs: Stock / Low Stock / Incoming / Movements
- Realtime: animação verde quando linha muda

### **Fase 4 — Modais e ações**
- AdjustStock, ReceiveStock, Transfer, Reorder, VariantQuickEdit, MovementDetailDrawer
- Padrão swipe-to-confirm consistente com Service Request

### **Fase 5 — Subpáginas**
- `/products` (CRUD), `/products/:id`, `/locations`, `/categories`

### **Fase 6 — Polimento**
- Empty states, skeletons, error boundaries
- Export CSV (stock atual + histórico de movimentos)
- Search global (`pg_trgm` em product.name)
- Filtros sticky por location + categoria

---

## 6. Detalhes Técnicos

**RPC transacional para ajuste (evita race condition):**
```sql
fn_adjust_stock(p_variant uuid, p_location uuid, p_delta int,
                p_type movement_type_enum, p_ref_type text, p_ref_id uuid, p_notes text)
→ INSERT movement + UPDATE inventory atomicamente
→ Retorna inventory row atualizado
```

**Realtime channels:**
```ts
supabase.channel('inventory')
  .on('postgres_changes', { event: '*', table: 'inventory' }, refetch)
  .on('postgres_changes', { event: 'INSERT', table: 'inventory_movements' }, prepend)
```

**Permissões:** todos os endpoints exigem `has_role(auth.uid(),'admin')` OR `has_role('staff')`.

---

## 7. Entregáveis por iteração

1. **Iter 1** → Migrations Fase 1 (peço aprovação antes de executar)
2. **Iter 2** → Hooks + UI principal de Inventory ligada a dados reais
3. **Iter 3** → AdjustStock + ReceiveStock + realtime
4. **Iter 4** → Tab Movements + filtros + drawer
5. **Iter 5** → Subpáginas Products / Locations / Categories
6. **Iter 6** → Reorder modal + export + polimento

---

## Perguntas antes de começar

1. Posso criar **todas** as migrations da Fase 1 de uma vez (ou preferes fase por fase)?
2. Queres dados **seed de exemplo** (5–10 produtos demo) para popular a página visualmente desde já?
3. O catálogo deve ser **multilingual desde já** (NL/EN/PT) ou só EN inicialmente?
4. Confirmar: **staff** também pode ajustar stock, ou só **admin**?

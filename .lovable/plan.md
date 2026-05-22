## Resposta rápida — como funciona o tracking

Os KPIs vêm de `useInventoryKPIs` (em `src/hooks/inventory/useInventoryData.ts`), calculados em tempo real sobre os registros da tabela `inventory` no Supabase (com realtime ligado via `postgres_changes`):

- **Stock Value** — soma de `qty_available × (variant.price_override ?? product.base_price)` para todas as linhas.
- **Total SKUs** — quantidade de variantes únicas (`variant_id` distintos) com linha em `inventory`.
- **Low Stock** — quantas linhas estão com estoque real (`qty_available − qty_reserved`) ≤ `low_stock_threshold` definido por linha.
- **Incoming** — soma de `qty_incoming` (unidades já compradas/em trânsito, ainda não recebidas).

O **botão Reorder** abre `ReorderModal`, que filtra todas as linhas onde estoque real ≤ `reorder_point` e sugere comprar `max(reorder_point − estoque_real, 1)` unidades por SKU/local. Permite exportar a lista como CSV de pedido de compra. Não cria pedido automático — é um assistente de reposição.

## Plano de implementação

### 1. Estender `AdminKPICard` com tooltip opcional
Arquivo: `src/components/dashboard/AdminKPICard.tsx`
- Adicionar prop opcional `info?: string`.
- Quando presente, renderizar um ícone `Info` (lucide) pequeno no canto, ao lado do ícone do trend, envolto em `Tooltip` (já temos `src/components/ui/tooltip.tsx` + `TooltipProvider` no app).
- Manter visual minimalista: `h-3.5 w-3.5 text-muted-foreground/60 hover:text-foreground`.

### 2. Passar textos explicativos nos 4 KPIs do Inventory
Arquivo: `src/pages/admin/AdminInventory.tsx` — array `kpiCards`:
- **Stock Value**: "Valor total do estoque a preço de venda (qty disponível × preço da variante). Atualiza em tempo real."
- **Total SKUs**: "Número de variantes únicas com registro em inventário (cada combinação produto + opção)."
- **Low Stock**: "Variantes onde (disponível − reservado) ≤ limite mínimo configurado por linha. Ação recomendada: receber estoque."
- **Incoming**: "Unidades já pedidas a fornecedores que ainda não foram recebidas (qty_incoming somado em todos os locais)."

### 3. Tooltip no botão Reorder
Arquivo: `src/pages/admin/AdminInventory.tsx`
- Envolver o `Button` Reorder em `Tooltip` com texto: "Lista SKUs abaixo do ponto de reposição e sugere a quantidade a comprar. Exportável em CSV para enviar ao fornecedor."

### Detalhes técnicos
- Usar `TooltipProvider` local em `AdminKPICard` (delayDuration 150) para não depender de provider global.
- Sem alterações em hooks/lógica de negócio — apenas UI.

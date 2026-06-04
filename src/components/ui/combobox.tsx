import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Check, ChevronsUpDown, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/* ------------------------------------------------------------------ */
/* Context                                                            */
/* ------------------------------------------------------------------ */

type ItemToStr<T> = (item: T) => string;

interface ComboboxContextValue<T = any> {
  items: T[];
  filtered: T[];
  itemToValue: ItemToStr<T>;
  itemToLabel: ItemToStr<T>;
  search: string;
  setSearch: (s: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  value: string | null;
  setValue: (v: string | null) => void;
  onSelect?: (item: T) => void;
  autoHighlight: boolean;
  highlightId: string;
  triggerLabel: string | null;
  placeholder?: string;
  disabled?: boolean;
}

const ComboboxCtx = React.createContext<ComboboxContextValue | null>(null);
const useComboboxCtx = () => {
  const ctx = React.useContext(ComboboxCtx);
  if (!ctx) throw new Error("Combobox components must be used inside <Combobox>");
  return ctx;
};

/* ------------------------------------------------------------------ */
/* Root                                                                */
/* ------------------------------------------------------------------ */

export interface ComboboxProps<T> {
  items: readonly T[];
  value?: string | null;
  onValueChange?: (value: string | null, item: T | null) => void;
  onSelect?: (item: T) => void;
  itemToValue?: ItemToStr<T>;
  itemToLabel?: ItemToStr<T>;
  /** Custom client-side filter. Defaults to includes() on label. */
  filter?: (item: T, search: string) => boolean;
  autoHighlight?: boolean;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  defaultOpen?: boolean;
  /** Controlled search text. */
  searchValue?: string;
  onSearchChange?: (s: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

function defaultToString<T>(item: T): string {
  if (item == null) return "";
  return typeof item === "string" ? item : String(item);
}

export function Combobox<T>({
  items,
  value: valueProp,
  onValueChange,
  onSelect,
  itemToValue = defaultToString,
  itemToLabel = defaultToString,
  filter,
  autoHighlight = false,
  open: openProp,
  onOpenChange,
  defaultOpen = false,
  searchValue,
  onSearchChange,
  placeholder,
  disabled,
  className,
  children,
}: ComboboxProps<T>) {
  const [openState, setOpenState] = React.useState(defaultOpen);
  const open = openProp ?? openState;
  const setOpen = React.useCallback(
    (v: boolean) => {
      if (openProp === undefined) setOpenState(v);
      onOpenChange?.(v);
    },
    [openProp, onOpenChange],
  );

  const [valueState, setValueState] = React.useState<string | null>(valueProp ?? null);
  React.useEffect(() => {
    if (valueProp !== undefined) setValueState(valueProp);
  }, [valueProp]);

  const [searchState, setSearchState] = React.useState("");
  const search = searchValue ?? searchState;
  const setSearch = React.useCallback(
    (s: string) => {
      if (searchValue === undefined) setSearchState(s);
      onSearchChange?.(s);
    },
    [searchValue, onSearchChange],
  );

  const filtered = React.useMemo(() => {
    const list = items as T[];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    if (filter) return list.filter((i) => filter(i, search));
    return list.filter((i) => itemToLabel(i).toLowerCase().includes(term));
  }, [items, search, filter, itemToLabel]);

  const setValue = React.useCallback(
    (v: string | null) => {
      setValueState(v);
      const found = (items as T[]).find((it) => itemToValue(it) === v) ?? null;
      onValueChange?.(v, found);
    },
    [items, itemToValue, onValueChange],
  );

  const highlightId = React.useId();
  const triggerLabel = React.useMemo(() => {
    if (valueState == null) return null;
    const item = (items as T[]).find((it) => itemToValue(it) === valueState);
    return item ? itemToLabel(item) : valueState;
  }, [items, itemToValue, itemToLabel, valueState]);

  const ctx: ComboboxContextValue<T> = {
    items: items as T[],
    filtered,
    itemToValue,
    itemToLabel,
    search,
    setSearch,
    open,
    setOpen,
    value: valueState,
    setValue,
    onSelect,
    autoHighlight,
    highlightId,
    triggerLabel,
    placeholder,
    disabled,
  };

  return (
    <ComboboxCtx.Provider value={ctx as ComboboxContextValue}>
      <Popover open={open} onOpenChange={setOpen}>
        <div className={cn("relative w-full", className)}>{children}</div>
      </Popover>
    </ComboboxCtx.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Trigger (button-style)                                              */
/* ------------------------------------------------------------------ */

export const ComboboxTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { placeholder?: string }
>(({ className, placeholder, children, ...props }, ref) => {
  const ctx = useComboboxCtx();
  const label = ctx.triggerLabel ?? placeholder ?? ctx.placeholder ?? "Select…";
  return (
    <PopoverTrigger asChild>
      <button
        ref={ref}
        type="button"
        role="combobox"
        aria-expanded={ctx.open}
        disabled={ctx.disabled}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm font-normal ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        <span className={cn("truncate", ctx.triggerLabel == null && "text-muted-foreground")}>
          {children ?? label}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0 ml-2" />
      </button>
    </PopoverTrigger>
  );
});
ComboboxTrigger.displayName = "ComboboxTrigger";

/* ------------------------------------------------------------------ */
/* Input (inline mode — also opens popover)                            */
/* ------------------------------------------------------------------ */

export const ComboboxInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
    showIcon?: boolean;
  }
>(({ className, showIcon = true, placeholder, onFocus, onKeyDown, ...props }, ref) => {
  const ctx = useComboboxCtx();
  return (
    <PopoverTrigger asChild>
      <div className="relative w-full">
        {showIcon && (
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        )}
        <input
          ref={ref}
          type="text"
          value={ctx.search}
          onChange={(e) => {
            ctx.setSearch(e.target.value);
            if (!ctx.open) ctx.setOpen(true);
          }}
          onFocus={(e) => {
            ctx.setOpen(true);
            onFocus?.(e);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "Enter") {
              if (!ctx.open) ctx.setOpen(true);
            }
            if (e.key === "Escape") ctx.setOpen(false);
            onKeyDown?.(e);
          }}
          placeholder={placeholder ?? ctx.placeholder}
          disabled={ctx.disabled}
          aria-expanded={ctx.open}
          aria-autocomplete="list"
          role="combobox"
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            showIcon && "pl-9",
            className,
          )}
          {...props}
        />
      </div>
    </PopoverTrigger>
  );
});
ComboboxInput.displayName = "ComboboxInput";

/* ------------------------------------------------------------------ */
/* Content (popover surface + cmdk command)                            */
/* ------------------------------------------------------------------ */

export const ComboboxContent = React.forwardRef<
  React.ElementRef<typeof PopoverContent>,
  React.ComponentPropsWithoutRef<typeof PopoverContent> & {
    /** Hide the inner search input — useful when the trigger is already an input. */
    hideInnerSearch?: boolean;
    innerSearchPlaceholder?: string;
  }
>(({ className, children, hideInnerSearch, innerSearchPlaceholder, align = "start", ...props }, ref) => {
  const ctx = useComboboxCtx();
  return (
    <PopoverContent
      ref={ref}
      align={align}
      sideOffset={4}
      onOpenAutoFocus={(e) => {
        // Keep focus on the original input when opened
        if (!hideInnerSearch) return;
        e.preventDefault();
      }}
      className={cn(
        "p-0 w-[var(--radix-popover-trigger-width)] bg-background/95 backdrop-blur-xl border-border/40",
        className,
      )}
      {...props}
    >
      <CommandPrimitive
        shouldFilter={false}
        value={ctx.value ?? undefined}
        onValueChange={(v) => {
          // cmdk highlights the first item on its own; we only use this to keep
          // controlled highlight in sync when consumers care.
        }}
        className="flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground"
      >
        {!hideInnerSearch && (
          <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandPrimitive.Input
              autoFocus
              value={ctx.search}
              onValueChange={ctx.setSearch}
              placeholder={innerSearchPlaceholder ?? ctx.placeholder ?? "Search…"}
              className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        )}
        {children}
      </CommandPrimitive>
    </PopoverContent>
  );
});
ComboboxContent.displayName = "ComboboxContent";

/* ------------------------------------------------------------------ */
/* List / Empty / Item                                                 */
/* ------------------------------------------------------------------ */

export const ComboboxEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className={cn("py-6 text-center text-sm text-muted-foreground", className)}
    {...props}
  />
));
ComboboxEmpty.displayName = "ComboboxEmpty";

interface ComboboxListProps<T> {
  className?: string;
  children: (item: T, index: number) => React.ReactNode;
  loading?: boolean;
  loadingNode?: React.ReactNode;
}

export function ComboboxList<T>({ className, children, loading, loadingNode }: ComboboxListProps<T>) {
  const ctx = useComboboxCtx() as unknown as ComboboxContextValue<T>;
  return (
    <CommandPrimitive.List
      className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    >
      {loading
        ? loadingNode
        : (
          <CommandPrimitive.Group className="overflow-hidden p-1 text-foreground">
            {ctx.filtered.map((item, i) => children(item, i))}
          </CommandPrimitive.Group>
        )}
    </CommandPrimitive.List>
  );
}

export interface ComboboxItemProps
  extends Omit<React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>, "onSelect" | "value"> {
  value: string;
  /** If true, render a check on the left when selected. Default true. */
  showCheck?: boolean;
}

export const ComboboxItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  ComboboxItemProps
>(({ className, children, value, showCheck = true, ...props }, ref) => {
  const ctx = useComboboxCtx();
  const isActive = ctx.value === value;
  return (
    <CommandPrimitive.Item
      ref={ref}
      value={value}
      onSelect={(v) => {
        ctx.setValue(v);
        const found = ctx.items.find((it) => ctx.itemToValue(it) === v) ?? null;
        if (found) ctx.onSelect?.(found);
        ctx.setOpen(false);
      }}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected='true']:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50",
        className,
      )}
      {...props}
    >
      {showCheck && (
        <Check
          className={cn(
            "mr-2 h-3.5 w-3.5 shrink-0",
            isActive ? "opacity-100" : "opacity-0",
          )}
        />
      )}
      {children}
    </CommandPrimitive.Item>
  );
});
ComboboxItem.displayName = "ComboboxItem";

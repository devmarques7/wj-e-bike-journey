import { Link, useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

/**
 * Human-readable labels for known route segments.
 * Unknown segments (ids, slugs) are title-cased and truncated.
 */
const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  admin: "Admin",
  staff: "Staff",
  workshop: "Workshop",
  manage: "Gerir",
  plans: "Planos",
  members: "Membros",
  inventory: "Inventário",
  products: "Produtos",
  locations: "Localizações",
  categories: "Categorias",
  subscriber: "Subscritor",
  service: "Serviço",
  wallet: "Carteira",
  "v-id": "V-ID",
  gallery: "Galeria",
  product: "Produto",
  checkout: "Checkout",
  "membership-plans": "Planos de Membro",
  accessories: "Acessórios",
  "find-store": "Loja",
  "book-test-ride": "Test Ride",
  "our-story": "Nossa História",
  career: "Carreira",
  help: "Ajuda",
  delivery: "Entrega",
  returns: "Devoluções",
  auth: "Entrar",
  "complete-profile": "Completar Perfil",
  profile: "Perfil",
  "urgent-service": "Serviço Urgente",
};

/** Routes where breadcrumbs should NOT appear. */
const HIDDEN_ROUTES = ["/", "/auth", "/complete-profile"];

/** Segments to strip from the trail (not shown, not linked). */
const HIDDEN_SEGMENTS = new Set(["dashboard", "admin", "staff"]);

function prettify(segment: string) {
  if (LABELS[segment]) return LABELS[segment];
  // ids / uuids → "#abc123"
  if (/^[0-9a-f-]{8,}$/i.test(segment)) return `#${segment.slice(0, 6)}`;
  return segment
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface AutoBreadcrumbsProps {
  className?: string;
}

export default function AutoBreadcrumbs({ className }: AutoBreadcrumbsProps) {
  const { pathname } = useLocation();

  if (HIDDEN_ROUTES.includes(pathname)) return null;

  const rawSegments = pathname.split("/").filter(Boolean);

  // Build full hrefs first (so links keep working), then filter out hidden segments.
  const allCrumbs = rawSegments.map((seg, i) => ({
    seg,
    label: prettify(seg),
    href: "/" + rawSegments.slice(0, i + 1).join("/"),
  }));

  const visible = allCrumbs.filter((c) => !HIDDEN_SEGMENTS.has(c.seg));

  // Only show breadcrumbs on subpages (need at least a parent + current).
  if (visible.length < 2) return null;

  const crumbs = visible.map((c, i) => ({
    ...c,
    isLast: i === visible.length - 1,
  }));

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "inline-flex items-center px-3 py-1.5 rounded-full",
        "bg-background/40 backdrop-blur-md border border-border/40",
        className,
      )}
    >
      <Breadcrumb>
        <BreadcrumbList className="text-xs">
          {crumbs.map((c, i) => (
            <span key={c.href} className="flex items-center gap-1.5">
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {c.isLast ? (
                  <BreadcrumbPage className="uppercase tracking-[0.14em] text-[11px]">
                    {c.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      to={c.href}
                      className="uppercase tracking-[0.14em] text-[11px] text-muted-foreground"
                    >
                      {c.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </nav>
  );
}

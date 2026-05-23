import { useLocation } from "react-router-dom";
import AutoBreadcrumbs from "./AutoBreadcrumbs";

/**
 * Renders breadcrumbs globally on public pages. Dashboard routes render their
 * own inline breadcrumbs inside their layouts, so they are skipped here.
 */
export default function GlobalBreadcrumbs() {
  const { pathname } = useLocation();

  if (pathname.startsWith("/dashboard")) return null;

  return (
    <div className="fixed top-3 left-3 z-30 pointer-events-auto hidden md:block">
      <AutoBreadcrumbs />
    </div>
  );
}

import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { code: "en", label: "English", short: "EN" },
  { code: "pt", label: "Português", short: "PT" },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = (i18n.resolvedLanguage || i18n.language || "en").slice(0, 2);
  const active = LANGUAGES.find((l) => l.code === current) ?? LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Change language"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-muted/50 transition-colors text-xs font-medium"
        >
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="tabular-nums">{active.short}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={cn(
              "flex items-center justify-between cursor-pointer",
              lang.code === current && "text-wj-green font-medium",
            )}
          >
            <span>{lang.label}</span>
            <span className="text-[10px] text-muted-foreground">{lang.short}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
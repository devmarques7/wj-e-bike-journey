import { useEffect, useRef } from "react";
import { createStyledQR, type StyledQROverrides } from "@/lib/epass/generate-styled-qr";
import { useTheme } from "@/contexts/ThemeContext";

interface StyledEPassQRProps {
  /** Value encoded inside the QR — usually the full E-Pass URL. */
  data: string;
  logoUrl?: string;
  size?: number;
  overrides?: StyledQROverrides;
  className?: string;
}

/**
 * Live, theme-aware QR code for the E-Pass card.
 * Re-renders whenever the data, logo, or active theme changes so it always
 * matches the current design tokens.
 */
export default function StyledEPassQR({
  data,
  logoUrl,
  size = 200,
  overrides,
  className,
}: StyledEPassQRProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // theme is read just to retrigger the effect when the user toggles light/dark
  const { theme } = useTheme();

  useEffect(() => {
    if (!containerRef.current) return;
    const node = containerRef.current;
    node.innerHTML = "";
    const qr = createStyledQR({
      data,
      logoUrl,
      overrides: { width: size, height: size, ...overrides },
    });
    qr.append(node);
  }, [data, logoUrl, size, theme, overrides]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: size, height: size }}
      aria-label="E-Pass QR code"
    />
  );
}

import { createContext, useContext, useLayoutEffect, useState } from "react";

type ColorTheme = {
  brand: string;
  setBrand: (c: string) => void;
  accent: string;
  setAccent: (c: string) => void;
  success: string;
  warning: string;
  error: string;
};

const defaultTheme = {
  brand: "#2563eb",
  accent: "#8b5cf6", 
  success: "#16a34a",
  warning: "#f59e0b",
  error: "#dc2626"
};

const Ctx = createContext<ColorTheme>({
  ...defaultTheme,
  setBrand: () => {},
  setAccent: () => {}
});

export function BrandProvider({
  initial = defaultTheme,
  children
}: {
  initial?: Partial<typeof defaultTheme>;
  children: React.ReactNode;
}) {
  const [brand, setBrand] = useState(initial.brand || defaultTheme.brand);
  const [accent, setAccent] = useState(initial.accent || defaultTheme.accent);
  
  const theme = {
    ...defaultTheme,
    brand,
    accent
  };

  useLayoutEffect(() => {
    // Set CSS custom properties for theming
    document.documentElement.style.setProperty("--brand", theme.brand);
    document.documentElement.style.setProperty("--accent", theme.accent);
    document.documentElement.style.setProperty("--success", theme.success);
    document.documentElement.style.setProperty("--warning", theme.warning);
    document.documentElement.style.setProperty("--error", theme.error);
    
    // Add alpha variants
    document.documentElement.style.setProperty("--brand-50", theme.brand + "0D");
    document.documentElement.style.setProperty("--brand-100", theme.brand + "1A");
    document.documentElement.style.setProperty("--brand-200", theme.brand + "33");
  }, [theme]);

  return (
    <Ctx.Provider value={{ ...theme, setBrand, setAccent }}>
      {children}
    </Ctx.Provider>
  );
}

export const useBrand = () => useContext(Ctx);
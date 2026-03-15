"use client";

import { AppProvider } from "@/contexts/AppContext";

/**
 * Wrapper de client-side providers.
 * Importado no layout.tsx (server component) para evitar torná-lo um client component.
 */
export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}

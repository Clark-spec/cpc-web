import type { ReactNode } from "react";
import { AuthProvider } from "@/hooks/useAuth";

/** The provider composition for the app. `AuthProvider` itself stays defined in
 *  `@/hooks/useAuth`; this only wraps it around the route table so the tree can
 *  grow more providers without touching the routes. */
export function AppProviders({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

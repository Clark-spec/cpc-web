import { createContext, useContext } from "react";

export type AuthLayoutMode = "mobile" | "desktop";

export const AuthLayoutModeContext = createContext<AuthLayoutMode>("desktop");

export function useAuthLayoutMode(): AuthLayoutMode {
  return useContext(AuthLayoutModeContext);
}

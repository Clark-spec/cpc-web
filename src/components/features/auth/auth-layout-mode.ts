import { createContext, useContext } from "react";

export type AuthLayoutMode = "mobile" | "frame" | "wide";

export const AuthLayoutModeContext = createContext<AuthLayoutMode>("frame");

export function useAuthLayoutMode(): AuthLayoutMode {
  return useContext(AuthLayoutModeContext);
}

let cachedToken: string | null = null;

export function readCsrfToken(): string | null {
  if (typeof window !== "undefined") {
    const stored = window.sessionStorage.getItem("cpc_csrf_token");
    if (stored) {
      cachedToken = stored;
      return stored;
    }
  }
  return cachedToken;
}

export function storeCsrfToken(token: string): void {
  cachedToken = token;
  if (typeof window !== "undefined") window.sessionStorage.setItem("cpc_csrf_token", token);
}

export function clearCsrfToken(): void {
  cachedToken = null;
  if (typeof window !== "undefined") window.sessionStorage.removeItem("cpc_csrf_token");
}

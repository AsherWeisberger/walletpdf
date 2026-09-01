import { UNLOCK_STORAGE_KEY } from "./types";

export function readUnlockParam(search: string): string | null {
  try {
    const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
    return params.get("unlock");
  } catch {
    return null;
  }
}

export function shouldUnlockFromQuery(search: string): boolean {
  const value = readUnlockParam(search);
  if (!value) return false;
  // QA: ?unlock=dev   Polar success URL: ?unlock=1
  return value === "dev" || value === "1" || value === "true";
}

export function persistUnlock(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(UNLOCK_STORAGE_KEY, "1");
}

export function clearUnlock(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(UNLOCK_STORAGE_KEY);
}

export function isStoredUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(UNLOCK_STORAGE_KEY) === "1";
}

export function buyUrl(): string {
  return (process.env.NEXT_PUBLIC_BUY_URL ?? "").trim();
}

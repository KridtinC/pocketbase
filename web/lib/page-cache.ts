/**
 * Simple in-memory per-page cache for list state + scroll position.
 * Survives client-side navigation (SPA), cleared on full page reload.
 */
const store = new Map<string, unknown>();

export function getPageCache<T>(key: string): T | null {
  return (store.get(key) ?? null) as T | null;
}

export function setPageCache<T>(key: string, val: T): void {
  store.set(key, val);
}

export interface BaseListCache {
  search: string;
  items: unknown[];
  page: number;
  total: number;
  scrollY: number;
}

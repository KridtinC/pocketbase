import { apiBase } from "./env";

// The access token lives only in memory (module scope, survives client-side
// route changes, wiped on full page reload). Only the rotating refresh
// token touches localStorage.
let accessToken: string | null = null;
let accessExpiresAt = 0; // epoch ms
let refreshPromise: Promise<string | null> | null = null;
let onSignedOut: (() => void) | null = null;

const REFRESH_STORAGE_KEY = "pb_refresh_token";
const EXPIRY_SAFETY_MARGIN_MS = 5000;

export function setSignedOutListener(fn: (() => void) | null) {
  onSignedOut = fn;
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_STORAGE_KEY);
}

function storeRefreshToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(REFRESH_STORAGE_KEY, token);
  else localStorage.removeItem(REFRESH_STORAGE_KEY);
}

export function getAccessToken(): string | null {
  if (accessToken && Date.now() < accessExpiresAt) return accessToken;
  return null;
}

export function setTokens(access: string, expiresInSec: number, refresh: string) {
  accessToken = access;
  accessExpiresAt = Date.now() + expiresInSec * 1000 - EXPIRY_SAFETY_MARGIN_MS;
  storeRefreshToken(refresh);
}

export function clearTokens() {
  accessToken = null;
  accessExpiresAt = 0;
  storeRefreshToken(null);
  onSignedOut?.();
}

// Single-flight: refresh tokens are single-use (rotated on every call), so
// concurrent 401s must share one in-flight request instead of each racing
// to redeem the same stored token — the loser would look like token reuse.
export function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  const stored = getStoredRefreshToken();
  if (!stored) return Promise.resolve(null);

  refreshPromise = fetch(`${apiBase()}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: stored }),
  })
    .then(async (res) => {
      if (!res.ok) {
        clearTokens();
        return null;
      }
      const data = await res.json();
      setTokens(data.access_token, data.expires_in, data.refresh_token);
      return data.access_token as string;
    })
    .catch(() => {
      clearTokens();
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function logout(): Promise<void> {
  const stored = getStoredRefreshToken();
  clearTokens();
  if (stored) {
    fetch(`${apiBase()}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: stored }),
    }).catch(() => {});
  }
}

export function loginUrl(): string {
  return `${apiBase()}/auth/google/login`;
}

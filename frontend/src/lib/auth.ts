import { jwtDecode } from "jwt-decode";
import type { AuthResponse, JwtSessionPayload, SessionUser } from "./types";

const TOKEN_KEY = "concert_token";
const USER_KEY = "concert_user";

function canUseStorage() {
  return typeof window !== "undefined";
}

function syncCookie(token: string | null) {
  if (!canUseStorage()) {
    return;
  }

  if (!token) {
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
    return;
  }

  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=86400; SameSite=Lax`;
}

export function saveSession(response: AuthResponse) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(TOKEN_KEY, response.accessToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  syncCookie(response.accessToken);
}

export function clearSession() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  syncCookie(null);
}

export function getStoredToken() {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): SessionUser | null {
  if (!canUseStorage()) {
    return null;
  }

  const rawUser = window.localStorage.getItem(USER_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as SessionUser;
  } catch {
    clearSession();
    return null;
  }
}

export function decodeToken(token: string): JwtSessionPayload | null {
  try {
    return jwtDecode<JwtSessionPayload>(token);
  } catch {
    return null;
  }
}
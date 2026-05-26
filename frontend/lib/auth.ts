import type { Teacher } from "@/lib/types"

const TOKEN_KEY = "comprendoToken"
const TEACHER_KEY = "comprendoTeacher"

// ─── Token ────────────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// ─── Teacher session ──────────────────────────────────────────────────────────

export function getTeacher(): Teacher | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(TEACHER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Teacher
  } catch {
    return null
  }
}

export function setTeacher(teacher: Teacher): void {
  localStorage.setItem(TEACHER_KEY, JSON.stringify(teacher))
}

export function clearTeacher(): void {
  localStorage.removeItem(TEACHER_KEY)
}

// ─── Auth check ───────────────────────────────────────────────────────────────

export function isAuthenticated(): boolean {
  return !!getToken()
}

// ─── Clear all session ────────────────────────────────────────────────────────

export function clearSession(): void {
  clearToken()
  clearTeacher()
}

"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { login as apiLogin } from "@/lib/api"
import {
  getToken,
  setToken,
  clearSession,
  getTeacher,
  setTeacher,
} from "@/lib/auth"
import type { Teacher } from "@/lib/types"

export function useAuth() {
  const router = useRouter()
  const [token, setTokenState] = useState<string | null>(null)
  const [teacher, setTeacherState] = useState<Teacher | null>(null)
  const [hydrated, setHydrated] = useState(false)

  // Initialise from localStorage after mount (client-only)
  useEffect(() => {
    setTokenState(getToken())
    setTeacherState(getTeacher())
    setHydrated(true)
  }, [])

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      const data = await apiLogin(email, password)
      setToken(data.token)
      setTeacher(data.usuario)
      setTokenState(data.token)
      setTeacherState(data.usuario)
      router.push("/grados")
    },
    [router]
  )

  const logout = useCallback(() => {
    clearSession()
    setTokenState(null)
    setTeacherState(null)
    router.push("/")
  }, [router])

  return {
    token,
    teacher,
    isLoggedIn: hydrated ? !!token : false,
    login,
    logout,
  }
}

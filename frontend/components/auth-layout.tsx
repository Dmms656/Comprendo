"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { useAuth } from "@/hooks/useAuth"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { isLoggedIn, logout } = useAuth()

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfdf1]">
      <Navbar isLoggedIn={isLoggedIn} onLogout={logout} />
      <div className="flex-1 flex flex-col">{children}</div>
      <Footer />
    </div>
  )
}

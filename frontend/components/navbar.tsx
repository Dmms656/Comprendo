"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { HelpCircle, Bell, User } from "lucide-react"

interface NavbarProps {
  isLoggedIn?: boolean
  onLogin?: () => void
  onLogout?: () => void
}

export function Navbar({ isLoggedIn = false, onLogin, onLogout }: NavbarProps) {
  const router = useRouter()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <nav className="sticky top-0 z-50 h-14 bg-[#f4f0d5] border-b border-[#F1D87C]/30 px-8 flex items-center justify-between">
      {/* Logo */}
      <button
        onClick={() => router.push("/")}
        className={`text-2xl font-black tracking-tight cursor-pointer hover:opacity-80 transition-opacity ${
          isLoggedIn ? "text-[#7297C9]" : "text-[#9E5A78]"
        }`}
      >
        Comprendo
      </button>

      {/* Right side */}
      {!isLoggedIn ? (
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/registro")}
            className="rounded-2xl bg-[#5B9B95] px-6 py-2 text-xs font-bold text-white hover:bg-[#4a8880] shadow-md shadow-[#5B9B95]/15 hover:shadow-lg hover:scale-105 active:scale-[0.98] transition-all cursor-pointer"
          >
            Registrarse
          </button>
          <button
            onClick={() => router.push("/login")}
            className="rounded-2xl bg-[#5B9B95] px-6 py-2 text-xs font-bold text-white hover:bg-[#4a8880] shadow-md shadow-[#5B9B95]/15 hover:shadow-lg hover:scale-105 active:scale-[0.98] transition-all cursor-pointer"
          >
            Iniciar sesión
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          {/* Help button */}
          <IconButton icon={<HelpCircle className="h-5 w-5" />} tooltip="Ayuda" />
          
          {/* Notifications button */}
          <IconButton icon={<Bell className="h-5 w-5" />} tooltip="Notificaciones" />
          
          {/* Profile button with dropdown */}
          <div className="relative" ref={dropdownRef}>
            <IconButton
              icon={<User className="h-5 w-5" />}
              tooltip="Perfil"
              onClick={() => setShowDropdown(!showDropdown)}
              isActive={showDropdown}
            />
            
            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-40 rounded-2xl bg-white p-2 shadow-lg">
                <button
                  onClick={onLogout}
                  className="w-full rounded-xl px-4 py-2 text-left font-bold text-[#7297C9] hover:bg-[#fdfdf1] transition-colors"
                >
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

interface IconButtonProps {
  icon: React.ReactNode
  tooltip: string
  onClick?: () => void
  isActive?: boolean
}

function IconButton({ icon, tooltip, onClick, isActive }: IconButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex h-9 w-9 items-center justify-center rounded-full text-[#7297C9] hover:bg-[#7297C9]/10 transition-colors ${
          isActive ? "bg-[#7297C9]/10" : ""
        }`}
      >
        {icon}
      </button>
      
      {showTooltip && !isActive && (
        <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2">
          <div className="relative rounded-full bg-[#C66B86] px-3 py-1 text-sm font-medium text-white whitespace-nowrap">
            {tooltip}
            {/* Tooltip arrow */}
            <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-[#C66B86]" />
          </div>
        </div>
      )}
    </div>
  )
}

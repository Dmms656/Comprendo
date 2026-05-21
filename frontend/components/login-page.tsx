"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { PublicLayout } from "@/components/public-layout"
import { useAuth } from "@/hooks/useAuth"
import { ApiError } from "@/lib/api"

export function LoginPage() {
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      // navigation handled inside useAuth
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Ocurrió un error al iniciar sesión. Intenta de nuevo.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicLayout>
      {/* Main content - two columns */}
      <main className="flex-1 flex">
        {/* Left panel - Image with blur and tint */}
        <div className="hidden lg:block w-[55%] relative overflow-hidden">
          <img
            src="/images/img-iniciarsesion1.jpg"
            alt="Estudiantes en clase"
            className="w-full h-full object-cover"
          />
          {/* Blue tint overlay */}
          <div className="absolute inset-0 bg-[#7297C9]/35" />
        </div>

        {/* Right panel - Login form */}
        <div className="w-full lg:w-[45%] bg-[#fdfdf1] flex flex-col justify-center px-8 md:px-16 py-12">
          <form onSubmit={handleSubmit} className="max-w-md mx-auto w-full">
            <h1 className="font-bold text-4xl text-[#9E5A78] italic mb-10">
              Iniciar Sesión
            </h1>

            {/* Email field */}
            <div className="mb-6">
              <label
                htmlFor="email"
                className="block text-[#7297C9] font-semibold text-sm mb-1"
              >
                Usuario o correo
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@gmail.com"
                required
                disabled={loading}
                className="bg-[#fdfdf1] border border-[#F1D87C] rounded-xl px-4 py-2 w-full focus:outline-none focus:border-[#7297C9] transition-colors disabled:opacity-60"
              />
            </div>

            {/* Password field */}
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-[#7297C9] font-semibold text-sm mb-1"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-[#fdfdf1] border border-[#F1D87C] rounded-xl px-4 py-2 w-full pr-10 focus:outline-none focus:border-[#7297C9] transition-colors disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C66B86] hover:text-[#9E5A78] transition-colors"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-[#d4776a] text-sm mb-4 text-center font-medium">
                {error}
              </p>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="bg-[#5B9B95] text-white font-semibold rounded-full px-8 py-2 mx-auto flex items-center gap-2 hover:bg-[#4a8880] transition-colors mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              {loading ? "Ingresando..." : "Iniciar Sesión"}
            </button>

            {/* Register link */}
            <p className="text-center mt-4">
              <a
                href="/registro"
                className="text-[#C66B86] underline text-sm cursor-pointer hover:text-[#9E5A78] transition-colors"
              >
                Crea tu cuenta hoy
              </a>
            </p>
          </form>
        </div>
      </main>
    </PublicLayout>
  )
}

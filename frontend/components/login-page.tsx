"use client"

import { useState } from "react"
import { Eye, EyeOff, ArrowLeft, ShieldCheck } from "lucide-react"
import { PublicLayout } from "@/components/public-layout"
import { useAuth } from "@/hooks/useAuth"
import { ApiError } from "@/lib/api"
import { useRouter } from "next/navigation"

export function LoginPage() {
  const router = useRouter()
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
    <PublicLayout accentBars={false}>
      {/* Main content - split screen with high-end aesthetic */}
      <main className="flex-1 flex min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-[#faf6df] to-[#fdfdf1]">
        
        {/* Left panel - High Quality Illustration with overlay */}
        <div className="hidden lg:block w-[55%] relative overflow-hidden">
          <img
            src="/images/img-ingresar.jpg"
            alt="Beautiful modern classroom 3D art"
            className="w-full h-full object-cover transform scale-100 hover:scale-105 transition-transform duration-10000"
          />
          {/* Indigo/Teal overlay blend */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#9E5A78]/30 via-[#7297C9]/40 to-[#5B9B95]/20 mix-blend-multiply" />
          
          {/* Floating branding/motto inside illustration */}
          <div className="absolute bottom-16 left-16 right-16 bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 text-white space-y-2">
            <h2 className="text-2xl font-black italic tracking-tight">Comprendo</h2>
            <p className="text-sm font-medium text-white/90">
              Evaluaciones ágiles por Telegram que te brindan el mapa exacto del conocimiento de tus alumnos.
            </p>
          </div>
        </div>

        {/* Right panel - Login form with glass card */}
        <div className="w-full lg:w-[45%] flex flex-col justify-center px-6 md:px-16 py-12 relative">
          
          {/* Back button */}
          <button 
            onClick={() => router.push("/")}
            className="absolute top-6 left-6 md:left-12 flex items-center gap-2 text-sm text-[#9E5A78] hover:text-[#5B9B95] font-semibold transition-colors cursor-pointer group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Volver al inicio
          </button>
          
          <div className="max-w-md mx-auto w-full bg-white/60 backdrop-blur-lg p-8 rounded-3xl shadow-xl border border-white/80">
            
            <div className="mb-8 text-center">
              <div className="inline-flex p-3 rounded-2xl bg-[#5B9B95]/15 text-[#5B9B95] mb-3">
                <ShieldCheck size={28} />
              </div>
              <h1 className="font-black text-3xl text-[#9E5A78] tracking-tight">
                Iniciar Sesión
              </h1>
              <p className="text-xs text-[#C66B86] font-medium mt-1">
                ¡Qué bueno verte de nuevo! Ingresa tus credenciales a continuación.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Email field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-[#7297C9] font-bold text-xs uppercase tracking-wider pl-1"
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
                  className="bg-white/80 border border-[#F1D87C]/60 focus:border-[#5B9B95] rounded-2xl px-4 py-3 w-full text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5B9B95]/20 transition-all duration-300 disabled:opacity-60"
                />
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-[#7297C9] font-bold text-xs uppercase tracking-wider pl-1"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    className="bg-white/80 border border-[#F1D87C]/60 focus:border-[#5B9B95] rounded-2xl px-4 py-3 w-full pr-11 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5B9B95]/20 transition-all duration-300 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#C66B86] hover:text-[#9E5A78] transition-colors"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="p-3 bg-[#d4776a]/15 border border-[#d4776a]/20 text-[#d4776a] text-xs rounded-xl text-center font-semibold animate-shake">
                  {error}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#5B9B95] text-white font-bold rounded-2xl py-3.5 flex items-center justify-center gap-2 hover:bg-[#4a8880] hover:shadow-lg hover:shadow-[#5B9B95]/25 active:scale-[0.99] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading && (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                {loading ? "Ingresando..." : "Ingresar a mi cuenta"}
              </button>

              {/* Register link */}
              <p className="text-center text-sm text-[#5B5B5B] pt-2">
                ¿No tienes una cuenta?{" "}
                <a
                  onClick={() => router.push("/registro")}
                  className="text-[#C66B86] font-bold underline cursor-pointer hover:text-[#9E5A78] transition-colors"
                >
                  Crea tu cuenta hoy
                </a>
              </p>
            </form>
          </div>
        </div>
      </main>
    </PublicLayout>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, ChevronDown, ArrowLeft, Award } from "lucide-react"
import { PublicLayout } from "@/components/public-layout"
import { register } from "@/lib/api"
import { ApiError } from "@/lib/api"

const unidadesFeyAlegria = [
  "José María Vélaz, S.J.",
  "Tobar Donoso",
  "Hermano Miguel",
  "Carolina de Febres Cordero",
]

export function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [unidad, setUnidad] = useState<"fe" | "otro">("fe")
  const [selectedUnidad, setSelectedUnidad] = useState("")
  const [otroUnidad, setOtroUnidad] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const unidadEducativa = unidad === "fe" ? selectedUnidad : otroUnidad

    try {
      await register({
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        password: formData.password,
        unidadEducativa,
      })
      router.push("/login")
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Ocurrió un error al registrarse. Intenta de nuevo.")
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
            src="/images/img-registrarse.jpg"
            alt="Maestra leyendo con estudiantes 3D illustration"
            className="w-full h-full object-cover object-left transform scale-100 hover:scale-105 transition-transform duration-10000"
          />
          {/* Teal tint overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#5B9B95]/35 via-[#9BC294]/30 to-[#F1D87C]/20 mix-blend-multiply" />
          
          {/* Floating branding/motto inside illustration */}
          <div className="absolute bottom-16 left-16 right-16 bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 text-white space-y-2">
            <h2 className="text-2xl font-black italic tracking-tight">Comprendo</h2>
            <p className="text-sm font-medium text-white/90">
              Registra tu cuenta en segundos y eleva el nivel de comprensión lectora y de contenidos en tus materias.
            </p>
          </div>
        </div>

        {/* Right panel - Registration Form with glass card */}
        <div className="w-full lg:w-[45%] flex flex-col justify-center px-6 md:px-16 py-10 relative">
          
          {/* Back button */}
          <button 
            onClick={() => router.push("/")}
            className="absolute top-6 left-6 md:left-12 flex items-center gap-2 text-sm text-[#9E5A78] hover:text-[#5B9B95] font-semibold transition-colors cursor-pointer group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Volver al inicio
          </button>
          
          <div className="max-w-md mx-auto w-full bg-white/60 backdrop-blur-lg p-6 md:p-8 rounded-3xl shadow-xl border border-white/80 my-4">
            
            <div className="mb-6 text-center">
              <div className="inline-flex p-3 rounded-2xl bg-[#9E5A78]/10 text-[#9E5A78] mb-2">
                <Award size={24} />
              </div>
              <h1 className="font-black text-2xl md:text-3xl text-[#9E5A78] tracking-tight">
                Registrarse
              </h1>
              <p className="text-xs text-[#C66B86] font-medium mt-0.5">
                Crea tu cuenta de docente y automatiza tus evaluaciones.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Name row */}
              <div className="flex gap-4">
                <div className="flex-1 space-y-1">
                  <label className="block text-[#7297C9] font-bold text-xs uppercase tracking-wider pl-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    placeholder="Ignacio"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    disabled={loading}
                    className="w-full bg-white/80 border border-[#F1D87C]/60 focus:border-[#5B9B95] rounded-2xl px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5B9B95]/20 transition-all duration-300 disabled:opacity-60"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="block text-[#7297C9] font-bold text-xs uppercase tracking-wider pl-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    placeholder="Libre"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    required
                    disabled={loading}
                    className="w-full bg-white/80 border border-[#F1D87C]/60 focus:border-[#5B9B95] rounded-2xl px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5B9B95]/20 transition-all duration-300 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-[#7297C9] font-bold text-xs uppercase tracking-wider pl-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  placeholder="ejemplo@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                  className="w-full bg-white/80 border border-[#F1D87C]/60 focus:border-[#5B9B95] rounded-2xl px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5B9B95]/20 transition-all duration-300 disabled:opacity-60"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-[#7297C9] font-bold text-xs uppercase tracking-wider pl-1">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={loading}
                    className="w-full bg-white/80 border border-[#F1D87C]/60 focus:border-[#5B9B95] rounded-2xl px-4 py-2.5 pr-11 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5B9B95]/20 transition-all duration-300 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#C66B86] hover:text-[#9E5A78] transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Unidad Educativa */}
              <div className="space-y-1.5">
                <label className="block text-[#7297C9] font-bold text-xs uppercase tracking-wider pl-1">
                  Unidad Educativa
                </label>
                
                <div className="flex gap-2.5 mb-2">
                  <button
                    type="button"
                    onClick={() => setUnidad("fe")}
                    disabled={loading}
                    className={`flex-1 rounded-2xl py-2 px-3 text-xs font-bold transition-all duration-300 transform active:scale-95 cursor-pointer ${
                      unidad === "fe"
                        ? "bg-[#C66B86] text-white shadow-md shadow-[#C66B86]/20 border border-transparent"
                        : "bg-white/85 text-[#C66B86] border border-[#C66B86]/35 hover:bg-[#C66B86]/5"
                    }`}
                  >
                    Fe y Alegría
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnidad("otro")}
                    disabled={loading}
                    className={`flex-1 rounded-2xl py-2 px-3 text-xs font-bold transition-all duration-300 transform active:scale-95 cursor-pointer ${
                      unidad === "otro"
                        ? "bg-[#7297C9] text-white shadow-md shadow-[#7297C9]/20 border border-transparent"
                        : "bg-white/85 text-[#7297C9] border border-[#7297C9]/35 hover:bg-[#7297C9]/5"
                    }`}
                  >
                    Otro
                  </button>
                </div>

                {unidad === "fe" ? (
                  <div className="relative">
                    <select
                      value={selectedUnidad}
                      onChange={(e) => setSelectedUnidad(e.target.value)}
                      disabled={loading}
                      required
                      className="w-full bg-white/85 border border-[#F1D87C]/60 rounded-2xl px-4 py-2.5 pr-10 text-sm text-gray-700 appearance-none focus:outline-none focus:border-[#5B9B95] focus:ring-2 focus:ring-[#5B9B95]/20 transition-all duration-300 disabled:opacity-60"
                    >
                      <option value="" disabled>Seleccione una Unidad</option>
                      {unidadesFeyAlegria.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                    <ChevronDown
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#d4776a] pointer-events-none"
                      size={18}
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Ingresa tu unidad educativa"
                    value={otroUnidad}
                    onChange={(e) => setOtroUnidad(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full bg-white/85 border border-[#F1D87C]/60 focus:border-[#5B9B95] rounded-2xl px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5B9B95]/20 transition-all duration-300 disabled:opacity-60"
                  />
                )}
              </div>

              {/* Error message */}
              {error && (
                <div className="p-3 bg-[#d4776a]/15 border border-[#d4776a]/20 text-[#d4776a] text-xs rounded-xl text-center font-semibold">
                  {error}
                </div>
              )}

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#5B9B95] text-white font-bold rounded-2xl py-3.5 flex items-center justify-center gap-2 hover:bg-[#4a8880] hover:shadow-lg hover:shadow-[#5B9B95]/25 active:scale-[0.99] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading && (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  )}
                  {loading ? "Creando cuenta..." : "Crear mi cuenta"}
                </button>
              </div>

              {/* Login link */}
              <p className="text-center text-sm text-[#5B5B5B]">
                ¿Ya tienes una cuenta?{" "}
                <a
                  onClick={() => router.push("/login")}
                  className="text-[#C66B86] font-bold underline cursor-pointer hover:text-[#9E5A78] transition-colors"
                >
                  Inicia sesión
                </a>
              </p>
            </form>
          </div>
        </div>
      </main>
    </PublicLayout>
  )
}

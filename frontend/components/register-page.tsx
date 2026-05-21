"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, ChevronDown } from "lucide-react"
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
    <PublicLayout>
      {/* Main content - two columns filling remaining space */}
      <main className="flex-1 flex">
        {/* Left panel - Image filling full height */}
        <div className="hidden lg:block w-[55%] relative overflow-hidden">
          <img
            src="/images/img-registrarse1.jpg"
            alt="Maestra leyendo con estudiantes"
            className="w-full h-full object-cover object-left"
          />
          {/* Teal tint overlay */}
          <div className="absolute inset-0 bg-[#5B9B95]/35" />
        </div>

        {/* Right panel - Form */}
        <div className="w-full lg:w-[45%] bg-[#fdfdf1] flex flex-col justify-center px-8 md:px-16 py-12">
          <form onSubmit={handleSubmit} className="max-w-md mx-auto w-full space-y-5">
            <h1 className="font-bold text-4xl text-[#9E5A78] italic mb-6">
              Registrarse
            </h1>

            {/* Name row */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-[#7297C9] font-semibold text-sm mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  placeholder="Ignacio"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  disabled={loading}
                  className="w-full bg-[#fdfdf1] border border-[#F1D87C] rounded-xl px-4 py-2 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#7297C9] transition-colors disabled:opacity-60"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[#7297C9] font-semibold text-sm mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  placeholder="Libre"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  required
                  disabled={loading}
                  className="w-full bg-[#fdfdf1] border border-[#F1D87C] rounded-xl px-4 py-2 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#7297C9] transition-colors disabled:opacity-60"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[#7297C9] font-semibold text-sm mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                placeholder="ejemplo@gmail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
                className="w-full bg-[#fdfdf1] border border-[#F1D87C] rounded-xl px-4 py-2 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#7297C9] transition-colors disabled:opacity-60"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[#7297C9] font-semibold text-sm mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading}
                  className="w-full bg-[#fdfdf1] border border-[#F1D87C] rounded-xl px-4 py-2 pr-10 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#7297C9] transition-colors disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C66B86] hover:text-[#9E5A78] transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Unidad Educativa */}
            <div>
              <label className="block text-[#7297C9] font-semibold text-sm mb-2">
                Unidad Educativa
              </label>
              <div className="flex gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => setUnidad("fe")}
                  disabled={loading}
                  className={`rounded-full px-6 py-2 font-semibold transition-colors ${
                    unidad === "fe"
                      ? "bg-[#C66B86] text-white"
                      : "bg-[#fdfdf1] text-[#C66B86] border border-[#C66B86]"
                  }`}
                >
                  Fe y Alegría
                </button>
                <button
                  type="button"
                  onClick={() => setUnidad("otro")}
                  disabled={loading}
                  className={`rounded-full px-6 py-2 font-semibold transition-colors ${
                    unidad === "otro"
                      ? "bg-[#7297C9] text-white"
                      : "bg-[#fdfdf1] text-[#7297C9] border border-[#7297C9]"
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
                    className="w-full bg-[#fdfdf1] border border-[#F1D87C] rounded-xl px-4 py-2 pr-10 text-gray-700 appearance-none focus:outline-none focus:border-[#7297C9] transition-colors disabled:opacity-60"
                  >
                    <option value="" disabled>Seleccione una Unidad</option>
                    {unidadesFeyAlegria.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#d4776a] pointer-events-none"
                    size={20}
                  />
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Ingresa tu unidad educativa"
                  value={otroUnidad}
                  onChange={(e) => setOtroUnidad(e.target.value)}
                  disabled={loading}
                  className="w-full bg-[#fdfdf1] border border-[#F1D87C] rounded-xl px-4 py-2 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#7297C9] transition-colors disabled:opacity-60"
                />
              )}
            </div>

            {/* Error message */}
            {error && (
              <p className="text-[#d4776a] text-sm text-center font-medium">
                {error}
              </p>
            )}

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 mx-auto bg-[#5B9B95] text-white font-semibold rounded-full px-10 py-2 hover:bg-[#4a8880] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading && (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                {loading ? "Registrando..." : "Registrarse"}
              </button>
            </div>

            {/* Login link */}
            <p className="text-center">
              <a
                href="/login"
                className="text-[#C66B86] underline text-sm cursor-pointer hover:text-[#9E5A78] transition-colors"
              >
                ¿Ya tienes cuenta? Inicia sesión
              </a>
            </p>
          </form>
        </div>
      </main>
    </PublicLayout>
  )
}

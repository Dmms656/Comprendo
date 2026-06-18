"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Search, Link2, Copy, Check, RefreshCw, X, ArrowRight, UserPlus, HelpCircle, Trash2 } from "lucide-react"
import { AuthLayout } from "@/components/auth-layout"
import { CourseSidebar } from "@/components/course-sidebar"
import { CourseFlowHeader } from "@/components/course-flow-header"
import { getEstudiantes, generarCodigo, getBotInfo, removeEstudianteFromMateria, getAsignaciones } from "@/lib/api"
import type { Estudiante } from "@/lib/types"
import { useRouter } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

// ─── Types ────────────────────────────────────────────────────────────────────
interface EstudiantesPageProps {
  gradeId?: string | number
  gradeName?: string
  section?: string
  subject?: string
}

// ─── Mock fallback (dev mode) ─────────────────────────────────────────────────
const MOCK_STUDENTS: Estudiante[] = [
  { id: 1, nombre: "Georgina", apellido: "Arcos",    telefono: "0907965234" },
  { id: 2, nombre: "Mateo",    apellido: "Carranza",  telefono: "0934523454" },
  { id: 3, nombre: "Antonella",apellido: "Cina",      telefono: "0906554654" },
  { id: 4, nombre: "Cesar",    apellido: "Estrada",   telefono: "0964554284" },
  { id: 5, nombre: "Miguel",   apellido: "Paz",       telefono: "0965425096" },
]

// ─── Skeleton rows ────────────────────────────────────────────────────────────
function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-gray-100 animate-pulse">
          <td className="px-6 py-4">
            <div className="h-4 rounded-full bg-[#9E5A78]/10 w-44" />
          </td>
          <td className="px-6 py-4 text-center">
            <div className="h-4 rounded-full bg-[#5B9B95]/10 w-28 mx-auto" />
          </td>
        </tr>
      ))}
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function EstudiantesPage({
  gradeId = "2",
  gradeName = "Segundo",
  section = "D",
  subject = "Física",
}: EstudiantesPageProps) {
  const router = useRouter()
  const [search, setSearch]   = useState("")
  const [sortAsc, setSortAsc] = useState(true)

  // ── API state ────────────────────────────────────────────────────────────
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Enrollment link state ─────────────────────────────────────────────────
  const [generating, setGenerating] = useState(false)
  const [enrollCode, setEnrollCode] = useState<string | null>(null)
  const [enrollLink, setEnrollLink] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [botUsername, setBotUsername] = useState<string>("Comprendobotv1_bot")

  // Fetch the Telegram bot username once on mount
  useEffect(() => {
    getBotInfo()
      .then((info) => { if (info.username) setBotUsername(info.username) })
      .catch(() => { /* silently ignore — default fallback is used */ })
  }, [])

  // ── Load students ─────────────────────────────────────────────────────────
  const loadEstudiantes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getEstudiantes(gradeId)
      setEstudiantes(data)
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        setEstudiantes(MOCK_STUDENTS)
      } else {
        setError(err instanceof Error ? err.message : "Error al cargar estudiantes")
      }
    } finally {
      setLoading(false)
    }
  }, [gradeId])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getEstudiantes(gradeId)
        if (!cancelled) setEstudiantes(data)
      } catch (err) {
        if (!cancelled) {
          if (process.env.NODE_ENV === "development") {
            setEstudiantes(MOCK_STUDENTS)
          } else {
            setError(err instanceof Error ? err.message : "Error al cargar estudiantes")
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [gradeId])

  // Cargar código estático del curso y enlace genérico al bot
  useEffect(() => {
    async function loadEnrollmentInfo() {
      try {
        const asignaciones = await getAsignaciones()
        const asignacion = asignaciones.find(
          (a) => String(a.idDocenteCursoMateria) === String(gradeId)
        )
        let code = asignacion?.codigoAcceso ?? null
        if (!code) {
          code = await generarCodigo(gradeId)
        }
        setEnrollCode(code)
        setEnrollLink(`https://t.me/${botUsername}?start=inscripcion`)
      } catch {
        // El profesor puede reintentar con el botón
      }
    }
    if (botUsername && gradeId) {
      loadEnrollmentInfo()
    }
  }, [gradeId, botUsername])

  // ── Generate enrollment link manually ───────────────────────────────────────
  const handleObtenerCodigo = async () => {
    setGenerating(true)
    setGenError(null)
    try {
      const asignaciones = await getAsignaciones()
      const asignacion = asignaciones.find(
        (a) => String(a.idDocenteCursoMateria) === String(gradeId)
      )
      let code = asignacion?.codigoAcceso ?? null
      if (!code) {
        code = await generarCodigo(gradeId)
      }
      setEnrollCode(code)
      setEnrollLink(`https://t.me/${botUsername}?start=inscripcion`)
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "No se pudo obtener el código")
    } finally {
      setGenerating(false)
    }
  }

  const handleCopyLink = async () => {
    if (!enrollLink) return
    await navigator.clipboard.writeText(enrollLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleCopyCode = async () => {
    if (!enrollCode) return
    await navigator.clipboard.writeText(enrollCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const filtered = useMemo(() => {
    const fullName = (e: Estudiante) => {
      const nom = e.nombre ?? e.nombres ?? ""
      const ape = e.apellido ?? e.apellidos ?? ""
      return `${nom} ${ape}`.trim()
    }

    let result = [...estudiantes]

    if (search.trim()) {
      result = result.filter((e) =>
        fullName(e).toLowerCase().includes(search.toLowerCase())
      )
    }

    result.sort((a, b) =>
      sortAsc
        ? fullName(a).localeCompare(fullName(b))
        : fullName(b).localeCompare(fullName(a))
    )

    return result
  }, [estudiantes, search, sortAsc])

  const [removingId, setRemovingId] = useState<string | number | null>(null)

  const handleRemoveStudent = async (student: Estudiante) => {
    const name = `${student.nombre} ${student.apellido ?? ""}`.trim()
    if (!confirm(`¿Quitar a ${name} de este curso?`)) return
    setRemovingId(student.id)
    try {
      await removeEstudianteFromMateria(student.id, gradeId)
      await loadEstudiantes()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo quitar al estudiante")
    } finally {
      setRemovingId(null)
    }
  }

  const getPhone = (e: Estudiante) =>
    e.telefono ?? e.telefonoTelegram ?? e.telefonoCelular ?? "—"

  return (
    <AuthLayout>
      <div className="flex flex-1 min-h-[calc(100vh-3.5rem)]">
        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <CourseSidebar
          gradeId={gradeId}
          subject={subject}
          gradeName={gradeName}
          section={section}
          activeTab="estudiantes"
        />

        {/* ── Main ──────────────────────────────────────────────────────── */}
        <main className="flex-1 bg-gradient-to-br from-[#faf6df] via-[#fdfdf1] to-[#FAF8EB] px-6 md:px-8 py-6 min-w-0">
          
          {/* Breadcrumb */}
          <Breadcrumb className="mb-2">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  onClick={() => router.push("/grados")}
                  className="cursor-pointer text-[#7297C9] hover:text-[#5B9B95] font-bold text-xs uppercase tracking-wide transition-colors"
                >
                  Mis Cursos
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-[#7297C9] [&>svg]:size-3" />
              <BreadcrumbItem>
                <BreadcrumbLink
                  onClick={() => router.push(`/curso/${gradeId}/${encodeURIComponent(subject)}/dashboard`)}
                  className="cursor-pointer text-[#7297C9] hover:text-[#5B9B95] font-bold text-xs uppercase tracking-wide transition-colors"
                >
                  {gradeName} — {subject}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-[#7297C9] [&>svg]:size-3" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-[#C66B86] font-bold text-xs uppercase tracking-wide">
                  Estudiantes
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Onboarding Flow Steps Header */}
          <CourseFlowHeader gradeId={gradeId} subject={subject} activeStep="estudiantes" />

          {/* ── SECTION 1: INVITATION INLINE CARD (COMPARTIR EL LINK) ── */}
          <div className="w-full bg-white rounded-3xl p-6 mb-6 shadow-sm border border-[#F1D87C]/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#5B9B95]/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-2 mb-4 text-[#9E5A78]">
              <div className="p-1.5 rounded-xl bg-[#9E5A78]/10 text-[#9E5A78]">
                <UserPlus size={20} />
              </div>
              <h2 className="font-black text-xl tracking-tight">Invitar Estudiantes a Telegram</h2>
            </div>

            {!enrollCode ? (
              <div className="bg-[#faf6df]/50 rounded-2xl p-5 border border-dashed border-[#F1D87C]/60 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 max-w-xl">
                  <p className="text-sm font-bold text-[#9E5A78]">¡Comencemos a registrar estudiantes!</p>
                  <p className="text-xs text-[#C66B86] leading-relaxed">
                    Obtén el código permanente de este curso. Los estudiantes abren el bot de Telegram, se registran con su teléfono y datos, e ingresan este código.
                  </p>
                </div>
                <button
                  onClick={handleObtenerCodigo}
                  disabled={generating}
                  className="bg-[#5B9B95] text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md shadow-[#5B9B95]/15 hover:shadow-lg transition-all duration-300 transform active:scale-95 flex items-center gap-2 flex-shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {generating ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Link2 size={16} />
                  )}
                  {generating ? "Cargando..." : "Mostrar código del curso"}
                </button>
              </div>
            ) : (
              /* Inline interactive details - zero modals! */
              <div className="space-y-5 animate-in fade-in slide-in-from-top-3 duration-300">
                <p className="text-xs text-[#5B5B5B] leading-relaxed">
                  Comparte el enlace del bot y el código con tus estudiantes de <strong>{gradeName} — {subject}</strong>. El código es permanente para este curso.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left: Link display card */}
                  <div className="bg-[#faf6df]/40 rounded-2xl p-4 border border-[#F1D87C]/30 flex flex-col justify-between gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C66B86]">Enlace al bot de Telegram</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white border border-[#F1D87C]/40 rounded-xl py-2.5 px-3.5 text-xs text-[#5B9B95] font-bold overflow-hidden text-ellipsis whitespace-nowrap">
                        {enrollLink}
                      </div>
                      <button
                        onClick={handleCopyLink}
                        className={`p-3 rounded-xl border flex-shrink-0 transition-all cursor-pointer ${
                          copiedLink
                            ? "bg-[#9BC294]/20 border-[#9BC294]/40 text-[#5a8c55]"
                            : "bg-white border-[#F1D87C]/40 text-[#5B9B95] hover:bg-[#5B9B95]/10"
                        }`}
                        title="Copiar enlace"
                      >
                        {copiedLink ? <Check size={18} /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Right: Code display card */}
                  <div className="bg-[#faf6df]/40 rounded-2xl p-4 border border-[#F1D87C]/30 flex flex-col justify-between gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C66B86]">Código del curso (permanente)</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white border border-[#F1D87C]/40 rounded-xl py-2 font-mono text-xl font-bold tracking-[0.2em] text-[#9E5A78] text-center">
                        {enrollCode}
                      </div>
                      <button
                        onClick={handleCopyCode}
                        className={`p-3 rounded-xl border flex-shrink-0 transition-all cursor-pointer ${
                          copiedCode
                            ? "bg-[#9BC294]/20 border-[#9BC294]/40 text-[#5a8c55]"
                            : "bg-white border-[#F1D87C]/40 text-[#5B9B95] hover:bg-[#5B9B95]/10"
                        }`}
                        title="Copiar código"
                      >
                        {copiedCode ? <Check size={18} /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Guide notes */}
                <div className="bg-[#7297C9]/10 border border-[#7297C9]/20 rounded-2xl p-4 flex gap-3 text-xs text-[#5272a0] leading-relaxed">
                  <div className="p-1 rounded-lg bg-white/60 text-[#7297C9] flex-shrink-0 h-fit">
                    <HelpCircle size={16} />
                  </div>
                  <div>
                    <strong>📱 ¿Cómo se inscriben tus estudiantes?</strong>
                    <ul className="list-disc pl-4 mt-1 space-y-1 text-[#5272a0]/90">
                      <li>Abren el enlace del bot (envía <code>/start</code> automáticamente) o buscan <strong>@{botUsername}</strong></li>
                      <li>Si es su primera vez: teléfono → nombre → apellido → código → verificación</li>
                      <li>Si ya están registrados: el bot les pedirá directamente el código <strong>{enrollCode}</strong></li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error from code generation */}
          {genError && (
            <div className="mb-4 p-3 rounded-2xl bg-[#d4776a]/10 border border-[#d4776a]/20 text-[#d4776a] text-xs flex items-center gap-2 animate-shake">
              <X size={14} className="flex-shrink-0" />
              {genError}
            </div>
          )}

          {/* ── SECTION 2: STUDENTS LIST TABLE ── */}
          <div className="w-full bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            
            {/* Table Control header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-[#9E5A78] font-black text-lg">Alumnos Registrados</span>
                <span className="text-[10px] font-bold bg-[#9E5A78]/10 text-[#9E5A78] rounded-full px-2 py-0.5">
                  {filtered.length} total
                </span>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar estudiante..."
                    className="bg-gray-50 border border-gray-100 rounded-2xl pl-4 pr-10 py-2 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#5B9B95] focus:ring-2 focus:ring-[#5B9B95]/10 w-44 transition-all"
                  />
                  <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5B9B95]" />
                </div>

                {/* Refresh list */}
                <button
                  onClick={loadEstudiantes}
                  disabled={loading}
                  className="p-2.5 rounded-2xl border border-gray-100 text-[#5B9B95] bg-white hover:bg-[#5B9B95]/5 transition-colors disabled:opacity-40 cursor-pointer"
                  title="Actualizar lista"
                >
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-[#d4776a] text-sm mb-4 font-semibold text-center">{error}</p>
            )}

            {/* Table wrapper */}
            <div className="w-full rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th
                      onClick={() => setSortAsc((v) => !v)}
                      className="text-left px-6 py-4 text-xs font-black text-[#9E5A78] uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 transition-colors"
                    >
                      <span className="flex items-center gap-1">
                        Nombre y Apellido
                        <span className="text-[10px] text-[#C66B86]">{sortAsc ? "▲" : "▼"}</span>
                      </span>
                    </th>
                    <th className="px-6 py-4 text-xs font-black text-[#5B9B95] uppercase tracking-wider text-center">
                      Teléfono Telegram
                    </th>
                    <th className="px-6 py-4 text-xs font-black text-[#C66B86] uppercase tracking-wider text-center">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <SkeletonRows />
                  ) : filtered.length > 0 ? (
                    filtered.map((student, idx) => (
                      <tr
                        key={student.id ? String(student.id) : `student-${idx}`}
                        className="hover:bg-[#FAF8EB] transition-colors"
                      >
                        <td className="px-6 py-3.5 font-bold text-gray-700">
                          {student.nombre} {student.apellido ?? ""}
                        </td>
                        <td className="px-6 py-3.5 text-gray-600 text-center font-mono text-xs">
                          {getPhone(student)}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveStudent(student)}
                            disabled={removingId === student.id}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#d4776a] hover:bg-[#d4776a]/10 px-2 py-1 rounded-lg disabled:opacity-50"
                            title="Quitar del curso"
                          >
                            <Trash2 size={14} />
                            {removingId === student.id ? "..." : "Quitar"}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-[#C66B86] font-semibold italic">
                        No hay estudiantes inscritos en este curso todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── SECTION 3: STEP 2 CALL TO ACTION BANNER ── */}
          <div className="w-full mt-6 bg-gradient-to-r from-[#5B9B95] to-[#4a8a80] rounded-3xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md shadow-[#5B9B95]/10 animate-in fade-in duration-300">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-black text-lg tracking-tight">¿Estudiantes listos para evaluar?</h3>
              <p className="text-white/80 text-xs">
                Una vez inscritos los estudiantes, procede a crear evaluaciones dinámicas e interactivas.
              </p>
            </div>
            <button
              onClick={() => router.push(`/curso/${gradeId}/${encodeURIComponent(subject)}/lecciones`)}
              className="bg-white text-[#5B9B95] hover:text-[#4a8a80] font-black text-sm px-6 py-3 rounded-2xl shadow-md transition-all duration-300 hover:shadow-lg active:scale-[0.99] flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              Paso 2: Ir a Lecciones <ArrowRight size={16} />
            </button>
          </div>

        </main>
      </div>
    </AuthLayout>
  )
}

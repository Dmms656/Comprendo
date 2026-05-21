"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Search, Link2, Copy, Check, RefreshCw, X } from "lucide-react"
import { AuthLayout } from "@/components/auth-layout"
import { CourseSidebar } from "@/components/course-sidebar"
import { getEstudiantes, generarCodigo, getBotInfo } from "@/lib/api"
import type { Estudiante } from "@/lib/types"

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
        <tr key={i} className="border-b border-[#E8E0D5] animate-pulse">
          <td className="px-4 py-3">
            <div className="h-4 rounded-full bg-[#9E5A78]/10 w-40" />
          </td>
          <td className="px-4 py-3 text-center">
            <div className="h-4 rounded-full bg-[#5B9B95]/10 w-24 mx-auto" />
          </td>
        </tr>
      ))}
    </>
  )
}

// ─── Enrollment Link Modal ─────────────────────────────────────────────────────
function EnrollmentModal({
  code,
  link,
  gradeName,
  subject,
  onClose,
}: {
  code: string
  link: string
  gradeName: string
  subject: string
  onClose: () => void
}) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(link)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2500)
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(30,18,24,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Modal card */}
      <div
        className="relative bg-[#fdfdf1] rounded-3xl shadow-2xl border border-[#F1D87C]/30 w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-[#C66B86] hover:bg-[#C66B86]/10 transition-colors"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        {/* Icon badge */}
        <div className="flex justify-center mb-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md"
            style={{ background: "linear-gradient(135deg, #5B9B95 0%, #4a8880 100%)" }}
          >
            <Link2 size={28} className="text-white" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold italic text-[#9E5A78] text-center mb-1">
          ¡Link de Telegram generado!
        </h2>
        <p className="text-xs text-[#C66B86] text-center mb-6 leading-relaxed">
          Comparte este enlace con tus estudiantes de{" "}
          <strong>{gradeName} — {subject}</strong>. Al hacer clic, se abrirá el bot de Telegram y quedarán inscritos automáticamente.
        </p>

        {/* Code display */}
        <div className="mb-4">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#C66B86] mb-1.5">
            Código de acceso
          </label>
          <div className="flex items-center gap-2">
            <div
              className="flex-1 text-center font-mono text-3xl font-bold tracking-[0.35em] py-3 rounded-xl border border-[#F1D87C]/40"
              style={{ backgroundColor: "#faf6df", color: "#9E5A78" }}
            >
              {code}
            </div>
            <button
              onClick={handleCopyCode}
              className={`p-3 rounded-xl border transition-all ${
                copiedCode
                  ? "bg-[#9BC294]/20 border-[#9BC294]/40 text-[#5a8c55]"
                  : "bg-[#faf6df] border-[#F1D87C]/40 text-[#5B9B95] hover:bg-[#5B9B95]/10"
              }`}
              title="Copiar código"
            >
              {copiedCode ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2 my-4">
          <div className="flex-1 h-px bg-[#F1D87C]/30" />
          <span className="text-[10px] text-[#C66B86]/60 font-semibold uppercase tracking-widest">o también</span>
          <div className="flex-1 h-px bg-[#F1D87C]/30" />
        </div>

        {/* Link display */}
        <div className="mb-6">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#C66B86] mb-1.5">
            Enlace de Telegram
          </label>
          <div className="flex items-center gap-2">
            <div
              className="flex-1 text-xs text-[#5B9B95] py-2.5 px-3 rounded-xl border border-[#F1D87C]/40 overflow-hidden whitespace-nowrap text-ellipsis"
              style={{ backgroundColor: "#faf6df" }}
              title={link}
            >
              {link}
            </div>
            <button
              onClick={handleCopyLink}
              className={`p-3 rounded-xl border transition-all flex-shrink-0 ${
                copiedLink
                  ? "bg-[#9BC294]/20 border-[#9BC294]/40 text-[#5a8c55]"
                  : "bg-[#faf6df] border-[#F1D87C]/40 text-[#5B9B95] hover:bg-[#5B9B95]/10"
              }`}
              title="Copiar enlace"
            >
              {copiedLink ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        </div>

        {/* Info note */}
        <div className="p-3 rounded-xl bg-[#7297C9]/10 border border-[#7297C9]/20 text-[#5272a0] text-xs leading-relaxed">
          <strong>📱 ¿Cómo funciona?</strong> El estudiante hace clic en el enlace → se abre el bot <strong>@{link.split("t.me/")[1]?.split("?")[0] ?? "ComprendoBot"}</strong> en Telegram → el bot le inscribe automáticamente en la materia y quedará visible en esta lista.
        </div>

        {/* Close button at bottom */}
        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-all"
          style={{ background: "linear-gradient(135deg, #9E5A78 0%, #C66B86 100%)" }}
        >
          Listo
        </button>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function EstudiantesPage({
  gradeId = "2",
  gradeName = "Segundo",
  section = "D",
  subject = "Física",
}: EstudiantesPageProps) {
  const [search, setSearch]   = useState("")
  const [sortAsc, setSortAsc] = useState(true)

  // ── API state ────────────────────────────────────────────────────────────
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Enrollment link state ─────────────────────────────────────────────────
  const [generating, setGenerating] = useState(false)
  const [enrollModal, setEnrollModal] = useState<{ code: string; link: string } | null>(null)
  const [genError, setGenError] = useState<string | null>(null)
  const [botUsername, setBotUsername] = useState<string>("Comprendobotv1_bot")

  // Fetch the Telegram bot username once on mount
  useEffect(() => {
    getBotInfo()
      .then((info) => { if (info.username) setBotUsername(info.username) })
      .catch(() => { /* silently ignore — default fallback is used */ })
  }, [])

  const breadcrumb = `Grados/${gradeName}/${subject}/Estudiantes`

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

  // ── Generate enrollment link ───────────────────────────────────────────────
  const handleGenerarLink = async () => {
    setGenerating(true)
    setGenError(null)
    try {
      // Resolve the idDocenteCursoMateria for this gradeId
      // gradeId is already the idDocenteCursoMateria coming from the route
      const code = await generarCodigo(gradeId)

      // Build the Telegram deep link — clicking it opens the bot and sends /start CODE
      const link = `https://t.me/${botUsername}?start=${code}`

      setEnrollModal({ code, link })

      // Refresh list after generating (new students may appear after sharing)
      await loadEstudiantes()
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "No se pudo generar el link")
    } finally {
      setGenerating(false)
    }
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

  const getPhone = (e: Estudiante) =>
    e.telefono ?? e.telefonoTelegram ?? e.telefonoCelular ?? "—"

  return (
    <AuthLayout>
      <div className="flex flex-1">
        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <CourseSidebar
          gradeId={gradeId}
          subject={subject}
          gradeName={gradeName}
          section={section}
          activeTab="estudiantes"
        />

        {/* ── Main ──────────────────────────────────────────────────────── */}
        <main className="flex-1 bg-[#faf6df] px-8 py-6 min-w-0">
          {/* Breadcrumb */}
          <p className="text-[#7297C9] text-sm mb-2">{breadcrumb}</p>

          {/* Heading + Generate Link button */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h1 className="text-4xl font-bold italic text-[#9E5A78]">
              Estudiantes
            </h1>

            <div className="flex items-center gap-2">
              {/* Refresh list */}
              <button
                onClick={loadEstudiantes}
                disabled={loading}
                className="p-2 rounded-xl border border-[#F1D87C]/40 bg-[#fdfdf1] text-[#5B9B95] hover:bg-[#5B9B95]/10 transition-colors disabled:opacity-40"
                title="Actualizar lista"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              </button>

              {/* Generate enrollment link */}
              <button
                onClick={handleGenerarLink}
                disabled={generating}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #5B9B95 0%, #4a8880 100%)" }}
              >
                {generating ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Link2 size={16} />
                )}
                {generating ? "Generando..." : "Generar link de inscripción"}
              </button>
            </div>
          </div>

          {/* Error from code generation */}
          {genError && (
            <div className="mb-4 p-3 rounded-xl bg-[#d4776a]/10 border border-[#d4776a]/20 text-[#d4776a] text-xs flex items-center gap-2">
              <X size={14} className="flex-shrink-0" />
              {genError}
            </div>
          )}

          {/* ── Search row ────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[#9E5A78] font-semibold text-sm">Buscar:</span>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Doménica"
                className="bg-[#9BC294]/30 border-none rounded-full pl-4 pr-8 py-1.5 text-sm text-[#5B5B5B] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9BC294]/50 w-44"
              />
              <Search
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5B9B95]"
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-[#d4776a] text-sm mb-4">{error}</p>
          )}

          {/* ── Table ─────────────────────────────────────────────────── */}
          <div className="w-full bg-[#fdfdf1] rounded-2xl overflow-hidden shadow-sm border border-[#F1D87C]/20">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {/* Sortable name column — highlighted pink */}
                  <th
                    onClick={() => setSortAsc((v) => !v)}
                    className="text-left px-4 py-3 text-white font-semibold cursor-pointer select-none"
                    style={{ backgroundColor: "#C66B86" }}
                  >
                    <span className="flex items-center gap-1">
                      Nombre y Apellido
                      <span className="text-xs">{sortAsc ? "▼" : "▲"}</span>
                    </span>
                  </th>

                  {/* Phone column */}
                  <th
                    className="px-4 py-3 text-white font-semibold text-center"
                    style={{ backgroundColor: "#5B9B95" }}
                  >
                    Teléfono
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <SkeletonRows />
                ) : filtered.length > 0 ? (
                  filtered.map((student, idx) => (
                    <tr
                      key={student.id ? String(student.id) : `student-${idx}`}
                      className="border-b border-[#E8E0D5] hover:bg-[#F1D87C]/10 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-700">
                        {student.nombre} {student.apellido ?? ""}
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-center">
                        {getPhone(student)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-[#C66B86]">
                      No se encontraron estudiantes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Student count hint */}
          {!loading && (
            <p className="mt-3 text-xs text-[#C66B86]/60 text-right">
              {filtered.length} estudiante{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
            </p>
          )}
        </main>
      </div>

      {/* ── Enrollment Modal ────────────────────────────────────────────────── */}
      {enrollModal && (
        <EnrollmentModal
          code={enrollModal.code}
          link={enrollModal.link}
          gradeName={gradeName}
          subject={subject}
          onClose={() => setEnrollModal(null)}
        />
      )}
    </AuthLayout>
  )
}

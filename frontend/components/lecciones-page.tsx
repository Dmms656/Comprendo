"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Plus, Calendar, Clock, BookOpen, ChevronRight, Award, ArrowRight } from "lucide-react"
import { AuthLayout } from "@/components/auth-layout"
import { CourseSidebar } from "@/components/course-sidebar"
import { CourseFlowHeader } from "@/components/course-flow-header"
import { getLecciones } from "@/lib/api"
import type { Leccion } from "@/lib/types"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

// ─── Types ────────────────────────────────────────────────────────────────────
interface LeccionesPageProps {
  gradeId?: string | number
  gradeName?: string
  section?: string
  subject?: string
}

// ─── Mock fallback (dev mode) ─────────────────────────────────────────────────
const MOCK_LESSONS: Leccion[] = [
  { id: 1, tema: "MCU",                      fechaCreacion: "2026-02-10T12:15:00", idDocenteCursoMateria: "2" },
  { id: 2, tema: "MCUV",                     fechaCreacion: "2026-03-03T10:50:00", idDocenteCursoMateria: "2" },
  { id: 3, tema: "Movimiento de Proyectiles", fechaCreacion: "2026-04-11T11:15:00", idDocenteCursoMateria: "2" },
]

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white/80 rounded-3xl p-6 border border-[#F1D87C]/30 animate-pulse space-y-3">
      <div className="h-6 w-24 rounded-full bg-[#9E5A78]/10" />
      <div className="h-4 w-40 rounded-full bg-[#5B9B95]/10" />
      <div className="h-4.5 w-32 rounded-full bg-[#C66B86]/10" />
    </div>
  )
}

// ─── Format date ─────────────────────────────────────────────────────────────
function formatDate(iso?: string) {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("es-EC", {
      day: "2-digit", month: "2-digit", year: "numeric",
    })
  } catch {
    return iso
  }
}

function formatTime(iso?: string) {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleTimeString("es-EC", {
      hour: "2-digit", minute: "2-digit",
    })
  } catch {
    return ""
  }
}

// ─── Main component ───────────────────────────────────────────────────────────
export function LeccionesPage({
  gradeId = "2",
  gradeName = "Segundo",
  section = "D",
  subject = "Física",
}: LeccionesPageProps) {
  const router = useRouter()

  // ── Filter / sort state ──────────────────────────────────────────────────
  const [sortAsc, setSortAsc] = useState(true)
  const [search, setSearch] = useState("")

  // ── API state ────────────────────────────────────────────────────────────
  const [lecciones, setLecciones] = useState<Leccion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getLecciones(gradeId)
        // Dynamic front-end filtering to guarantee absolute course isolation
        const courseLessons = data.filter((l) => String(l.idDocenteCursoMateria) === String(gradeId))
        if (!cancelled) setLecciones(courseLessons)
      } catch (err) {
        if (!cancelled) {
          // Fall back to mock data in development
          if (process.env.NODE_ENV === "development") {
            const courseMocks = MOCK_LESSONS.filter((l) => String(l.idDocenteCursoMateria) === String(gradeId))
            setLecciones(courseMocks)
          } else {
            setError(err instanceof Error ? err.message : "Error al cargar lecciones")
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [gradeId])

  // ── Derived list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...lecciones]

    if (search.trim()) {
      result = result.filter((l) =>
        l.tema.toLowerCase().includes(search.toLowerCase())
      )
    }

    result.sort((a, b) => {
      const aId = Number(a.id) || 0
      const bId = Number(b.id) || 0
      return sortAsc ? aId - bId : bId - aId
    })

    return result
  }, [lecciones, sortAsc, search])

  // Sequential number map based on ascending database ID order
  const sequentialNumbers = useMemo(() => {
    const sorted = [...lecciones].sort((a, b) => {
      const aId = Number(a.id) || 0
      const bId = Number(b.id) || 0
      return aId - bId
    })
    const map: Record<string | number, number> = {}
    sorted.forEach((l, index) => {
      map[l.id] = index + 1
    })
    return map
  }, [lecciones])

  return (
    <AuthLayout>
      <div className="flex flex-1 min-h-[calc(100vh-3.5rem)]">
        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <CourseSidebar
          gradeId={gradeId}
          subject={subject}
          gradeName={gradeName}
          section={section}
          activeTab="lecciones"
        />

        {/* ── Main content ─────────────────────────────────────────────── */}
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
                  onClick={() => router.push(`/curso/${gradeId}/${encodeURIComponent(subject)}/estudiantes`)}
                  className="cursor-pointer text-[#7297C9] hover:text-[#5B9B95] font-bold text-xs uppercase tracking-wide transition-colors"
                >
                  {gradeName} — {subject}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-[#7297C9] [&>svg]:size-3" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-[#C66B86] font-bold text-xs uppercase tracking-wide">
                  Lecciones
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Onboarding Flow Steps Header */}
          <CourseFlowHeader gradeId={gradeId} subject={subject} activeStep="lecciones" />

          {/* ── Controls row ── */}
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
            {/* Left: filter pills */}
            <div className="flex items-center gap-3 flex-wrap">
              
              {/* 1. Sort toggle */}
              <button
                onClick={() => setSortAsc((v) => !v)}
                className="bg-[#faf6df] text-[#9E5A78] border border-[#F1D87C]/60 rounded-2xl px-4 py-2.5 text-xs font-bold hover:bg-[#F1D87C]/15 transition-all duration-300 cursor-pointer"
              >
                {sortAsc ? "ID: Ascendente ▲" : "ID: Descendente ▼"}
              </button>

              {/* 3. Search by tema */}
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar tema..."
                  className="bg-gray-50 border border-gray-100 rounded-2xl pl-4 pr-10 py-2.5 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#5B9B95] focus:ring-2 focus:ring-[#5B9B95]/10 w-40 md:w-48 transition-all"
                />
                <Search
                  size={14}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5B9B95] pointer-events-none"
                />
              </div>
            </div>

            {/* Right: Nueva Lección */}
            <button
              onClick={() =>
                router.push(
                  `/curso/${gradeId}/${encodeURIComponent(subject)}/lecciones/nueva`
                )
              }
              className="bg-[#5B9B95] text-white font-bold rounded-2xl px-5 py-2.5 text-sm hover:bg-[#4a8880] transition-all duration-300 shadow-md shadow-[#5B9B95]/15 flex items-center gap-2 hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
            >
              Nueva Lección <Plus size={16} />
            </button>
          </div>

          {/* ── States ── */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-white/60 rounded-3xl border border-[#d4776a]/20 p-8 max-w-md mx-auto shadow-sm">
              <p className="text-[#d4776a] text-base font-semibold mb-4">{error}</p>
            </div>
          ) : (
            /* ── Lesson cards grid ── */
            <div className="space-y-6">
              {filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() =>
                        router.push(
                          `/curso/${gradeId}/${encodeURIComponent(subject)}/lecciones/${lesson.id}`
                        )
                      }
                      className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl hover:scale-[1.02] border border-[#F1D87C]/30 hover:border-[#5B9B95]/30 text-left transition-all duration-300 relative group overflow-hidden cursor-pointer"
                    >
                      {/* Visual backdrop gradient hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#5B9B95]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="relative z-10 space-y-4 w-full">
                        {/* ID Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="bg-[#9E5A78]/10 text-[#9E5A78] text-xs font-black px-3.5 py-1 rounded-xl">
                            Lección #{sequentialNumbers[lesson.id] ?? lesson.id}
                          </span>
                        </div>

                        {/* Title / Tema */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Tema Evaluado</span>
                          <p className="font-black text-lg text-[#9E5A78] leading-tight group-hover:text-[#5B9B95] transition-colors break-words">
                            {lesson.tema}
                          </p>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-gray-100 w-full" />

                        {/* Date & Time indicators */}
                        <div className="flex items-center justify-between text-xs text-gray-500 font-semibold pt-1">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-[#C66B86]" />
                            {formatDate(lesson.fechaCreacion)}
                          </span>
                          {lesson.fechaCreacion && (
                            <span className="flex items-center gap-1.5">
                              <Clock size={13} className="text-[#C66B86]" />
                              {formatTime(lesson.fechaCreacion)}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white/40 rounded-3xl border border-dashed border-gray-200">
                  <p className="text-[#C66B86] font-bold text-lg">No se encontraron lecciones</p>
                  <p className="text-xs text-[#C66B86]/70 mt-1">Genera tu primera lección interactiva haciendo clic en &quot;Nueva Lección&quot;.</p>
                </div>
              )}

              {/* ── STEP 3 CALL TO ACTION BANNER ── */}
              <div className="w-full mt-8 bg-gradient-to-r from-[#9E5A78] to-[#804861] rounded-3xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md shadow-[#9E5A78]/10">
                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="font-black text-lg tracking-tight">¿Evaluaciones realizadas o en curso?</h3>
                  <p className="text-white/80 text-xs">
                    Revisa las calificaciones automáticas, respuestas correctas e incorrectas, y analiza las debilidades del grupo.
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/curso/${gradeId}/${encodeURIComponent(subject)}/dashboard`)}
                  className="bg-white text-[#9E5A78] hover:text-[#804861] font-black text-sm px-6 py-3 rounded-2xl shadow-md transition-all duration-300 hover:shadow-lg active:scale-[0.99] flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  Paso 3: Ver en Dashboard <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthLayout>
  )
}

"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { AuthLayout } from "@/components/auth-layout"
import { CourseSidebar } from "@/components/course-sidebar"
import { getLecciones } from "@/lib/api"
import type { Leccion } from "@/lib/types"

// ─── Types ────────────────────────────────────────────────────────────────────
interface LeccionesPageProps {
  gradeId?: string | number
  gradeName?: string
  section?: string
  subject?: string
}

// ─── Mock fallback (dev mode) ─────────────────────────────────────────────────
const MOCK_LESSONS: Leccion[] = [
  { id: 1, tema: "MCU",                      parcial: 1, fechaCreacion: "2026-02-10T12:15:00" },
  { id: 2, tema: "MCUV",                     parcial: 1, fechaCreacion: "2026-03-03T10:50:00" },
  { id: 3, tema: "Movimiento de Proyectiles", parcial: 2, fechaCreacion: "2026-04-11T11:15:00" },
]

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-[#fdfdf1] rounded-2xl px-6 py-5 border border-[#F1D87C]/30 animate-pulse">
      <div className="h-5 w-32 rounded-full bg-[#9E5A78]/20 mb-3" />
      <div className="h-4 w-48 rounded-full bg-[#5B9B95]/15 mb-2" />
      <div className="h-3 w-28 rounded-full bg-[#C66B86]/15" />
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
  const [selectedParcial, setSelectedParcial] = useState<number | null>(null)
  const [parcialOpen, setParcialOpen] = useState(false)
  const [search, setSearch] = useState("")

  // ── API state ────────────────────────────────────────────────────────────
  const [lecciones, setLecciones] = useState<Leccion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const breadcrumb = `Grados/${gradeName}/${subject}/Lecciones`

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getLecciones()
        if (!cancelled) setLecciones(data)
      } catch (err) {
        if (!cancelled) {
          // Fall back to mock data in development
          if (process.env.NODE_ENV === "development") {
            setLecciones(MOCK_LESSONS)
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

    if (selectedParcial !== null) {
      result = result.filter((l) => l.parcial === selectedParcial)
    }

    if (search.trim()) {
      result = result.filter((l) =>
        l.tema.toLowerCase().includes(search.toLowerCase())
      )
    }

    result.sort((a, b) => {
      const aId = Number(a.id)
      const bId = Number(b.id)
      return sortAsc ? aId - bId : bId - aId
    })

    return result
  }, [lecciones, sortAsc, selectedParcial, search])

  return (
    <AuthLayout>
      {/* Page body */}
      <div className="flex flex-1">
        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <CourseSidebar
          gradeId={gradeId}
          subject={subject}
          gradeName={gradeName}
          section={section}
          activeTab="lecciones"
        />

        {/* ── Main content ─────────────────────────────────────────────── */}
        <main className="flex-1 bg-[#faf6df] px-8 py-6 overflow-x-auto">
          {/* Breadcrumb */}
          <p className="text-[#7297C9] text-sm mb-2">{breadcrumb}</p>

          {/* Heading */}
          <h1 className="text-4xl font-bold italic text-[#9E5A78] mb-4">
            Lecciones
          </h1>

          {/* ── Controls row ───────────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
            {/* Left: filter pills */}
            <div className="flex items-center gap-3 flex-wrap">

              {/* 1. Sort toggle */}
              <button
                onClick={() => setSortAsc((v) => !v)}
                className="bg-[#5B9B95] text-white rounded-full px-4 py-1.5 text-sm font-medium hover:bg-[#4a8a84] transition-colors whitespace-nowrap"
              >
                {sortAsc ? "Ascendente ▲" : "Descendente ▼"}
              </button>

              {/* 2. Parcial filter dropdown */}
              <div className="relative">
                <button
                  onClick={() => setParcialOpen((v) => !v)}
                  className="bg-[#5B9B95] text-white rounded-full px-4 py-1.5 text-sm font-medium hover:bg-[#4a8a84] transition-colors whitespace-nowrap"
                >
                  {selectedParcial !== null ? `Parcial ${selectedParcial}` : "Parcial"} ▼
                </button>

                {parcialOpen && (
                  <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-2xl shadow-lg border border-[#F1D87C]/30 overflow-hidden min-w-[140px]">
                    <button
                      onClick={() => { setSelectedParcial(null); setParcialOpen(false) }}
                      className="w-full text-left px-4 py-2 text-sm text-[#9E5A78] hover:bg-[#fdfdf1] transition-colors font-semibold"
                    >
                      Todos
                    </button>
                    {[1, 2, 3, 4].map((p) => (
                      <button
                        key={p}
                        onClick={() => { setSelectedParcial(p); setParcialOpen(false) }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          selectedParcial === p
                            ? "bg-[#5B9B95]/10 text-[#5B9B95] font-semibold"
                            : "text-[#9E5A78] hover:bg-[#fdfdf1]"
                        }`}
                      >
                        Parcial {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Search by tema */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar tema..."
                  className="bg-[#5B9B95] text-white placeholder:text-white/70 rounded-full pl-4 pr-9 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 w-36 transition-all"
                />
                <Search
                  size={15}
                  className="absolute right-3 text-white pointer-events-none"
                />
              </div>
            </div>

            {/* Right: Nueva Lección */}
            <button
              className="bg-[#d4776a] text-white font-semibold rounded-xl px-5 py-2 hover:opacity-90 transition-opacity whitespace-nowrap"
              onClick={() =>
                router.push(
                  `/curso/${gradeId}/${encodeURIComponent(subject)}/lecciones/nueva`
                )
              }
            >
              Nueva Lección
            </button>
          </div>

          {/* ── States ─────────────────────────────────────────────────── */}
          {loading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-[#d4776a] text-lg">{error}</p>
            </div>
          ) : (
            /* ── Lesson cards ─────────────────────────────────────────── */
            <div className="flex flex-col gap-4">
              {filtered.length > 0 ? (
                filtered.map((lesson, idx) => (
                  <div
                    key={lesson.id}
                    onClick={() =>
                      router.push(
                        `/curso/${gradeId}/${encodeURIComponent(subject)}/lecciones/${lesson.id}`
                      )
                    }
                    className="bg-[#fdfdf1] rounded-2xl px-6 py-5 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all duration-200 border border-[#F1D87C]/30"
                  >
                    {/* Title */}
                    <p className="font-bold text-xl text-[#9E5A78] mb-2">
                      Lección#{lesson.id}
                    </p>

                    {/* Tema */}
                    <p className="text-sm">
                      <span className="text-gray-400">Tema: </span>
                      <span className="text-[#5B9B95] font-semibold">{lesson.tema}</span>
                    </p>

                    {/* Parcial */}
                    {lesson.parcial && (
                      <p className="text-sm text-[#C66B86]">
                        Parcial: {lesson.parcial}
                      </p>
                    )}

                    {/* Fecha */}
                    <p className="text-sm text-[#C66B86]">
                      Fecha: {formatDate(lesson.fechaCreacion)}
                    </p>

                    {/* Hora */}
                    {lesson.fechaCreacion && (
                      <p className="text-sm text-[#C66B86]">
                        Hora: {formatTime(lesson.fechaCreacion)}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-[#C66B86] text-lg">No se encontraron lecciones</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </AuthLayout>
  )
}

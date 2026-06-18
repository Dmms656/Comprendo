"use client"

import React, { useState, useMemo, useEffect } from "react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts"
import { Search, X, Check, ChevronLeft, ChevronRight, Eye, AlignJustify } from "lucide-react"
import { AuthLayout } from "@/components/auth-layout"
import { CourseSidebar } from "@/components/course-sidebar"
import { getResultados, getPreguntas, getLecciones, getLeccion, updateLeccion } from "@/lib/api"
import { formatFechaDisponibilidad, fromDatetimeLocal, toDatetimeLocal } from "@/lib/datetime"
import type { Resultado, Pregunta, Opcion, Leccion } from "@/lib/types"
import { NuevaLeccionPage } from "@/components/nueva-leccion-page"
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
interface LeccionDetallePageProps {
  gradeId?: string | number
  gradeName?: string
  section?: string
  subject?: string
  lessonNumber?: number
}

type TabKey = "participaciones" | "preguntas" | "dashboard"

// ─── Mock fallback data ───────────────────────────────────────────────────────
const MOCK_RESULTADOS: Resultado[] = [
  { estudianteNombre: "Georgina Arcos",  respuestas: [{ literalDado:"A",esCorrecta:true},{literalDado:"B",esCorrecta:false},{literalDado:"C",esCorrecta:false},{literalDado:"D",esCorrecta:true}] },
  { estudianteNombre: "Mateo Carranza",  respuestas: [{ literalDado:"B",esCorrecta:false},{literalDado:"D",esCorrecta:false},{literalDado:"B",esCorrecta:true},{literalDado:"D",esCorrecta:true}] },
  { estudianteNombre: "Antonella Cina",  respuestas: [{ literalDado:"D",esCorrecta:false},{literalDado:"A",esCorrecta:true},{literalDado:"B",esCorrecta:true},{literalDado:"B",esCorrecta:false}] },
]

const MOCK_PREGUNTAS: Pregunta[] = [
  { id:1, enunciado:"¿Cuál de las siguientes afirmaciones sobre el MCU es correcta?", opciones:[{literal:"A",texto:"El módulo de la velocidad es constante"},{literal:"B",texto:"El vector velocidad apunta al centro"},{literal:"C",texto:"La velocidad es constante en módulo y dirección"}], literalCorrecto:"A" },
  { id:2, enunciado:"Si un objeto en MCU tarda 4 segundos en dar dos vueltas completas, ¿cuál es su periodo T?", opciones:[{literal:"A",texto:"4 s"},{literal:"B",texto:"2 s"},{literal:"C",texto:"0.5 s"},{literal:"D",texto:"8 s"}], literalCorrecto:"B" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getOpcionText(o: Opcion | string): { literal: string; texto: string } {
  if (typeof o === "string") return { literal: "?", texto: o }
  return o
}

// ─── Answer cell ─────────────────────────────────────────────────────────────
function AnswerCell({ literal, correct }: { literal: string; correct: boolean }) {
  return correct ? (
    <span className="flex items-center justify-center gap-1 text-[#5B9B95] font-semibold">
      {literal}
      <Check size={13} strokeWidth={3} className="text-[#9BC294]" />
    </span>
  ) : (
    <span className="flex items-center justify-center gap-1 text-[#d4776a] font-semibold">
      {literal}
      <X size={13} strokeWidth={3} />
    </span>
  )
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────
function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <tr key={i} className="border-b border-[#E8E0D5] animate-pulse">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-5 py-3">
              <div className="h-4 rounded-full bg-[#9E5A78]/10 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// ─── Participaciones tab ──────────────────────────────────────────────────────
function ParticipacionesTab({ lessonId }: { lessonId: string | number }) {
  const [search, setSearch] = useState("")
  const [sortAsc, setSortAsc] = useState(true)
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load(isSilent = false) {
      if (!isSilent) setLoading(true)
      setError(null)
      try {
        const [resData, pregData] = await Promise.all([
          getResultados(lessonId),
          getPreguntas(lessonId),
        ])
        if (!cancelled) {
          setResultados(resData)
          setPreguntas(pregData)
        }
      } catch (err) {
        if (!cancelled && !isSilent) {
          if (process.env.NODE_ENV === "development") {
            setResultados(MOCK_RESULTADOS)
            setPreguntas(MOCK_PREGUNTAS)
          } else {
            setError(err instanceof Error ? err.message : "Error al cargar participaciones")
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    
    load(false)

    // Polling background update every 4 seconds
    const interval = setInterval(() => {
      load(true)
    }, 4000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [lessonId])

  const maxPreguntas = preguntas.length > 0
    ? preguntas.length
    : Math.max(...resultados.map((r) => r.respuestas.length), 0)

  const filtered = useMemo(() => {
    let result = [...resultados]
    if (search.trim()) {
      result = result.filter((s) =>
        s.estudianteNombre.toLowerCase().includes(search.toLowerCase())
      )
    }
    result.sort((a, b) =>
      sortAsc
        ? a.estudianteNombre.localeCompare(b.estudianteNombre)
        : b.estudianteNombre.localeCompare(a.estudianteNombre)
    )
    return result
  }, [resultados, search, sortAsc])

  return (
    <div>
      {/* Search row */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[#9E5A78] font-semibold text-sm">Buscar:</span>
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Doménica"
              className="bg-[#9BC294]/30 border-none rounded-full pl-4 pr-8 py-1.5 text-sm text-[#5B5B5B] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9BC294]/50 w-40 font-semibold"
            />
            <Search
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5B9B95]"
            />
          </div>
        </div>

        {/* Live Update Indicator */}
        <div className="flex items-center gap-2 bg-[#9BC294]/15 text-[#5a8c55] px-3.5 py-1.5 rounded-full text-xs font-black select-none border border-[#9BC294]/35">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5BC28B] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5BC28B]"></span>
          </span>
          Actualizando en vivo (Telegram)
        </div>
      </div>

      {error && (
        <p className="text-[#d4776a] text-sm mb-4">{error}</p>
      )}

      {/* Table */}
      <div className="w-full bg-[#fdfdf1] rounded-2xl overflow-hidden shadow-sm border border-[#F1D87C]/20">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th
                onClick={() => setSortAsc((v) => !v)}
                className="text-left px-5 py-3 text-white font-semibold cursor-pointer select-none"
                style={{ backgroundColor: "#C66B86" }}
              >
                <span className="flex items-center gap-1">
                  Nombre y Apellido
                  <span className="text-xs">{sortAsc ? "▼" : "▲"}</span>
                </span>
              </th>
              {preguntas.length > 0 ? (
                preguntas.map((preg, i) => (
                  <th
                    key={preg.id}
                    className="px-5 py-3 text-white font-semibold text-center"
                    style={{ backgroundColor: "#9E5A78" }}
                  >
                    Pregunta {i + 1}
                  </th>
                ))
              ) : (
                Array.from({ length: maxPreguntas }).map((_, i) => (
                  <th
                    key={i}
                    className="px-5 py-3 text-white font-semibold text-center"
                    style={{ backgroundColor: "#9E5A78" }}
                  >
                    Pregunta {i + 1}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={maxPreguntas + 1 || 5} />
            ) : filtered.length > 0 ? (
              filtered.map((student, i) => (
                <tr
                  key={student.estudianteNombre}
                  className={`border-b border-[#E8E0D5] transition-colors hover:bg-[#faf6df] ${
                    i % 2 === 0 ? "bg-white" : "bg-[#fdfdf1]"
                  }`}
                >
                  <td className="px-5 py-3 text-[#9E5A78] font-medium">
                    {student.estudianteNombre}
                  </td>
                  {preguntas.length > 0 ? (
                    preguntas.map((preg) => {
                      const resp = student.respuestas.find(
                        (r) => String(r.preguntaId) === String(preg.id)
                      )
                      return (
                        <td key={preg.id} className="px-5 py-3 text-center">
                          {resp ? (
                            <AnswerCell literal={resp.literalDado} correct={resp.esCorrecta} />
                          ) : (
                            <span className="text-gray-400 font-semibold">—</span>
                          )}
                        </td>
                      )
                    })
                  ) : (
                    student.respuestas.map((resp, j) => (
                      <td key={j} className="px-5 py-3 text-center">
                        <AnswerCell literal={resp.literalDado} correct={resp.esCorrecta} />
                      </td>
                    ))
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={maxPreguntas + 1 || 5} className="px-5 py-8 text-center text-[#C66B86]">
                  No se encontraron estudiantes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Preguntas tab ───────────────────────────────────────────────────────────
function PreguntasTab({ lessonId }: { lessonId: string | number }) {
  const [search, setSearch] = useState("")
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getPreguntas(lessonId)
        if (!cancelled) setPreguntas(data)
      } catch (err) {
        if (!cancelled) {
          if (process.env.NODE_ENV === "development") {
            setPreguntas(MOCK_PREGUNTAS)
          } else {
            setError(err instanceof Error ? err.message : "Error al cargar preguntas")
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [lessonId])

  const filtered = useMemo(() => {
    if (!search.trim()) return preguntas
    return preguntas.filter((p) =>
      p.enunciado.toLowerCase().includes(search.toLowerCase())
    )
  }, [preguntas, search])

  return (
    <div>
      {/* Search row */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[#9E5A78] font-semibold text-sm">Buscar:</span>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Omega"
            className="bg-[#9BC294]/30 border-none rounded-full pl-4 pr-8 py-1.5 text-sm text-[#5B5B5B] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9BC294]/50 w-44"
          />
          <Search
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5B9B95]"
          />
        </div>
      </div>

      {error && (
        <p className="text-[#d4776a] text-sm mb-4">{error}</p>
      )}

      {/* Table */}
      <div className="w-full bg-[#fdfdf1] rounded-2xl overflow-hidden shadow-sm border border-[#F1D87C]/20">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: "#9E5A78" }}>
              <th className="w-12 py-3 px-4 text-white font-semibold text-center">Nro</th>
              <th className="py-3 px-4 text-white font-semibold text-left">Preguntas</th>
              <th className="py-3 px-4 text-white font-semibold text-left">Opciones</th>
              <th className="w-24 py-3 px-4 text-white font-semibold text-center">
                Literal{"\n"}Correcto
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={4} />
            ) : filtered.length > 0 ? (
              filtered.map((row, i) => (
                <tr
                  key={row.id}
                  className={`border-b border-[#E8E0D5] align-top ${
                    i % 2 === 0 ? "bg-[#fdfdf1]" : "bg-[#C66B86]/15"
                  }`}
                >
                  {/* Nro */}
                  <td className="py-3 px-4 text-center font-semibold text-[#9E5A78] align-top">
                    {i + 1}
                  </td>

                  {/* Pregunta */}
                  <td className="py-3 px-4 text-gray-700 align-top leading-snug">
                    {row.enunciado}
                  </td>

                  {/* Opciones */}
                  <td className="py-3 px-4 text-gray-700 align-top">
                    {row.opciones.map((o, j) => {
                      const { literal, texto } = getOpcionText(o)
                      return (
                        <p key={j} className="leading-snug mb-0.5 last:mb-0">
                          {literal}) {texto}
                        </p>
                      )
                    })}
                  </td>

                  {/* Literal correcto */}
                  <td className="py-3 px-4 text-center font-bold text-[#9E5A78] align-top">
                    {row.literalCorrecto}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[#C66B86]">
                  No se encontraron preguntas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Dashboard tab ────────────────────────────────────────────────────────────

type FloatingTarget =
  | { type: "general" }
  | { type: "pregunta"; index: number }
  | { type: "estudiante"; index: number }

function ChartCard({
  title,
  onDetail,
  children,
}: {
  title: string
  onDetail?: () => void
  children: React.ReactNode
}) {
  return (
    <div className="bg-[#fdfdf1] rounded-2xl p-4 shadow-sm border border-[#F1D87C]/30 flex-1">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-[#9E5A78]">{title}</p>
        {onDetail && (
          <button
            onClick={onDetail}
            className="flex items-center gap-1 text-[10px] font-bold text-[#5B9B95] hover:text-[#4a8880] hover:bg-[#5B9B95]/10 px-2 py-0.5 rounded-lg transition-all select-none"
          >
            Ver detalles
            <span className="text-[9px]">↗</span>
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className="bg-[#fdfdf1] rounded-2xl px-6 py-5 text-center flex-1 shadow-sm border border-[#F1D87C]/30">
      <p className="text-xs font-semibold text-[#C66B86] mb-2">{label}</p>
      <p className="text-5xl font-bold leading-none mb-2" style={{ color }}>{value}</p>
      <p className="text-xs font-semibold text-[#C66B86]">{sub}</p>
    </div>
  )
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────
function DetailDrawer({
  target,
  preguntas,
  resultados,
  onClose,
}: {
  target: FloatingTarget
  preguntas: Pregunta[]
  resultados: any[]
  onClose: () => void
}) {
  const [showFull, setShowFull] = useState(true)
  const [activeIndex, setActiveIndex] = useState(
    target.type === "pregunta" ? target.index
    : target.type === "estudiante" ? target.index
    : 0
  )

  const totalPreguntas = preguntas.length
  const totalEstudiantes = resultados.length

  // Helpers
  function getLiteralesForPregunta(pregIndex: number) {
    const preg = preguntas[pregIndex]
    if (!preg) return []
    const tally: Record<string, { count: number; nombres: string[]; esCorrecta: boolean }> = {}
    resultados.forEach((r) => {
      const resp = r.respuestas?.find((x: any) => String(x.preguntaId) === String(preg.id))
      if (resp) {
        if (!tally[resp.literalDado]) {
          tally[resp.literalDado] = { count: 0, nombres: [], esCorrecta: resp.esCorrecta }
        }
        tally[resp.literalDado].count++
        tally[resp.literalDado].nombres.push(r.estudianteNombre ?? "Estudiante")
      }
    })
    return Object.entries(tally).map(([literal, v]) => ({ literal, ...v }))
  }

  function getRespuestasForEstudiante(estIndex: number) {
    const estudiante = resultados[estIndex]
    if (!estudiante) return []
    return preguntas.map((preg, i) => {
      const resp = estudiante.respuestas?.find((x: any) => String(x.preguntaId) === String(preg.id))
      return {
        pregunta: preg,
        pregIndex: i,
        literalDado: resp?.literalDado ?? null,
        esCorrecta: resp?.esCorrecta ?? null,
      }
    })
  }

  // ── Render content ──────────────────────────────────────────────────────
  function renderGeneral() {
    return (
      <div className="space-y-4">
        {preguntas.map((preg, i) => {
          const literales = getLiteralesForPregunta(i)
          const correctas = literales.filter((l) => l.esCorrecta).reduce((s, l) => s + l.count, 0)
          const incorrectas = literales.filter((l) => !l.esCorrecta).reduce((s, l) => s + l.count, 0)
          return (
            <div key={preg.id} className="bg-[#faf6df]/60 border border-[#F1D87C]/30 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C66B86]">Pregunta {i + 1}</span>
                <div className="flex gap-2 text-[10px] font-semibold">
                  <span className="text-[#5B9B95]">✓ {correctas}</span>
                  <span className="text-[#d4776a]">✗ {incorrectas}</span>
                </div>
              </div>
              {showFull && (
                <p className="text-xs text-[#9E5A78] leading-snug mb-2 font-medium">{preg.enunciado}</p>
              )}
              <div className="space-y-1">
                {showFull ? (
                  preg.opciones.map((o) => {
                    const { literal, texto } = getOpcionText(o)
                    const isCorrect = literal === preg.literalCorrecto
                    const tally = literales.find((l) => l.literal === literal)
                    return (
                      <div
                        key={literal}
                        className={`flex items-start gap-2 px-2.5 py-1.5 rounded-lg text-[11px] ${
                          isCorrect
                            ? "bg-[#5B9B95]/10 border border-[#5B9B95]/30 text-[#4a8880]"
                            : "bg-white/60 border border-transparent text-[#9E5A78]/80"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] flex-shrink-0 ${
                            isCorrect ? "bg-[#5B9B95] text-white" : "bg-[#faf6df] text-[#C66B86] border border-[#F1D87C]/40"
                          }`}
                        >
                          {literal}
                        </span>
                        <span className="flex-1">{texto}</span>
                        {tally && (
                          <span className="text-[10px] font-bold text-[#9E5A78] shrink-0">
                            {tally.count} resp.
                          </span>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {literales.length > 0 ? (
                      literales.map((l) => (
                        <span
                          key={l.literal}
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            l.esCorrecta
                              ? "bg-[#5B9B95]/10 border-[#5B9B95]/40 text-[#4a8880]"
                              : "bg-[#d4776a]/10 border-[#d4776a]/30 text-[#d4776a]"
                          }`}
                        >
                          {l.literal} ({l.count})
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-gray-400">Sin respuestas</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  function renderPregunta() {
    const preg = preguntas[activeIndex]
    if (!preg) return <p className="text-sm text-gray-400">Pregunta no encontrada</p>
    const literales = getLiteralesForPregunta(activeIndex)

    return (
      <div>
        {/* Navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setActiveIndex((v) => Math.max(0, v - 1))}
            disabled={activeIndex === 0}
            className="p-1.5 rounded-lg hover:bg-[#9E5A78]/10 text-[#9E5A78] disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex gap-1 flex-wrap justify-center">
            {preguntas.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`w-6 h-6 rounded-full text-[10px] font-bold transition-all ${
                  i === activeIndex
                    ? "bg-[#9E5A78] text-white shadow-sm"
                    : "bg-[#9E5A78]/10 text-[#9E5A78] hover:bg-[#9E5A78]/20"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setActiveIndex((v) => Math.min(totalPreguntas - 1, v + 1))}
            disabled={activeIndex === totalPreguntas - 1}
            className="p-1.5 rounded-lg hover:bg-[#9E5A78]/10 text-[#9E5A78] disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="bg-[#faf6df]/60 border border-[#F1D87C]/30 rounded-xl p-3">
          {showFull && (
            <p className="text-sm font-semibold text-[#9E5A78] leading-snug mb-3">{preg.enunciado}</p>
          )}
          {!showFull && (
            <p className="text-[11px] text-[#C66B86] font-bold uppercase tracking-wide mb-2">Pregunta {activeIndex + 1}</p>
          )}

          <div className="space-y-1.5">
            {preg.opciones.map((o) => {
              const { literal, texto } = getOpcionText(o)
              const isCorrect = literal === preg.literalCorrecto
              const tally = literales.find((l) => l.literal === literal)
              return (
                <div
                  key={literal}
                  className={`rounded-xl p-2.5 border ${
                    isCorrect
                      ? "bg-[#5B9B95]/10 border-[#5B9B95]/30"
                      : "bg-white/60 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${
                        isCorrect ? "bg-[#5B9B95] text-white" : "bg-[#faf6df] text-[#C66B86] border border-[#F1D87C]/40"
                      }`}
                    >
                      {literal}
                    </span>
                    {showFull && (
                      <span className={`text-xs flex-1 ${
                        isCorrect ? "font-semibold text-[#4a8880]" : "text-[#9E5A78]/80"
                      }`}>{texto}</span>
                    )}
                    {isCorrect && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#5B9B95] ml-auto">Correcta</span>
                    )}
                  </div>
                  {tally ? (
                    <div className="pl-7">
                      <p className="text-[10px] text-gray-500 font-semibold mb-0.5">{tally.count} estudiante(s):</p>
                      <div className="flex flex-wrap gap-1">
                        {tally.nombres.map((n) => (
                          <span key={n} className="text-[10px] bg-white border border-[#F1D87C]/40 px-1.5 py-0.5 rounded-full text-[#9E5A78]">{n.split(" ")[0]}</span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="pl-7 text-[10px] text-gray-400">Sin respuestas</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  function renderEstudiante() {
    const estudiante = resultados[activeIndex]
    if (!estudiante) return <p className="text-sm text-gray-400">Estudiante no encontrado</p>
    const respuestas = getRespuestasForEstudiante(activeIndex)
    const nombre = estudiante.estudianteNombre ?? "Estudiante"
    const parts = nombre.split(" ")
    const initials = parts.map((p: string) => p.charAt(0).toUpperCase()).slice(0, 2).join("")
    const correctCount = respuestas.filter((r) => r.esCorrecta === true).length
    const incorrectCount = respuestas.filter((r) => r.esCorrecta === false).length

    return (
      <div>
        {/* Student navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setActiveIndex((v) => Math.max(0, v - 1))}
            disabled={activeIndex === 0}
            className="p-1.5 rounded-lg hover:bg-[#9E5A78]/10 text-[#9E5A78] disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex gap-1 flex-wrap justify-center">
            {resultados.map((r, i) => {
              const n = (r.estudianteNombre ?? "E").split(" ")
              const ini = n.map((p: string) => p.charAt(0).toUpperCase()).slice(0, 2).join("")
              return (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`w-6 h-6 rounded-full text-[9px] font-bold transition-all ${
                    i === activeIndex
                      ? "bg-[#9E5A78] text-white shadow-sm"
                      : "bg-[#9E5A78]/10 text-[#9E5A78] hover:bg-[#9E5A78]/20"
                  }`}
                  title={r.estudianteNombre}
                >
                  {ini}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => setActiveIndex((v) => Math.min(totalEstudiantes - 1, v + 1))}
            disabled={activeIndex === totalEstudiantes - 1}
            className="p-1.5 rounded-lg hover:bg-[#9E5A78]/10 text-[#9E5A78] disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Student header */}
        <div className="flex items-center gap-3 mb-3 p-3 bg-[#faf6df]/60 border border-[#F1D87C]/30 rounded-xl">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: "#9E5A78" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#9E5A78] truncate">{nombre}</p>
            <div className="flex gap-3 text-xs mt-0.5">
              <span className="text-[#5B9B95] font-semibold">✓ {correctCount} correctas</span>
              <span className="text-[#d4776a] font-semibold">✗ {incorrectCount} incorrectas</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold" style={{ color: correctCount > incorrectCount ? "#9BC294" : "#d4776a" }}>
              {respuestas.length > 0 ? Math.round((correctCount / respuestas.filter(r => r.literalDado !== null).length) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Answers per question */}
        <div className="space-y-2">
          {respuestas.map(({ pregunta, pregIndex, literalDado, esCorrecta }) => (
            <div
              key={pregunta.id}
              className={`rounded-xl p-3 border ${
                esCorrecta === true
                  ? "bg-[#5B9B95]/8 border-[#5B9B95]/25"
                  : esCorrecta === false
                  ? "bg-[#d4776a]/8 border-[#d4776a]/20"
                  : "bg-white/40 border-[#F1D87C]/20"
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C66B86] mt-0.5 shrink-0">
                  P{pregIndex + 1}
                </span>
                <div className="flex-1 min-w-0">
                  {showFull && (
                    <p className="text-xs text-[#9E5A78] leading-snug mb-1.5 font-medium">{pregunta.enunciado}</p>
                  )}
                  {showFull ? (
                    <div className="space-y-1">
                      {pregunta.opciones.map((o) => {
                        const { literal, texto } = getOpcionText(o)
                        const isChosen = literal === literalDado
                        const isCorrectOpt = literal === pregunta.literalCorrecto
                        return (
                          <div
                            key={literal}
                            className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg ${
                              isChosen && isCorrectOpt
                                ? "bg-[#5B9B95]/15 font-bold text-[#4a8880]"
                                : isChosen && !isCorrectOpt
                                ? "bg-[#d4776a]/15 font-bold text-[#d4776a]"
                                : isCorrectOpt
                                ? "bg-[#5B9B95]/8 text-[#5B9B95]/70"
                                : "text-[#9E5A78]/50"
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                              isChosen ? (isCorrectOpt ? "bg-[#5B9B95] text-white" : "bg-[#d4776a] text-white") : "bg-gray-100 text-gray-400"
                            }`}>
                              {literal}
                            </span>
                            {texto}
                            {isChosen && (
                              <span className="ml-auto shrink-0">
                                {isCorrectOpt ? <Check size={11} className="text-[#5B9B95]" strokeWidth={3} /> : <X size={11} className="text-[#d4776a]" strokeWidth={3} />}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {literalDado ? (
                        <>
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${
                              esCorrecta
                                ? "bg-[#5B9B95]/10 border-[#5B9B95]/40 text-[#4a8880]"
                                : "bg-[#d4776a]/10 border-[#d4776a]/30 text-[#d4776a]"
                            }`}
                          >
                            {literalDado}
                            {esCorrecta ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {esCorrecta ? "Correcta" : `Correcta: ${pregunta.literalCorrecto}`}
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] text-gray-400">Sin respuesta</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const drawerTitle =
    target.type === "general" ? "Detalles Generales"
    : target.type === "pregunta" ? "Detalle por Pregunta"
    : "Detalle por Estudiante"

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-[#fdfdf1] shadow-2xl flex flex-col border-l border-[#F1D87C]/40"
        style={{ animation: "slideInRight 0.25s cubic-bezier(0.4,0,0.2,1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1D87C]/30 bg-[#faf6df]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#C66B86] mb-0.5">Dashboard</p>
            <h2 className="text-base font-bold text-[#9E5A78]">{drawerTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#9E5A78] hover:bg-[#9E5A78]/10 transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 px-5 py-3 border-b border-[#F1D87C]/20">
          <button
            onClick={() => setShowFull(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              showFull ? "bg-[#9E5A78] text-white shadow-sm" : "text-[#9E5A78] hover:bg-[#9E5A78]/10"
            }`}
          >
            <Eye size={12} />
            Detalle completo
          </button>
          <button
            onClick={() => setShowFull(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              !showFull ? "bg-[#7297C9] text-white shadow-sm" : "text-[#7297C9] hover:bg-[#7297C9]/10"
            }`}
          >
            <AlignJustify size={12} />
            Resumen simplificado
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {target.type === "general" && renderGeneral()}
          {target.type === "pregunta" && renderPregunta()}
          {target.type === "estudiante" && renderEstudiante()}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0.5; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  )
}

function DashboardTab({ lessonId }: { lessonId: string | number }) {
  const [resultados, setResultados] = useState<any[]>([])
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFloating, setActiveFloating] = useState<FloatingTarget | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load(isSilent = false) {
      if (!isSilent) setLoading(true)
      try {
        const [resData, pregData] = await Promise.all([
          getResultados(lessonId).catch(() => []),
          getPreguntas(lessonId).catch(() => []),
        ])
        if (!cancelled) {
          setResultados(resData)
          setPreguntas(pregData)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load(false)
    const interval = setInterval(() => { load(true) }, 4000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [lessonId])

  // ── Compute stats from real data ─────────────────────────────────────────
  const totalEstudiantes = resultados.length
  const totalCorrectas = resultados.reduce((s, r) => s + (r.respuestas?.filter((x: any) => x.esCorrecta).length ?? 0), 0)
  const totalIncorrectas = resultados.reduce((s, r) => s + (r.respuestas?.filter((x: any) => !x.esCorrecta).length ?? 0), 0)
  const totalRespuestas = totalCorrectas + totalIncorrectas
  const tasaAcierto = totalRespuestas > 0 ? Math.round((totalCorrectas / totalRespuestas) * 100) : 0
  const tasaError = 100 - tasaAcierto

  // ── Chart data ──────────────────────────────────────────────────────────
  const correctasVsData = preguntas.length > 0
    ? preguntas.map((preg, i) => {
        let c = 0, inc = 0
        resultados.forEach((r) => {
          const resp = r.respuestas?.find((x: any) => String(x.preguntaId) === String(preg.id))
          if (resp) { if (resp.esCorrecta) c++; else inc++ }
        })
        return { p: `P${i + 1}`, c, i: inc, index: i }
      })
    : Array.from({ length: Math.max(...resultados.map((r) => r.respuestas?.length ?? 0), 0) }).map((_, i) => {
        let c = 0, inc = 0
        resultados.forEach((r) => {
          const resp = r.respuestas?.[i]
          if (resp) { if (resp.esCorrecta) c++; else inc++ }
        })
        return { p: `P${i + 1}`, c, i: inc, index: i }
      })

  const donutData = [
    { name: "Correctas",   value: tasaAcierto, fill: "#9BC294" },
    { name: "Incorrectas", value: tasaError,   fill: "#d4776a" },
  ]

  const alumnoData = resultados.map((r, idx) => {
    const correct = r.respuestas?.filter((x: any) => x.esCorrecta).length ?? 0
    const incorrect = r.respuestas?.filter((x: any) => !x.esCorrecta).length ?? 0
    const firstName = (r.estudianteNombre ?? "Estudiante").split(" ")[0]
    return { name: firstName, c: correct, i: incorrect, index: idx }
  })

  const studentCards = resultados.map((r, idx) => {
    const nombre = r.estudianteNombre ?? "Estudiante"
    const parts = nombre.split(" ")
    const initials = parts.map((p: string) => p.charAt(0).toUpperCase()).slice(0, 2).join("")
    const correct = r.respuestas?.filter((x: any) => x.esCorrecta).length ?? 0
    const incorrect = r.respuestas?.filter((x: any) => !x.esCorrecta).length ?? 0
    const total = correct + incorrect
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0
    return { initials, name: parts[0], correct, incorrect, pct, index: idx }
  })

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="flex gap-4">
          {[1,2,3].map(i => <div key={i} className="flex-1 h-28 rounded-2xl bg-[#9E5A78]/10" />)}
        </div>
        <div className="flex gap-4">
          {[1,2].map(i => <div key={i} className="flex-1 h-48 rounded-2xl bg-[#9E5A78]/10" />)}
        </div>
      </div>
    )
  }

  if (resultados.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#C66B86] text-lg">Aún no hay resultados para esta lección</p>
        <p className="text-gray-400 text-sm mt-2">Los datos aparecerán cuando los estudiantes respondan</p>
      </div>
    )
  }

  return (
    <div>
      {/* Drawer */}
      {activeFloating && (
        <DetailDrawer
          target={activeFloating}
          preguntas={preguntas}
          resultados={resultados}
          onClose={() => setActiveFloating(null)}
        />
      )}

      {/* Live Update Indicator */}
      <div className="flex justify-end mb-3">
        <div className="flex items-center gap-2 bg-[#9BC294]/15 text-[#5a8c55] px-3.5 py-1.5 rounded-full text-xs font-black select-none border border-[#9BC294]/35">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5BC28B] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5BC28B]"></span>
          </span>
          Actualizando en vivo (Telegram)
        </div>
      </div>

      {/* ROW 1 — Stat cards */}
      <div className="flex gap-4 mb-4">
        <StatCard label="Conteo estudiantes"    value={totalEstudiantes} sub="Estudiantes" color="#5B9B95" />
        <StatCard label="Preguntas respondidas" value={totalRespuestas}  sub="Respuestas"  color="#C66B86" />
        <StatCard label="Tasa de acierto"       value={`${tasaAcierto}%`} sub="General"   color="#9BC294" />
      </div>

      {/* ROW 2 — Two charts */}
      <div className="flex gap-4 mb-4">
        {/* Grouped bar — by question */}
        <ChartCard
          title="Correctas vs Incorrectas por Pregunta"
          onDetail={() => setActiveFloating({ type: "pregunta", index: 0 })}
        >
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={correctasVsData}
              barGap={2}
              barCategoryGap="30%"
              onClick={(data) => {
                if (data?.activePayload?.[0]?.payload?.index !== undefined) {
                  setActiveFloating({ type: "pregunta", index: data.activePayload[0].payload.index })
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <XAxis dataKey="p" tick={{ fontSize: 9, fill: "#9E5A78" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#9E5A78" }} axisLine={false} tickLine={false} width={18} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #F1D87C50", fontSize: 11 }} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 9, color: "#9E5A78" }} />
              <Bar dataKey="c" name="Correctas"   fill="#9BC294" radius={[3,3,0,0]} />
              <Bar dataKey="i" name="Incorrectas" fill="#d4776a" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Donut — general */}
        <ChartCard
          title="Porcentaje tipo de respuesta"
          onDetail={() => setActiveFloating({ type: "general" })}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center gap-1 text-xs" style={{ color: "#9BC294" }}>
              <span className="w-2 h-2 rounded-full bg-[#9BC294] inline-block" /> Correctas {tasaAcierto}%
            </span>
            <span className="text-gray-300 text-xs">|</span>
            <span className="flex items-center gap-1 text-xs" style={{ color: "#d4776a" }}>
              <span className="w-2 h-2 rounded-full bg-[#d4776a] inline-block" /> Incorrectas {tasaError}%
            </span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart onClick={() => setActiveFloating({ type: "general" })} style={{ cursor: "pointer" }}>
              <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={72}>
                {donutData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => [`${v}%`, ""]}
                contentStyle={{ borderRadius: 12, border: "1px solid #F1D87C50", fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ROW 3 — Desempeño por alumno */}
      <div className="mb-4">
        <ChartCard
          title="Desempeño por alumno"
          onDetail={() => setActiveFloating({ type: "estudiante", index: 0 })}
        >
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={alumnoData}
              barGap={2}
              barCategoryGap="35%"
              onClick={(data) => {
                if (data?.activePayload?.[0]?.payload?.index !== undefined) {
                  setActiveFloating({ type: "estudiante", index: data.activePayload[0].payload.index })
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#9E5A78" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#9E5A78" }} axisLine={false} tickLine={false} width={18} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #F1D87C50", fontSize: 11 }} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 9, color: "#9E5A78" }} />
              <Bar dataKey="c" name="Correctas"   fill="#9BC294" radius={[3,3,0,0]} />
              <Bar dataKey="i" name="Incorrectas" fill="#d4776a" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ROW 4 — Resumen individual */}
      <div className="bg-[#fdfdf1] rounded-2xl p-4 shadow-sm border border-[#F1D87C]/30">
        <p className="text-xs font-semibold text-[#9E5A78] mb-3">Resumen individual</p>
        <div className="flex gap-3 flex-wrap">
          {studentCards.map((s) => (
            <button
              key={`${s.initials}-${s.index}`}
              onClick={() => setActiveFloating({ type: "estudiante", index: s.index })}
              className="bg-[#fdfdf1] border border-[#F1D87C]/40 rounded-2xl p-4 w-32 text-center shadow-sm hover:shadow-md hover:border-[#9E5A78]/30 hover:bg-[#faf6df] transition-all cursor-pointer group"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto mb-1 group-hover:scale-105 transition-transform"
                style={{ backgroundColor: "#9E5A78" }}
              >
                {s.initials}
              </div>
              <p className="text-sm font-semibold text-[#9E5A78] truncate">{s.name}</p>
              <p className="text-xs text-gray-400 mb-1">General</p>
              <p className="text-xs text-[#5B9B95]">✓ {s.correct}</p>
              <p className="text-xs text-[#d4776a] mb-2">✗ {s.incorrect}</p>
              <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#9BC294] transition-all"
                  style={{ width: `${s.pct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{s.pct}%</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function LeccionDetallePage({
  gradeId = "2",
  gradeName = "Segundo",
  section = "D",
  subject = "Física",
  lessonNumber = 4,
}: LeccionDetallePageProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>("participaciones")
  const [sequentialNum, setSequentialNum] = useState<number | null>(null)
  const [leccion, setLeccion] = useState<Leccion | null>(null)
  const [loadingLeccion, setLoadingLeccion] = useState(true)
  const [editTitle, setEditTitle] = useState("")
  const [editFechaDesde, setEditFechaDesde] = useState("")
  const [editFechaHasta, setEditFechaHasta] = useState("")
  const [savingMeta, setSavingMeta] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadLessons() {
      try {
        const allLessons = await getLecciones(gradeId)
        const courseLessons = allLessons.filter(l => String(l.idDocenteCursoMateria) === String(gradeId))
        courseLessons.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0))
        const idx = courseLessons.findIndex(l => String(l.id) === String(lessonNumber))
        if (!cancelled && idx !== -1) {
          setSequentialNum(idx + 1)
        }
      } catch (err) {
        console.error("Error loading lessons for sequential numbering:", err)
      }
    }
    loadLessons()
    return () => { cancelled = true }
  }, [gradeId, lessonNumber])

  useEffect(() => {
    let cancelled = false
    async function loadLesson() {
      setLoadingLeccion(true)
      try {
        const data = await getLeccion(lessonNumber)
        if (!cancelled) {
          setLeccion(data)
          setEditTitle(data.titulo || data.tema || "")
          setEditFechaDesde(toDatetimeLocal(data.fechaDisponibleDesde))
          setEditFechaHasta(toDatetimeLocal(data.fechaDisponibleHasta))
        }
      } catch (err) {
        console.error("Error loading lesson detail:", err)
      } finally {
        if (!cancelled) setLoadingLeccion(false)
      }
    }
    loadLesson()
    return () => { cancelled = true }
  }, [lessonNumber])

  if (loadingLeccion) {
    return (
      <AuthLayout>
        <div className="flex flex-1">
          <CourseSidebar
            gradeId={gradeId}
            subject={subject}
            gradeName={gradeName}
            section={section}
            activeTab="lecciones"
          />
          <main className="flex-1 bg-[#faf6df] px-8 py-6 min-w-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <span className="w-8 h-8 border-4 border-[#5B9B95] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-[#9E5A78] font-bold">Cargando lección...</p>
            </div>
          </main>
        </div>
      </AuthLayout>
    )
  }

  if (leccion && leccion.estado === "BORRADOR") {
    return (
      <NuevaLeccionPage
        gradeId={gradeId}
        gradeName={gradeName}
        section={section}
        subject={subject}
        lessonId={lessonNumber}
      />
    )
  }

  const displayNum = sequentialNum !== null ? sequentialNum : lessonNumber
  const displayTitle = leccion?.titulo || leccion?.tema || `Lección #${displayNum}`

  const handleSaveLessonMeta = async () => {
    if (!leccion) return
    setSavingMeta(true)
    try {
      const updated = await updateLeccion(leccion.id, {
        titulo: editTitle.trim() || displayTitle,
        tema: leccion.tema,
        fechaDisponibleDesde: fromDatetimeLocal(editFechaDesde),
        fechaDisponibleHasta: fromDatetimeLocal(editFechaHasta),
      })
      setLeccion(updated)
    } catch (err) {
      console.error("Error al actualizar lección:", err)
    } finally {
      setSavingMeta(false)
    }
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "participaciones", label: "Participaciones" },
    { key: "preguntas", label: "Preguntas" },
    { key: "dashboard", label: "Dashboard" },
  ]

  return (
    <AuthLayout>
      <div className="flex flex-1">
        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <CourseSidebar
          gradeId={gradeId}
          subject={subject}
          gradeName={gradeName}
          section={section}
          activeTab="lecciones"
        />

        {/* ── Main ──────────────────────────────────────────────────────── */}
        <main className="flex-1 bg-[#faf6df] px-8 py-6 min-w-0">
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
                <BreadcrumbLink
                  onClick={() => router.push(`/curso/${gradeId}/${encodeURIComponent(subject)}/lecciones`)}
                  className="cursor-pointer text-[#7297C9] hover:text-[#5B9B95] font-bold text-xs uppercase tracking-wide transition-colors"
                >
                  Lecciones
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-[#7297C9] [&>svg]:size-3" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-[#C66B86] font-bold text-xs uppercase tracking-wide">
                  {displayTitle}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Heading */}
          <div className="mb-4 space-y-3">
            <h1 className="text-4xl font-bold italic text-[#9E5A78]">
              {displayTitle}
            </h1>
            {leccion?.estado !== "ENVIADA" && leccion?.estado !== "CERRADA" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white/70 border border-[#F1D87C]/40 rounded-2xl p-4">
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-[#9E5A78] uppercase mb-1">Nombre</label>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-xl border border-[#F1D87C]/50 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#9E5A78] uppercase mb-1">Disponible desde</label>
                  <input
                    type="datetime-local"
                    value={editFechaDesde}
                    onChange={(e) => setEditFechaDesde(e.target.value)}
                    className="w-full rounded-xl border border-[#F1D87C]/50 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#9E5A78] uppercase mb-1">Disponible hasta</label>
                  <input
                    type="datetime-local"
                    value={editFechaHasta}
                    onChange={(e) => setEditFechaHasta(e.target.value)}
                    className="w-full rounded-xl border border-[#F1D87C]/50 px-3 py-2 text-sm"
                  />
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <button
                    onClick={handleSaveLessonMeta}
                    disabled={savingMeta}
                    className="bg-[#5B9B95] text-white text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-50"
                  >
                    {savingMeta ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </div>
            )}
            {leccion?.fechaDisponibleDesde || leccion?.fechaDisponibleHasta ? (
              <p className="text-xs text-[#5B5B5B]">
                Ventana de disponibilidad:{" "}
                {formatFechaDisponibilidad(leccion.fechaDisponibleDesde) ?? "sin inicio"}{" "}
                — {formatFechaDisponibilidad(leccion.fechaDisponibleHasta) ?? "sin cierre"}
              </p>
            ) : (
              <p className="text-xs text-[#5B5B5B]">Sin restricción de fechas configurada</p>
            )}
          </div>

          {/* ── Tab bar ─────────────────────────────────────────────────── */}
          <div className="inline-flex items-center bg-[#7297C9] rounded-full p-1 mb-6 gap-0">
            {tabs.map((tab, i) => (
              <React.Fragment key={tab.key}>
                <button
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-6 py-1.5 rounded-full text-sm font-semibold transition-all duration-150 ${
                    activeTab === tab.key
                      ? "bg-white text-[#9E5A78] shadow-sm"
                      : "text-white hover:text-white/80"
                  }`}
                >
                  {tab.label}
                </button>
                {/* Separator between tabs */}
                {i < tabs.length - 1 && (
                  <span
                    className="text-white/60 text-sm select-none px-0.5"
                  >
                    |
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* ── Tab content ─────────────────────────────────────────────── */}
          {activeTab === "participaciones" && <ParticipacionesTab lessonId={lessonNumber} />}
          {activeTab === "preguntas" && <PreguntasTab lessonId={lessonNumber} />}
          {activeTab === "dashboard" && <DashboardTab lessonId={lessonNumber} />}
        </main>
      </div>
    </AuthLayout>
  )
}

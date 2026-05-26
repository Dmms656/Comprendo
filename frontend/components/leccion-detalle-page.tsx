"use client"

import React, { useState, useMemo, useEffect } from "react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts"
import { Search, X, Check } from "lucide-react"
import { AuthLayout } from "@/components/auth-layout"
import { CourseSidebar } from "@/components/course-sidebar"
import { getResultados, getPreguntas, getLecciones } from "@/lib/api"
import type { Resultado, Pregunta, Opcion } from "@/lib/types"
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

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#fdfdf1] rounded-2xl p-4 shadow-sm border border-[#F1D87C]/30 flex-1">
      <p className="text-xs font-semibold text-[#9E5A78] mb-3">{title}</p>
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

function DashboardTab({ lessonId }: { lessonId: string | number }) {
  const [resultados, setResultados] = useState<any[]>([])
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])
  const [loading, setLoading] = useState(true)

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

    // Polling background update every 4 seconds
    const interval = setInterval(() => {
      load(true)
    }, 4000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [lessonId])

  // ── Compute stats from real data ─────────────────────────────────────────
  const totalEstudiantes = resultados.length
  const totalCorrectas = resultados.reduce((s, r) => s + (r.respuestas?.filter((x: any) => x.esCorrecta).length ?? 0), 0)
  const totalIncorrectas = resultados.reduce((s, r) => s + (r.respuestas?.filter((x: any) => !x.esCorrecta).length ?? 0), 0)
  const totalRespuestas = totalCorrectas + totalIncorrectas
  const tasaAcierto = totalRespuestas > 0 ? Math.round((totalCorrectas / totalRespuestas) * 100) : 0
  const tasaError = 100 - tasaAcierto

  // ── Correctas vs Incorrectas por pregunta ───────────────────────────────
  const correctasVsData = preguntas.length > 0
    ? preguntas.map((preg, i) => {
        let c = 0, inc = 0
        resultados.forEach((r) => {
          const resp = r.respuestas?.find((x: any) => String(x.preguntaId) === String(preg.id))
          if (resp) {
            if (resp.esCorrecta) c++
            else inc++
          }
        })
        return { p: `Pregunta ${i + 1}`, c, i: inc }
      })
    : Array.from({ length: Math.max(...resultados.map((r) => r.respuestas?.length ?? 0), 0) }).map((_, i) => {
        let c = 0, inc = 0
        resultados.forEach((r) => {
          const resp = r.respuestas?.[i]
          if (resp) {
            if (resp.esCorrecta) c++
            else inc++
          }
        })
        return { p: `Pregunta ${i + 1}`, c, i: inc }
      })

  // ── Donut data ─────────────────────────────────────────────────────────
  const donutData = [
    { name: "Correctas",   value: tasaAcierto, fill: "#9BC294" },
    { name: "Incorrectas", value: tasaError,   fill: "#d4776a" },
  ]

  // ── Per-student data ──────────────────────────────────────────────────
  const alumnoData = resultados.map((r) => {
    const correct = r.respuestas?.filter((x: any) => x.esCorrecta).length ?? 0
    const incorrect = r.respuestas?.filter((x: any) => !x.esCorrecta).length ?? 0
    const firstName = (r.estudianteNombre ?? "Estudiante").split(" ")[0]
    return { name: firstName, c: correct, i: incorrect }
  })

  const studentCards = resultados.map((r) => {
    const nombre = r.estudianteNombre ?? "Estudiante"
    const parts = nombre.split(" ")
    const initials = parts.map((p: string) => p.charAt(0).toUpperCase()).slice(0, 2).join("")
    const correct = r.respuestas?.filter((x: any) => x.esCorrecta).length ?? 0
    const incorrect = r.respuestas?.filter((x: any) => !x.esCorrecta).length ?? 0
    const total = correct + incorrect
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0
    return { initials, name: parts[0], correct, incorrect, pct }
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
        {/* Grouped bar */}
        <ChartCard title="Correctas vs Incorrectas por Pregunta">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={correctasVsData} barGap={2} barCategoryGap="30%">
              <XAxis dataKey="p" tick={{ fontSize: 9, fill: "#9E5A78" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#9E5A78" }} axisLine={false} tickLine={false} width={18} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #F1D87C50", fontSize: 11 }} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 9, color: "#9E5A78" }} />
              <Bar dataKey="c" name="Correctas"   fill="#9BC294" radius={[3,3,0,0]} />
              <Bar dataKey="i" name="Incorrectas" fill="#d4776a" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Donut */}
        <ChartCard title="Porcentaje tipo de respuesta">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center gap-1 text-xs" style={{ color: "#9BC294" }}>
              <span className="w-2 h-2 rounded-full bg-[#9BC294] inline-block" /> Correctas {tasaAcierto}%
            </span>
            <span className="text-white/40 text-xs">|</span>
            <span className="flex items-center gap-1 text-xs" style={{ color: "#d4776a" }}>
              <span className="w-2 h-2 rounded-full bg-[#d4776a] inline-block" /> Incorrectas {tasaError}%
            </span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
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
        <ChartCard title="Desempeño por alumno">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={alumnoData} barGap={2} barCategoryGap="35%">
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
          {studentCards.map((s, idx) => (
            <div
              key={`${s.initials}-${idx}`}
              className="bg-[#fdfdf1] border border-[#F1D87C]/40 rounded-2xl p-4 w-32 text-center shadow-sm"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto mb-1"
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
            </div>
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

  const displayNum = sequentialNum !== null ? sequentialNum : lessonNumber

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
                  Lección #{displayNum}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Heading */}
          <h1 className="text-4xl font-bold italic text-[#9E5A78] mb-4">
            Lección #{displayNum}
          </h1>

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

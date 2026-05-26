"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts"
import { AuthLayout } from "@/components/auth-layout"
import { CourseSidebar } from "@/components/course-sidebar"
import { CourseFlowHeader } from "@/components/course-flow-header"
import { Users, FileText, CheckSquare, GraduationCap, ChevronRight, BarChart3, HelpCircle } from "lucide-react"
import { getLecciones, getEstudiantes, getPreguntas, getResultados } from "@/lib/api"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

// ─── Types ────────────────────────────────────────────────────────────────────
interface CourseDashboardPageProps {
  gradeId?: string | number
  gradeName?: string
  section?: string
  subject?: string
}

// ─── Shared card wrapper ───────────────────────────────────────────────────────
function Card({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={`bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300 relative overflow-hidden ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sublabel,
  color,
  icon: Icon,
}: {
  label: string
  value: number
  sublabel: string
  color: string
  icon: any
}) {
  return (
    <Card className="flex-1 min-w-[200px] flex items-center gap-4 py-5 px-5">
      {/* Icon Wrapper */}
      <div 
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-sm"
        style={{ backgroundColor: `${color}15`, color }}
      >
        <Icon size={22} />
      </div>

      <div className="space-y-0.5 text-left">
        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</p>
        <p className="text-3xl font-black leading-none" style={{ color }}>
          {value}
        </p>
        <p className="text-[10px] font-bold text-gray-400">{sublabel}</p>
      </div>
    </Card>
  )
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-2xl shadow-xl px-4 py-3 text-xs border border-gray-100 animate-in fade-in zoom-in-95 duration-100">
      {label && <p className="font-black text-[#9E5A78] mb-2">{label}</p>}
      <div className="space-y-1">
        {payload.map((entry: any) => (
          <p key={entry.name} style={{ color: entry.color }} className="font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}: <span className="font-black text-gray-700">{entry.value}</span>
          </p>
        ))}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function CourseDashboardPage({
  gradeId = "2",
  gradeName = "Segundo",
  section = "D",
  subject = "Física",
}: CourseDashboardPageProps) {
  const router = useRouter()

  // ── API State ────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [totalStudents, setTotalStudents] = useState(0)
  const [lessonsCount, setLessonsCount] = useState(0)
  const [totalAnsweredQuestions, setTotalAnsweredQuestions] = useState(0)
  
  const [comprensionData, setComprensionData] = useState<Array<{ tema: string; s1: number; s2: number; s3: number }>>([])
  const [conteoRespuestasData, setConteoRespuestasData] = useState<Array<{ tipo: string; value: number }>>([])
  const [pieData, setPieData] = useState<Array<{ name: string; value: number; fill: string }>>([])

  useEffect(() => {
    let cancelled = false
    
    async function loadStats() {
      setLoading(true)
      setError(null)
      try {
        // 1. Fetch enrolled students
        const students = await getEstudiantes(gradeId).catch(() => [])
        if (cancelled) return
        setTotalStudents(students.length)

        // 2. Fetch all lessons
        const allLessons = await getLecciones(gradeId).catch(() => [])
        if (cancelled) return
        
        // Filter by current course
        const courseLessons = allLessons.filter(l => String(l.idDocenteCursoMateria) === String(gradeId))
        setLessonsCount(courseLessons.length)

        if (courseLessons.length === 0) {
          setTotalAnsweredQuestions(0)
          setComprensionData([])
          setConteoRespuestasData([
            { tipo: "Correctas", value: 0 },
            { tipo: "Incorrectas", value: 0 },
          ])
          setPieData([
            { name: "Correctas", value: 0, fill: "#9BC294" },
            { name: "Incorrectas", value: 0, fill: "#d4776a" },
          ])
          setLoading(false)
          return
        }

        // 3. For each lesson in parallel, fetch its results and questions
        const details = await Promise.all(
          courseLessons.map(async (lesson) => {
            try {
              const [questions, results] = await Promise.all([
                getPreguntas(lesson.id).catch(() => []),
                getResultados(lesson.id).catch(() => []),
              ])
              return { lesson, questions, results }
            } catch (err) {
              console.error(`Failed to fetch stats for lesson ${lesson.id}:`, err)
              return { lesson, questions: [], results: [] }
            }
          })
        )

        if (cancelled) return

        // 4. Aggregate metrics
        let answeredQuestionsCount = 0
        let globalCorrect = 0
        let globalIncorrect = 0

        const tempComprension = details.map(({ lesson, results }) => {
          let bajo = 0    // <= 1 correctas
          let medio = 0   // 2-3 correctas
          let alto = 0    // >= 4 correctas

          results.forEach((r) => {
            const correctCount = r.respuestas.filter((ans) => ans.esCorrecta).length
            if (correctCount <= 1) bajo++
            else if (correctCount <= 3) medio++
            else alto++
          })

          return {
            tema: lesson.tema,
            s1: bajo,
            s2: medio,
            s3: alto,
          }
        })

        details.forEach(({ results }) => {
          results.forEach((r) => {
            answeredQuestionsCount += r.respuestas.length
            r.respuestas.forEach((ans) => {
              if (ans.esCorrecta) globalCorrect++
              else globalIncorrect++
            })
          })
        })

        setTotalAnsweredQuestions(answeredQuestionsCount)

        setConteoRespuestasData([
          { tipo: "Correctas", value: globalCorrect },
          { tipo: "Incorrectas", value: globalIncorrect },
        ])

        const totalAnswers = globalCorrect + globalIncorrect
        const correctPct = totalAnswers > 0 ? Math.round((globalCorrect / totalAnswers) * 100) : 0
        const incorrectPct = totalAnswers > 0 ? 100 - correctPct : 0

        setPieData([
          { name: "Correctas", value: correctPct, fill: "#9BC294" },
          { name: "Incorrectas", value: incorrectPct, fill: "#d4776a" },
        ])

        setComprensionData(tempComprension)

      } catch (err) {
        if (!cancelled) {
          setError("Ocurrió un error al calcular las estadísticas del curso.")
          console.error(err)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadStats()
    return () => { cancelled = true }
  }, [gradeId])

  return (
    <AuthLayout>
      <div className="flex flex-1 min-h-[calc(100vh-3.5rem)]">
        <CourseSidebar
          gradeId={gradeId}
          subject={subject}
          gradeName={gradeName}
          section={section}
          activeTab="dashboard"
        />

        {/* ── Main content ────────────────────────────────────────────────── */}
        <main className="flex-1 bg-gradient-to-br from-[#faf6df] via-[#fdfdf1] to-[#FAF8EB] px-6 md:px-8 py-6 min-w-0 flex flex-col">
          
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
                  Dashboard
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Onboarding Flow Steps Header */}
          <CourseFlowHeader gradeId={gradeId} subject={subject} activeStep="dashboard" />

          {loading ? (
            <div className="space-y-6 mt-4 flex-1">
              {/* StatCards Skeletons */}
              <div className="flex gap-4 flex-wrap">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex-1 min-w-[200px] h-24 rounded-3xl bg-white/70 border border-gray-50 p-6 animate-pulse flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#9E5A78]/10" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 w-20 bg-[#9E5A78]/10 rounded-full" />
                      <div className="h-6 w-12 bg-[#9E5A78]/15 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
              {/* Primary Chart Skeleton */}
              <div className="bg-white rounded-3xl p-6 border border-gray-50 h-[340px] animate-pulse flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-48 bg-[#9E5A78]/10 rounded-full" />
                  <div className="h-3.5 w-72 bg-[#C66B86]/10 rounded-full" />
                </div>
                <div className="h-[220px] bg-gray-50/50 rounded-2xl border border-dashed border-gray-100 flex items-center justify-center">
                  <span className="text-xs text-gray-300 font-bold">Generando estadísticas acumuladas de la clase...</span>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-white/60 rounded-3xl border border-[#d4776a]/20 p-8 max-w-md mx-auto shadow-sm mt-4">
              <p className="text-[#d4776a] text-sm font-bold">{error}</p>
            </div>
          ) : lessonsCount === 0 ? (
            <div className="text-center py-20 bg-white/60 rounded-3xl border border-dashed border-gray-200 p-8 max-w-xl mx-auto shadow-sm flex flex-col items-center gap-4 mt-4 w-full">
              <div className="w-16 h-16 rounded-full bg-[#9E5A78]/10 flex items-center justify-center text-3xl">📊</div>
              <h3 className="font-black text-xl text-[#9E5A78]">Aún no hay estadísticas acumuladas</h3>
              <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
                Las estadísticas acumulativas, evolutivas e individuales se generarán automáticamente en este dashboard una vez que crees y publiques tu primera lección interactiva.
              </p>
              <button
                onClick={() => router.push(`/curso/${gradeId}/${encodeURIComponent(subject)}/lecciones/nueva`)}
                className="bg-[#5B9B95] text-white font-bold rounded-2xl px-6 py-3 hover:bg-[#4a8880] transition-colors shadow-md shadow-[#5B9B95]/15 mt-2 flex items-center gap-2 cursor-pointer"
              >
                Crear mi primera lección <ChevronRight size={16} />
              </button>
            </div>
          ) : (
            <div className="flex-1 mt-4 space-y-6">
              {/* ── ROW 1: Stat Cards ───────────────────────────────────────── */}
              <div className="flex gap-4 flex-wrap">
                <StatCard
                  label="Alumnos Registrados"
                  value={totalStudents}
                  sublabel="Estudiantes activos"
                  color="#5B9B95"
                  icon={Users}
                />
                <StatCard
                  label="Lecciones Creadas"
                  value={lessonsCount}
                  sublabel="Evaluaciones"
                  color="#9E5A78"
                  icon={FileText}
                />
                <StatCard
                  label="Preguntas Respondidas"
                  value={totalAnsweredQuestions}
                  sublabel="Feedback de Telegram"
                  color="#C66B86"
                  icon={CheckSquare}
                />
              </div>

              {/* ── ROW 2: Primary Comprehension Chart ────────────────────────── */}
              <div>
                <Card className="p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#5B9B95]/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-2 relative z-10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[#9E5A78]">
                        <BarChart3 size={18} />
                        <h2 className="font-black text-lg tracking-tight">Nivel de Comprensión Por Tema</h2>
                      </div>
                      <p className="text-[10px] text-[#C66B86] font-semibold uppercase tracking-wider">
                        Cantidad de estudiantes por nivel de acierto en cada tema
                      </p>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={comprensionData} barGap={4} barCategoryGap="25%">
                      <XAxis
                        dataKey="tema"
                        tick={{ fontSize: 10, fill: "#9E5A78", fontWeight: "bold" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#9E5A78", fontWeight: "bold" }}
                        axisLine={false}
                        tickLine={false}
                        width={25}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 10, color: "#9E5A78", fontWeight: "bold", paddingTop: 10 }}
                      />
                      <Bar dataKey="s1" name="Bajo (0-1 correctas)" fill="#d4776a" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="s2" name="Medio (2-3 correctas)" fill="#F1D87C" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="s3" name="Alto (4+ correctas)" fill="#5B9B95" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* ── ROW 3: Secondary Statistics Charts ─────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Card 1 – Conteo tipo de respuesta */}
                <Card className="flex flex-col justify-between min-h-[220px]">
                  <div className="space-y-0.5 mb-4">
                    <p className="text-sm font-black text-[#9E5A78] tracking-tight">Conteo Tipo de Respuesta</p>
                    <p className="text-[9px] text-[#C66B86] font-bold uppercase tracking-wider">Respuestas absolutas de alumnos</p>
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={conteoRespuestasData} barCategoryGap="45%">
                      <XAxis
                        dataKey="tipo"
                        tick={{ fontSize: 10, fill: "#9E5A78", fontWeight: "bold" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#9E5A78", fontWeight: "bold" }}
                        axisLine={false}
                        tickLine={false}
                        width={22}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="value" name="Respuestas" radius={[5, 5, 0, 0]}>
                        {conteoRespuestasData.map((entry, i) => (
                          <Cell
                            key={entry.tipo}
                            fill={i === 0 ? "#9BC294" : "#d4776a"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                {/* Card 2 – Porcentaje tipo de respuesta (Pie) */}
                <Card className="flex flex-col justify-between min-h-[220px]">
                  <div className="space-y-0.5 mb-4">
                    <p className="text-sm font-black text-[#9E5A78] tracking-tight">Porcentaje General</p>
                    <p className="text-[9px] text-[#C66B86] font-bold uppercase tracking-wider">Distribución porcentual de aciertos</p>
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={55}
                        label={({ name, value }) => `${name} ${value}%`}
                        labelLine={false}
                        style={{ fontSize: 9, fontWeight: "bold" }}
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`${value}%`, ""]}
                        contentStyle={{
                          borderRadius: 16,
                          border: "1px solid #E8E0D5",
                          fontSize: 10,
                          fontWeight: "bold",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* Bottom decorative details */}
              <div className="p-4 bg-white/50 border border-gray-100 rounded-2xl flex items-center justify-between text-xs text-gray-400 font-semibold flex-wrap gap-2">
                <span className="flex items-center gap-1.5"><GraduationCap size={15} /> Clase: {gradeName} - Materia: {subject}</span>
                <span className="flex items-center gap-1.5"><HelpCircle size={15} /> Los datos de Telegram se actualizan cada 5 minutos de forma automática.</span>
              </div>
            </div>
          )}

        </main>
      </div>
    </AuthLayout>
  )
}

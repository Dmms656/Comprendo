"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, X, Edit2, ChevronDown, ChevronUp, Plus, Award, ArrowRight, Calendar, Sparkles } from "lucide-react"
import { AuthLayout } from "@/components/auth-layout"
import {
  getAsignaciones,
  getAniosLectivos,
  getNiveles,
  createNivel,
  getParalelos,
  createParalelo,
  getCursos,
  createCurso,
  getMaterias,
  createMateria,
  createAsignacion,
} from "@/lib/api"
import type {
  Asignacion,
  AnioLectivo,
  Nivel,
  Paralelo,
  Curso,
  Materia,
} from "@/lib/types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a nivel string like "Octavo" → { number: number, ordinal: string, name: string } */
function parseNivel(nivel: string): { number: number; ordinal: string; name: string } {
  const normalized = nivel.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
  
  if (normalized.includes("primero") || normalized.includes("primer")) {
    return { number: 1, ordinal: "ro", name: nivel }
  }
  if (normalized.includes("segundo")) {
    return { number: 2, ordinal: "do", name: nivel }
  }
  if (normalized.includes("tercero") || normalized.includes("tercer")) {
    return { number: 3, ordinal: "ro", name: nivel }
  }
  if (normalized.includes("cuarto")) {
    return { number: 4, ordinal: "to", name: nivel }
  }
  if (normalized.includes("quinto")) {
    return { number: 5, ordinal: "to", name: nivel }
  }
  if (normalized.includes("sexto")) {
    return { number: 6, ordinal: "to", name: nivel }
  }
  if (normalized.includes("septimo")) {
    return { number: 7, ordinal: "mo", name: nivel }
  }
  if (normalized.includes("octavo")) {
    return { number: 8, ordinal: "vo", name: nivel }
  }
  if (normalized.includes("noveno")) {
    return { number: 9, ordinal: "no", name: nivel }
  }
  if (normalized.includes("decimo")) {
    return { number: 10, ordinal: "mo", name: nivel }
  }
  
  // Check direct numbers (e.g. 1ro, 2do, 3ro, 1er, 1, 2, 3)
  const numberMatch = normalized.match(/\b(10|[1-9])\b/) || normalized.match(/(10|[1-9])/)
  if (numberMatch) {
    const num = parseInt(numberMatch[1])
    const ordinals: Record<number, string> = {
      1: "ro", 2: "do", 3: "ro", 4: "to", 5: "to", 6: "to", 7: "mo", 8: "vo", 9: "no", 10: "mo"
    }
    return { number: num, ordinal: ordinals[num] ?? "no", name: nivel }
  }
  
  return { number: 0, ordinal: "", name: nivel }
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white/80 rounded-3xl shadow-sm px-6 py-6 flex items-center gap-4 border border-[#F1D87C]/30 animate-pulse">
      <div className="w-14 h-14 rounded-2xl bg-[#5B9B95]/10" />
      <div className="flex flex-col gap-2 flex-1">
        <div className="h-5 w-28 rounded-full bg-[#9E5A78]/10" />
        <div className="h-4.5 w-20 rounded-full bg-[#C66B86]/10" />
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function GradesPanelPage() {
  const router = useRouter()
  const [sortAsc, setSortAsc] = useState(true)
  const [search, setSearch] = useState("")

  // API state
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal state — selected nivel name
  const [selectedNivel, setSelectedNivel] = useState<string | null>(null)
  const [expandedParalelos, setExpandedParalelos] = useState<Record<string, boolean>>({})

  // Modal states for creating a new assignment
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [catalogsLoading, setCatalogsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Catalogs
  const [aniosLectivos, setAniosLectivos] = useState<AnioLectivo[]>([])
  const [niveles, setNiveles] = useState<Nivel[]>([])
  const [paralelos, setParalelos] = useState<Paralelo[]>([])
  const [materias, setMaterias] = useState<Materia[]>([])
  const [cursos, setCursos] = useState<Curso[]>([])

  // Form selections
  const [selectedAnioId, setSelectedAnioId] = useState<string>("")
  const [selectedNivelId, setSelectedNivelId] = useState<string>("")
  const [customNivelName, setCustomNivelName] = useState("")
  const [selectedParaleloId, setSelectedParaleloId] = useState<string>("")
  const [customParaleloName, setCustomParaleloName] = useState("")
  const [selectedMateriaId, setSelectedMateriaId] = useState<string>("")
  const [customMateriaName, setCustomMateriaName] = useState("")
  const [customMateriaDesc, setCustomMateriaDesc] = useState("")

  const openCreateModal = async () => {
    setIsCreateModalOpen(true)
    setCatalogsLoading(true)
    setModalError(null)
    try {
      const [years, levels, sections, subjects, allCourses] = await Promise.all([
        getAniosLectivos(),
        getNiveles(),
        getParalelos(),
        getMaterias(),
        getCursos(),
      ])
      setAniosLectivos(years)
      setNiveles(levels)
      setParalelos(sections)
      setMaterias(subjects)
      setCursos(allCourses)

      if (years.length > 0) {
        const active = years.find((y) => y.estado === "ACTIVO") ?? years[0]
        setSelectedAnioId(active.idAnioLectivo.toString())
      }
      if (levels.length > 0) setSelectedNivelId(levels[0].idNivel.toString())
      if (sections.length > 0) setSelectedParaleloId(sections[0].idParalelo.toString())
      if (subjects.length > 0) setSelectedMateriaId(subjects[0].idMateria.toString())
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Error al cargar los catálogos")
    } finally {
      setCatalogsLoading(false)
    }
  }

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setModalError(null)
    try {
      let finalNivelId = parseInt(selectedNivelId)
      let finalParaleloId = parseInt(selectedParaleloId)
      let finalMateriaId = parseInt(selectedMateriaId)
      let finalAnioId = parseInt(selectedAnioId)

      if (!finalAnioId) {
        throw new Error("Por favor selecciona un año lectivo.")
      }

      // 1. Create Nivel if custom
      if (selectedNivelId === "NEW") {
        if (!customNivelName.trim()) throw new Error("Por favor ingresa el nombre del nuevo nivel.")
        const newNivel = await createNivel(customNivelName.trim())
        finalNivelId = newNivel.idNivel
      }

      // 2. Create Paralelo if custom
      if (selectedParaleloId === "NEW") {
        if (!customParaleloName.trim()) throw new Error("Por favor ingresa el nombre del nuevo paralelo.")
        const newParalelo = await createParalelo(customParaleloName.trim())
        finalParaleloId = newParalelo.idParalelo
      }

      // 3. Create Materia if custom
      if (selectedMateriaId === "NEW") {
        if (!customMateriaName.trim()) throw new Error("Por favor ingresa el nombre de la nueva materia.")
        const newMateria = await createMateria(customMateriaName.trim(), customMateriaDesc.trim())
        finalMateriaId = newMateria.idMateria
      }

      // 4. Find or Create Curso
      let course = cursos.find(
        (c) =>
          c.idAnioLectivo === finalAnioId &&
          c.idNivel === finalNivelId &&
          c.idParalelo === finalParaleloId
      )

      let finalCursoId: number
      if (course) {
        finalCursoId = course.idCurso
      } else {
        const newCourse = await createCurso(finalAnioId, finalNivelId, finalParaleloId)
        finalCursoId = newCourse.idCurso
      }

      // 5. Create Asignacion
      await createAsignacion(finalCursoId, finalMateriaId)

      // 6. Refetch and Close
      const updatedAsignaciones = await getAsignaciones()
      setAsignaciones(updatedAsignaciones)
      setIsCreateModalOpen(false)

      // Reset custom inputs
      setCustomNivelName("")
      setCustomParaleloName("")
      setCustomMateriaName("")
      setCustomMateriaDesc("")
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Error al guardar el nuevo grado/curso")
    } finally {
      setSubmitting(false)
    }
  }

  // Fetch asignaciones on mount
  useEffect(() => {
    let cancelled = false
    async function fetch() {
      setLoading(true)
      setError(null)
      try {
        const data = await getAsignaciones()
        if (!cancelled) setAsignaciones(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar grados")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [])

  // ── Derive grade cards (group by nivel) ──────────────────────────────────────
  const gradeCards = useMemo(() => {
    const map = new Map<string, { asignaciones: Asignacion[]; parsed: ReturnType<typeof parseNivel> }>()
    for (const a of asignaciones) {
      if (!map.has(a.nivel)) {
        map.set(a.nivel, { asignaciones: [], parsed: parseNivel(a.nivel) })
      }
      map.get(a.nivel)!.asignaciones.push(a)
    }
    return Array.from(map.entries()).map(([nivel, val]) => ({
      nivel,
      ...val,
    }))
  }, [asignaciones])

  const filteredAndSorted = useMemo(() => {
    let result = [...gradeCards]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((g) => g.nivel.toLowerCase().includes(q))
    }
    result.sort((a, b) =>
      sortAsc ? a.parsed.number - b.parsed.number : b.parsed.number - a.parsed.number
    )
    return result
  }, [gradeCards, sortAsc, search])

  // Sections for the selected nivel
  const modalNivelData = useMemo(() => {
    if (!selectedNivel) return null
    const entry = gradeCards.find((g) => g.nivel === selectedNivel)
    if (!entry) return null

    // Group asignaciones by paralelo
    const paralelos = new Map<string, Asignacion[]>()
    for (const a of entry.asignaciones) {
      if (!paralelos.has(a.paralelo)) paralelos.set(a.paralelo, [])
      paralelos.get(a.paralelo)!.push(a)
    }
    return { entry, paralelos }
  }, [selectedNivel, gradeCards])

  const toggleParalelo = (p: string) =>
    setExpandedParalelos((prev) => ({ ...prev, [p]: !prev[p] }))

  // Determine anio lectivo badge from first asignacion
  const anioLectivo = asignaciones[0]?.anioLectivo ?? "2025-2026"

  return (
    <AuthLayout>
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 md:px-8 py-10 min-h-[calc(100vh-3.5rem)]">
        
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-[#F1D87C]/20">
          {/* Left Side - Title */}
          <div className="space-y-1.5 text-left">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-black text-[#9E5A78] tracking-tight">
                Mis Cursos
              </h1>
              <span className="flex items-center gap-1.5 bg-[#5B9B95]/10 text-[#5B9B95] border border-[#5B9B95]/20 text-xs font-bold rounded-full px-3 py-1">
                <Calendar size={12} /> {anioLectivo}
              </span>
            </div>
            <p className="text-xs text-[#C66B86] font-semibold tracking-wide uppercase">
              Gestiona tus asignaciones, estudiantes y lecciones académicas
            </p>
          </div>

          {/* Right Side - Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Nuevo Grado Button */}
            <button
              onClick={openCreateModal}
              className="bg-[#5B9B95] text-white font-bold rounded-2xl px-5 py-2.5 text-sm hover:bg-[#4a8880] transition-all duration-300 shadow-md shadow-[#5B9B95]/20 flex items-center gap-2 hover:-translate-y-0.5 cursor-pointer"
            >
              Nuevo Curso <Plus size={16} />
            </button>

            {/* Sort Toggle */}
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="bg-[#faf6df] text-[#9E5A78] border border-[#F1D87C]/60 rounded-2xl px-4 py-2.5 text-xs font-bold hover:bg-[#F1D87C]/15 transition-all duration-300 cursor-pointer"
            >
              {sortAsc ? "Menor a Mayor ▲" : "Mayor a Menor ▼"}
            </button>

            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar curso..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white border border-[#F1D87C]/60 rounded-2xl px-4 py-2.5 pr-10 text-xs text-gray-700 placeholder:text-[#C66B86]/50 focus:outline-none focus:border-[#5B9B95] focus:ring-2 focus:ring-[#5B9B95]/10 w-44 md:w-52 transition-all"
              />
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5B9B95]" />
            </div>
          </div>
        </div>

        {/* States: loading / error / content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white/60 rounded-3xl border border-[#d4776a]/20 p-8 max-w-md mx-auto shadow-sm">
            <p className="text-[#d4776a] text-base font-semibold mb-4">{error}</p>
            <button
              onClick={() => {
                setLoading(true)
                setError(null)
                getAsignaciones()
                  .then(setAsignaciones)
                  .catch((e) => setError(e.message))
                  .finally(() => setLoading(false))
              }}
              className="bg-[#5B9B95] text-white rounded-2xl px-6 py-2.5 text-sm font-bold hover:bg-[#4a8880] transition-colors shadow-sm cursor-pointer"
            >
              Intentar nuevamente
            </button>
          </div>
        ) : filteredAndSorted.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSorted.map((grade, idx) => (
              <button
                key={grade.nivel}
                onClick={() => {
                  setSelectedNivel(grade.nivel)
                  setExpandedParalelos({})
                }}
                className="bg-white rounded-3xl shadow-sm hover:shadow-xl hover:scale-[1.02] border border-[#F1D87C]/30 hover:border-[#5B9B95]/30 p-6 flex items-center gap-5 text-left transition-all duration-300 relative group overflow-hidden cursor-pointer"
              >
                {/* Visual background gradient hover effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#5B9B95]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Grade Badge */}
                <div className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center bg-[#5B9B95]/10 text-[#5B9B95] font-black tracking-tighter relative z-10">
                  <span className="text-3xl leading-none">
                    {grade.parsed.number || "?"}
                  </span>
                  <span className="text-[10px] font-bold uppercase -mt-0.5">
                    {grade.parsed.ordinal}
                  </span>
                </div>

                {/* Grade Info */}
                <div className="relative z-10 flex-1 space-y-1">
                  <div className="font-black text-lg md:text-xl text-[#9E5A78] leading-tight group-hover:text-[#5B9B95] transition-colors">
                    {grade.nivel}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#C66B86] font-semibold">
                    <Award size={13} />
                    <span>{grade.asignaciones.length} paralelo{grade.asignaciones.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>

                <div className="text-gray-300 group-hover:text-[#5B9B95] transition-colors relative z-10">
                  <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/40 rounded-3xl border border-dashed border-gray-200">
            <p className="text-[#C66B86] font-bold text-lg">No se encontraron cursos asignados</p>
            <p className="text-xs text-[#C66B86]/70 mt-1">Haz clic en &quot;Nuevo Curso&quot; para registrar uno.</p>
          </div>
        )}
      </main>

      {/* Floating Panel Overlay (Sections list) */}
      {selectedNivel && modalNivelData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
          style={{ backgroundColor: "rgba(30,18,24,0.4)" }}
          onClick={() => setSelectedNivel(null)}
        >
          <div
            className="bg-[#fdfdf1] rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-[#F1D87C]/30 flex flex-col animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "85vh" }}
          >
            {/* Panel Header */}
            <div
              className="px-6 py-6 text-center relative text-white"
              style={{
                background: "linear-gradient(135deg, #9E5A78 0%, #C66B86 100%)",
              }}
            >
              <span className="inline-block p-2 bg-white/10 rounded-2xl mb-1.5 text-white/90">
                <Sparkles size={20} />
              </span>
              <h2 className="font-black text-2xl tracking-tight leading-none">{selectedNivel}</h2>
              <p className="text-white/80 text-xs font-semibold mt-1 tracking-wide uppercase">Selecciona un paralelo</p>
              
              {/* Close button */}
              <button
                onClick={() => setSelectedNivel(null)}
                className="absolute right-4 top-4 p-1 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                aria-label="Cerrar panel"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sections List */}
            <div className="px-5 py-5 space-y-3 overflow-y-auto flex-1 bg-gradient-to-b from-white/30 to-[#fdfdf1]">
              {Array.from(modalNivelData.paralelos.entries()).map(([paralelo, asgns]) => {
                const isExpanded = expandedParalelos[paralelo]
                return (
                  <div key={paralelo} className="space-y-1">
                    <button
                      onClick={() => toggleParalelo(paralelo)}
                      className={`w-full flex items-center justify-between rounded-2xl px-4 py-3.5 text-left transition-all duration-300 border bg-white cursor-pointer ${
                        isExpanded
                          ? "shadow-md border-[#F1D87C] rounded-b-none"
                          : "shadow-sm border-gray-100 hover:border-[#F1D87C]"
                      }`}
                    >
                      <span className="font-bold text-gray-700 text-sm flex items-center gap-2">
                        <span className="w-5 h-5 rounded-lg flex items-center justify-center bg-[#5B9B95]/15 text-[#5B9B95] font-black text-xs">
                          {paralelo}
                        </span>
                        Sección &quot;{paralelo}&quot;
                      </span>
                      <div className="flex items-center gap-2 text-[#5B9B95]">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>

                    {/* Expanded subjects */}
                    {isExpanded && (
                      <div className="bg-white rounded-b-2xl border border-t-0 border-[#F1D87C]/50 shadow-sm px-4 pb-3.5 pt-1.5 space-y-2 animate-in slide-in-from-top-2 duration-200">
                        <div className="h-px bg-gray-100 w-full mb-2" />
                        <div className="space-y-1.5">
                          {asgns.map((a) => (
                            <button
                              key={a.idDocenteCursoMateria}
                              onClick={() => {
                                setSelectedNivel(null)
                                router.push(
                                  `/curso/${a.idDocenteCursoMateria}/${encodeURIComponent(a.materia)}`
                                )
                              }}
                              className="w-full flex items-center justify-between hover:bg-[#5B9B95]/10 rounded-xl px-3 py-2.5 transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: "#C66B86" }}
                                />
                                <span className="text-sm text-gray-700 font-bold group-hover:text-[#9E5A78]">
                                  {a.materia}
                                </span>
                              </div>
                              <ArrowRight size={14} className="text-gray-300 group-hover:text-[#5B9B95] transform group-hover:translate-x-0.5 transition-all" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Add new section note */}
              <p className="text-[10px] text-[#C66B86] text-center italic mt-2 leading-relaxed">
                ¿Falta un paralelo o asignatura? Haz clic en el botón <strong>&quot;Nuevo Curso&quot;</strong> de la cabecera para agregarlo en segundos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Nuevo Grado / Curso Creation Modal */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
          style={{ backgroundColor: "rgba(30,18,24,0.4)" }}
          onClick={() => { if (!submitting) setIsCreateModalOpen(false) }}
        >
          <div
            className="bg-[#fdfdf1] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-[#F1D87C]/30 flex flex-col animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "90vh" }}
          >
            {/* Header */}
            <div
              className="px-6 py-6 text-center relative text-white"
              style={{
                background: "linear-gradient(135deg, #9E5A78 0%, #C66B86 100%)",
              }}
            >
              <h2 className="font-black text-2xl tracking-tight">Nuevo Grado o Curso</h2>
              <p className="text-white/80 text-xs font-semibold mt-1 tracking-wide uppercase">Asigna una materia a un grado académico</p>
              
              <button
                onClick={() => { if (!submitting) setIsCreateModalOpen(false) }}
                className="absolute right-4 top-4 p-1.5 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                disabled={submitting}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Form */}
            {catalogsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 gap-3">
                <div className="w-10 h-10 border-4 border-[#5B9B95] border-t-transparent rounded-full animate-spin" />
                <p className="text-[#9E5A78] font-bold text-sm">Cargando catálogos del sistema...</p>
              </div>
            ) : (
              <form onSubmit={handleCreateAssignment} className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-white/30">
                {modalError && (
                  <div className="bg-[#fdf0f0] border border-[#f5c6c6] text-[#d4776a] text-xs rounded-2xl px-4 py-3 font-semibold text-center">
                    {modalError}
                  </div>
                )}

                {/* Año Lectivo Selector */}
                <div className="space-y-1.5">
                  <label className="block text-[#9E5A78] text-[10px] font-black uppercase tracking-wider pl-1">
                    Año Lectivo
                  </label>
                  <select
                    value={selectedAnioId}
                    onChange={(e) => setSelectedAnioId(e.target.value)}
                    className="w-full bg-white border border-[#F1D87C]/60 focus:border-[#5B9B95] rounded-2xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5B9B95]/10 transition-colors"
                  >
                    {aniosLectivos.map((a) => (
                      <option key={a.idAnioLectivo} value={a.idAnioLectivo}>
                        {a.nombre} {a.estado === "ACTIVO" ? "(Activo)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nivel Selector */}
                <div className="space-y-1.5">
                  <label className="block text-[#9E5A78] text-[10px] font-black uppercase tracking-wider pl-1">
                    Nivel Educativo (Grado)
                  </label>
                  <select
                    value={selectedNivelId}
                    onChange={(e) => setSelectedNivelId(e.target.value)}
                    className="w-full bg-white border border-[#F1D87C]/60 focus:border-[#5B9B95] rounded-2xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5B9B95]/10 transition-colors"
                  >
                    {niveles.map((n) => (
                      <option key={n.idNivel} value={n.idNivel}>
                        {n.nombre}
                      </option>
                    ))}
                    <option value="NEW" className="text-[#5B9B95] font-black">
                      + Crear nuevo grado...
                    </option>
                  </select>

                  {selectedNivelId === "NEW" && (
                    <input
                      type="text"
                      placeholder="Ej. Octavo de Básica, Tercero BGU..."
                      value={customNivelName}
                      onChange={(e) => setCustomNivelName(e.target.value)}
                      required
                      className="w-full bg-white border border-[#5B9B95] rounded-2xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5B9B95]/10 mt-2 placeholder:text-gray-400 animate-in slide-in-from-top-2"
                    />
                  )}
                </div>

                {/* Paralelo Selector */}
                <div className="space-y-1.5">
                  <label className="block text-[#9E5A78] text-[10px] font-black uppercase tracking-wider pl-1">
                    Paralelo (Sección)
                  </label>
                  <select
                    value={selectedParaleloId}
                    onChange={(e) => setSelectedParaleloId(e.target.value)}
                    className="w-full bg-white border border-[#F1D87C]/60 focus:border-[#5B9B95] rounded-2xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5B9B95]/10 transition-colors"
                  >
                    {paralelos.map((p) => (
                      <option key={p.idParalelo} value={p.idParalelo}>
                        Paralelo {p.nombre}
                      </option>
                    ))}
                    <option value="NEW" className="text-[#5B9B95] font-black">
                      + Crear nuevo paralelo...
                    </option>
                  </select>

                  {selectedParaleloId === "NEW" && (
                    <input
                      type="text"
                      placeholder="Ej. A, B, C, Único..."
                      value={customParaleloName}
                      onChange={(e) => setCustomParaleloName(e.target.value)}
                      required
                      className="w-full bg-white border border-[#5B9B95] rounded-2xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5B9B95]/10 mt-2 placeholder:text-gray-400 animate-in slide-in-from-top-2"
                    />
                  )}
                </div>

                {/* Materia Selector */}
                <div className="space-y-1.5">
                  <label className="block text-[#9E5A78] text-[10px] font-black uppercase tracking-wider pl-1">
                    Materia (Asignatura)
                  </label>
                  <select
                    value={selectedMateriaId}
                    onChange={(e) => setSelectedMateriaId(e.target.value)}
                    className="w-full bg-white border border-[#F1D87C]/60 focus:border-[#5B9B95] rounded-2xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5B9B95]/10 transition-colors"
                  >
                    {materias.map((m) => (
                      <option key={m.idMateria} value={m.idMateria}>
                        {m.nombre}
                      </option>
                    ))}
                    <option value="NEW" className="text-[#5B9B95] font-black">
                      + Crear nueva materia...
                    </option>
                  </select>

                  {selectedMateriaId === "NEW" && (
                    <div className="space-y-2 mt-2 animate-in slide-in-from-top-2">
                      <input
                        type="text"
                        placeholder="Ej. Matemática, Emprendimiento..."
                        value={customMateriaName}
                        onChange={(e) => setCustomMateriaName(e.target.value)}
                        required
                        className="w-full bg-white border border-[#5B9B95] rounded-2xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5B9B95]/10 placeholder:text-gray-400"
                      />
                      <textarea
                        placeholder="Descripción breve (opcional)..."
                        value={customMateriaDesc}
                        onChange={(e) => setCustomMateriaDesc(e.target.value)}
                        className="w-full bg-white border border-[#5B9B95]/60 focus:border-[#5B9B95] rounded-2xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5B9B95]/10 placeholder:text-gray-400 h-16 resize-none"
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={submitting}
                    className="flex-1 py-2.5 px-4 rounded-2xl border border-[#C66B86] text-[#C66B86] font-bold hover:bg-[#C66B86]/5 transition-colors text-xs disabled:opacity-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 px-4 rounded-2xl bg-[#5B9B95] text-white font-bold hover:bg-[#4a8880] transition-colors text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md shadow-[#5B9B95]/10"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Crear y Asignar"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </AuthLayout>
  )
}

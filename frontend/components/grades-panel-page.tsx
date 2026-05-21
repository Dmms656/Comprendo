"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, X, Edit2, ChevronDown, ChevronUp, Plus } from "lucide-react"
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

/** Convert a nivel string like "Octavo" → { number: 8, ordinal: "vo", name: "Octavo" } */
function parseNivel(nivel: string): { number: number; ordinal: string; name: string } {
  const map: Record<string, { number: number; ordinal: string }> = {
    primero:   { number: 1,  ordinal: "ro" },
    segundo:   { number: 2,  ordinal: "do" },
    tercero:   { number: 3,  ordinal: "ro" },
    cuarto:    { number: 4,  ordinal: "to" },
    quinto:    { number: 5,  ordinal: "to" },
    sexto:     { number: 6,  ordinal: "to" },
    séptimo:   { number: 7,  ordinal: "mo" },
    septimo:   { number: 7,  ordinal: "mo" },
    octavo:    { number: 8,  ordinal: "vo" },
    noveno:    { number: 9,  ordinal: "no" },
    décimo:    { number: 10, ordinal: "mo" },
    decimo:    { number: 10, ordinal: "mo" },
  }
  const key = nivel.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  const found = map[nivel.toLowerCase()] ?? map[key]
  return found
    ? { number: found.number, ordinal: found.ordinal, name: nivel }
    : { number: 0, ordinal: "", name: nivel }
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm px-6 py-5 flex items-center gap-4 border border-[#F1D87C]/40 animate-pulse">
      <div className="w-14 h-14 rounded-xl bg-[#5B9B95]/20" />
      <div className="flex flex-col gap-2 flex-1">
        <div className="h-4 w-24 rounded-full bg-[#9E5A78]/20" />
        <div className="h-3 w-16 rounded-full bg-[#C66B86]/20" />
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
      <main className="flex-1 max-w-5xl mx-auto w-full px-8 py-10">
        {/* Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          {/* Left Side - Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[#9E5A78] italic">
              Grados Asignados
            </h1>
            <span className="bg-[#fdfdf1] border border-[#9BC294] text-[#5B9B95] text-sm font-semibold rounded-full px-3 py-1">
              {anioLectivo}
            </span>
          </div>

          {/* Right Side - Controls */}
          <div className="flex items-center gap-3">
            {/* Nuevo Grado Button */}
            <button
              onClick={openCreateModal}
              className="bg-[#9BC294] text-white font-semibold rounded-full px-4 py-1.5 text-sm hover:bg-[#7aaa73] transition-colors flex items-center gap-1"
            >
              Nuevo Grado
              <span className="text-lg leading-none">+</span>
            </button>

            {/* Sort Toggle */}
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="bg-[#5B9B95] text-white rounded-full px-4 py-1.5 text-sm font-medium hover:bg-[#4a8a84] transition-colors"
            >
              {sortAsc ? "Ascendente ▲" : "Descendente ▼"}
            </button>

            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar grado o curso..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-[#fdfdf1] border border-[#F1D87C] rounded-full px-4 py-1.5 pr-10 text-sm text-[#9E5A78] placeholder:text-[#C66B86]/50 focus:outline-none focus:border-[#5B9B95] w-48 transition-colors"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5B9B95]" />
            </div>
          </div>
        </div>

        {/* States: loading / error / content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-[#d4776a] text-lg mb-4">{error}</p>
            <button
              onClick={() => { setLoading(true); setError(null); getAsignaciones().then(setAsignaciones).catch((e) => setError(e.message)).finally(() => setLoading(false)) }}
              className="bg-[#5B9B95] text-white rounded-full px-6 py-2 text-sm font-semibold hover:bg-[#4a8880] transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : filteredAndSorted.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAndSorted.map((grade) => (
              <button
                key={grade.nivel}
                onClick={() => {
                  setSelectedNivel(grade.nivel)
                  setExpandedParalelos({})
                }}
                className="bg-white rounded-2xl shadow-sm px-6 py-5 flex items-center gap-4 hover:shadow-md hover:scale-[1.02] transition-all duration-200 text-left border border-[#F1D87C]/40"
              >
                {/* Grade Number with Superscript */}
                <div className="flex items-start">
                  <span className="text-5xl font-bold text-[#5B9B95]">
                    {grade.parsed.number || "?"}
                  </span>
                  <sup className="text-lg font-bold text-[#5B9B95] ml-0.5">
                    {grade.parsed.ordinal}
                  </sup>
                </div>

                {/* Grade Info */}
                <div>
                  <div className="font-bold text-xl text-[#9E5A78]">
                    {grade.nivel}
                  </div>
                  <div className="text-[#C66B86] text-sm">
                    {grade.asignaciones.length} curso{grade.asignaciones.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-[#C66B86] text-lg">No se encontraron grados</p>
          </div>
        )}
      </main>

      {/* Floating Panel Overlay */}
      {selectedNivel && modalNivelData && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
          onClick={() => setSelectedNivel(null)}
        >
          <div
            className="bg-[#fdfdf1] rounded-3xl shadow-2xl w-full max-w-xs mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "90vh", overflowY: "auto" }}
          >
            {/* Panel Header */}
            <div
              className="px-6 pt-5 pb-4 text-center relative"
              style={{
                background: "linear-gradient(135deg, #9E5A78 0%, #C66B86 100%)",
              }}
            >
              <h2 className="text-white font-bold text-2xl">{selectedNivel}</h2>
              <p className="text-white/80 text-sm mt-0.5">Selecciona una sección</p>
              {/* Edit button */}
              <button className="absolute right-10 top-5 text-white/80 hover:text-white transition-colors">
                <Edit2 size={16} />
              </button>
              {/* Close button */}
              <button
                onClick={() => setSelectedNivel(null)}
                className="absolute right-4 top-5 text-white/80 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Sections List */}
            <div className="px-4 py-4 space-y-2">
              {Array.from(modalNivelData.paralelos.entries()).map(([paralelo, asgns]) => {
                const isExpanded = expandedParalelos[paralelo]
                return (
                  <div key={paralelo}>
                    <div
                      className={`flex items-center justify-between rounded-2xl px-4 py-3 transition-all duration-200 ${
                        isExpanded
                          ? "bg-white shadow-sm border border-[#F1D87C]/50 rounded-b-none"
                          : "bg-white shadow-sm border border-transparent hover:border-[#F1D87C]/50"
                      }`}
                    >
                      <span className="font-semibold text-[#5B5B5B] text-sm">
                        {selectedNivel} &quot;{paralelo}&quot;
                      </span>
                      <div className="flex items-center gap-2">
                        <button className="text-[#5B9B95] hover:text-[#4a8880] transition-colors">
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => toggleParalelo(paralelo)}
                          className="text-[#5B9B95] hover:text-[#4a8880] transition-colors"
                        >
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded subjects */}
                    {isExpanded && (
                      <div className="bg-white rounded-b-2xl border border-t-0 border-[#F1D87C]/50 shadow-sm px-4 pb-3">
                        <div className="space-y-2 pt-2">
                          {asgns.map((a) => (
                            <button
                              key={a.idDocenteCursoMateria}
                              onClick={() =>
                                router.push(
                                  `/curso/${a.idDocenteCursoMateria}/${encodeURIComponent(a.materia)}`
                                )
                              }
                              className="w-full flex items-center justify-between hover:bg-[#fdfdf1] rounded-xl px-2 py-1 transition-colors -mx-2"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: "#C66B86" }}
                                />
                                <span className="text-sm text-[#5B5B5B] font-medium">
                                  {a.materia}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Add new section button */}
              <button className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#5B9B95]/40 text-[#5B9B95] text-sm font-semibold py-3 hover:bg-[#5B9B95]/5 transition-colors mt-1">
                <Plus size={16} />
                Añadir nueva sección
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nuevo Grado / Curso Creation Modal */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
          style={{ backgroundColor: "rgba(158, 90, 120, 0.2)" }}
          onClick={() => { if (!submitting) setIsCreateModalOpen(false) }}
        >
          <div
            className="bg-[#fdfdf1] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-[#F1D87C]/30 flex flex-col animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "90vh" }}
          >
            {/* Header */}
            <div
              className="px-6 py-5 text-center relative"
              style={{
                background: "linear-gradient(135deg, #9E5A78 0%, #C66B86 100%)",
              }}
            >
              <h2 className="text-white font-bold text-2xl">Nuevo Grado o Curso</h2>
              <p className="text-white/80 text-sm mt-0.5">Asigna una materia a un grado académico</p>
              <button
                onClick={() => { if (!submitting) setIsCreateModalOpen(false) }}
                className="absolute right-4 top-5 text-white/80 hover:text-white transition-colors"
                disabled={submitting}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Form */}
            {catalogsLoading ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 gap-3">
                <div className="w-10 h-10 border-4 border-[#5B9B95] border-t-transparent rounded-full animate-spin" />
                <p className="text-[#9E5A78] font-medium text-sm">Cargando catálogos del sistema...</p>
              </div>
            ) : (
              <form onSubmit={handleCreateAssignment} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {modalError && (
                  <div className="bg-[#fdf0f0] border border-[#f5c6c6] text-[#d4776a] text-xs rounded-xl px-4 py-3 font-medium">
                    {modalError}
                  </div>
                )}

                {/* Año Lectivo Selector */}
                <div className="space-y-1">
                  <label className="block text-[#9E5A78] text-xs font-bold uppercase tracking-wider">
                    Año Lectivo
                  </label>
                  <select
                    value={selectedAnioId}
                    onChange={(e) => setSelectedAnioId(e.target.value)}
                    className="w-full bg-white border border-[#F1D87C]/60 rounded-xl px-3 py-2 text-sm text-[#5B5B5B] focus:outline-none focus:border-[#5B9B95] transition-colors"
                  >
                    {aniosLectivos.map((a) => (
                      <option key={a.idAnioLectivo} value={a.idAnioLectivo}>
                        {a.nombre} {a.estado === "ACTIVO" ? "(Activo)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nivel Selector */}
                <div className="space-y-1">
                  <label className="block text-[#9E5A78] text-xs font-bold uppercase tracking-wider">
                    Nivel Educativo (Grado)
                  </label>
                  <select
                    value={selectedNivelId}
                    onChange={(e) => setSelectedNivelId(e.target.value)}
                    className="w-full bg-white border border-[#F1D87C]/60 rounded-xl px-3 py-2 text-sm text-[#5B5B5B] focus:outline-none focus:border-[#5B9B95] transition-colors"
                  >
                    {niveles.map((n) => (
                      <option key={n.idNivel} value={n.idNivel}>
                        {n.nombre}
                      </option>
                    ))}
                    <option value="NEW" className="text-[#5B9B95] font-semibold">
                      + Crear nuevo nivel...
                    </option>
                  </select>

                  {selectedNivelId === "NEW" && (
                    <input
                      type="text"
                      placeholder="Ej. Octavo de Básica, Tercero BGU..."
                      value={customNivelName}
                      onChange={(e) => setCustomNivelName(e.target.value)}
                      className="w-full bg-white border border-[#5B9B95] rounded-xl px-3 py-2 text-sm text-[#5B5B5B] focus:outline-none mt-2 placeholder:text-[#5B5B5B]/40"
                    />
                  )}
                </div>

                {/* Paralelo Selector */}
                <div className="space-y-1">
                  <label className="block text-[#9E5A78] text-xs font-bold uppercase tracking-wider">
                    Paralelo (Sección)
                  </label>
                  <select
                    value={selectedParaleloId}
                    onChange={(e) => setSelectedParaleloId(e.target.value)}
                    className="w-full bg-white border border-[#F1D87C]/60 rounded-xl px-3 py-2 text-sm text-[#5B5B5B] focus:outline-none focus:border-[#5B9B95] transition-colors"
                  >
                    {paralelos.map((p) => (
                      <option key={p.idParalelo} value={p.idParalelo}>
                        Paralelo {p.nombre}
                      </option>
                    ))}
                    <option value="NEW" className="text-[#5B9B95] font-semibold">
                      + Crear nuevo paralelo...
                    </option>
                  </select>

                  {selectedParaleloId === "NEW" && (
                    <input
                      type="text"
                      placeholder="Ej. A, B, C, Único..."
                      value={customParaleloName}
                      onChange={(e) => setCustomParaleloName(e.target.value)}
                      className="w-full bg-white border border-[#5B9B95] rounded-xl px-3 py-2 text-sm text-[#5B5B5B] focus:outline-none mt-2 placeholder:text-[#5B5B5B]/40"
                    />
                  )}
                </div>

                {/* Materia Selector */}
                <div className="space-y-1">
                  <label className="block text-[#9E5A78] text-xs font-bold uppercase tracking-wider">
                    Materia (Asignatura)
                  </label>
                  <select
                    value={selectedMateriaId}
                    onChange={(e) => setSelectedMateriaId(e.target.value)}
                    className="w-full bg-white border border-[#F1D87C]/60 rounded-xl px-3 py-2 text-sm text-[#5B5B5B] focus:outline-none focus:border-[#5B9B95] transition-colors"
                  >
                    {materias.map((m) => (
                      <option key={m.idMateria} value={m.idMateria}>
                        {m.nombre}
                      </option>
                    ))}
                    <option value="NEW" className="text-[#5B9B95] font-semibold">
                      + Crear nueva materia...
                    </option>
                  </select>

                  {selectedMateriaId === "NEW" && (
                    <div className="space-y-2 mt-2">
                      <input
                        type="text"
                        placeholder="Ej. Matemática, Emprendimiento..."
                        value={customMateriaName}
                        onChange={(e) => setCustomMateriaName(e.target.value)}
                        className="w-full bg-white border border-[#5B9B95] rounded-xl px-3 py-2 text-sm text-[#5B5B5B] focus:outline-none placeholder:text-[#5B5B5B]/40"
                      />
                      <textarea
                        placeholder="Descripción breve (opcional)..."
                        value={customMateriaDesc}
                        onChange={(e) => setCustomMateriaDesc(e.target.value)}
                        className="w-full bg-white border border-[#5B9B95]/60 rounded-xl px-3 py-2 text-sm text-[#5B5B5B] focus:outline-none placeholder:text-[#5B5B5B]/40 h-16 resize-none"
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={submitting}
                    className="flex-1 py-2 px-4 rounded-full border border-[#C66B86] text-[#C66B86] hover:bg-[#C66B86]/5 transition-colors text-sm font-semibold disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2 px-4 rounded-full bg-[#5B9B95] text-white hover:bg-[#4a8880] transition-colors text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
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

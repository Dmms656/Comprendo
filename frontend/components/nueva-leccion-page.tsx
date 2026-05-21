"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowUp, Pencil, Check, X } from "lucide-react"
import { AuthLayout } from "@/components/auth-layout"
import { CourseSidebar } from "@/components/course-sidebar"
import { generateQuestion, createLeccion, createPregunta, getEstudiantes, startEvaluationForStudent } from "@/lib/api"
import type { GeneratedQuestion, Opcion, Estudiante } from "@/lib/types"

// ─── Types ────────────────────────────────────────────────────────────────────
interface NuevaLeccionPageProps {
  gradeId?: string | number
  gradeName?: string
  section?: string
  subject?: string
}

type Message = {
  id: number
  role: "assistant" | "user"
  content: string
}

// ─── Chat flow states ─────────────────────────────────────────────────────────
type ChatPhase =
  | "ask_input"        // waiting for user to enter topic and count
  | "generating"       // generating questions via AI
  | "done"             // all questions generated, ready to publish

// ─── Bird avatar SVG ─────────────────────────────────────────────────────────
function BirdAvatar() {
  return (
    <div
      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl select-none shadow-sm"
      style={{ backgroundColor: "#fdfdf1", border: "2px solid #C66B86" }}
      aria-label="Asistente Comprendo"
    >
      🐦
    </div>
  )
}

// ─── Format generated question for display ────────────────────────────────────
function formatQuestion(q: GeneratedQuestion, index: number): string {
  const opcionesText = q.opciones
    .map((o: Opcion) => `${o.literal}) ${o.texto}`)
    .join("\n")
  return `📝 Pregunta ${index + 1}:\n${q.enunciado}\n\n${opcionesText}\n\n✅ Respuesta correcta: ${q.literalCorrecto}`
}

// ─── Main component ───────────────────────────────────────────────────────────
export function NuevaLeccionPage({
  gradeId = "2",
  gradeName = "Segundo",
  section = "D",
  subject = "Física",
}: NuevaLeccionPageProps) {
  const router = useRouter()
  const breadcrumb = `Grados/${gradeName}/${subject}/Lecciones/NuevaLección`

  const initialMessage: Message = {
    id: 0,
    role: "assistant",
    content:
      "¡Hola! Soy tu asistente de Comprendo. Estoy aquí para ayudarte a generar lecciones interactivas en un instante. 🐦\n\nPara comenzar, dime el tema de la lección y cuántas preguntas deseas generar (1 a 5).\nEjemplo: \"Movimiento Circular 3 preguntas\".\n\n¿Qué tema trabajaremos hoy?",
  }

  const [messages, setMessages] = useState<Message[]>([initialMessage])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [phase, setPhase] = useState<ChatPhase>("ask_input")
  const [topic, setTopic] = useState("")
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([])
  const [publishing, setPublishing] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // ─── States for editing generated questions ───────────────────────────────────
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editEnunciado, setEditEnunciado] = useState("")
  const [editOpciones, setEditOpciones] = useState<Opcion[]>([])
  const [editLiteralCorrecto, setEditLiteralCorrecto] = useState("")

  const startEditing = (idx: number) => {
    setEditingIndex(idx)
    setEditEnunciado(generatedQuestions[idx].enunciado)
    setEditOpciones(JSON.parse(JSON.stringify(generatedQuestions[idx].opciones)))
    setEditLiteralCorrecto(generatedQuestions[idx].literalCorrecto)
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
  }

  const handleSaveEdit = (idx: number) => {
    const updated = [...generatedQuestions]
    updated[idx] = {
      enunciado: editEnunciado,
      opciones: editOpciones,
      literalCorrecto: editLiteralCorrecto,
    }
    setGeneratedQuestions(updated)
    setEditingIndex(null)
  }

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const addAssistantMessage = (content: string) => {
    setMessages((prev) => [...prev, { id: prev.length, role: "assistant", content }])
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || isTyping || publishing) return

    const userMsg: Message = { id: messages.length, role: "user", content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsTyping(true)

    try {
      if (phase === "ask_input") {
        // Parse input for topic and number of questions (1-5)
        let count = 1
        const countMatch = text.match(/\b([1-5])\b/)
        if (countMatch) {
          count = parseInt(countMatch[1], 10)
        }
        
        // Remove the number and "preguntas" to get the clean topic
        let parsedTopic = text
          .replace(/\b[1-5]\b/, "")
          .replace(/preguntas?/i, "")
          .trim()
          
        if (!parsedTopic) {
           parsedTopic = text
        }

        setTopic(parsedTopic)
        setTotalQuestions(count)
        setPhase("generating")
        setIsTyping(false)

        addAssistantMessage(
          `¡Generando ${count} pregunta${count > 1 ? "s" : ""} sobre "${parsedTopic}"... esto puede tomar un momento. 🤖`
        )

        // Generate questions one by one
        const questions: GeneratedQuestion[] = []
        try {
          for (let i = 0; i < count; i++) {
            const q = await generateQuestion({
              topic: parsedTopic,
              existingQuestions: questions,
              questionIndex: i,
              totalQuestions: count,
            })
            questions.push(q)
            setGeneratedQuestions([...questions])
            addAssistantMessage(formatQuestion(q, i))
          }

          setPhase("done")
          addAssistantMessage(
            `✅ ¡Listo! Generé ${count} pregunta${count > 1 ? "s" : ""} sobre "${parsedTopic}".\n\nRevisa las preguntas arriba y cuando estés listo presiona **Publicar Lección** para enviarlas a tus estudiantes.`
          )
        } catch (err) {
          setPhase("ask_input")
          setGeneratedQuestions([])
          addAssistantMessage(
            `Ocurrió un error al generar las preguntas: ${err instanceof Error ? err.message : "Error desconocido"}.\n\nPuedes intentarlo de nuevo.`
          )
        }
      }
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handlePublish = async () => {
    if (generatedQuestions.length === 0 || publishing) return
    setPublishing(true)

    try {
      // 1. Create the leccion in backend
      const leccion = await createLeccion({
        tema: topic,
        titulo: topic,
        creadaConIa: true,
        idDocenteCursoMateria: gradeId,
      })

      // 2. Create each pregunta in backend and collect the created items (with their database IDs)
      const creadas = []
      let idx = 1
      for (const q of generatedQuestions) {
        const dbPregunta = await createPregunta(
          leccion.id,
          {
            enunciado: q.enunciado,
            opciones: q.opciones,
            literalCorrecto: q.literalCorrecto,
          },
          idx++
        )
        creadas.push(dbPregunta)
      }

      // 3. Fetch enrolled students to notify them
      let estudiantes: Estudiante[] = []
      try {
        estudiantes = await getEstudiantes(gradeId)
      } catch (err) {
        console.error("No se pudieron obtener estudiantes para Telegram:", err)
      }

      // 4. Send the lesson to students registered on Telegram
      const estudiantesTelegram = estudiantes.filter((e) => e.telegramChatId)
      if (estudiantesTelegram.length > 0) {
        const preguntasParaBot = creadas.map((q, idx) => ({
          idPregunta: q.id,
          orden: idx + 1,
          enunciado: q.enunciado,
          opciones: (q.opciones ?? []) as Opcion[],
          literalCorrecto: q.literalCorrecto,
        }))

        // Notify each student via the integration bot
        const sendPromises = estudiantesTelegram.map((e) =>
          startEvaluationForStudent({
            idLeccion: leccion.id,
            idEstudiante: e.id,
            topic: topic,
            studentChatId: e.telegramChatId!,
            preguntas: preguntasParaBot,
          }).catch((err) => {
            console.warn(`No se pudo enviar lección por Telegram a ${e.nombre}:`, err)
          })
        )
        // Wait for all messages to be dispatched
        await Promise.all(sendPromises)
      }

      // 5. Navigate to the lesson detail screen
      router.push(`/curso/${gradeId}/${encodeURIComponent(subject)}/lecciones/${leccion.id}`)
    } catch (err) {
      addAssistantMessage(
        `❌ Error al publicar la lección: ${err instanceof Error ? err.message : "Error desconocido"}. Intenta de nuevo.`
      )
      setPublishing(false)
    }
  }

  const isInputDisabled = isTyping || phase === "generating" || phase === "done" || publishing

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
        <main className="flex-1 bg-[#faf6df] px-8 py-6 flex flex-col min-h-0">
          {/* Breadcrumb */}
          <p className="text-[#7297C9] text-sm mb-2">{breadcrumb}</p>

          {/* Heading + Publish button */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold italic text-[#9E5A78]">
              Nueva Lección
            </h1>
            <button
              onClick={handlePublish}
              disabled={!mounted || phase !== "done" || publishing}
              className="bg-[#5B9B95] text-white font-semibold rounded-xl px-5 py-2 hover:bg-[#4a8880] transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {publishing && (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              {publishing ? "Publicando..." : "Publicar Lección"}
            </button>
          </div>

          {/* ── Layout Contenedor: Chat + Panel de Preguntas (si existen) ── */}
          <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
            {/* Chat Card (Izquierda) */}
            {phase !== "done" && (
              <div className="flex-1 flex flex-col bg-[#fdfdf1] rounded-2xl shadow-sm border border-[#F1D87C]/30 overflow-hidden">
                {/* Messages area */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                  {messages.map((msg) =>
                    msg.role === "assistant" ? (
                      /* Assistant bubble */
                      <div key={msg.id} className="flex items-start gap-3">
                        <BirdAvatar />
                        <div
                          className="max-w-[75%] rounded-2xl rounded-tl-none px-4 py-3 text-sm text-white leading-relaxed whitespace-pre-line shadow-sm"
                          style={{ backgroundColor: "#5B9B95" }}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ) : (
                      /* User bubble */
                      <div key={msg.id} className="flex justify-end">
                        <div
                          className="max-w-[70%] rounded-2xl rounded-tr-none px-4 py-3 text-sm leading-relaxed shadow-sm"
                          style={{ backgroundColor: "#9E5A78", color: "#fff" }}
                        >
                          {msg.content}
                        </div>
                      </div>
                    )
                  )}

                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex items-start gap-3">
                      <BirdAvatar />
                      <div
                        className="rounded-2xl rounded-tl-none px-4 py-3 shadow-sm"
                        style={{ backgroundColor: "#5B9B95" }}
                      >
                        <span className="flex gap-1 items-center h-4">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="w-2 h-2 rounded-full bg-white/70 animate-bounce"
                              style={{ animationDelay: `${i * 0.15}s` }}
                            />
                          ))}
                        </span>
                      </div>
                    </div>
                  )}

                  <div ref={bottomRef} />
                </div>

                {/* Input row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 border-t border-[#F1D87C]/30"
                  style={{ backgroundColor: "#faf6df" }}
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      phase === "generating"
                        ? "Generando preguntas..."
                        : "Escribe aquí..."
                    }
                    disabled={isInputDisabled}
                    className="flex-1 bg-transparent text-sm text-[#9E5A78] placeholder:text-[#C66B86]/50 focus:outline-none disabled:opacity-50"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isInputDisabled}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-40"
                    style={{ backgroundColor: "#5B9B95" }}
                    aria-label="Enviar mensaje"
                  >
                    <ArrowUp size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Panel de Preguntas Generadas (Derecha o Completo si terminó la generación) */}
            {generatedQuestions.length > 0 && (
              <div className={`flex flex-col bg-[#fdfdf1] rounded-2xl shadow-sm border border-[#F1D87C]/30 p-6 transition-all duration-300 ${
                phase === "done" ? "flex-1 w-full animate-in fade-in zoom-in-95 duration-500" : "w-full lg:w-[45%]"
              }`}>
                <div className="mb-4">
                  {phase === "done" && (
                    <div className="mb-6 p-4 rounded-xl bg-[#5B9B95]/10 border border-[#5B9B95]/20 text-[#4a8880] flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                      <span className="text-xl">✨</span>
                      <div>
                        <h3 className="font-bold text-sm">¡Generación de preguntas completada con éxito!</h3>
                        <p className="text-xs opacity-90 mt-0.5 leading-relaxed">
                          Revisa y edita las preguntas generadas a continuación. Haz clic en el icono del lápiz en cada una para realizar cualquier cambio que consideres necesario. Cuando termines, presiona <strong>Publicar Lección</strong> arriba a la derecha.
                        </p>
                      </div>
                    </div>
                  )}
                  <h2 className="text-2xl font-bold italic text-[#9E5A78] flex items-center gap-2">
                    📝 Preguntas Generadas
                  </h2>
                  <p className="text-xs text-[#C66B86] mt-1">
                    Haz clic en el lápiz para editar el enunciado, las opciones o seleccionar la respuesta correcta.
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                  {generatedQuestions.map((q, idx) => {
                    const isEditing = editingIndex === idx

                    return (
                      <div
                        key={idx}
                        className="bg-[#faf6df]/40 border border-[#F1D87C]/20 rounded-xl p-4 relative group transition-all duration-200 hover:shadow-md hover:border-[#F1D87C]/50"
                      >
                        {/* Header card */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#C66B86]">
                            Pregunta {idx + 1}
                          </span>
                          {!isEditing && (
                            <button
                              onClick={() => startEditing(idx)}
                              disabled={publishing}
                              className="p-1.5 rounded-lg text-[#5B9B95] hover:bg-[#5B9B95]/10 hover:text-[#4a8880] transition-colors"
                              title="Editar pregunta"
                            >
                              <Pencil size={15} />
                            </button>
                          )}
                        </div>

                        {/* View or Edit mode */}
                        {!isEditing ? (
                          /* View Mode */
                          <div className="space-y-3">
                            <p className="text-sm font-semibold text-[#9E5A78] leading-relaxed">
                              {q.enunciado}
                            </p>
                            <div className="space-y-2">
                              {q.opciones.map((opt) => {
                                const isCorrect = opt.literal === q.literalCorrecto
                                return (
                                  <div
                                    key={opt.literal}
                                    className={`flex items-start gap-2.5 px-3 py-2 rounded-lg text-xs leading-relaxed transition-all ${
                                      isCorrect
                                        ? "bg-[#5B9B95]/10 border border-[#5B9B95]/30 text-[#4a8880] font-medium"
                                        : "bg-white/60 border border-transparent text-[#9E5A78]/80"
                                    }`}
                                  >
                                    <span
                                      className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${
                                        isCorrect
                                          ? "bg-[#5B9B95] text-white"
                                          : "bg-[#faf6df] text-[#C66B86] border border-[#F1D87C]/40"
                                      }`}
                                    >
                                      {opt.literal}
                                    </span>
                                    <span className="flex-1 mt-0.5">{opt.texto}</span>
                                    {isCorrect && (
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B9B95] mt-0.5 select-none">
                                        Correcta
                                      </span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ) : (
                          /* Edit Mode */
                          <div className="space-y-3">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#C66B86] mb-1">
                                Enunciado de la Pregunta
                              </label>
                              <textarea
                                value={editEnunciado}
                                onChange={(e) => setEditEnunciado(e.target.value)}
                                className="w-full bg-white border border-[#F1D87C] rounded-lg p-2 text-xs text-[#9E5A78] focus:outline-none focus:ring-1 focus:ring-[#5B9B95] resize-none"
                                rows={3}
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#C66B86]">
                                Opciones (Selecciona la letra para marcar como correcta)
                              </label>
                              {editOpciones.map((opt, oIdx) => {
                                const isCorrect = opt.literal === editLiteralCorrecto
                                return (
                                  <div key={opt.literal} className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setEditLiteralCorrecto(opt.literal)}
                                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 transition-all ${
                                        isCorrect
                                          ? "bg-[#5B9B95] text-white shadow-sm"
                                          : "bg-white text-[#C66B86] border border-[#F1D87C]"
                                      }`}
                                      title="Marcar como correcta"
                                    >
                                      {opt.literal}
                                    </button>
                                    <input
                                      type="text"
                                      value={opt.texto}
                                      onChange={(e) => {
                                        const updatedOpts = [...editOpciones]
                                        updatedOpts[oIdx] = { ...opt, texto: e.target.value }
                                        setEditOpciones(updatedOpts)
                                      }}
                                      className="flex-1 bg-white border border-[#F1D87C] rounded-lg px-2.5 py-1.5 text-xs text-[#9E5A78] focus:outline-none focus:ring-1 focus:ring-[#5B9B95]"
                                    />
                                  </div>
                                )
                              })}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F1D87C]/20">
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1.5 rounded-lg border border-[#C66B86]/40 text-[#C66B86] hover:bg-[#C66B86]/5 transition-colors text-xs font-medium flex items-center gap-1"
                              >
                                <X size={12} />
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleSaveEdit(idx)}
                                className="px-3 py-1.5 rounded-lg bg-[#5B9B95] text-white hover:bg-[#4a8880] transition-colors text-xs font-medium flex items-center gap-1 shadow-sm"
                              >
                                <Check size={12} />
                                Guardar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthLayout>
  )
}

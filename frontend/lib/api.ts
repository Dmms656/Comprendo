import { getToken } from "@/lib/auth"
import type {
  LoginResponse,
  Asignacion,
  Leccion,
  LeccionesResponse,
  Pregunta,
  Resultado,
  Estudiante,
  EstudiantesResponse,
  CreateLeccionRequest,
  CreatePreguntaRequest,
  GenerateQuestionsRequest,
  GenerateQuestionsResponse,
  BotInfoResponse,
  StartEvaluationRequest,
  StartClassRequest,
  RegisterRequest,
  AnioLectivo,
  Nivel,
  Paralelo,
  Curso,
  Materia,
  Opcion,
} from "@/lib/types"

// ─── Base URL ─────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"

// ─── Error class ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message)
    this.name = "ApiError"
  }
}

// ─── Generic fetch wrapper ────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    let message = `Error ${res.status}: ${res.statusText}`
    try {
      const body = await res.json()
      if (body?.message) message = body.message
      else if (body?.error) message = body.error
      else if (typeof body === "string") message = body
    } catch {
      // ignore parse errors, keep default message
    }
    throw new ApiError(message, res.status)
  }

  // Handle empty responses (e.g. 204 No Content)
  const text = await res.text()
  if (!text) return undefined as unknown as T
  return JSON.parse(text) as T
}

const BOT_URL = process.env.NEXT_PUBLIC_BOT_API_URL ?? "http://localhost:5000"

async function requestBot<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${BOT_URL}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    let message = `Error ${res.status}: ${res.statusText}`
    try {
      const body = await res.json()
      if (body?.message) message = body.message
      else if (body?.error) message = body.error
      else if (typeof body === "string") message = body
    } catch {
      // ignore parse errors, keep default message
    }
    throw new ApiError(message, res.status)
  }

  const text = await res.text()
  if (!text) return undefined as unknown as T
  return JSON.parse(text) as T
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ correo: email, password }),
  })
}

// ─── Register (student / teacher depending on backend) ───────────────────────

export async function register(data: RegisterRequest): Promise<unknown> {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      nombres: data.nombre,
      apellidos: data.apellido,
      correo: data.email,
      password: data.password,
      unidadEducativa: data.unidadEducativa,
    }),
  })
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboard(): Promise<Record<string, unknown>> {
  return request("/api/dashboard")
}

// ─── Asignaciones ─────────────────────────────────────────────────────────────

export async function getAsignaciones(): Promise<Asignacion[]> {
  return request<Asignacion[]>("/api/asignaciones")
}

// ─── Lecciones ────────────────────────────────────────────────────────────────

export async function getLecciones(idDocenteCursoMateria?: string | number): Promise<Leccion[]> {
  let url = "/api/lecciones?pageSize=1000"
  if (idDocenteCursoMateria) {
    url += `&idDocenteCursoMateria=${idDocenteCursoMateria}`
  }
  const res = await request<LeccionesResponse | any[]>(url)
  // Handle both `{ items: [...] }` and `[...]` response shapes
  const items = Array.isArray(res) ? res : (res as LeccionesResponse).items ?? []
  return items.map((item: any) => ({
    ...item,
    id: item.id ?? item.idLeccion,
    idDocenteCursoMateria: item.idDocenteCursoMateria ?? item.IdDocenteCursoMateria,
  }))
}

export async function createLeccion(data: CreateLeccionRequest): Promise<Leccion> {
  const res = await request<any>("/api/lecciones", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return {
    ...res,
    id: res.id ?? res.idLeccion,
    idDocenteCursoMateria: res.idDocenteCursoMateria ?? res.IdDocenteCursoMateria ?? data.idDocenteCursoMateria,
  }
}

// ─── Preguntas ────────────────────────────────────────────────────────────────

export async function getPreguntas(leccionId: string | number): Promise<Pregunta[]> {
  const res = await request<any[] | { items: any[] }>(`/api/lecciones/${leccionId}/preguntas`)
  const items = Array.isArray(res) ? res : (res as { items: any[] }).items ?? []
  return items.map((item: any) => {
    // Find the correct literal from opciones if respuestaCorrecta is not a single letter
    const rawOpciones: any[] = item.opciones ?? item.Opciones ?? []
    const opciones = rawOpciones.map((o: any) => ({
      literal: o.literal ?? o.Literal ?? "?",
      texto: o.texto ?? o.Texto ?? "",
    }))

    // Determine literalCorrecto: use respuestaCorrecta, or find the option marked esCorrecta
    let literalCorrecto = item.literalCorrecto ?? item.respuestaCorrecta ?? item.RespuestaCorrecta ?? ""
    if (!literalCorrecto) {
      const correctOpt = rawOpciones.find((o: any) => o.esCorrecta === true || o.EsCorrecta === true)
      if (correctOpt) {
        literalCorrecto = correctOpt.literal ?? correctOpt.Literal ?? ""
      }
    }

    return {
      id: item.id ?? item.idPregunta ?? item.IdPregunta,
      enunciado: item.enunciado ?? item.Enunciado ?? "",
      opciones,
      literalCorrecto,
    }
  })
}

export async function createPregunta(
  leccionId: string | number,
  data: CreatePreguntaRequest,
  orden?: number
): Promise<Pregunta> {
  const payload = {
    enunciado: data.enunciado,
    Enunciado: data.enunciado,
    tipoPregunta: "OpcionMultiple",
    TipoPregunta: "OpcionMultiple",
    respuestaCorrecta: data.literalCorrecto,
    RespuestaCorrecta: data.literalCorrecto,
    explicacion: "",
    Explicacion: "",
    puntaje: 1.0,
    Puntaje: 1.0,
    orden: orden ?? 1,
    Orden: orden ?? 1,
    opciones: data.opciones.map((o) => ({
      literal: o.literal,
      Literal: o.literal,
      texto: o.texto,
      Texto: o.texto,
      esCorrecta: o.literal === data.literalCorrecto,
      EsCorrecta: o.literal === data.literalCorrecto,
    })),
    Opciones: data.opciones.map((o) => ({
      literal: o.literal,
      Literal: o.literal,
      texto: o.texto,
      Texto: o.texto,
      esCorrecta: o.literal === data.literalCorrecto,
      EsCorrecta: o.literal === data.literalCorrecto,
    })),
  }

  const res = await request<any>(`/api/lecciones/${leccionId}/preguntas`, {
    method: "POST",
    body: JSON.stringify(payload),
  })

  const rawOpciones: any[] = res.opciones ?? res.Opciones ?? data.opciones ?? []
  const opciones = rawOpciones.map((o: any) => ({
    literal: o.literal ?? o.Literal ?? "?",
    texto: o.texto ?? o.Texto ?? "",
  }))

  let literalCorrecto = res.literalCorrecto ?? res.respuestaCorrecta ?? res.RespuestaCorrecta ?? data.literalCorrecto ?? ""
  if (!literalCorrecto) {
    const correctOpt = rawOpciones.find((o: any) => o.esCorrecta === true || o.EsCorrecta === true)
    if (correctOpt) {
      literalCorrecto = correctOpt.literal ?? correctOpt.Literal ?? ""
    }
  }

  return {
    ...res,
    id: res.id ?? res.idPregunta,
    opciones,
    literalCorrecto,
  }
}

// ─── Resultados ───────────────────────────────────────────────────────────────

export async function getResultados(leccionId: string | number): Promise<Resultado[]> {
  const res = await request<any[] | { items: any[] }>(`/api/lecciones/${leccionId}/resultados`)
  const items = Array.isArray(res) ? res : (res as any).items ?? []

  return items.map((item: any) => {
    const nombre = `${item.nombres ?? item.nombre ?? ""} ${item.apellidos ?? item.apellido ?? ""}`.trim()
    
    // Synthesize respuestas array if not explicitly returned by API
    const correctCount = item.respuestasCorrectas ?? 0
    const incorrectCount = item.respuestasIncorrectas ?? 0
    const generatedRespuestas = [
      ...Array.from({ length: correctCount }).map(() => ({ literalDado: "—", esCorrecta: true })),
      ...Array.from({ length: incorrectCount }).map(() => ({ literalDado: "—", esCorrecta: false })),
    ]

    const respuestas = Array.isArray(item.respuestas)
      ? item.respuestas.map((r: any) => ({
          preguntaId: r.idPregunta ?? r.preguntaId,
          literalDado: r.respuestaTexto ?? r.literalDado ?? "—",
          esCorrecta: r.esCorrecta ?? false,
        }))
      : generatedRespuestas

    return {
      estudianteId: item.idEstudiante ?? item.estudianteId,
      estudianteNombre: nombre || "Estudiante",
      respuestas,
      respuestasMapa: item.respuestasMapa ?? {},
    }
  })
}

// ─── Estudiantes ──────────────────────────────────────────────────────────────

export async function getEstudiantes(idDocenteCursoMateria: string | number): Promise<Estudiante[]> {
  const res = await request<EstudiantesResponse | Estudiante[]>(
    `/api/estudiantes?idDocenteCursoMateria=${idDocenteCursoMateria}`
  )
  const items = Array.isArray(res) ? res : (res as EstudiantesResponse).items ?? []
  return items.map((item: any) => ({
    id: item.id ?? item.idEstudiante,
    nombre: item.nombre ?? item.nombres ?? "",
    apellido: item.apellido ?? item.apellidos ?? "",
    telefono: item.telefono ?? item.telefonoTelegram ?? item.telefonoCelular ?? "—",
    telegramChatId: item.telegramChatId,
  }))
}

export async function createEstudiante(data: unknown): Promise<Estudiante> {
  return request<Estudiante>("/api/estudiantes", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function enrollEstudianteInCurso(
  estudianteId: string | number,
  data: unknown
): Promise<unknown> {
  return request(`/api/estudiantes/${estudianteId}/cursos`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function enrollEstudianteInMateria(
  estudianteId: string | number,
  data: unknown
): Promise<unknown> {
  return request(`/api/estudiantes/${estudianteId}/materias`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// ─── IA Question Generation ───────────────────────────────────────────────────

interface BotGenerateResponse {
  ok: boolean
  pregunta: {
    contenido: string
    opciones: Record<string, string>
    claveRespuesta: string
  }
}

export async function generateQuestion(
  data: GenerateQuestionsRequest
): Promise<GenerateQuestionsResponse> {
  const res = await requestBot<BotGenerateResponse>("/api/questions/generate", {
    method: "POST",
    body: JSON.stringify(data),
  })

  const mappedOpciones: Opcion[] = Object.entries(res.pregunta.opciones).map(
    ([literal, texto]) => ({
      literal,
      texto,
    })
  )

  return {
    enunciado: res.pregunta.contenido,
    opciones: mappedOpciones,
    literalCorrecto: res.pregunta.claveRespuesta,
  }
}

// ─── Código de acceso ─────────────────────────────────────────────────────────

export async function generarCodigo(idDocenteCursoMateria: string | number): Promise<string> {
  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}/api/asignaciones/${idDocenteCursoMateria}/generar-codigo`, {
    method: "POST",
    headers,
  })

  if (!res.ok) {
    let message = `Error ${res.status}: ${res.statusText}`
    try {
      const body = await res.json()
      if (body?.message) message = body.message
      else if (body?.error) message = body.error
      else if (typeof body === "string") message = body
    } catch {
      // ignore parse errors
    }
    throw new ApiError(message, res.status)
  }

  // Backend returns a plain string (no JSON quotes), read it as raw text
  const text = await res.text()
  // Strip surrounding quotes in case the backend wraps it in JSON string
  return text.replace(/^"|"$/g, "").trim()
}

// ─── Bot / Telegram ───────────────────────────────────────────────────────────

export async function getBotInfo(): Promise<BotInfoResponse> {
  return requestBot<BotInfoResponse>("/api/bot-info")
}

export async function startEvaluation(data: StartEvaluationRequest): Promise<unknown> {
  return requestBot("/start-evaluation", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function startEvaluationForStudent(data: {
  idLeccion: number | string
  idEstudiante: number | string
  topic: string
  studentChatId: string
  preguntas: Array<{
    idPregunta: number | string
    orden?: number
    enunciado: string
    opciones: Opcion[]
    literalCorrecto: string
    puntaje?: number
  }>
}): Promise<unknown> {
  return requestBot("/start-evaluation", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function startClass(data: StartClassRequest): Promise<unknown> {
  return requestBot("/start-class", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// ─── Academic and Assignment helpers ──────────────────────────────────────────

export interface PaginatedList<T> {
  items: T[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export async function getAniosLectivos(): Promise<AnioLectivo[]> {
  const res = await request<PaginatedList<AnioLectivo> | AnioLectivo[]>("/api/academico/anios-lectivos")
  if (Array.isArray(res)) return res
  return (res as PaginatedList<AnioLectivo>).items ?? []
}

export async function getNiveles(): Promise<Nivel[]> {
  const res = await request<PaginatedList<Nivel> | Nivel[]>("/api/academico/niveles?pageSize=100")
  if (Array.isArray(res)) return res
  return (res as PaginatedList<Nivel>).items ?? []
}

export async function createNivel(nombre: string, descripcion?: string): Promise<Nivel> {
  return request<Nivel>("/api/academico/niveles", {
    method: "POST",
    body: JSON.stringify({ nombre, descripcion }),
  })
}

export async function getParalelos(): Promise<Paralelo[]> {
  const res = await request<PaginatedList<Paralelo> | Paralelo[]>("/api/academico/paralelos?pageSize=100")
  if (Array.isArray(res)) return res
  return (res as PaginatedList<Paralelo>).items ?? []
}

export async function createParalelo(nombre: string, descripcion?: string): Promise<Paralelo> {
  return request<Paralelo>("/api/academico/paralelos", {
    method: "POST",
    body: JSON.stringify({ nombre, descripcion }),
  })
}

export async function getCursos(): Promise<Curso[]> {
  const res = await request<PaginatedList<Curso> | Curso[]>("/api/academico/cursos?pageSize=200")
  if (Array.isArray(res)) return res
  return (res as PaginatedList<Curso>).items ?? []
}

export async function createCurso(idAnioLectivo: number, idNivel: number, idParalelo: number): Promise<Curso> {
  return request<Curso>("/api/academico/cursos", {
    method: "POST",
    body: JSON.stringify({ idAnioLectivo, idNivel, idParalelo, estado: "Activo" }),
  })
}

export async function getMaterias(): Promise<Materia[]> {
  const res = await request<PaginatedList<Materia> | Materia[]>("/api/academico/materias?pageSize=200")
  if (Array.isArray(res)) return res
  return (res as PaginatedList<Materia>).items ?? []
}

export async function createMateria(nombre: string, descripcion?: string): Promise<Materia> {
  return request<Materia>("/api/academico/materias", {
    method: "POST",
    body: JSON.stringify({ nombre, descripcion, estado: "Activa" }),
  })
}

export async function createAsignacion(idCurso: number, idMateria: number): Promise<Asignacion> {
  return request<Asignacion>("/api/asignaciones", {
    method: "POST",
    body: JSON.stringify({ idCurso, idMateria }),
  })
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface LoginResponse {
  token: string
  usuario: Teacher
}

export interface Teacher {
  id: number | string
  nombre: string
  apellido?: string
  email: string
  unidadEducativa?: string
}

export interface Asignacion {
  idDocenteCursoMateria: number | string
  materia: string
  nivel: string
  paralelo: string
  anioLectivo: string
  codigoAcceso?: string
}

export interface Leccion {
  id: number | string
  tema: string
  parcial?: number
  fechaCreacion?: string
  hora?: string
  estado?: string
}

export interface LeccionesResponse {
  items: Leccion[]
}

export interface Opcion {
  literal: string
  texto: string
}

export interface Pregunta {
  id: number | string
  enunciado: string
  opciones: Opcion[] | string[]
  literalCorrecto: string
  textoOpciones?: string
}

export interface RespuestaEstudiante {
  preguntaId?: number | string
  literalDado: string
  esCorrecta: boolean
}

export interface Resultado {
  estudianteId?: number | string
  estudianteNombre: string
  respuestas: RespuestaEstudiante[]
  respuestasMapa?: Record<string, boolean>
}

export interface Estudiante {
  id: number | string
  nombre: string
  apellido?: string
  telefono?: string
  telefonoCelular?: string
  idEstudiante?: number | string
  nombres?: string
  apellidos?: string
  telefonoTelegram?: string
  telegramChatId?: string
}

export interface EstudiantesResponse {
  items: Estudiante[]
}

// ─── Request Types ────────────────────────────────────────────────────────────

export interface CreateLeccionRequest {
  tema: string
  idDocenteCursoMateria: number | string
  parcial?: number
  titulo?: string
  descripcion?: string
  creadaConIa?: boolean
}

export interface CreatePreguntaRequest {
  enunciado: string
  opciones: Opcion[]
  literalCorrecto: string
}

export interface GenerateQuestionsRequest {
  topic: string
  existingQuestions: GeneratedQuestion[]
  questionIndex: number
  totalQuestions: number
}

export interface GeneratedQuestion {
  enunciado: string
  opciones: Opcion[]
  literalCorrecto: string
}

export interface GenerateQuestionsResponse {
  enunciado: string
  opciones: Opcion[]
  literalCorrecto: string
}

export interface BotInfoResponse {
  username: string
}

export interface StartEvaluationRequest {
  leccionId: number | string
  idDocenteCursoMateria: number | string
}

export interface StartClassRequest {
  preguntaId: number | string
}

export interface RegisterRequest {
  nombre: string
  apellido: string
  email: string
  password: string
  unidadEducativa?: string
  telefono?: string
}

export interface AnioLectivo {
  idAnioLectivo: number
  nombre: string
  estado: string
}

export interface Nivel {
  idNivel: number
  nombre: string
  descripcion?: string
}

export interface Paralelo {
  idParalelo: number
  nombre: string
  descripcion?: string
}

export interface Curso {
  idCurso: number
  idAnioLectivo: number
  idNivel: number
  idParalelo: number
  estado: string
}

export interface Materia {
  idMateria: number
  nombre: string
  descripcion?: string
  estado: string
}

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";

function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const seedData = {
  docentes: [
    {
      id: "docente-demo",
      nombreCompleto: "Dana Bahamonde",
      email: "docente@comprendo.local",
      passwordHash: hashPassword("comprendo123"),
      fechaRegistro: "2026-05-10T00:00:00.000Z"
    }
  ],
  cursos: [
    {
      id: "curso-demo",
      docenteId: "docente-demo",
      nombreCurso: "3ro Bachillerato Ciencias A",
      periodoLectivo: "2025-2026"
    }
  ],
  temas: [
    {
      id: "tema-demo",
      cursoId: "curso-demo",
      titulo: "Fracciones equivalentes"
    }
  ],
  evaluaciones: [],
  preguntas: [],
  respuestas: []
};

function normalizeData(data) {
  return {
    docentes: Array.isArray(data?.docentes) ? data.docentes : [],
    cursos: Array.isArray(data?.cursos) ? data.cursos : [],
    temas: Array.isArray(data?.temas) ? data.temas : [],
    evaluaciones: Array.isArray(data?.evaluaciones) ? data.evaluaciones : [],
    preguntas: Array.isArray(data?.preguntas) ? data.preguntas : [],
    respuestas: Array.isArray(data?.respuestas) ? data.respuestas : []
  };
}

function sanitizeTeacher(docente) {
  return {
    id: docente.id,
    nombreCompleto: docente.nombreCompleto,
    email: docente.email
  };
}

function validateOptions(options = {}) {
  const keys = ["A", "B", "C", "D"];
  const cleanOptions = {};

  for (const key of keys) {
    const value = String(options[key] || "").trim();
    if (!value) {
      return { ok: false, error: `La opcion ${key} es obligatoria.` };
    }
    cleanOptions[key] = value;
  }

  return { ok: true, options: cleanOptions };
}

function buildStore({ initialData, persist }) {
  let data = normalizeData(clone(initialData || seedData));
  const sessions = new Map();

  async function save() {
    if (persist) {
      await persist(data);
    }
  }

  function getTeacherCourses(docenteId) {
    return data.cursos.filter((curso) => curso.docenteId === docenteId);
  }

  function getTeacherEvaluationIds(docenteId) {
    return new Set(
      data.evaluaciones
        .filter((evaluacion) => evaluacion.docenteId === docenteId)
        .map((evaluacion) => evaluacion.id)
    );
  }

  function findTopicForCourse(cursoId, titulo) {
    return data.temas.find(
      (tema) =>
        tema.cursoId === cursoId &&
        tema.titulo.toLowerCase() === String(titulo).trim().toLowerCase()
    );
  }

  function ensureTopic(cursoId, titulo) {
    const cleanTitle = String(titulo || "").trim();
    const existing = findTopicForCourse(cursoId, cleanTitle);

    if (existing) {
      return existing;
    }

    const tema = {
      id: randomUUID(),
      cursoId,
      titulo: cleanTitle
    };
    data.temas.push(tema);
    return tema;
  }

  function assertCourseForTeacher(cursoId, docenteId) {
    const curso = data.cursos.find(
      (item) => item.id === cursoId && item.docenteId === docenteId
    );

    if (!curso) {
      const error = new Error("El curso no existe o no pertenece al docente.");
      error.status = 404;
      throw error;
    }

    return curso;
  }

  function normalizeQuestionPayload(payload) {
    const contenido = String(payload?.contenido || "").trim();
    const claveRespuesta = String(payload?.claveRespuesta || "").trim().toUpperCase();

    if (!contenido) {
      const error = new Error("El enunciado de la pregunta es obligatorio.");
      error.status = 400;
      throw error;
    }

    const optionsResult = validateOptions(payload?.opciones);
    if (!optionsResult.ok) {
      const error = new Error(optionsResult.error);
      error.status = 400;
      throw error;
    }

    if (!["A", "B", "C", "D"].includes(claveRespuesta)) {
      const error = new Error("La respuesta correcta debe ser A, B, C o D.");
      error.status = 400;
      throw error;
    }

    return {
      contenido,
      opciones: optionsResult.options,
      claveRespuesta
    };
  }

  return {
    async authenticate(email, password) {
      const cleanEmail = String(email || "").trim().toLowerCase();
      const docente = data.docentes.find(
        (item) => item.email.toLowerCase() === cleanEmail
      );

      if (!docente || docente.passwordHash !== hashPassword(String(password || ""))) {
        return null;
      }

      const token = randomUUID();
      sessions.set(token, docente.id);

      return {
        token,
        docente: sanitizeTeacher(docente),
        cursos: getTeacherCourses(docente.id)
      };
    },

    async getTeacherByToken(token) {
      const docenteId = sessions.get(token);
      if (!docenteId) {
        return null;
      }

      const docente = data.docentes.find((item) => item.id === docenteId);
      return docente ? sanitizeTeacher(docente) : null;
    },

    async getDashboard(docenteId) {
      const cursos = getTeacherCourses(docenteId);
      const evaluaciones = data.evaluaciones.filter(
        (evaluacion) => evaluacion.docenteId === docenteId
      );
      const evaluationIds = getTeacherEvaluationIds(docenteId);
      const preguntas = data.preguntas.filter((pregunta) =>
        evaluationIds.has(pregunta.evaluacionId)
      );

      return {
        cursos,
        resumen: {
          totalCursos: cursos.length,
          totalEvaluaciones: evaluaciones.length,
          totalPreguntas: preguntas.length,
          totalRespuestas: data.respuestas.length
        },
        evaluacionesRecientes: evaluaciones.slice(-5).reverse()
      };
    },

    async listEvaluations(docenteId) {
      const cursos = getTeacherCourses(docenteId);
      const courseNames = new Map(cursos.map((curso) => [curso.id, curso.nombreCurso]));
      const topicNames = new Map(data.temas.map((tema) => [tema.id, tema.titulo]));
      const counts = new Map();

      for (const pregunta of data.preguntas) {
        counts.set(pregunta.evaluacionId, (counts.get(pregunta.evaluacionId) || 0) + 1);
      }

      return data.evaluaciones
        .filter((evaluacion) => evaluacion.docenteId === docenteId)
        .map((evaluacion) => ({
          ...evaluacion,
          cursoNombre: courseNames.get(evaluacion.cursoId) || "Curso sin nombre",
          temaTitulo: topicNames.get(evaluacion.temaId) || "Tema sin titulo",
          totalPreguntas: counts.get(evaluacion.id) || 0
        }));
    },

    async createEvaluation(docenteId, payload) {
      const titulo = String(payload?.titulo || "").trim();
      const cursoId = String(payload?.cursoId || "").trim();
      const temaTitulo = String(payload?.temaTitulo || "").trim();
      const preguntasPayload = Array.isArray(payload?.preguntas) ? payload.preguntas : [];

      if (!titulo) {
        const error = new Error("El titulo de la evaluacion es obligatorio.");
        error.status = 400;
        throw error;
      }

      if (!cursoId) {
        const error = new Error("Debe seleccionar un curso.");
        error.status = 400;
        throw error;
      }

      if (!temaTitulo) {
        const error = new Error("El tema es obligatorio.");
        error.status = 400;
        throw error;
      }

      if (!preguntasPayload.length) {
        const error = new Error("Debe agregar al menos una pregunta.");
        error.status = 400;
        throw error;
      }

      assertCourseForTeacher(cursoId, docenteId);

      const normalizedQuestions = preguntasPayload.map((item) =>
        normalizeQuestionPayload(item)
      );
      const tema = ensureTopic(cursoId, temaTitulo);
      const evaluacion = {
        id: randomUUID(),
        docenteId,
        cursoId,
        temaId: tema.id,
        titulo,
        descripcion: String(payload?.descripcion || "").trim(),
        fechaCreacion: new Date().toISOString()
      };

      data.evaluaciones.push(evaluacion);

      const preguntas = [];
      for (const item of normalizedQuestions) {
        const pregunta = {
          id: randomUUID(),
          evaluacionId: evaluacion.id,
          temaId: tema.id,
          contenido: item.contenido,
          tipo: "OPCION_MULTIPLE",
          opciones: item.opciones,
          claveRespuesta: item.claveRespuesta,
          fechaCreacion: new Date().toISOString()
        };
        data.preguntas.push(pregunta);
        preguntas.push(pregunta);
      }

      await save();

      return {
        ...evaluacion,
        temaTitulo: tema.titulo,
        preguntas
      };
    },

    async createQuestion(docenteId, payload) {
      const evaluacionId = String(payload?.evaluacionId || "").trim();
      const evaluationIds = getTeacherEvaluationIds(docenteId);

      if (!evaluationIds.has(evaluacionId)) {
        const error = new Error("La evaluacion no existe o no pertenece al docente.");
        error.status = 404;
        throw error;
      }

      const normalizedQuestion = normalizeQuestionPayload(payload);
      const evaluacion = data.evaluaciones.find((item) => item.id === evaluacionId);
      const pregunta = {
        id: randomUUID(),
        evaluacionId,
        temaId: payload?.temaId || evaluacion.temaId,
        contenido: normalizedQuestion.contenido,
        tipo: "OPCION_MULTIPLE",
        opciones: normalizedQuestion.opciones,
        claveRespuesta: normalizedQuestion.claveRespuesta,
        fechaCreacion: new Date().toISOString()
      };

      data.preguntas.push(pregunta);
      await save();

      return pregunta;
    },

    async listQuestions(docenteId) {
      const evaluationIds = getTeacherEvaluationIds(docenteId);
      return data.preguntas.filter((pregunta) =>
        evaluationIds.has(pregunta.evaluacionId)
      );
    },

    snapshot() {
      return clone(data);
    }
  };
}

export function createMemoryStore(initialData = seedData) {
  return buildStore({ initialData });
}

export async function createFileStore(
  filePath = process.env.DATA_FILE || path.join(process.cwd(), "data", "comprendo.json")
) {
  let initialData = seedData;

  try {
    const content = await readFile(filePath, "utf8");
    initialData = normalizeData(JSON.parse(content));
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("No se pudo leer la base local, usando datos demo:", error.message);
    }
  }

  return buildStore({
    initialData,
    persist: async (data) => {
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
    }
  });
}

export const demoCredentials = {
  email: "docente@comprendo.local",
  password: "comprendo123"
};

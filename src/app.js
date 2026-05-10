import express from "express";
import twilio from "twilio";
import { state } from "./state.js";
import { generateQuestion } from "./services/generateQuestion.js";
import { createFileStore } from "./dataStore.js";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

function getBearerToken(req) {
  const header = req.get("authorization") || "";
  const [scheme, token] = header.split(" ");

  return scheme?.toLowerCase() === "bearer" ? token : null;
}

function sendError(res, error) {
  const status = error.status || 500;
  res.status(status).json({
    ok: false,
    error: error.message || "Error interno del servidor."
  });
}

export function createApp(options = {}) {
  const app = express();
  const storePromise = Promise.resolve(options.store || createFileStore());

  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(express.static("public"));

  async function requireTeacher(req, res, next) {
    try {
      const token = getBearerToken(req);
      const store = await storePromise;
      const teacher = token ? await store.getTeacherByToken(token) : null;

      if (!teacher) {
        return res.status(401).json({
          ok: false,
          error: "Sesion no valida. Inicia sesion nuevamente."
        });
      }

      req.store = store;
      req.teacher = teacher;
      next();
    } catch (error) {
      sendError(res, error);
    }
  }

  app.get("/health", (req, res) => {
    res.json({
      ok: true,
      service: "bot-whatsapp-comprendo"
    });
  });

  app.get("/report", (req, res) => {
    res.json({
      question: state.question,
      correctAnswer: state.correctAnswer,
      totalResponses: state.responses.length,
      responses: state.responses
    });
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const email = String(req.body.email || "").trim();
      const password = String(req.body.password || "");

      if (!email || !password) {
        return res.status(400).json({
          ok: false,
          error: "Email y contrasena son obligatorios."
        });
      }

      const store = await storePromise;
      const session = await store.authenticate(email, password);

      if (!session) {
        return res.status(401).json({
          ok: false,
          error: "Credenciales incorrectas."
        });
      }

      res.json({
        ok: true,
        ...session
      });
    } catch (error) {
      sendError(res, error);
    }
  });

  app.get("/api/panel", requireTeacher, async (req, res) => {
    try {
      const dashboard = await req.store.getDashboard(req.teacher.id);
      res.json({
        ok: true,
        docente: req.teacher,
        ...dashboard
      });
    } catch (error) {
      sendError(res, error);
    }
  });

  app.get("/api/evaluations", requireTeacher, async (req, res) => {
    try {
      const evaluaciones = await req.store.listEvaluations(req.teacher.id);
      res.json({
        ok: true,
        evaluaciones
      });
    } catch (error) {
      sendError(res, error);
    }
  });

  app.post("/api/evaluations", requireTeacher, async (req, res) => {
    try {
      const evaluacion = await req.store.createEvaluation(req.teacher.id, req.body);
      res.status(201).json({
        ok: true,
        evaluacion
      });
    } catch (error) {
      sendError(res, error);
    }
  });

  app.get("/api/questions", requireTeacher, async (req, res) => {
    try {
      const preguntas = await req.store.listQuestions(req.teacher.id);
      res.json({
        ok: true,
        preguntas
      });
    } catch (error) {
      sendError(res, error);
    }
  });

  app.post("/api/questions", requireTeacher, async (req, res) => {
    try {
      const pregunta = await req.store.createQuestion(req.teacher.id, req.body);
      res.status(201).json({
        ok: true,
        pregunta
      });
    } catch (error) {
      sendError(res, error);
    }
  });

  app.post("/api/questions/generate", requireTeacher, async (req, res) => {
    try {
      const topic = String(req.body.topic || "").trim();

      if (!topic) {
        return res.status(400).json({
          ok: false,
          error: "El tema es obligatorio para generar una pregunta."
        });
      }

      const q = await generateQuestion(topic);
      res.json({
        ok: true,
        pregunta: {
          contenido: q.question,
          opciones: q.options,
          claveRespuesta: q.correct
        }
      });
    } catch (error) {
      sendError(res, error);
    }
  });

  app.post("/start-class", async (req, res) => {
    try {
      const topic = String(req.body.topic || "").trim();
      const studentNumber = req.body.studentNumber || process.env.STUDENT_NUMBER;

      if (!topic) {
        return res.status(400).json({
          ok: false,
          error: "El campo 'topic' es obligatorio. No se envio ninguna pregunta."
        });
      }

      if (!studentNumber) {
        return res.status(400).json({
          ok: false,
          error: "No se encontro el numero del estudiante."
        });
      }

      const q = await generateQuestion(topic);

      state.question = q;
      state.correctAnswer = q.correct;
      state.responses = [];

      const body = `Cierre de clase: ${topic}

${q.question}

A) ${q.options.A}
B) ${q.options.B}
C) ${q.options.C}
D) ${q.options.D}

Responde solo con A, B, C o D.`;

      const msg = await twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: studentNumber,
        body
      });

      res.json({
        ok: true,
        topic,
        question: q.question,
        twilioMessageSid: msg.sid
      });
    } catch (error) {
      console.error("ERROR /start-class:", error);
      res.status(500).json({
        ok: false,
        error: error.message
      });
    }
  });

  app.post("/whatsapp", async (req, res) => {
    const twiml = new twilio.twiml.MessagingResponse();

    try {
      const from = req.body.From;
      const answer = (req.body.Body || "").trim().toUpperCase();

      if (!state.question || !state.correctAnswer) {
        twiml.message("No hay una pregunta activa en este momento.");
        return res.type("text/xml").send(twiml.toString());
      }

      if (!["A", "B", "C", "D"].includes(answer)) {
        twiml.message("Respuesta no valida. Responde solo con A, B, C o D.");
        return res.type("text/xml").send(twiml.toString());
      }

      const correct = state.correctAnswer;
      const isCorrect = answer === correct;

      state.responses.push({
        from,
        answer,
        correct,
        isCorrect,
        at: new Date().toISOString()
      });

      twiml.message(
        isCorrect
          ? "Correcto ✅"
          : `Incorrecto ❌. La respuesta correcta era ${correct}`
      );

      if (process.env.TEACHER_NUMBER) {
        await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_NUMBER,
          to: process.env.TEACHER_NUMBER,
          body: `Nuevo reporte

Estudiante: ${from}
Pregunta: ${state.question.question}
A) ${state.question.options.A}
B) ${state.question.options.B}
C) ${state.question.options.C}
D) ${state.question.options.D}

Respuesta estudiante: ${answer}
Respuesta correcta: ${correct} - ${state.question.options[correct]}
Resultado: ${isCorrect ? "Correcto ✅" : "Incorrecto ❌"}`
        });
      }

      return res.type("text/xml").send(twiml.toString());
    } catch (error) {
      console.error("ERROR /whatsapp:", error);
      twiml.message("Hubo un error procesando tu respuesta.");
      return res.type("text/xml").send(twiml.toString());
    }
  });

  return app;
}

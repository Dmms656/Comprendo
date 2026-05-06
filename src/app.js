import express from "express";
import twilio from "twilio";
import { state } from "./state.js";
import { generateQuestion } from "./services/generateQuestion.js";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export function createApp() {
  const app = express();
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

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

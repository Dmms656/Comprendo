import express from "express";
import { state } from "./state.js";
import { generateQuestion } from "./services/generateQuestion.js";
import { sendTelegramMessage } from "./lib/telegram.js";

export function createApp() {
  const app = express();
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  app.get("/health", (req, res) => {
    res.json({
      ok: true,
      service: "bot-telegram-comprendo"
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
      const studentChatId =
        req.body.studentChatId ?? process.env.TELEGRAM_STUDENT_CHAT_ID;

      if (!topic) {
        return res.status(400).json({
          ok: false,
          error: "El campo 'topic' es obligatorio. No se envió ninguna pregunta."
        });
      }

      if (!studentChatId) {
        return res.status(400).json({
          ok: false,
          error:
            "No se encontró el chat del estudiante (studentChatId o TELEGRAM_STUDENT_CHAT_ID)."
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

      const telegramResult = await sendTelegramMessage(studentChatId, body);

      res.json({
        ok: true,
        topic,
        question: q.question,
        telegramMessageId: telegramResult?.result?.message_id
      });
    } catch (error) {
      console.error("ERROR /start-class:", error);
      res.status(500).json({
        ok: false,
        error: error.message
      });
    }
  });

  app.post("/telegram", async (req, res) => {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (secret) {
      const got = req.headers["x-telegram-bot-api-secret-token"];
      if (got !== secret) {
        return res.sendStatus(403);
      }
    }

    try {
      const update = req.body;
      const msg = update?.message || update?.edited_message;
      const chatId = msg?.chat?.id;
      const rawText = (msg?.text || "").trim();
      const answer = rawText.toUpperCase();

      if (!chatId) {
        return res.sendStatus(200);
      }

      if (!state.question || !state.correctAnswer) {
        await sendTelegramMessage(
          chatId,
          "No hay una pregunta activa en este momento."
        );
        return res.sendStatus(200);
      }

      if (!["A", "B", "C", "D"].includes(answer)) {
        await sendTelegramMessage(
          chatId,
          "Respuesta no válida. Responde solo con A, B, C o D."
        );
        return res.sendStatus(200);
      }

      const correct = state.correctAnswer;
      const isCorrect = answer === correct;

      state.responses.push({
        from: String(chatId),
        answer,
        correct,
        isCorrect,
        at: new Date().toISOString()
      });

      await sendTelegramMessage(
        chatId,
        isCorrect
          ? "Correcto ✅"
          : `Incorrecto ❌. La respuesta correcta era ${correct}`
      );

      const teacherChatId = process.env.TELEGRAM_TEACHER_CHAT_ID;
      if (teacherChatId) {
        const reportText = `Nuevo reporte

Estudiante (chat): ${chatId}
Pregunta: ${state.question.question}
A) ${state.question.options.A}
B) ${state.question.options.B}
C) ${state.question.options.C}
D) ${state.question.options.D}

Respuesta estudiante: ${answer}
Respuesta correcta: ${correct} - ${state.question.options[correct]}
Resultado: ${isCorrect ? "Correcto ✅" : "Incorrecto ❌"}`;

        await sendTelegramMessage(teacherChatId, reportText);
      }

      return res.sendStatus(200);
    } catch (error) {
      console.error("ERROR /telegram:", error);
      try {
        const chatId =
          req.body?.message?.chat?.id || req.body?.edited_message?.chat?.id;
        if (chatId) {
          await sendTelegramMessage(
            chatId,
            "Hubo un error procesando tu respuesta."
          );
        }
      } catch (_) {
        /* ignore */
      }
      return res.sendStatus(200);
    }
  });

  return app;
}

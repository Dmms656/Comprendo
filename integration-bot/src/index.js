import "dotenv/config";
import express from "express";
import TelegramBot from "node-telegram-bot-api";
import { generateQuestion } from "./services/zhipu.js";

const PORT = Number(process.env.PORT) || 3000;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Estado temporal en memoria para rastrear envíos activos en el chat
const state = {
  activeEnvioId: null,
  activeQuestion: null,
  studentId: null,
  studentChatId: null
};

// Inicializar Telegram Bot
let bot = null;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (TELEGRAM_BOT_TOKEN && TELEGRAM_BOT_TOKEN !== "tu_telegram_bot_token_aqui") {
  try {
    bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
    console.log("Telegram Bot: inicializado correctamente (polling activo).");

    // Escuchar mensajes de los estudiantes
    bot.on("message", async (msg) => {
      const chatId = String(msg.chat.id);
      
      // Manejar comando /start
      if (msg.text === "/start") {
        await bot.sendMessage(chatId, "¡Hola! Bienvenido a Comprendo. 📚\n\nPara poder recibir evaluaciones de tus profesores, necesitamos vincular tu cuenta de Telegram con tu perfil de estudiante.\n\nPor favor, presiona el botón de abajo para compartir tu número de teléfono.", {
          reply_markup: {
            keyboard: [
              [{ text: "📱 Compartir mi número para registrarme", request_contact: true }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        });
        return;
      }

      // Manejar envío de contacto
      if (msg.contact) {
        const phoneNumber = msg.contact.phone_number.replace(/\D/g, ""); // Remove '+' or spaces
        const username = msg.from.username || null;
        
        try {
          const coreUrl = process.env.CORE_API_URL || "http://localhost:5253";
          console.log(`Vinculando estudiante en Core API: ${coreUrl}/api/integracion/vincular-estudiante`);
          
          const response = await fetch(`${coreUrl}/api/integracion/vincular-estudiante`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Integration-Api-Key": process.env.INTEGRATION_API_KEY || "dev-integration-api-key"
            },
            body: JSON.stringify({
              telefonoTelegram: phoneNumber,
              telegramChatId: chatId,
              telegramUsername: username
            })
          });

          if (response.ok) {
            await bot.sendMessage(chatId, "¡Excelente! Tu cuenta ha sido vinculada correctamente. Ya puedes recibir evaluaciones.", {
              reply_markup: { remove_keyboard: true }
            });
          } else {
            let errMessage = "Asegúrate de que tu profesor te haya registrado primero con este número de teléfono.";
            try {
              const errData = await response.json();
              if (errData.title || errData.error) errMessage = errData.title || errData.error;
            } catch (e) {
              const errText = await response.text();
              if (errText) errMessage = errText;
            }
            await bot.sendMessage(chatId, `No se pudo vincular tu cuenta: ${errMessage}`);
          }
        } catch (error) {
          console.error("Error al vincular estudiante:", error);
          await bot.sendMessage(chatId, "Ocurrió un error al intentar vincular tu cuenta. Intenta más tarde.");
        }
        return;
      }

      const text = (msg.text || "").trim().toUpperCase();

      console.log(`Telegram Bot: mensaje recibido de ${chatId}: "${text}"`);

      // Verificar si hay una pregunta activa para este chat o en general
      if (!state.activeQuestion || !state.activeEnvioId) {
        await bot.sendMessage(chatId, "No tienes ninguna pregunta activa en este momento. 📚");
        return;
      }

      // Validar formato de respuesta
      if (!["A", "B", "C", "D"].includes(text)) {
        await bot.sendMessage(chatId, "Respuesta no válida. Por favor, responde únicamente con la letra: A, B, C o D.");
        return;
      }

      const correct = state.activeQuestion.correct || state.activeQuestion.claveRespuesta;
      const isCorrect = text === correct;

      // Responder al alumno en Telegram
      const feedback = isCorrect 
        ? "¡Correcto! Excelente trabajo. ✅" 
        : `Incorrecto. ❌ La respuesta correcta era la ${correct}.`;
      
      await bot.sendMessage(chatId, feedback);

      // Registrar la respuesta en el Core API de .NET
      try {
        const coreUrl = process.env.CORE_API_URL || "http://localhost:5253";
        console.log(`Enviando respuesta al Core API: ${coreUrl}/api/integracion/respuestas`);

        const response = await fetch(`${coreUrl}/api/integracion/respuestas`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Integration-Api-Key": process.env.INTEGRATION_API_KEY || "dev-integration-api-key"
          },
          body: JSON.stringify({
            idEnvio: state.activeEnvioId,
            idEstudiante: state.studentId,
            idPregunta: state.activeQuestion.id || 0,
            respuestaTexto: text,
            esCorrecta: isCorrect,
            puntajeObtenido: isCorrect ? 10.0 : 0.0,
            tiempoRespuestaSegundos: null,
            evaluadaPorIa: false,
            retroalimentacion: isCorrect ? "Muy bien." : `Debes repasar. La respuesta correcta era ${correct}.`
          })
        });

        if (response.ok) {
          console.log("Respuesta registrada con éxito en el Core API .NET.");
        } else {
          const errData = await response.text();
          console.error("Error al registrar la respuesta en Core API:", errData);
        }
      } catch (error) {
        console.error("Error de conexión al registrar respuesta en Core API:", error.message);
      }

      // Limpiar estado activo después de responder
      state.activeEnvioId = null;
      state.activeQuestion = null;
      state.studentId = null;
      state.studentChatId = null;
    });
  } catch (error) {
    console.error("Error al inicializar el bot de Telegram:", error.message);
  }
} else {
  console.warn("TELEGRAM_BOT_TOKEN no configurado o es el valor por defecto. El bot no responderá en Telegram.");
}

// Endpoint de salud
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "comprendo-integration-bot",
    telegramBotInitialized: bot !== null
  });
});

// Endpoint para generar preguntas con IA (invocado por el Frontend)
app.post("/api/questions/generate", async (req, res) => {
  try {
    const topic = String(req.body.topic || "").trim();

    if (!topic) {
      return res.status(400).json({
        ok: false,
        error: "El tema es obligatorio para generar una pregunta."
      });
    }

    console.log(`Generando pregunta con IA para el tema: "${topic}"`);
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
    console.error("Error en generate question api:", error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// Endpoint para iniciar la clase y enviar la pregunta
app.post("/start-class", async (req, res) => {
  try {
    const { idLeccion, idPregunta, idEstudiante, topic, pregunta } = req.body;
    const studentChatId = req.body.studentChatId || process.env.TELEGRAM_STUDENT_CHAT_ID;

    if (!idLeccion || !idPregunta || !idEstudiante || !studentChatId) {
      return res.status(400).json({
        ok: false,
        error: "Faltan campos obligatorios: idLeccion, idPregunta, idEstudiante, studentChatId."
      });
    }

    let activeQ = pregunta;

    // Si no se provee la pregunta estructurada, la generamos
    if (!activeQ) {
      if (!topic) {
        return res.status(400).json({
          ok: false,
          error: "Debe proveer 'topic' si no envía una pregunta pre-generada."
        });
      }
      activeQ = await generateQuestion(topic);
    }

    const correct = activeQ.correct || activeQ.claveRespuesta;
    const questionText = activeQ.question || activeQ.contenido;
    const opts = activeQ.options || {};

    const questionMessage = `📢 *Cierre de clase: ${topic || "Evaluación"}*\n\n${questionText}\n\n*A)* ${opts.A}\n*B)* ${opts.B}\n*C)* ${opts.C}\n*D)* ${opts.D}\n\n_Responde enviando solo la letra de la opción correcta (A, B, C o D)._`;

    let telegramMessageId = null;

    if (bot) {
      console.log(`Enviando pregunta a Telegram chat ${studentChatId}`);
      const sentMsg = await bot.sendMessage(studentChatId, questionMessage, { parse_mode: "Markdown" });
      telegramMessageId = String(sentMsg.message_id);
    } else {
      console.warn("Telegram Bot no inicializado. El mensaje no se envió realmente.");
      telegramMessageId = "MOCK-MSG-ID-" + Date.now();
    }

    // Registrar el envío en el Core API de .NET
    const coreUrl = process.env.CORE_API_URL || "http://localhost:5253";
    console.log(`Registrando envío en Core API: ${coreUrl}/api/integracion/envios`);

    const apiResponse = await fetch(`${coreUrl}/api/integracion/envios`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Integration-Api-Key": process.env.INTEGRATION_API_KEY || "dev-integration-api-key"
      },
      body: JSON.stringify({
        idLeccion: Number(idLeccion),
        idPregunta: Number(idPregunta),
        idEstudiante: Number(idEstudiante),
        telegramChatId: String(studentChatId),
        mensajeEnviado: questionMessage,
        telegramMessageId: telegramMessageId,
        estadoEnvio: "ENVIADO"
      })
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      throw new Error(`Core API error: ${errText}`);
    }

    const envioDto = await apiResponse.json();

    // Guardar en el estado de memoria del bot para esperar la respuesta
    state.activeEnvioId = envioDto.id || envioDto.idEnvio;
    state.activeQuestion = {
      id: idPregunta,
      question: questionText,
      options: opts,
      correct: correct
    };
    state.studentId = idEstudiante;
    state.studentChatId = studentChatId;

    res.json({
      ok: true,
      envio: envioDto,
      pregunta: activeQ
    });
  } catch (error) {
    console.error("ERROR /start-class:", error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servicio Bot de Integración escuchando en el puerto ${PORT}`);
});

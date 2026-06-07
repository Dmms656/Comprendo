import "dotenv/config";
import express from "express";
import TelegramBot from "node-telegram-bot-api";
import { generateQuestion } from "./services/zhipu.js";

const PORT = Number(process.env.PORT) || 3000;
const app = express();

const corsAllowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "http://localhost:3000,http://localhost:3001")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Middleware de CORS para peticiones del panel docente
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && corsAllowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  } else if (process.env.NODE_ENV !== "production") {
    res.header("Access-Control-Allow-Origin", "*");
  }
  res.header("Access-Control-Allow-Headers", "Authorization, Origin, X-Requested-With, Content-Type, Accept, X-Integration-Api-Key");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Map para rastrear el estado de preguntas activas por cada chatId de Telegram
// Key: String (chatId), Value: Object { activeEnvioId, activeQuestion, studentId, studentChatId }
const activeChats = new Map();

// Cola de evaluación secuencial por chat (Enviar a estudiantes)
// Key: chatId, Value: { idLeccion, idEstudiante, topic, preguntas[], currentIndex }
const evaluationQueues = new Map();

// Estado de las lecciones (Para agrupar respuestas y manejar el timeout)
// Key: idLeccion (number), Value: { timer, totalEstudiantes, finishedCount, results: Map<chatId, { correctCount, messages }> }
const activeLessons = new Map();

async function closeLessonAndSendFeedback(lessonId) {
    const lessonState = activeLessons.get(lessonId);
    if (!lessonState) return;
    
    console.log(`Cerrando lección ${lessonId} y enviando resultados...`);
    activeLessons.delete(lessonId); // Marcar como cerrada
    
    for (const [studentChatId, result] of lessonState.results.entries()) {
        const totalQs = result.messages.length;
        const msg = `📢 *Resultados Finales de la Evaluación*\n\nAciertos: ${result.correctCount} de ${totalQs}\n\n${result.messages.join("\n\n")}`;
        try {
            if (bot) await bot.sendMessage(studentChatId, msg, { parse_mode: "Markdown" });
        } catch(e) {
            console.error(`Failed to send final results to ${studentChatId}`, e.message);
        }
        
        // Limpiar colas residuales por si se cerró por tiempo y no terminaron
        evaluationQueues.delete(studentChatId);
        activeChats.delete(studentChatId);
    }
}

// Rastreo de registros pendientes por código de acceso de Telegram
const pendingRegistrations = new Map();

const CORE_API_URL = () => process.env.CORE_API_URL || "http://localhost:5253";
const INTEGRATION_HEADERS = () => ({
  "Content-Type": "application/json",
  "X-Integration-Api-Key": process.env.INTEGRATION_API_KEY || "dev-integration-api-key"
});

function normalizePregunta(pregunta) {
  const opts = pregunta.options || {};
  if (pregunta.opciones && Array.isArray(pregunta.opciones)) {
    for (const o of pregunta.opciones) {
      opts[o.literal] = o.texto;
    }
  } else if (pregunta.opciones && typeof pregunta.opciones === "object") {
    Object.assign(opts, pregunta.opciones);
  }
  return {
    id: pregunta.idPregunta || pregunta.id,
    question: pregunta.question || pregunta.enunciado || pregunta.contenido,
    options: {
      A: opts.A || "",
      B: opts.B || "",
      C: opts.C || "",
      D: opts.D || ""
    },
    correct: pregunta.correct || pregunta.respuestaCorrecta || pregunta.claveRespuesta || pregunta.literalCorrecto,
    puntaje: pregunta.puntaje ? Number(pregunta.puntaje) : 1.0
  };
}

function buildQuestionMessage(topic, activeQ) {
  const questionText = activeQ.question;
  const opts = activeQ.options;
  return `📢 *Cierre de clase: ${topic || "Evaluación"}*\n\n${questionText}\n\n*A)* ${opts.A}\n*B)* ${opts.B}\n*C)* ${opts.C}\n*D)* ${opts.D}\n\n_Responde enviando solo la letra de la opción correcta (A, B, C o D)._`;
}

async function sendQuestionToStudent({
  idLeccion,
  idPregunta,
  idEstudiante,
  studentChatId,
  topic,
  pregunta,
  puntaje
}) {
  const activeQ = normalizePregunta(pregunta);
  const questionMessage = buildQuestionMessage(topic, activeQ);

  let telegramMessageId = null;
  let telegramError = null;
  let estadoEnvio = "ENVIADO";

  if (bot) {
    try {
      console.log(`Enviando pregunta a Telegram chat ${studentChatId}`);
      const sentMsg = await bot.sendMessage(studentChatId, questionMessage, { parse_mode: "Markdown" });
      telegramMessageId = String(sentMsg.message_id);
    } catch (tgErr) {
      telegramError = tgErr.message || String(tgErr);
      estadoEnvio = "ERROR";
      console.warn(`Telegram send failed para chatId ${studentChatId}: ${telegramError}`);
    }
  } else {
    console.warn("Telegram Bot no inicializado. El mensaje no se envió realmente.");
    telegramMessageId = "MOCK-MSG-ID-" + Date.now();
  }

  const apiResponse = await fetch(`${CORE_API_URL()}/api/integracion/envios`, {
    method: "POST",
    headers: INTEGRATION_HEADERS(),
    body: JSON.stringify({
      idLeccion: Number(idLeccion),
      idPregunta: Number(idPregunta),
      idEstudiante: Number(idEstudiante),
      telegramChatId: String(studentChatId),
      mensajeEnviado: questionMessage,
      telegramMessageId: telegramMessageId,
      estadoEnvio: estadoEnvio
    })
  });

  if (!apiResponse.ok) {
    const errText = await apiResponse.text();
    throw new Error(`Core API error: ${errText}`);
  }

  const envioDto = await apiResponse.json();

  if (!telegramError) {
    activeChats.set(String(studentChatId), {
      activeEnvioId: envioDto.id || envioDto.idEnvio,
      activeQuestion: {
        id: idPregunta,
        question: activeQ.question,
        options: activeQ.options,
        correct: activeQ.correct,
        literalCorrecto: activeQ.correct,
        puntaje: puntaje ?? activeQ.puntaje
      },
      studentId: idEstudiante,
      studentChatId: studentChatId
    });
  }

  return { activeQ, envioDto, telegramError, questionMessage };
}

function chatHasActiveSession(chatId) {
  return activeChats.has(String(chatId)) || evaluationQueues.has(String(chatId));
}

// Inicializar Telegram Bot
let bot = null;
let botUsername = "Comprendobotv1_bot";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (TELEGRAM_BOT_TOKEN && TELEGRAM_BOT_TOKEN !== "tu_telegram_bot_token_aqui") {
  try {
    bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
    console.log("Telegram Bot: inicializado correctamente (polling activo).");

    bot.getMe().then((me) => {
      botUsername = me.username;
      console.log(`Telegram Bot username cached: @${botUsername}`);
    }).catch((err) => {
      console.error("Error al obtener información del bot:", err.message);
    });

    // Escuchar mensajes de los estudiantes
    bot.on("message", async (msg) => {
      const chatId = String(msg.chat.id);
      
      // Manejar comando /start con código opcional
      if (msg.text && msg.text.startsWith("/start")) {
        const parts = msg.text.split(/\s+/);
        const code = parts.length > 1 ? parts[1].trim().toUpperCase() : null;

        if (code) {
          try {
            const coreUrl = process.env.CORE_API_URL || "http://localhost:5253";
            console.log(`Verificando código ${code} para chat ${chatId}`);
            
            const response = await fetch(`${coreUrl}/api/integracion/vincular-estudiante-codigo`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Integration-Api-Key": process.env.INTEGRATION_API_KEY || "dev-integration-api-key"
              },
              body: JSON.stringify({
                telegramChatId: chatId,
                telegramUsername: msg.from.username || null,
                nombres: msg.from.first_name || "",
                apellidos: msg.from.last_name || "",
                codigoAcceso: code
              })
            });

            if (response.ok) {
              const result = await response.json();
              if (result.requiereTelefono) {
                pendingRegistrations.set(chatId, code);
                await bot.sendMessage(chatId, `¡Hola! Para inscribirte en la materia con código *${code}*, necesitamos vincular tu cuenta con tu número de teléfono.\n\nPor favor, presiona el botón de abajo para compartir tu contacto.`, {
                  parse_mode: "Markdown",
                  reply_markup: {
                    keyboard: [
                      [{ text: "📱 Compartir mi número para registrarme", request_contact: true }]
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: true
                  }
                });
              } else if (result.exito) {
                await bot.sendMessage(chatId, `¡Bienvenido! Has sido registrado e inscrito correctamente en la materia: *${result.materiaNombre}* 📚`, {
                  parse_mode: "Markdown",
                  reply_markup: { remove_keyboard: true }
                });
              } else {
                await bot.sendMessage(chatId, `No se pudo procesar la inscripción: ${result.mensaje}`);
              }
            } else {
              let errMsg = "Código inválido o error en el sistema.";
              try {
                const errData = await response.json();
                if (errData.title || errData.mensaje) errMsg = errData.title || errData.mensaje;
              } catch (e) {
                const errText = await response.text();
                if (errText) errMsg = errText;
              }
              await bot.sendMessage(chatId, `No se pudo registrar en la materia: ${errMsg}`);
            }
          } catch (error) {
            console.error("Error al registrar estudiante con código:", error);
            await bot.sendMessage(chatId, "Ocurrió un error al procesar tu código. Intenta más tarde.");
          }
        } else {
          await bot.sendMessage(chatId, "¡Hola! Bienvenido a Comprendo. 📚\n\nPara poder recibir evaluaciones de tus profesores, necesitamos vincular tu cuenta de Telegram con tu perfil de estudiante.\n\nPor favor, presiona el botón de abajo para compartir tu número de teléfono.", {
            reply_markup: {
              keyboard: [
                [{ text: "📱 Compartir mi número para registrarme", request_contact: true }]
              ],
              resize_keyboard: true,
              one_time_keyboard: true
            }
          });
        }
        return;
      }

      // Manejar envío de contacto
      if (msg.contact) {
        const phoneNumber = msg.contact.phone_number.replace(/\D/g, ""); // Remove '+' or spaces
        const username = msg.from.username || null;
        const pendingCode = pendingRegistrations.get(chatId);
        
        try {
          const coreUrl = process.env.CORE_API_URL || "http://localhost:5253";
          
          if (pendingCode) {
            console.log(`Registrando/vinculando estudiante con código ${pendingCode} en Core API`);
            const response = await fetch(`${coreUrl}/api/integracion/vincular-estudiante-codigo`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Integration-Api-Key": process.env.INTEGRATION_API_KEY || "dev-integration-api-key"
              },
              body: JSON.stringify({
                telegramChatId: chatId,
                telegramUsername: username,
                nombres: msg.from.first_name || "",
                apellidos: msg.from.last_name || "",
                codigoAcceso: pendingCode,
                telefonoTelegram: phoneNumber
              })
            });

            if (response.ok) {
              const result = await response.json();
              if (result.exito) {
                pendingRegistrations.delete(chatId);
                await bot.sendMessage(chatId, `¡Registro exitoso! Has sido inscrito en la materia: *${result.materiaNombre}* 📚`, {
                  parse_mode: "Markdown",
                  reply_markup: { remove_keyboard: true }
                });
              } else {
                await bot.sendMessage(chatId, `No se pudo completar el registro: ${result.mensaje}`);
              }
            } else {
              let errMsg = "Error al completar el registro.";
              try {
                const errData = await response.json();
                if (errData.title || errData.mensaje) errMsg = errData.title || errData.mensaje;
              } catch (e) {
                const errText = await response.text();
                if (errText) errMsg = errText;
              }
              await bot.sendMessage(chatId, `Error al completar el registro: ${errMsg}`);
            }
          } else {
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
          }
        } catch (error) {
          console.error("Error al vincular estudiante:", error);
          await bot.sendMessage(chatId, "Ocurrió un error al intentar vincular tu cuenta. Intenta más tarde.");
        }
        return;
      }

      const chatState = activeChats.get(chatId);
      if (!chatState) {
        // Evitar responder si es un comando que no conocemos pero empieza con /
        if (msg.text && msg.text.startsWith("/")) {
          return;
        }
        await bot.sendMessage(chatId, "No tienes ninguna pregunta activa en este momento. 📚");
        return;
      }

      let text = (msg.text || "").trim().toUpperCase();

      console.log(`Telegram Bot: mensaje recibido de ${chatId}: "${text}"`);

      // Normalizar emojis de letras comunes
      text = text.replace(/🅰️|🅰/g, "A")
                 .replace(/🅱️|🅱/g, "B")
                 .replace(/🅲️|🅲/g, "C")
                 .replace(/🄳️|🄳|🅳️|🅳/g, "D");

      // Buscar una letra A, B, C o D aislada
      const match = text.match(/\b([A-D])\b/);
      if (match) {
        text = match[1];
      } else {
        // Fallback de normalización de cadenas para casos especiales
        text = text.replace(/OPCIÓN|OPCION|RESPUESTA|SELECCIONO|ELEGIR|\s|\./g, "");
      }

      // Validar formato de respuesta
      if (!["A", "B", "C", "D"].includes(text)) {
        await bot.sendMessage(chatId, "⚠️ Respuesta no válida. Por favor, responde únicamente con la letra de la opción: A, B, C o D.");
        return; // Retornamos temprano sin eliminar el estado para permitir reintentos
      }

      const correct = chatState.activeQuestion.correct || chatState.activeQuestion.claveRespuesta || chatState.activeQuestion.literalCorrecto;
      const isCorrect = text === correct;

      // El feedback global se enviará al finalizar la clase.

      const queue = evaluationQueues.get(chatId);
      const currentLessonId = queue ? queue.idLeccion : null;

      // Guardar el resultado en memoria para el resumen global
      if (currentLessonId && activeLessons.has(currentLessonId)) {
          const lessonState = activeLessons.get(currentLessonId);
          if (!lessonState.results.has(chatId)) {
              lessonState.results.set(chatId, { correctCount: 0, messages: [] });
          }
          const studentResult = lessonState.results.get(chatId);
          if (isCorrect) studentResult.correctCount++;
          
          const qText = chatState.activeQuestion.question;
          studentResult.messages.push(`*Pregunta:* ${qText}\n*Tu respuesta:* ${text} ${isCorrect ? '✅' : '❌'}\n*Correcta:* ${correct}`);
      }

      // Registrar la respuesta en el Core API de .NET
      try {
        const coreUrl = process.env.CORE_API_URL || "http://localhost:5253";
        console.log(`Enviando respuesta al Core API: ${coreUrl}/api/integracion/respuestas`);

        // Usar el puntaje real de la pregunta (no el hardcodeado 10.0)
        const puntajeRealPregunta = chatState.activeQuestion.puntaje || 1.0;

        const response = await fetch(`${coreUrl}/api/integracion/respuestas`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Integration-Api-Key": process.env.INTEGRATION_API_KEY || "dev-integration-api-key"
          },
          body: JSON.stringify({
            idEnvio: chatState.activeEnvioId,
            idEstudiante: chatState.studentId,
            idPregunta: chatState.activeQuestion.id || 0,
            respuestaTexto: text,
            esCorrecta: isCorrect,
            puntajeObtenido: isCorrect ? puntajeRealPregunta : 0.0,
            tiempoRespuestaSegundos: null,
            evaluadaPorIa: false,
            retroalimentacion: isCorrect ? "¡Excelente trabajo! 🎉" : `Debes repasar este tema. La respuesta correcta era la opción ${correct}.`
          })
        });

        if (response.ok) {
          console.log("Respuesta registrada con éxito en el Core API .NET.");
        } else {
          const errData = await response.text();
          console.error("Error al registrar la respuesta en Core API:", errData);
          if (response.status === 400 && errData.toLowerCase().includes("tiempo")) {
            await bot.sendMessage(chatId, "⏱️ El tiempo límite de 5 minutos ha finalizado. La evaluación se ha cerrado y no se aceptó tu respuesta.");
            activeChats.delete(chatId);
            evaluationQueues.delete(chatId);
            return;
          }
        }
      } catch (error) {
        console.error("Error de conexión al registrar respuesta en Core API:", error.message);
      }

      activeChats.delete(chatId);

      const currentQueueForNext = evaluationQueues.get(chatId);
      if (currentQueueForNext && currentQueueForNext.currentIndex + 1 < currentQueueForNext.preguntas.length) {
        currentQueueForNext.currentIndex += 1;
        const nextPregunta = currentQueueForNext.preguntas[currentQueueForNext.currentIndex];
        try {
          const result = await sendQuestionToStudent({
            idLeccion: currentQueueForNext.idLeccion,
            idPregunta: nextPregunta.idPregunta,
            idEstudiante: currentQueueForNext.idEstudiante,
            studentChatId: chatId,
            topic: currentQueueForNext.topic,
            pregunta: nextPregunta,
            puntaje: nextPregunta.puntaje
          });
          if (result.telegramError) {
            console.warn(`No se pudo enviar pregunta ${currentQueueForNext.currentIndex + 1} de la cola: ${result.telegramError}`);
            evaluationQueues.delete(chatId);
          } else {
            const total = currentQueueForNext.preguntas.length;
            const num = currentQueueForNext.currentIndex + 1;
            await bot.sendMessage(chatId, `📋 Siguiente pregunta (${num} de ${total}).`);
          }
        } catch (err) {
          console.error("Error al enviar siguiente pregunta de la cola:", err.message);
          evaluationQueues.delete(chatId);
        }
      } else {
        evaluationQueues.delete(chatId);
        
        // Registrar que este estudiante terminó
        if (currentLessonId && activeLessons.has(currentLessonId)) {
            const lessonState = activeLessons.get(currentLessonId);
            lessonState.finishedCount++;
            console.log(`Estudiante ${chatId} terminó. (${lessonState.finishedCount}/${lessonState.totalEstudiantes})`);
            
            // Si todos terminaron, cerrar y enviar
            if (lessonState.finishedCount >= lessonState.totalEstudiantes) {
                console.log(`Todos los estudiantes de la lección ${currentLessonId} han terminado.`);
                clearTimeout(lessonState.timer);
                await closeLessonAndSendFeedback(currentLessonId);
            } else {
                await bot.sendMessage(chatId, "Has respondido todas tus preguntas. Esperando a que el resto de tus compañeros termine para mostrarte los resultados...");
            }
        }
      }
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

// Endpoint para obtener información del bot de Telegram
app.get("/api/bot-info", (req, res) => {
  res.json({
    ok: true,
    username: botUsername,
    telegramBotInitialized: bot !== null
  });
});

// Endpoint para generar preguntas con IA (invocado por el Frontend)
app.post("/api/questions/generate", async (req, res) => {
  try {
    const topic = String(req.body.topic || "").trim();
    const existingQuestions = Array.isArray(req.body.existingQuestions)
      ? req.body.existingQuestions
      : [];
    const questionIndex = Number(req.body.questionIndex) || 1;
    const totalQuestions = Number(req.body.totalQuestions) || 1;

    if (!topic) {
      return res.status(400).json({
        ok: false,
        error: "El tema es obligatorio para generar una pregunta."
      });
    }

    console.log(
      `Generando pregunta ${questionIndex}/${totalQuestions} con IA para tema: "${topic}" ` +
      `(${existingQuestions.length} previas a evitar)`
    );
    const q = await generateQuestion(topic, {
      existingQuestions,
      questionIndex,
      totalQuestions
    });

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

// Endpoint para iniciar la clase y enviar una pregunta individual
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

    if (chatHasActiveSession(studentChatId)) {
      return res.status(409).json({
        ok: false,
        error: "El estudiante tiene una evaluación o pregunta activa. Espera a que responda antes de enviar otra."
      });
    }

    let activeQ = pregunta;
    if (!activeQ) {
      if (!topic) {
        return res.status(400).json({
          ok: false,
          error: "Debe proveer 'topic' si no envía una pregunta pre-generada."
        });
      }
      activeQ = await generateQuestion(topic);
    }

    const result = await sendQuestionToStudent({
      idLeccion,
      idPregunta,
      idEstudiante,
      studentChatId,
      topic,
      pregunta: activeQ,
      puntaje: req.body.puntaje ? Number(req.body.puntaje) : undefined
    });

    if (result.telegramError) {
      return res.status(200).json({
        ok: false,
        error: `El mensaje no pudo enviarse por Telegram: el estudiante no ha iniciado el bot o su chat es inválido. (${result.telegramError})`,
        envio: result.envioDto
      });
    }

    res.json({
      ok: true,
      envio: result.envioDto,
      pregunta: result.activeQ
    });
  } catch (error) {
    console.error("ERROR /start-class:", error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// Endpoint para iniciar evaluación secuencial (todas las preguntas de la lección, una por una)
app.post("/start-evaluation", async (req, res) => {
  try {
    const { idLeccion, idEstudiante, topic, preguntas } = req.body;
    const studentChatId = req.body.studentChatId || process.env.TELEGRAM_STUDENT_CHAT_ID;

    if (!idLeccion || !idEstudiante || !studentChatId) {
      return res.status(400).json({
        ok: false,
        error: "Faltan campos obligatorios: idLeccion, idEstudiante, studentChatId."
      });
    }

    if (!preguntas || !Array.isArray(preguntas) || preguntas.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "Debe proveer al menos una pregunta en el array 'preguntas'."
      });
    }

    const chatKey = String(studentChatId);

    if (chatHasActiveSession(chatKey)) {
      return res.status(409).json({
        ok: false,
        error: "El estudiante ya tiene una evaluación en curso. Espera a que termine de responder."
      });
    }

    const idLeccionNum = Number(idLeccion);
    const totalEstudiantes = Number(req.body.totalEstudiantes) || 1;

    // Inicializar estado de lección si es la primera petición de esta lección
    if (!activeLessons.has(idLeccionNum)) {
      const timer = setTimeout(() => {
        closeLessonAndSendFeedback(idLeccionNum);
      }, 5 * 60 * 1000); // 5 minutos exactos

      activeLessons.set(idLeccionNum, {
        timer,
        totalEstudiantes: totalEstudiantes,
        finishedCount: 0,
        results: new Map()
      });
    }

    const sortedPreguntas = [...preguntas].sort(
      (a, b) => (a.orden ?? 0) - (b.orden ?? 0)
    );

    evaluationQueues.set(chatKey, {
      idLeccion: Number(idLeccion),
      idEstudiante: Number(idEstudiante),
      topic: topic || "Evaluación",
      preguntas: sortedPreguntas,
      currentIndex: 0
    });

    const firstPregunta = sortedPreguntas[0];
    const result = await sendQuestionToStudent({
      idLeccion,
      idPregunta: firstPregunta.idPregunta,
      idEstudiante,
      studentChatId: chatKey,
      topic,
      pregunta: firstPregunta,
      puntaje: firstPregunta.puntaje
    });

    if (result.telegramError) {
      evaluationQueues.delete(chatKey);
      return res.status(200).json({
        ok: false,
        error: `El mensaje no pudo enviarse por Telegram: el estudiante no ha iniciado el bot o su chat es inválido. (${result.telegramError})`,
        envio: result.envioDto
      });
    }

    res.json({
      ok: true,
      envio: result.envioDto,
      totalPreguntas: sortedPreguntas.length,
      mensaje: `Evaluación iniciada (${sortedPreguntas.length} preguntas en cola).`
    });
  } catch (error) {
    console.error("ERROR /start-evaluation:", error);
    const chatKey = String(req.body?.studentChatId || "");
    if (chatKey) evaluationQueues.delete(chatKey);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// Endpoint para enviar los resultados globales de una lección
app.post("/send-lesson-results", async (req, res) => {
  try {
    const { resultados } = req.body;
    if (!resultados || !Array.isArray(resultados)) {
      return res.status(400).json({ ok: false, error: "Se requiere un arreglo 'resultados'." });
    }

    let enviados = 0;
    for (const resEstudiante of resultados) {
      if (resEstudiante.telegramChatId && resEstudiante.mensaje) {
        try {
          if (bot) {
            await bot.sendMessage(resEstudiante.telegramChatId, resEstudiante.mensaje, { parse_mode: "Markdown" });
            enviados++;
          }
        } catch (err) {
          console.warn(`No se pudo enviar resultado a ${resEstudiante.telegramChatId}: ${err.message}`);
        }
      }
    }

    res.json({ ok: true, enviados });
  } catch (error) {
    console.error("ERROR /send-lesson-results:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servicio Bot de Integración escuchando en el puerto ${PORT}`);
});

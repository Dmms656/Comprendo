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

// Estado de las lecciones (agrupa respuestas hasta que todos los estudiantes terminen)
// Key: idLeccion (number), Value: { timer?, totalEstudiantes, finishedCount, results, tiempoLimiteMinutos? }
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
        
        // Limpiar colas residuales si el estudiante no terminó todas las preguntas
        evaluationQueues.delete(studentChatId);
        activeChats.delete(studentChatId);
    }
}

// Sesiones de registro / inscripción guiada por chat
const registrationSessions = new Map();

const REG_STEP = {
  PHONE: "phone",
  NOMBRES: "nombres",
  APELLIDOS: "apellidos",
  CODIGO: "codigo",
  VERIFICACION: "verificacion",
  CODIGO_EXISTING: "codigo_existing",
};

function isAffirmative(text) {
  const normalized = (text || "").trim().toUpperCase().normalize("NFD").replace(/\p{M}/gu, "");
  return ["SI", "S", "OK", "CONFIRMAR", "CORRECTO", "YES"].includes(normalized);
}

function formatPhoneDisplay(phone) {
  if (!phone) return "—";
  return phone.startsWith("+") ? phone : `+${phone}`;
}

async function showVerificationSummary(chatId, session) {
  await bot.sendMessage(
    chatId,
    `📋 *Paso 5 de 5 — Revisa tus datos*\n\n` +
      `• *Nombre:* ${session.nombres}\n` +
      `• *Apellido:* ${session.apellidos}\n` +
      `• *Teléfono:* ${formatPhoneDisplay(session.phone)}\n` +
      `• *Código del curso:* ${session.codigoAcceso}\n\n` +
      `Si algo está mal, escribe el número para corregirlo:\n` +
      `*1* Nombre · *2* Apellido · *3* Teléfono · *4* Código\n\n` +
      `Si todo está correcto, escribe *SI* para confirmar.`,
    { parse_mode: "Markdown", reply_markup: { remove_keyboard: true } }
  );
}

function normalizeCourseCode(text) {
  return (text || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function isValidCourseCode(code) {
  return /^[A-Z0-9]{4,10}$/.test(code);
}

function looksLikePhoneNumber(text) {
  const trimmed = (text || "").trim();
  if (!trimmed) return false;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return false;
  return /^[+]?[\d\s\-().]{8,24}$/.test(trimmed);
}

function contactShareKeyboard() {
  return {
    keyboard: [[{ text: "📱 Compartir mi número", request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  };
}

async function promptSharePhone(chatId, typedNumber = false) {
  const message = typedNumber
    ? "⚠️ *No escribas tu número en el chat.*\n\nPor seguridad debes usar el botón de abajo para *compartir tu contacto* desde Telegram. Eso nos permite verificar tu cuenta correctamente."
    : "Para continuar el registro, presiona el botón de abajo para *compartir tu número* desde Telegram.\n\nNo lo escribas como mensaje de texto.";

  await bot.sendMessage(chatId, message, {
    parse_mode: "Markdown",
    reply_markup: contactShareKeyboard(),
  });
}

async function fetchStudentTelegramStatus(chatId) {
  const response = await fetch(
    `${CORE_API_URL()}/api/integracion/estudiante-telegram/${encodeURIComponent(chatId)}`,
    { headers: INTEGRATION_HEADERS() }
  );
  if (!response.ok) {
    return { registrado: false };
  }
  return response.json();
}

async function vincularEstudianteCodigo(payload) {
  const response = await fetch(`${CORE_API_URL()}/api/integracion/vincular-estudiante-codigo`, {
    method: "POST",
    headers: INTEGRATION_HEADERS(),
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    return { ok: true, result: await response.json() };
  }

  let errMsg = "Error al completar el registro.";
  try {
    const errData = await response.json();
    if (errData.title || errData.mensaje) errMsg = errData.title || errData.mensaje;
  } catch {
    const errText = await response.text();
    if (errText) errMsg = errText;
  }
  return { ok: false, errMsg };
}

async function enrollWithCode(chatId, username, session, code) {
  const payload = {
    telegramChatId: chatId,
    telegramUsername: username,
    nombres: session?.nombres || "",
    apellidos: session?.apellidos || "",
    codigoAcceso: code,
    telefonoTelegram: session?.phone || null,
  };

  const { ok, result, errMsg } = await vincularEstudianteCodigo(payload);

  if (ok && result.exito) {
    registrationSessions.delete(chatId);
    await bot.sendMessage(
      chatId,
      `¡Listo! Te inscribiste en *${result.materiaNombre}* 📚\n\nYa puedes recibir evaluaciones de tu profesor.`,
      { parse_mode: "Markdown", reply_markup: { remove_keyboard: true } }
    );
    return true;
  }

  session.step = REG_STEP.VERIFICACION;
  registrationSessions.set(chatId, session);
  await bot.sendMessage(chatId, `No se pudo completar la inscripción: ${result?.mensaje || errMsg}`);
  await showVerificationSummary(chatId, session);
  return false;
}

async function handleStartCommand(chatId, username) {
  registrationSessions.delete(chatId);
  clearStaleChatSessions(chatId);

  let status = { registrado: false };
  try {
    status = await fetchStudentTelegramStatus(chatId);
  } catch (error) {
    console.warn("No se pudo consultar estado del estudiante:", error.message);
  }

  if (status.registrado) {
    registrationSessions.set(chatId, { step: REG_STEP.CODIGO_EXISTING });
    const nombre = status.nombres || "estudiante";
    await bot.sendMessage(
      chatId,
      `¡Hola, *${nombre}*! 👋\n\nYa tienes cuenta en Comprendo.\n\nPara inscribirte en un curso, escribe el *código* que te compartió tu profesor.`,
      { parse_mode: "Markdown", reply_markup: { remove_keyboard: true } }
    );
    return;
  }

  registrationSessions.set(chatId, { step: REG_STEP.PHONE });
  await bot.sendMessage(
    chatId,
    "¡Hola! Bienvenido a *Comprendo* 📚\n\nPara inscribirte en un curso necesitamos registrarte.\n\n*Paso 1 de 5:* Comparte tu número de teléfono con el botón de abajo.\n\n(Tu nombre y apellido los escribirás en los siguientes pasos, no usamos los de la cuenta de Telegram.)",
    {
      parse_mode: "Markdown",
      reply_markup: contactShareKeyboard(),
    }
  );
}

async function handleRegistrationContact(chatId, msg) {
  const phoneNumber = msg.contact.phone_number.replace(/\D/g, "");
  clearStaleChatSessions(chatId);
  const session = registrationSessions.get(chatId) || { step: REG_STEP.PHONE };

  session.phone = phoneNumber;

  if (session.returnToVerify && session.codigoAcceso) {
    session.returnToVerify = false;
    session.step = REG_STEP.VERIFICACION;
    registrationSessions.set(chatId, session);
    await bot.sendMessage(chatId, "✅ Teléfono actualizado.", {
      parse_mode: "Markdown",
      reply_markup: { remove_keyboard: true },
    });
    await showVerificationSummary(chatId, session);
    return;
  }

  session.step = REG_STEP.NOMBRES;
  registrationSessions.set(chatId, session);

  await bot.sendMessage(
    chatId,
    "✅ Número recibido.\n\n*Paso 2 de 5:* Escribe tu *nombre* tal como figura en tus documentos.",
    { parse_mode: "Markdown", reply_markup: { remove_keyboard: true } }
  );
}

async function handleRegistrationText(chatId, username, text) {
  const session = registrationSessions.get(chatId);
  if (!session) return false;

  const trimmed = (text || "").trim();
  if (!trimmed) {
    await bot.sendMessage(chatId, "Por favor escribe una respuesta válida.");
    return true;
  }

  if (session.step === REG_STEP.PHONE) {
    await promptSharePhone(chatId, looksLikePhoneNumber(trimmed));
    return true;
  }

  if (session.step === REG_STEP.VERIFICACION) {
    if (isAffirmative(trimmed)) {
      await enrollWithCode(chatId, username, session, session.codigoAcceso);
      return true;
    }
    if (trimmed === "1") {
      session.step = REG_STEP.NOMBRES;
      registrationSessions.set(chatId, session);
      await bot.sendMessage(chatId, "Escribe tu *nombre* corregido:", { parse_mode: "Markdown" });
      return true;
    }
    if (trimmed === "2") {
      session.step = REG_STEP.APELLIDOS;
      registrationSessions.set(chatId, session);
      await bot.sendMessage(
        chatId,
        "Escribe tu *apellido* corregido.\n\n_Si tienes dos, escríbelos juntos en un solo mensaje._",
        { parse_mode: "Markdown" }
      );
      return true;
    }
    if (trimmed === "3") {
      session.step = REG_STEP.PHONE;
      session.returnToVerify = true;
      registrationSessions.set(chatId, session);
      await promptSharePhone(chatId);
      return true;
    }
    if (trimmed === "4") {
      session.step = REG_STEP.CODIGO;
      registrationSessions.set(chatId, session);
      await bot.sendMessage(chatId, "Escribe el *código del curso* corregido:", { parse_mode: "Markdown" });
      return true;
    }
    await bot.sendMessage(
      chatId,
      "Responde *SI* para confirmar, o escribe *1*, *2*, *3* o *4* para corregir un dato.",
      { parse_mode: "Markdown" }
    );
    return true;
  }

  if (session.step === REG_STEP.NOMBRES) {
    if (trimmed.length < 2) {
      await bot.sendMessage(chatId, "El nombre debe tener al menos 2 caracteres. Inténtalo de nuevo.");
      return true;
    }
    session.nombres = trimmed;
    if (session.codigoAcceso) {
      session.step = REG_STEP.VERIFICACION;
      registrationSessions.set(chatId, session);
      await showVerificationSummary(chatId, session);
      return true;
    }
    session.step = REG_STEP.APELLIDOS;
    registrationSessions.set(chatId, session);
    await bot.sendMessage(
      chatId,
      "*Paso 3 de 5:* Escribe tu *apellido* (el de tus documentos).\n\n_Si tienes dos apellidos, escríbelos juntos en un solo mensaje. No uses el apellido de la cuenta de Telegram._",
      { parse_mode: "Markdown" }
    );
    return true;
  }

  if (session.step === REG_STEP.APELLIDOS) {
    if (trimmed.length < 2) {
      await bot.sendMessage(chatId, "El apellido debe tener al menos 2 caracteres. Inténtalo de nuevo.");
      return true;
    }
    session.apellidos = trimmed;
    if (session.codigoAcceso) {
      session.step = REG_STEP.VERIFICACION;
      registrationSessions.set(chatId, session);
      await showVerificationSummary(chatId, session);
      return true;
    }
    session.step = REG_STEP.CODIGO;
    registrationSessions.set(chatId, session);
    await bot.sendMessage(
      chatId,
      `Gracias, *${session.nombres} ${session.apellidos}*.\n\n*Paso 4 de 5:* Escribe el *código del curso* que te dio tu profesor.`,
      { parse_mode: "Markdown" }
    );
    return true;
  }

  if (session.step === REG_STEP.CODIGO) {
    const code = normalizeCourseCode(trimmed);
    if (!isValidCourseCode(code)) {
      await bot.sendMessage(chatId, "⚠️ Código no válido. Verifica el código de tu profesor e inténtalo de nuevo.");
      return true;
    }
    session.codigoAcceso = code;
    session.step = REG_STEP.VERIFICACION;
    registrationSessions.set(chatId, session);
    await showVerificationSummary(chatId, session);
    return true;
  }

  if (session.step === REG_STEP.CODIGO_EXISTING) {
    const code = normalizeCourseCode(trimmed);
    if (!isValidCourseCode(code)) {
      await bot.sendMessage(chatId, "⚠️ Código no válido. Verifica el código de tu profesor e inténtalo de nuevo.");
      return true;
    }
    await enrollWithCode(chatId, username, session, code);
    return true;
  }

  return false;
}

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

function clearStaleChatSessions(chatId) {
  const key = String(chatId);
  activeChats.delete(key);
  evaluationQueues.delete(key);
}

function chatHasActiveSession(chatId) {
  return activeChats.has(String(chatId));
}

let bot = null;
let botUsername = "Comprendobotv1_bot";
let botInitPromise = null;

function registerBotMessageHandlers() {
  bot.on("message", async (msg) => {
      const chatId = String(msg.chat.id);
      
      // Comando /start (enlace sin código embebido)
      if (msg.text && msg.text.startsWith("/start")) {
        await handleStartCommand(chatId, msg.from.username || null);
        return;
      }

      // Compartir contacto durante el registro
      if (msg.contact) {
        await handleRegistrationContact(chatId, msg);
        return;
      }

      // Registro guiado: prioridad sobre evaluaciones residuales en memoria
      if (registrationSessions.has(chatId) && msg.text && !msg.text.startsWith("/")) {
        const handled = await handleRegistrationText(chatId, msg.from.username || null, msg.text);
        if (handled) return;
      }

      const chatState = activeChats.get(chatId);
      if (!chatState) {
        if (msg.text && msg.text.startsWith("/")) {
          return;
        }
        if (registrationSessions.has(chatId)) {
          await bot.sendMessage(
            chatId,
            "Sigamos con tu registro. Responde al paso que te indiqué arriba o escribe /start para comenzar de nuevo. 📚"
          );
          return;
        }
        await bot.sendMessage(
          chatId,
          "No tienes ninguna evaluación activa. Escribe /start para registrarte o inscribirte en un curso. 📚"
        );
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
            await bot.sendMessage(chatId, "⏱️ El tiempo límite de la evaluación ha finalizado. No se aceptó tu respuesta.");
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
                if (lessonState.timer) clearTimeout(lessonState.timer);
                await closeLessonAndSendFeedback(currentLessonId);
            } else {
                await bot.sendMessage(chatId, "Has respondido todas tus preguntas. Esperando a que el resto de tus compañeros termine para mostrarte los resultados...");
            }
        }
      }
  });
}

async function activateTelegramBot() {
  if (bot) {
    return { ok: true, username: botUsername, telegramBotInitialized: true };
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token === "tu_telegram_bot_token_aqui") {
    console.warn("TELEGRAM_BOT_TOKEN no configurado. El bot no responderá en Telegram.");
    return { ok: false, username: botUsername, telegramBotInitialized: false };
  }

  if (!botInitPromise) {
    botInitPromise = (async () => {
      try {
        bot = new TelegramBot(token, { polling: true });
        registerBotMessageHandlers();
        const me = await bot.getMe();
        botUsername = me.username;
        console.log(`Telegram Bot: activado (polling) @${botUsername}`);
        return { ok: true, username: botUsername, telegramBotInitialized: true };
      } catch (error) {
        bot = null;
        botInitPromise = null;
        console.error("Error al activar el bot de Telegram:", error.message);
        throw error;
      }
    })();
  }

  return botInitPromise;
}

console.log("Telegram Bot: en espera. Se activa al abrir la página de inicio del panel.");

// Activar polling de Telegram (invocado por la página de inicio)
app.post("/api/bot/activate", async (req, res) => {
  try {
    const result = await activateTelegramBot();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      username: botUsername,
      telegramBotInitialized: false,
      error: error.message
    });
  }
});

// Endpoint de salud
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "comprendo-integration-bot",
    telegramBotInitialized: bot !== null
  });
});

// Endpoint para obtener información del bot de Telegram
app.get("/api/bot-info", async (req, res) => {
  try {
    const result = await activateTelegramBot();
    res.json({
      ok: result.ok,
      username: result.username,
      telegramBotInitialized: result.telegramBotInitialized
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      username: botUsername,
      telegramBotInitialized: false,
      error: error.message
    });
  }
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
    await activateTelegramBot();

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
    const tiempoLimiteMinutos = Number(req.body.tiempoLimiteMinutos) || 0;
    const fechaDisponibleHasta = req.body.fechaDisponibleHasta
      ? new Date(req.body.fechaDisponibleHasta)
      : null;

    // Inicializar estado de lección si es la primera petición de esta lección
    if (!activeLessons.has(idLeccionNum)) {
      const lessonState = {
        totalEstudiantes: totalEstudiantes,
        finishedCount: 0,
        results: new Map(),
        timer: null
      };

      let closeAtMs = null;
      if (fechaDisponibleHasta && !Number.isNaN(fechaDisponibleHasta.getTime())) {
        closeAtMs = fechaDisponibleHasta.getTime() - Date.now();
      } else if (tiempoLimiteMinutos > 0) {
        closeAtMs = tiempoLimiteMinutos * 60 * 1000;
      }

      if (closeAtMs && closeAtMs > 0) {
        lessonState.timer = setTimeout(() => {
          closeLessonAndSendFeedback(idLeccionNum);
        }, closeAtMs);
      }

      activeLessons.set(idLeccionNum, lessonState);
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

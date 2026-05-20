const state = {
  token: localStorage.getItem("comprendoToken"),
  teacher: JSON.parse(localStorage.getItem("comprendoTeacher") || "null"),
  courses: [],
  students: [],
  pendingQuestions: [],
  botUsername: "ComprendoBot"
};

const $ = (selector) => document.querySelector(selector);

function showMessage(text, isError = false) {
  const message = $("#message");
  message.textContent = text;
  message.style.color = isError ? "#9b1c31" : "#145270";
  window.clearTimeout(showMessage.timer);
  showMessage.timer = window.setTimeout(() => {
    message.textContent = "";
  }, 4500);
}

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers
  });
  
  const contentType = response.headers.get("content-type");
  let data = {};
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = { text: await response.text() };
  }

  if (!response.ok || data.ok === false) {
    throw new Error(data.error || data.title || "No se pudo completar la solicitud.");
  }

  return data;
}

function setSession(session) {
  state.token = session.token;
  state.teacher = session.usuario;
  state.courses = [];
  localStorage.setItem("comprendoToken", session.token);
  localStorage.setItem("comprendoTeacher", JSON.stringify(session.usuario));
}

function clearSession() {
  state.token = null;
  state.teacher = null;
  state.courses = [];
  state.pendingQuestions = [];
  localStorage.removeItem("comprendoToken");
  localStorage.removeItem("comprendoTeacher");
  $("#panel").classList.add("hidden");
  $("#login-card").classList.remove("hidden");
}

function renderCourses(courses) {
  const select = $("#course");
  select.innerHTML = "";

  for (const course of courses) {
    const option = document.createElement("option");
    option.value = course.idDocenteCursoMateria;
    option.textContent = `${course.materia} - ${course.nivel} ${course.paralelo} (${course.anioLectivo})`;
    select.appendChild(option);
  }
}

function renderQuestions() {
  const list = $("#pending-questions");
  list.innerHTML = "";

  if (!state.pendingQuestions.length) {
    const item = document.createElement("li");
    item.textContent = "Aun no hay preguntas agregadas.";
    list.appendChild(item);
    return;
  }

  state.pendingQuestions.forEach((question, index) => {
    const item = document.createElement("li");
    const title = document.createElement("strong");
    const options = document.createElement("p");
    const answer = document.createElement("small");

    title.textContent = `${index + 1}. ${question.contenido}`;
    options.textContent = `A) ${question.opciones.A} | B) ${question.opciones.B} | C) ${question.opciones.C} | D) ${question.opciones.D}`;
    answer.textContent = `Respuesta correcta: ${question.claveRespuesta}`;

    item.append(title, options, answer);
    list.appendChild(item);
  });
}

function renderEvaluations(evaluations) {
  const list = $("#evaluations-list");
  list.innerHTML = "";

  if (!evaluations.length) {
    list.innerHTML = '<p class="muted" style="padding:1rem 0;">No hay evaluaciones guardadas todavía.</p>';
    return;
  }

  for (const evaluation of evaluations) {
    const item = document.createElement("article");
    item.className = "evaluation-item";
    item.style.cssText = "border:1px solid #e2e8f0;border-radius:10px;padding:1.2rem;margin-bottom:1rem;background:#fafbfc;";

    const header = document.createElement("div");
    header.style.cssText = "display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.5rem;";

    const info = document.createElement("div");
    const title = document.createElement("strong");
    title.style.fontSize = "1rem";
    title.textContent = evaluation.titulo;

    const meta = document.createElement("p");
    meta.style.cssText = "margin:0.3rem 0 0;font-size:0.82rem;color:#64748b;";
    meta.textContent = `📚 ${evaluation.tema || "Sin tema"} · ${evaluation.numeroPreguntas || 0} pregunta(s) · ${new Date(evaluation.fechaCreacion).toLocaleDateString()}`;

    const estadoBadge = document.createElement("span");
    estadoBadge.style.cssText = "font-size:0.72rem;padding:2px 8px;border-radius:20px;font-weight:600;white-space:nowrap;";
    const estadoColors = { BORRADOR: "#e2e8f0;color:#475569", ENVIADA: "#dcfce7;color:#166534", PROGRAMADA: "#dbeafe;color:#1e40af", CERRADA: "#f1f5f9;color:#94a3b8" };
    const [bg, col] = (estadoColors[evaluation.estado] || "#e2e8f0;color:#475569").split(";");
    estadoBadge.style.background = bg;
    estadoBadge.style.color = col.replace("color:", "");
    estadoBadge.textContent = evaluation.estado || "BORRADOR";

    info.append(title, meta);
    header.append(info, estadoBadge);

    // Resultados de envío
    const resultLog = document.createElement("div");
    resultLog.style.cssText = "margin-top:0.8rem;font-size:0.82rem;display:none;";
    resultLog.id = `result-log-${evaluation.idLeccion}`;

    // Botón enviar a estudiantes
    const actions = document.createElement("div");
    actions.style.cssText = "margin-top:0.9rem;display:flex;gap:0.6rem;flex-wrap:wrap;";

    if (evaluation.numeroPreguntas > 0) {
      const sendBtn = document.createElement("button");
      sendBtn.textContent = "📤 Enviar a estudiantes";
      sendBtn.style.cssText = "font-size:0.85rem;padding:0.4rem 0.9rem;";
      sendBtn.addEventListener("click", () => sendEvaluacionToStudents(evaluation, sendBtn, resultLog));
      actions.append(sendBtn);
    } else {
      const noQMsg = document.createElement("span");
      noQMsg.style.cssText = "font-size:0.8rem;color:#94a3b8;font-style:italic;";
      noQMsg.textContent = "⚠️ Agrega preguntas para poder enviar.";
      actions.append(noQMsg);
    }

    const viewQuestionsBtn = document.createElement("button");
    viewQuestionsBtn.className = "secondary";
    viewQuestionsBtn.textContent = "❓ Ver preguntas";
    viewQuestionsBtn.style.cssText = "font-size:0.85rem;padding:0.4rem 0.9rem;";
    
    const questionsContainer = document.createElement("div");
    questionsContainer.id = `questions-container-${evaluation.idLeccion}`;
    questionsContainer.style.cssText = "margin-top:1rem;border-top:1px dashed #e2e8f0;padding-top:1rem;display:none;";
    
    viewQuestionsBtn.addEventListener("click", () => toggleQuestions(evaluation, viewQuestionsBtn, questionsContainer, resultLog));
    actions.append(viewQuestionsBtn);

    const viewResultsBtn = document.createElement("button");
    viewResultsBtn.className = "secondary";
    viewResultsBtn.textContent = "📊 Ver resultados";
    viewResultsBtn.style.cssText = "font-size:0.85rem;padding:0.4rem 0.9rem;";
    
    const resultsContainer = document.createElement("div");
    resultsContainer.id = `results-container-${evaluation.idLeccion}`;
    resultsContainer.style.cssText = "margin-top:1rem;border-top:1px dashed #e2e8f0;padding-top:1rem;display:none;";
    
    viewResultsBtn.addEventListener("click", () => toggleResults(evaluation, viewResultsBtn, resultsContainer));
    actions.append(viewResultsBtn);

    item.append(header, resultLog, actions, questionsContainer, resultsContainer);
    list.appendChild(item);
  }
}

function mapPreguntaForBot(pregunta) {
  return {
    idPregunta: pregunta.idPregunta,
    orden: pregunta.orden ?? 0,
    enunciado: pregunta.enunciado,
    respuestaCorrecta: pregunta.respuestaCorrecta,
    puntaje: pregunta.puntaje || 10.0,
    opciones: pregunta.opciones.map(o => ({ literal: o.literal, texto: o.texto }))
  };
}

async function sendEvaluacionToStudents(evaluation, btn, resultLog) {
  btn.disabled = true;
  btn.textContent = "⏳ Enviando...";
  resultLog.style.display = "block";
  resultLog.innerHTML = "";

  try {
    const preguntas = await api(`/api/lecciones/${evaluation.idLeccion}/preguntas`);
    if (!preguntas || preguntas.length === 0) {
      throw new Error("Esta evaluación no tiene preguntas activas.");
    }

    const preguntasPayload = preguntas.map(mapPreguntaForBot);

    const estudiantesData = await api(`/api/estudiantes?idDocenteCursoMateria=${evaluation.idDocenteCursoMateria}&pageSize=100`);
    const estudiantes = estudiantesData.items || estudiantesData || [];

    const vinculados = estudiantes.filter(e => e.telegramChatId);
    const sinVincular = estudiantes.filter(e => !e.telegramChatId);

    if (vinculados.length === 0) {
      throw new Error("Ningún estudiante matriculado ha vinculado su cuenta de Telegram todavía.");
    }

    let enviados = 0;
    let errores = 0;
    const logs = [];

    for (const estudiante of vinculados) {
      try {
        const r = await fetch("/start-evaluation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idLeccion: evaluation.idLeccion,
            idEstudiante: estudiante.idEstudiante,
            topic: evaluation.tema || evaluation.titulo,
            studentChatId: String(estudiante.telegramChatId),
            preguntas: preguntasPayload
          })
        });
        const data = await r.json().catch(() => ({}));
        if (r.ok && data.ok !== false) {
          enviados++;
          const total = data.totalPreguntas || preguntasPayload.length;
          logs.push(`✅ ${estudiante.nombres} ${estudiante.apellidos} (${total} preguntas en cola)`);
        } else if (data.ok === false && data.envio) {
          errores++;
          logs.push(`⚠️ ${estudiante.nombres} ${estudiante.apellidos}: Bot no iniciado — pídele que abra @${state.botUsername} en Telegram`);
        } else if (r.status === 409) {
          errores++;
          logs.push(`⚠️ ${estudiante.nombres} ${estudiante.apellidos}: ${data.error || "Evaluación en curso"}`);
        } else {
          errores++;
          logs.push(`❌ ${estudiante.nombres} ${estudiante.apellidos}: ${data.error || "Error desconocido"}`);
        }
      } catch (e) {
        errores++;
        logs.push(`❌ ${estudiante.nombres} ${estudiante.apellidos}: ${e.message}`);
      }
    }

    const summary = document.createElement("div");
    summary.style.cssText = "padding:0.6rem 0.8rem;border-radius:8px;" + (errores === 0 ? "background:#dcfce7;color:#166534" : "background:#fef9c3;color:#713f12");
    summary.innerHTML = `<strong>${enviados} evaluaciones iniciadas</strong> · ${errores} errores · ${sinVincular.length} sin vincular Telegram · ${preguntasPayload.length} preguntas por estudiante`;
    resultLog.appendChild(summary);

    const logList = document.createElement("ul");
    logList.style.cssText = "margin:0.5rem 0 0;padding-left:1.2rem;";
    logs.forEach(l => {
      const li = document.createElement("li"); li.textContent = l; logList.appendChild(li);
    });
    if (sinVincular.length > 0) {
      const li = document.createElement("li");
      li.style.color = "#94a3b8";
      li.textContent = `⚠️ Sin Telegram: ${sinVincular.map(e => e.nombres).join(", ")}`;
      logList.appendChild(li);
    }
    resultLog.appendChild(logList);

    btn.textContent = enviados > 0 ? "✅ Enviado" : "📤 Enviar a estudiantes";
    if (enviados > 0) showMessage(`Evaluación iniciada para ${enviados} estudiante(s). Las preguntas se enviarán una por una al responder.`);

  } catch (error) {
    resultLog.innerHTML = `<div style="color:#9b1c31;padding:0.5rem 0.8rem;background:#fee2e2;border-radius:8px;">❌ ${error.message}</div>`;
    btn.textContent = "📤 Enviar a estudiantes";
    showMessage(error.message, true);
  } finally {
    btn.disabled = false;
  }
}

async function sendPreguntaToStudents(evaluation, pregunta, btn, resultLog) {
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = "⏳ Enviando...";
  resultLog.style.display = "block";
  resultLog.innerHTML = "";

  try {
    const estudiantesData = await api(`/api/estudiantes?idDocenteCursoMateria=${evaluation.idDocenteCursoMateria}&pageSize=100`);
    const estudiantes = estudiantesData.items || estudiantesData || [];

    const vinculados = estudiantes.filter(e => e.telegramChatId);
    const sinVincular = estudiantes.filter(e => !e.telegramChatId);

    if (vinculados.length === 0) {
      throw new Error("Ningún estudiante ha vinculado su cuenta de Telegram todavía.");
    }

    let enviados = 0;
    let errores = 0;
    const logs = [];

    for (const estudiante of vinculados) {
      try {
        const r = await fetch("/start-class", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idLeccion: evaluation.idLeccion,
            idPregunta: pregunta.idPregunta,
            idEstudiante: estudiante.idEstudiante,
            topic: evaluation.tema || evaluation.titulo,
            studentChatId: String(estudiante.telegramChatId),
            puntaje: pregunta.puntaje || 10.0,
            pregunta: {
              question: pregunta.enunciado,
              options: {
                A: pregunta.opciones.find(o => o.literal === "A")?.texto || "",
                B: pregunta.opciones.find(o => o.literal === "B")?.texto || "",
                C: pregunta.opciones.find(o => o.literal === "C")?.texto || "",
                D: pregunta.opciones.find(o => o.literal === "D")?.texto || ""
              },
              correct: pregunta.respuestaCorrecta
            }
          })
        });
        const data = await r.json().catch(() => ({}));
        if (r.ok && data.ok !== false) {
          enviados++;
          logs.push(`✅ ${estudiante.nombres} ${estudiante.apellidos}`);
        } else if (data.ok === false && data.envio) {
          errores++;
          logs.push(`⚠️ ${estudiante.nombres} ${estudiante.apellidos}: Bot no iniciado — pídele que abra @${state.botUsername} en Telegram`);
        } else if (r.status === 409) {
          errores++;
          logs.push(`⚠️ ${estudiante.nombres} ${estudiante.apellidos}: ${data.error || "Tiene una evaluación activa"}`);
        } else {
          errores++;
          logs.push(`❌ ${estudiante.nombres} ${estudiante.apellidos}: ${data.error || "Error desconocido"}`);
        }
      } catch (e) {
        errores++;
        logs.push(`❌ ${estudiante.nombres} ${estudiante.apellidos}: ${e.message}`);
      }
    }

    const summary = document.createElement("div");
    summary.style.cssText = "padding:0.6rem 0.8rem;border-radius:8px;" + (errores === 0 ? "background:#dcfce7;color:#166534" : "background:#fef9c3;color:#713f12");
    summary.innerHTML = `<strong>${enviados} enviados</strong> · ${errores} errores · ${sinVincular.length} sin vincular Telegram`;
    resultLog.appendChild(summary);

    const logList = document.createElement("ul");
    logList.style.cssText = "margin:0.5rem 0 0;padding-left:1.2rem;";
    logs.forEach(l => {
      const li = document.createElement("li"); li.textContent = l; logList.appendChild(li);
    });
    if (sinVincular.length > 0) {
      const li = document.createElement("li");
      li.style.color = "#94a3b8";
      li.textContent = `⚠️ Sin Telegram: ${sinVincular.map(e => e.nombres).join(", ")}`;
      logList.appendChild(li);
    }
    resultLog.appendChild(logList);

    btn.textContent = enviados > 0 ? "✅ Enviado" : originalText;
    if (enviados > 0) showMessage(`Pregunta enviada a ${enviados} estudiante(s) por Telegram.`);

  } catch (error) {
    resultLog.innerHTML = `<div style="color:#9b1c31;padding:0.5rem 0.8rem;background:#fee2e2;border-radius:8px;">❌ ${error.message}</div>`;
    btn.textContent = originalText;
    showMessage(error.message, true);
  } finally {
    btn.disabled = false;
  }
}

async function toggleQuestions(evaluation, btn, container, resultLog) {
  if (container.style.display === "none") {
    container.style.display = "block";
    btn.textContent = "❓ Ocultar preguntas";
    
    container.innerHTML = '<p class="muted" style="font-size:0.85rem;padding:0.5rem 0;">⏳ Cargando preguntas...</p>';
    try {
      const preguntas = await api(`/api/lecciones/${evaluation.idLeccion}/preguntas`);
      container.innerHTML = "";
      
      if (!preguntas || preguntas.length === 0) {
        container.innerHTML = '<p class="muted" style="font-size:0.85rem;padding:0.5rem 0;font-style:italic;">No hay preguntas activas en esta evaluación.</p>';
        return;
      }
      
      const qList = document.createElement("ol");
      qList.style.cssText = "margin:0;padding-left:1.2rem;display:grid;gap:1rem;";
      
      preguntas.forEach((pregunta, idx) => {
        const qItem = document.createElement("li");
        qItem.style.cssText = "border-bottom:1px solid #f1f5f9;padding-bottom:0.75rem;";
        
        const content = document.createElement("p");
        content.style.cssText = "margin:0 0 0.5rem;font-weight:600;font-size:0.9rem;color:#1e293b;";
        content.textContent = pregunta.enunciado;
        
        const optsGrid = document.createElement("div");
        optsGrid.style.cssText = "display:grid;grid-template-columns:repeat(2, 1fr);gap:0.4rem;font-size:0.8rem;margin-bottom:0.6rem;";
        
        const opcA = pregunta.opciones.find(o => o.literal === "A")?.texto || "";
        const opcB = pregunta.opciones.find(o => o.literal === "B")?.texto || "";
        const opcC = pregunta.opciones.find(o => o.literal === "C")?.texto || "";
        const opcD = pregunta.opciones.find(o => o.literal === "D")?.texto || "";
        
        const createOptSpan = (lit, text) => {
          const span = document.createElement("span");
          span.style.cssText = "padding:4px 8px;border-radius:6px;background:#f8fafc;border:1px solid #f1f5f9;";
          if (pregunta.respuestaCorrecta === lit) {
            span.style.background = "#dcfce7";
            span.style.color = "#15803d";
            span.style.fontWeight = "700";
            span.style.borderColor = "#bbf7d0";
          }
          span.textContent = `${lit}) ${text}`;
          return span;
        };
        
        optsGrid.append(
          createOptSpan("A", opcA),
          createOptSpan("B", opcB),
          createOptSpan("C", opcC),
          createOptSpan("D", opcD)
        );
        
        const qActions = document.createElement("div");
        qActions.style.cssText = "display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.4rem;";
        
        const scoreInfo = document.createElement("span");
        scoreInfo.style.cssText = "font-size:0.75rem;color:#64748b;";
        scoreInfo.textContent = `Puntaje: ${pregunta.puntaje || 10.0} pts`;
        
        const sendQBtn = document.createElement("button");
        sendQBtn.textContent = "📤 Enviar esta pregunta";
        sendQBtn.style.cssText = "font-size:0.75rem;padding:0.25rem 0.6rem;border-radius:6px;";
        sendQBtn.addEventListener("click", () => sendPreguntaToStudents(evaluation, pregunta, sendQBtn, resultLog));
        
        qActions.append(scoreInfo, sendQBtn);
        qItem.append(content, optsGrid, qActions);
        qList.appendChild(qItem);
      });
      
      container.appendChild(qList);
    } catch (e) {
      container.innerHTML = `<p style="color:#9b1c31;font-size:0.85rem;padding:0.5rem 0;">❌ Error al cargar preguntas: ${e.message}</p>`;
    }
  } else {
    container.style.display = "none";
    btn.textContent = "❓ Ver preguntas";
  }
}

async function toggleResults(evaluation, btn, container) {
  if (container.style.display === "none") {
    container.style.display = "block";
    btn.textContent = "📊 Ocultar resultados";
    
    container.innerHTML = '<p class="muted" style="font-size:0.85rem;padding:0.5rem 0;">⏳ Cargando resultados...</p>';
    try {
      const resultados = await api(`/api/lecciones/${evaluation.idLeccion}/resultados`);
      container.innerHTML = "";
      
      if (!resultados || resultados.length === 0) {
        container.innerHTML = '<p class="muted" style="font-size:0.85rem;padding:0.5rem 0;font-style:italic;">Aún no hay respuestas o resultados para esta evaluación.</p>';
        return;
      }
      
      const tableWrapper = document.createElement("div");
      tableWrapper.style.cssText = "overflow-x:auto;margin-top:0.5rem;";
      
      const table = document.createElement("table");
      table.style.cssText = "width:100%;border-collapse:collapse;font-size:0.8rem;text-align:left;";
      
      const thead = document.createElement("thead");
      thead.innerHTML = `
        <tr style="border-bottom:2px solid #e2e8f0;color:#475569;">
          <th style="padding:0.5rem;">Estudiante</th>
          <th style="padding:0.5rem;text-align:center;">Resp.</th>
          <th style="padding:0.5rem;text-align:center;">Correctas</th>
          <th style="padding:0.5rem;text-align:center;">Incorrectas</th>
          <th style="padding:0.5rem;text-align:center;">Puntaje</th>
          <th style="padding:0.5rem;text-align:center;">%</th>
        </tr>
      `;
      
      const tbody = document.createElement("tbody");
      resultados.forEach((res, idx) => {
        const tr = document.createElement("tr");
        tr.style.cssText = idx % 2 === 0 ? "background:#f8fafc;border-bottom:1px solid #f1f5f9;" : "border-bottom:1px solid #f1f5f9;";
        
        const pctBadgeColor = res.porcentaje >= 70 ? "background:#dcfce7;color:#166534" : (res.porcentaje >= 40 ? "background:#fef9c3;color:#713f12" : "background:#fee2e2;color:#9b1c31");
        
        tr.innerHTML = `
          <td style="padding:0.5rem;font-weight:600;color:#1e293b;">${res.nombres || ""} ${res.apellidos || ""}</td>
          <td style="padding:0.5rem;text-align:center;">${res.preguntasRespondidas}/${res.totalPreguntas}</td>
          <td style="padding:0.5rem;text-align:center;color:#166534;font-weight:600;">${res.respuestasCorrectas}</td>
          <td style="padding:0.5rem;text-align:center;color:#9b1c31;">${res.respuestasIncorrectas}</td>
          <td style="padding:0.5rem;text-align:center;font-weight:600;">${res.puntajeObtenido}/${res.puntajeTotal}</td>
          <td style="padding:0.5rem;text-align:center;">
            <span style="font-size:0.7rem;padding:2px 6px;border-radius:4px;font-weight:bold;${pctBadgeColor}">${Math.round(res.porcentaje)}%</span>
          </td>
        `;
        tbody.appendChild(tr);
      });
      
      table.append(thead, tbody);
      tableWrapper.appendChild(table);
      container.appendChild(tableWrapper);
    } catch (e) {
      container.innerHTML = `<p style="color:#9b1c31;font-size:0.85rem;padding:0.5rem 0;">❌ Error al cargar resultados: ${e.message}</p>`;
    }
  } else {
    container.style.display = "none";
    btn.textContent = "📊 Ver resultados";
  }
}

function readQuestionForm() {
  const question = {
    contenido: $("#question-content").value.trim(),
    opciones: {
      A: $("#option-a").value.trim(),
      B: $("#option-b").value.trim(),
      C: $("#option-c").value.trim(),
      D: $("#option-d").value.trim()
    },
    claveRespuesta: $("#correct-answer").value
  };

  if (!question.contenido) {
    throw new Error("Escribe el enunciado de la pregunta.");
  }

  for (const [key, value] of Object.entries(question.opciones)) {
    if (!value) {
      throw new Error(`Completa la opcion ${key}.`);
    }
  }

  return question;
}

function resetQuestionForm() {
  $("#question-form").reset();
}

async function loadPanel() {
  const dashboard = await api("/api/dashboard");
  const asignaciones = await api("/api/asignaciones");
  const lecciones = await api("/api/lecciones");
  
  try {
    const estudiantesData = await api("/api/estudiantes?pageSize=100");
    state.students = estudiantesData.items || [];
  } catch (error) {
    console.error("Error al cargar estudiantes:", error);
    state.students = [];
  }

  try {
    const botInfo = await api("/api/bot-info");
    if (botInfo && botInfo.username) {
      state.botUsername = botInfo.username;
    }
  } catch (error) {
    console.error("Error al obtener info del bot:", error);
  }

  state.courses = asignaciones || [];

  $("#teacher-name").textContent = `${state.teacher.nombres} ${state.teacher.apellidos}`;
  $("#total-courses").textContent = dashboard.totalAsignaciones;
  $("#total-evaluations").textContent = dashboard.totalLecciones;
  $("#total-questions").textContent = dashboard.preguntasPendientesEnvio;
  $("#total-answers").textContent = dashboard.totalEstudiantes;

  renderCourses(state.courses);
  populateEnrollCourseSelect();
  renderEvaluations(lecciones.items || lecciones);
  renderQuestions();
  renderStudents();
  renderAccessCodes();
  initChatbot();

  $("#login-card").classList.add("hidden");
  $("#panel").classList.remove("hidden");
}

$("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const session = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        correo: $("#email").value,
        password: $("#password").value
      })
    });

    setSession(session);
    await loadPanel();
    showMessage("Sesion iniciada.");
  } catch (error) {
    showMessage(error.message, true);
  }
});

$("#logout").addEventListener("click", () => {
  clearSession();
  showMessage("Sesion cerrada.");
});

$("#question-form").addEventListener("submit", (event) => {
  event.preventDefault();

  try {
    state.pendingQuestions.push(readQuestionForm());
    resetQuestionForm();
    renderQuestions();
    showMessage("Pregunta agregada a la evaluacion.");
  } catch (error) {
    showMessage(error.message, true);
  }
});

function getExistingQuestionsForGeneration() {
  return state.pendingQuestions.map((q) => q.contenido).filter(Boolean);
}

$("#generate-question").addEventListener("click", async () => {
  const topic = $("#topic").value.trim();

  if (!topic) {
    showMessage("Escribe un tema antes de generar la pregunta.", true);
    return;
  }

  try {
    const existingQuestions = getExistingQuestionsForGeneration();
    const data = await api("/api/questions/generate", {
      method: "POST",
      body: JSON.stringify({
        topic,
        existingQuestions,
        questionIndex: existingQuestions.length + 1,
        totalQuestions: existingQuestions.length + 1
      })
    });

    $("#question-content").value = data.pregunta.contenido;
    $("#option-a").value = data.pregunta.opciones.A;
    $("#option-b").value = data.pregunta.opciones.B;
    $("#option-c").value = data.pregunta.opciones.C;
    $("#option-d").value = data.pregunta.opciones.D;
    $("#correct-answer").value = data.pregunta.claveRespuesta;
    showMessage("Pregunta generada. Revisala antes de agregarla.");
  } catch (error) {
    showMessage(error.message, true);
  }
});

$("#save-evaluation").addEventListener("click", async () => {
  const title = $("#evaluation-title").value.trim();
  const courseId = $("#course").value;
  const topic = $("#topic").value.trim();

  if (!title || !courseId || !topic) {
    showMessage("Completa titulo, curso y tema.", true);
    return;
  }

  if (!state.pendingQuestions.length) {
    showMessage("Agrega al menos una pregunta.", true);
    return;
  }

  try {
    const leccion = await api("/api/lecciones", {
      method: "POST",
      body: JSON.stringify({
        idDocenteCursoMateria: Number(courseId),
        titulo: title,
        descripcion: $("#description").value,
        tema: topic,
        creadaConIa: false
      })
    });

    for (let i = 0; i < state.pendingQuestions.length; i++) {
      const q = state.pendingQuestions[i];
      await api(`/api/lecciones/${leccion.idLeccion}/preguntas`, {
        method: "POST",
        body: JSON.stringify({
          enunciado: q.contenido,
          tipoPregunta: "OpcionMultiple",
          respuestaCorrecta: q.claveRespuesta,
          explicacion: "",
          puntaje: 10.0,
          orden: i + 1,
          opciones: [
            { literal: "A", texto: q.opciones.A, esCorrecta: q.claveRespuesta === "A" },
            { literal: "B", texto: q.opciones.B, esCorrecta: q.claveRespuesta === "B" },
            { literal: "C", texto: q.opciones.C, esCorrecta: q.claveRespuesta === "C" },
            { literal: "D", texto: q.opciones.D, esCorrecta: q.claveRespuesta === "D" }
          ]
        })
      });
    }

    state.pendingQuestions = [];
    $("#evaluation-form").reset();
    resetQuestionForm();
    await loadPanel();
    showMessage("Evaluacion guardada correctamente.");
  } catch (error) {
    showMessage(error.message, true);
  }
});

function populateEnrollCourseSelect() {
  const select = $("#enroll-course-select");
  select.innerHTML = '<option value="">Selecciona una materia...</option>';
  
  state.courses.forEach((course) => {
    const option = document.createElement("option");
    option.value = course.idDocenteCursoMateria;
    option.dataset.idCurso = course.idCurso;
    option.textContent = `${course.materia} - ${course.nivel} ${course.paralelo}`;
    select.appendChild(option);
  });
}

function renderStudents() {
  const list = $("#students-list");
  list.innerHTML = "";

  const enrollStudentSelect = $("#enroll-student-select");
  const originalStudentValue = enrollStudentSelect.value;
  enrollStudentSelect.innerHTML = '<option value="">Selecciona un estudiante...</option>';

  if (!state.students.length) {
    list.innerHTML = "<li>Aún no hay estudiantes registrados.</li>";
    return;
  }

  state.students.forEach((student) => {
    const item = document.createElement("li");
    item.style.display = "flex";
    item.style.justifyContent = "space-between";
    item.style.alignItems = "center";
    item.style.padding = "0.75rem";
    item.style.borderBottom = "1px solid #eef2f5";

    const info = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = `${student.nombres || "Sin Nombre"} ${student.apellidos || ""}`;
    
    const details = document.createElement("p");
    details.style.margin = "0.2rem 0 0";
    details.style.fontSize = "0.85rem";
    details.style.color = "#61758a";
    details.textContent = `Correo: ${student.correo || "N/A"} | Teléfono Telegram: ${student.telefonoTelegram} | Código: ${student.codigoEstudiante || "N/A"}`;
    
    if (student.telegramChatId) {
      const tag = document.createElement("span");
      tag.style.background = "#20bfa3";
      tag.style.color = "white";
      tag.style.padding = "2px 6px";
      tag.style.borderRadius = "4px";
      tag.style.fontSize = "0.7rem";
      tag.style.marginLeft = "8px";
      tag.textContent = "Vinculado";
      name.appendChild(tag);
    } else {
      const tag = document.createElement("span");
      tag.style.background = "#e0a96d";
      tag.style.color = "white";
      tag.style.padding = "2px 6px";
      tag.style.borderRadius = "4px";
      tag.style.fontSize = "0.7rem";
      tag.style.marginLeft = "8px";
      tag.textContent = "Pendiente Bot";
      name.appendChild(tag);
    }

    info.append(name, details);
    item.appendChild(info);
    list.appendChild(item);

    const option = document.createElement("option");
    option.value = student.idEstudiante;
    option.textContent = `${student.nombres} ${student.apellidos} (${student.telefonoTelegram})`;
    enrollStudentSelect.appendChild(option);
  });

  enrollStudentSelect.value = originalStudentValue;
}

$("#student-register-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const nombres = $("#student-nombres").value.trim();
  const apellidos = $("#student-apellidos").value.trim();
  const correo = $("#student-correo").value.trim();
  const codigo = $("#student-codigo").value.trim() || null;
  const telefono = $("#student-telefono").value.trim();

  try {
    await api("/api/estudiantes", {
      method: "POST",
      body: JSON.stringify({
        nombres,
        apellidos,
        correo,
        codigoEstudiante: codigo,
        telefonoTelegram: telefono,
        telegramChatId: null,
        telegramUsername: null
      })
    });

    $("#student-register-form").reset();
    showMessage("Estudiante registrado con éxito.");
    await loadPanel();
  } catch (error) {
    showMessage(error.message, true);
  }
});

$("#student-enroll-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const studentId = $("#enroll-student-select").value;
  const courseSelect = $("#enroll-course-select");
  const selectedOption = courseSelect.options[courseSelect.selectedIndex];
  const assignmentId = courseSelect.value;
  const courseId = selectedOption ? selectedOption.dataset.idCurso : null;

  if (!studentId || !assignmentId || !courseId) {
    showMessage("Selecciona un estudiante y una materia.", true);
    return;
  }

  try {
    await api(`/api/estudiantes/${studentId}/cursos`, {
      method: "POST",
      body: JSON.stringify({ idCurso: Number(courseId) })
    });

    await api(`/api/estudiantes/${studentId}/materias`, {
      method: "POST",
      body: JSON.stringify({ idDocenteCursoMateria: Number(assignmentId) })
    });

    $("#student-enroll-form").reset();
    showMessage("Estudiante matriculado con éxito en la asignatura.");
    await loadPanel();
  } catch (error) {
    showMessage(error.message, true);
  }
});

function renderAccessCodes() {
  const container = $("#codes-container");
  container.innerHTML = "";

  if (!state.courses.length) {
    container.innerHTML = "<p class='muted'>No tienes materias asignadas.</p>";
    return;
  }

  state.courses.forEach((course) => {
    const card = document.createElement("div");
    card.className = "code-card";

    const header = document.createElement("div");
    header.className = "code-card-header";
    
    const title = document.createElement("h3");
    title.textContent = course.materia;
    
    const subtitle = document.createElement("p");
    subtitle.textContent = `${course.nivel} - Paralelo ${course.paralelo} (${course.anioLectivo})`;
    
    header.append(title, subtitle);

    const display = document.createElement("div");
    display.className = "code-display";

    if (course.codigoAcceso) {
      const badge = document.createElement("div");
      badge.className = "code-badge";
      badge.textContent = course.codigoAcceso;

      const link = document.createElement("a");
      link.className = "code-link";
      const inviteUrl = `https://t.me/${state.botUsername}?start=${course.codigoAcceso}`;
      link.href = inviteUrl;
      link.target = "_blank";
      link.textContent = inviteUrl;
      link.title = "Abrir en Telegram";

      display.append(badge, link);
    } else {
      const noCode = document.createElement("span");
      noCode.className = "muted";
      noCode.style.fontStyle = "italic";
      noCode.style.fontSize = "0.9rem";
      noCode.textContent = "Sin código generado";
      display.append(noCode);
    }

    const actions = document.createElement("div");
    actions.className = "code-actions";

    const generateBtn = document.createElement("button");
    generateBtn.type = "button";
    generateBtn.textContent = course.codigoAcceso ? "Regenerar Código" : "Generar Código";
    generateBtn.addEventListener("click", async () => {
      try {
        await api(`/api/asignaciones/${course.idDocenteCursoMateria}/generar-codigo`, {
          method: "POST"
        });
        showMessage("Código generado exitosamente.");
        await loadPanel();
      } catch (error) {
        showMessage(error.message, true);
      }
    });

    actions.append(generateBtn);

    if (course.codigoAcceso) {
      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "secondary";
      copyBtn.textContent = "Copiar Enlace";
      copyBtn.addEventListener("click", () => {
        const inviteUrl = `https://t.me/${state.botUsername}?start=${course.codigoAcceso}`;
        navigator.clipboard.writeText(inviteUrl).then(() => {
          showMessage("¡Enlace copiado al portapapeles!");
        }).catch((err) => {
          console.error("Error al copiar enlace:", err);
          showMessage("No se pudo copiar el enlace automáticamente.", true);
        });
      });
      actions.append(copyBtn);
    }

    card.append(header, display, actions);
    container.appendChild(card);
  });
}

// Lógica del Asistente Chatbot
function addChatBubble(sender, text) {
  const container = $("#chat-messages");
  if (!container) return;
  
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${sender}`;
  bubble.textContent = text;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  return bubble;
}

function addLoadingBubble(text) {
  const container = $("#chat-messages");
  if (!container) return;

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble loading";
  bubble.textContent = text;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  return bubble;
}

function initChatbot() {
  const container = $("#chat-messages");
  if (!container) return;

  container.innerHTML = "";
  addChatBubble(
    "assistant",
    `¡Hola! Soy tu asistente de Comprendo. Estoy aquí para ayudarte a generar lecciones interactivas en un instante. 🚀\n\nPara comenzar, solo necesito que ingreses:\n• El tema de la lección, junto con sus delimitaciones.\n• El número de preguntas que deseas generar (pueden ser de 1 a 5).\n\n¿Qué tema trabajaremos hoy?`
  );
}

function parseChatInput(userText) {
  let numQuestions = 3; // valor por defecto

  // Intentar buscar números del 1 al 5 en formato numérico
  const numMatch = userText.match(/\b([1-5])\b/);
  if (numMatch) {
    numQuestions = parseInt(numMatch[1], 10);
  } else {
    // Intentar buscar números en palabras
    const spanishNumbers = { "uno": 1, "dos": 2, "tres": 3, "cuatro": 4, "cinco": 5 };
    for (const [word, val] of Object.entries(spanishNumbers)) {
      if (new RegExp(`\\b${word}\\b`, 'i').test(userText)) {
        numQuestions = val;
        break;
      }
    }
  }

  // Limpiar el tema quitando el número y frases comunes de control
  let cleanTopic = userText
    .replace(/\b[1-5]\s*(preguntas|pregunta|q)?/gi, "")
    .replace(/\b(uno|dos|tres|cuatro|cinco)\s*(preguntas|pregunta)?/gi, "")
    .replace(/generar|crear|haz|dame|asistente|lecciones|lección|leccion/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[,;.\-\s\/\\]+|[,;.\-\s\/\\]+$/g, "") // Eliminar comas, puntos o guiones al inicio o final
    .trim();

  if (!cleanTopic) {
    cleanTopic = userText.trim();
  }

  return { cleanTopic, numQuestions };
}

// Evento de envío del Chatbot
$("#chat-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = $("#chat-input");
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  addChatBubble("user", text);

  const { cleanTopic, numQuestions } = parseChatInput(text);

  // Auto-completar el formulario tradicional para mantener consistencia visual
  $("#topic").value = cleanTopic;
  if (!$("#evaluation-title").value) {
    $("#evaluation-title").value = `Lección: ${cleanTopic}`;
  }

  const loadingBubble = addLoadingBubble(`Analizando tema y preparando la generación de ${numQuestions} pregunta(s)...`);

  try {
    const generatedList = [];
    const baseExisting = getExistingQuestionsForGeneration();

    for (let i = 1; i <= numQuestions; i++) {
      loadingBubble.textContent = `🤖 Generando pregunta ${i} de ${numQuestions} sobre "${cleanTopic}"...`;

      const existingQuestions = [
        ...baseExisting,
        ...generatedList.map((q) => q.contenido)
      ];

      const data = await api("/api/questions/generate", {
        method: "POST",
        body: JSON.stringify({
          topic: cleanTopic,
          existingQuestions,
          questionIndex: i,
          totalQuestions: numQuestions
        })
      });

      if (data && data.pregunta) {
        generatedList.push({
          contenido: data.pregunta.contenido,
          opciones: {
            A: data.pregunta.opciones.A,
            B: data.pregunta.opciones.B,
            C: data.pregunta.opciones.C,
            D: data.pregunta.opciones.D
          },
          claveRespuesta: data.pregunta.claveRespuesta
        });
      }
    }

    loadingBubble.remove();

    if (generatedList.length > 0) {
      // Agregar al estado general
      state.pendingQuestions.push(...generatedList);
      renderQuestions();

      addChatBubble(
        "assistant",
        `🎉 ¡Excelente! He generado con éxito **${generatedList.length}** pregunta(s) sobre el tema **"${cleanTopic}"**.\n\nLas preguntas han sido añadidas automáticamente a tu lista de preguntas pendientes abajo. Puedes revisarlas y guardarlas en tu evaluación cuando gustes.\n\n¿Qué otro tema te gustaría trabajar?`
      );
      showMessage(`Se generaron ${generatedList.length} preguntas de IA.`);
    } else {
      addChatBubble("assistant", `⚠️ No se pudo generar ninguna pregunta para el tema "${cleanTopic}". Por favor intenta describiendo el tema con otras palabras.`);
    }
  } catch (error) {
    if (loadingBubble) loadingBubble.remove();
    addChatBubble("assistant", `❌ Ocurrió un error al generar las preguntas: ${error.message}`);
    showMessage("Error al generar preguntas con el chatbot.", true);
  }
});

if (state.token) {
  loadPanel().catch((err) => {
    console.error("Error al cargar panel inicial:", err);
    clearSession();
    showMessage("Tu sesion expiro. Inicia sesion nuevamente.", true);
  });
} else {
  renderQuestions();
}

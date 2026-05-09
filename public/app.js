const state = {
  token: localStorage.getItem("comprendoToken"),
  teacher: null,
  courses: [],
  pendingQuestions: []
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
  const data = await response.json();

  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "No se pudo completar la solicitud.");
  }

  return data;
}

function setSession(session) {
  state.token = session.token;
  state.teacher = session.docente;
  state.courses = session.cursos || [];
  localStorage.setItem("comprendoToken", session.token);
}

function clearSession() {
  state.token = null;
  state.teacher = null;
  state.courses = [];
  state.pendingQuestions = [];
  localStorage.removeItem("comprendoToken");
  $("#panel").classList.add("hidden");
  $("#login-card").classList.remove("hidden");
}

function renderCourses(courses) {
  const select = $("#course");
  select.innerHTML = "";

  for (const course of courses) {
    const option = document.createElement("option");
    option.value = course.id;
    option.textContent = `${course.nombreCurso} (${course.periodoLectivo})`;
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
    list.textContent = "No hay evaluaciones guardadas todavia.";
    return;
  }

  for (const evaluation of evaluations) {
    const item = document.createElement("article");
    const title = document.createElement("strong");
    const details = document.createElement("p");
    const meta = document.createElement("small");

    item.className = "evaluation-item";
    title.textContent = evaluation.titulo;
    details.textContent = `${evaluation.cursoNombre} - ${evaluation.temaTitulo}`;
    meta.textContent = `${evaluation.totalPreguntas} pregunta(s) | ${new Date(evaluation.fechaCreacion).toLocaleString()}`;

    item.append(title, details, meta);
    list.appendChild(item);
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
  const dashboard = await api("/api/panel");
  const evaluations = await api("/api/evaluations");

  state.teacher = dashboard.docente;
  state.courses = dashboard.cursos;

  $("#teacher-name").textContent = dashboard.docente.nombreCompleto;
  $("#total-courses").textContent = dashboard.resumen.totalCursos;
  $("#total-evaluations").textContent = dashboard.resumen.totalEvaluaciones;
  $("#total-questions").textContent = dashboard.resumen.totalPreguntas;
  $("#total-answers").textContent = dashboard.resumen.totalRespuestas;

  renderCourses(dashboard.cursos);
  renderEvaluations(evaluations.evaluaciones);
  renderQuestions();

  $("#login-card").classList.add("hidden");
  $("#panel").classList.remove("hidden");
}

$("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const session = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: $("#email").value,
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

$("#generate-question").addEventListener("click", async () => {
  const topic = $("#topic").value.trim();

  if (!topic) {
    showMessage("Escribe un tema antes de generar la pregunta.", true);
    return;
  }

  try {
    const data = await api("/api/questions/generate", {
      method: "POST",
      body: JSON.stringify({ topic })
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
    await api("/api/evaluations", {
      method: "POST",
      body: JSON.stringify({
        titulo: title,
        cursoId,
        temaTitulo: topic,
        descripcion: $("#description").value,
        preguntas: state.pendingQuestions
      })
    });

    state.pendingQuestions = [];
    $("#evaluation-form").reset();
    resetQuestionForm();
    await loadPanel();
    showMessage("Evaluacion guardada correctamente.");
  } catch (error) {
    showMessage(error.message, true);
  }
});

if (state.token) {
  loadPanel().catch(() => {
    clearSession();
    showMessage("Tu sesion expiro. Inicia sesion nuevamente.", true);
  });
} else {
  renderQuestions();
}

const state = {
  token: localStorage.getItem("comprendoToken"),
  teacher: JSON.parse(localStorage.getItem("comprendoTeacher") || "null"),
  courses: [],
  students: [],
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
    details.textContent = evaluation.tema || 'Tema';
    meta.textContent = `${evaluation.numeroPreguntas || 0} pregunta(s) | ${new Date(evaluation.fechaCreacion).toLocaleString()}`;

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
          tipoPregunta: "OPCION_MULTIPLE",
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

if (state.token) {
  loadPanel().catch((err) => {
    console.error("Error al cargar panel inicial:", err);
    clearSession();
    showMessage("Tu sesion expiro. Inicia sesion nuevamente.", true);
  });
} else {
  renderQuestions();
}

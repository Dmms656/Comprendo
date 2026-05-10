import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createMemoryStore, demoCredentials } from "../src/dataStore.js";

async function login(app) {
  const res = await request(app)
    .post("/api/auth/login")
    .send(demoCredentials)
    .expect(200);

  return res.body;
}

test("POST /api/auth/login autentica al docente demo", async () => {
  const app = createApp({ store: createMemoryStore() });
  const res = await request(app)
    .post("/api/auth/login")
    .send(demoCredentials)
    .expect(200);

  assert.equal(res.body.ok, true);
  assert.ok(res.body.token);
  assert.equal(res.body.docente.email, demoCredentials.email);
  assert.equal(res.body.cursos.length, 1);
});

test("GET /api/panel requiere sesion docente", async () => {
  const app = createApp({ store: createMemoryStore() });
  const res = await request(app).get("/api/panel").expect(401);

  assert.equal(res.body.ok, false);
});

test("POST /api/evaluations valida campos obligatorios", async () => {
  const app = createApp({ store: createMemoryStore() });
  const session = await login(app);

  const res = await request(app)
    .post("/api/evaluations")
    .set("Authorization", `Bearer ${session.token}`)
    .send({ titulo: "" })
    .expect(400);

  assert.equal(res.body.ok, false);
});

test("POST /api/evaluations guarda evaluacion con preguntas", async () => {
  const app = createApp({ store: createMemoryStore() });
  const session = await login(app);
  const courseId = session.cursos[0].id;

  const res = await request(app)
    .post("/api/evaluations")
    .set("Authorization", `Bearer ${session.token}`)
    .send({
      titulo: "Cierre de clase",
      cursoId: courseId,
      temaTitulo: "Fracciones equivalentes",
      preguntas: [
        {
          contenido: "Que fraccion equivale a 1/2?",
          opciones: {
            A: "1/3",
            B: "2/4",
            C: "3/5",
            D: "4/9"
          },
          claveRespuesta: "B"
        }
      ]
    })
    .expect(201);

  assert.equal(res.body.ok, true);
  assert.equal(res.body.evaluacion.preguntas.length, 1);
  assert.equal(res.body.evaluacion.preguntas[0].claveRespuesta, "B");
});

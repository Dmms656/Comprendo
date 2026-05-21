import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.join(__dirname, "src", "index.js");

console.log("Cargando index.js para pruebas unitarias...");
const code = fs.readFileSync(indexPath, "utf8");

// Extraer la función normalizePregunta del archivo original
const normalizeFuncMatch = code.match(/function normalizePregunta\([\s\S]*?\n\}/);
if (!normalizeFuncMatch) {
  console.error("❌ No se pudo encontrar la función normalizePregunta en index.js");
  process.exit(1);
}

const normalizePreguntaStr = normalizeFuncMatch[0];
console.log("Función normalizePregunta extraída con éxito.");

// Crear un entorno de ejecución dinámico para la función
const normalizePregunta = new Function("pregunta", `
  ${normalizePreguntaStr}
  return normalizePregunta(pregunta);
`);

// Casos de prueba para normalizePregunta
const testCases = [
  {
    name: "Caso 1: Usando literalCorrecto",
    pregunta: {
      id: 1,
      enunciado: "Pregunta 1",
      opciones: [
        { literal: "A", texto: "Opción A" },
        { literal: "B", texto: "Opción B" }
      ],
      literalCorrecto: "B"
    },
    expectedCorrect: "B"
  },
  {
    name: "Caso 2: Usando respuestaCorrecta (C# API style)",
    pregunta: {
      idPregunta: 2,
      question: "Pregunta 2",
      opciones: {
        A: "Opción A",
        B: "Opción B"
      },
      respuestaCorrecta: "A"
    },
    expectedCorrect: "A"
  },
  {
    name: "Caso 3: Usando claveRespuesta (IA response style)",
    pregunta: {
      id: 3,
      contenido: "Pregunta 3",
      options: {
        A: "Opción A",
        B: "Opción B"
      },
      claveRespuesta: "B"
    },
    expectedCorrect: "B"
  },
  {
    name: "Caso 4: Usando correct",
    pregunta: {
      id: 4,
      enunciado: "Pregunta 4",
      options: {
        A: "Opción A",
        B: "Opción B"
      },
      correct: "A"
    },
    expectedCorrect: "A"
  }
];

let failed = false;

console.log("\n--- INICIANDO PRUEBAS DE NORMALIZACIÓN ---");
for (const tc of testCases) {
  try {
    const result = normalizePregunta(tc.pregunta);
    if (result.correct === tc.expectedCorrect) {
      console.log(`✅ ${tc.name}: PASÓ (correct = "${result.correct}")`);
    } else {
      console.error(`❌ ${tc.name}: FALLÓ. Esperado "${tc.expectedCorrect}", obtenido "${result.correct}"`);
      failed = true;
    }
  } catch (err) {
    console.error(`❌ ${tc.name}: ERROR durante ejecución.`, err);
    failed = true;
  }
}

// Probar normalización de respuestas de estudiantes
console.log("\n--- INICIANDO PRUEBAS DE RESPUESTAS DE ESTUDIANTES ---");

// Extraer dinámicamente el fragmento de código de normalización de respuestas de index.js
const normalizacionRegex = /let text = \(msg\.text \|\| ""\)[\s\S]*?text = text\.replace\(\/OPCIÓN\|OPCION\|RESPUESTA\|SELECCIONO\|ELEGIR\|\\s\|\\\.\/g, ""\);\s*\}/;
const normMatch = code.match(normalizacionRegex);

if (!normMatch) {
  console.error("❌ No se pudo encontrar el fragmento de normalización de respuestas en index.js");
  process.exit(1);
}

const textNormalizationCode = `
  const msg = { text: msgText };
  const chatId = 123456789;
  ${normMatch[0]}
  return text;
`;

const normalizeStudentResponse = new Function("msgText", textNormalizationCode);

const responseTestCases = [
  { input: "A", expected: "A" },
  { input: "b", expected: "B" },
  { input: "opción C", expected: "C" },
  { input: "opcion D", expected: "D" },
  { input: "Respuesta A", expected: "A" },
  { input: "selecciono B", expected: "B" },
  { input: "elegir C", expected: "C" },
  { input: " A. ", expected: "A" },
  // Nuevos casos soportados con Regex y emojis
  { input: "la A", expected: "A" },
  { input: "el B", expected: "B" },
  { input: "Letra C", expected: "C" },
  { input: "opción: D", expected: "D" },
  { input: "La respuesta es la B", expected: "B" },
  { input: "🅰️", expected: "A" },
  { input: "🅱️", expected: "B" },
  { input: "🅲", expected: "C" },
  { input: "🅳️", expected: "D" }
];

for (const tc of responseTestCases) {
  const result = normalizeStudentResponse(tc.input);
  if (result === tc.expected) {
    console.log(`✅ Normalización de "${tc.input}" -> "${result}": PASÓ`);
  } else {
    console.error(`❌ Normalización de "${tc.input}": FALLÓ. Esperado "${tc.expected}", obtenido "${result}"`);
    failed = true;
  }
}

if (failed) {
  console.log("\n❌ Algunas pruebas fallaron.");
  process.exit(1);
} else {
  console.log("\n🎉 ¡Todas las pruebas de normalización pasaron correctamente!");
  process.exit(0);
}

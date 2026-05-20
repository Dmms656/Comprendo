// ─────────────────────────────────────────────────────────────────
// Servicio de generación de preguntas con IA
// Cadena de fallback: Gemini → Groq → pregunta hardcodeada
// ─────────────────────────────────────────────────────────────────

const FALLBACK_QUESTION = {
  question: "¿Cuál es la principal función de la mitocondria en la célula?",
  options: {
    A: "Sintetizar proteínas",
    B: "Producir energía (ATP)",
    C: "Almacenar el ADN",
    D: "Filtrar sustancias tóxicas"
  },
  correct: "B"
};

// ── URLs y modelos ────────────────────────────────────────────────
const GEMINI_MODEL  = process.env.GEMINI_MODEL  || "gemini-2.0-flash";
const GEMINI_URL    = () =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

const GROQ_URL      = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL    = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

// ── Prompt compartido ─────────────────────────────────────────────
const systemPrompt =
  "Eres un asistente educativo. Devuelve SOLO JSON válido sin markdown ni texto extra. " +
  "Cada pregunta debe ser única: distinto enunciado, distinto concepto evaluado y distintas opciones.";

const FOCUS_ANGLES = [
  "definiciones y conceptos fundamentales",
  "aplicación práctica o resolución de problemas",
  "comparación, causas y consecuencias",
  "análisis de ejemplos o situaciones concretas",
  "errores frecuentes, excepciones o matices del tema"
];

function normalizeQuestionText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractQuestionText(item) {
  if (!item) return "";
  if (typeof item === "string") return item;
  return item.question || item.contenido || item.enunciado || "";
}

function wordSimilarity(a, b) {
  const wordsA = new Set(normalizeQuestionText(a).split(" ").filter((w) => w.length > 3));
  const wordsB = new Set(normalizeQuestionText(b).split(" ").filter((w) => w.length > 3));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }
  const union = wordsA.size + wordsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** Devuelve true si la pregunta es demasiado parecida a alguna existente. */
export function isDuplicateQuestion(newQuestion, existingQuestions) {
  const newText = normalizeQuestionText(extractQuestionText(newQuestion));
  if (!newText) return false;

  for (const existing of existingQuestions) {
    const existingText = normalizeQuestionText(extractQuestionText(existing));
    if (!existingText) continue;
    if (newText === existingText) return true;
    if (newText.includes(existingText) || existingText.includes(newText)) return true;
    if (wordSimilarity(newText, existingText) >= 0.6) return true;
  }
  return false;
}

function userPrompt(topic, { existingQuestions = [], questionIndex = 1, totalQuestions = 1 } = {}) {
  const focus = FOCUS_ANGLES[(questionIndex - 1) % FOCUS_ANGLES.length];

  let exclusionBlock = "";
  if (existingQuestions.length > 0) {
    const listed = existingQuestions
      .map((q, i) => `${i + 1}. ${extractQuestionText(q)}`)
      .join("\n");
    exclusionBlock = `
IMPORTANTE: Ya existen estas preguntas sobre el mismo tema. NO repitas enunciado, idea central ni estructura.
Genera una pregunta claramente DIFERENTE (otro aspecto, otro escenario, otra formulación):
${listed}
`;
  }

  const batchHint =
    totalQuestions > 1
      ? `\nEsta es la pregunta ${questionIndex} de ${totalQuestions}. Debe cubrir un aspecto distinto a las anteriores.`
      : "";

  return `Genera 1 pregunta de opción múltiple ORIGINAL sobre el tema: "${topic}".
Enfócate en: ${focus}.${batchHint}${exclusionBlock}
La pregunta debe ser distinta a cualquier otra del mismo tema (distinto enunciado y concepto evaluado).
Responde ÚNICAMENTE con este JSON (sin texto adicional):
{"question":"<enunciado>","options":{"A":"<texto>","B":"<texto>","C":"<texto>","D":"<texto>"},"correct":"<A|B|C|D>"}`;
}

// ── Llamada a Gemini ──────────────────────────────────────────────
async function callGemini(topic, promptOptions) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY no configurada");

  console.log(`[AI] Gemini call → model="${GEMINI_MODEL}", topic="${topic}"`);

  const res = await fetch(GEMINI_URL(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: systemPrompt + "\n\n" + userPrompt(topic, promptOptions) }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 400
      }
    }),
    signal: AbortSignal.timeout(10000)   // 10 s timeout
  });

  const data = await res.json();

  if (!res.ok) {
    const code    = data?.error?.code;
    const message = data?.error?.message || res.statusText;
    throw new Error(`Gemini ${res.status} (${code}): ${message}`);
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini: respuesta vacía o formato inesperado");

  return text;
}

// ── Llamada a Groq (OpenAI-compatible) ───────────────────────────
async function callGroq(topic, promptOptions) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY no configurada");

  console.log(`[AI] Groq call → model="${GROQ_MODEL}", topic="${topic}"`);

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt(topic, promptOptions) }
      ],
      temperature: 0.85,
      max_tokens: 400
    }),
    signal: AbortSignal.timeout(10000)   // 10 s timeout
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Groq ${res.status}: ${JSON.stringify(data?.error || data)}`);
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq: respuesta vacía o formato inesperado");

  return text;
}

// ── Parser compartido ─────────────────────────────────────────────
function parseQuestion(text) {
  if (!text || typeof text !== "string") return null;

  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end   = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  let parsed;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }

  if (
    !parsed.question   ||
    !parsed.options?.A ||
    !parsed.options?.B ||
    !parsed.options?.C ||
    !parsed.options?.D ||
    !["A", "B", "C", "D"].includes(parsed.correct)
  ) {
    console.warn("[AI] Formato de pregunta inválido:", parsed);
    return null;
  }

  return parsed;
}

// ── Función principal exportada — cadena Gemini → Groq → fallback ─
/**
 * @param {string} topic
 * @param {{ existingQuestions?: Array<string|object>, questionIndex?: number, totalQuestions?: number, maxRetries?: number }} [options]
 */
export async function generateQuestion(topic, options = {}) {
  const {
    existingQuestions = [],
    questionIndex = 1,
    totalQuestions = 1,
    maxRetries = 3
  } = options;

  const promptOptions = { existingQuestions, questionIndex, totalQuestions };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const providers = [
      { name: "Gemini", call: () => callGemini(topic, promptOptions) },
      { name: "Groq",   call: () => callGroq(topic, promptOptions)   }
    ];

    for (const provider of providers) {
      try {
        const rawText = await provider.call();
        const parsed  = parseQuestion(rawText);

        if (parsed) {
          if (isDuplicateQuestion(parsed, existingQuestions)) {
            console.warn(
              `[AI] ${provider.name}: pregunta duplicada o muy similar (intento ${attempt}/${maxRetries}). Reintentando...`
            );
            continue;
          }

          console.log(
            `[AI] ✅ Pregunta ${questionIndex}/${totalQuestions} generada por ${provider.name} para tema: "${topic}"`
          );
          return parsed;
        }

        console.warn(`[AI] ${provider.name}: respuesta recibida pero formato inválido. Intentando siguiente proveedor.`);
      } catch (error) {
        console.warn(`[AI] ${provider.name} falló: ${error.message}. Intentando siguiente proveedor...`);
      }
    }
  }

  console.error("[AI] ⚠️  Todos los proveedores fallaron o devolvieron duplicados. Usando pregunta de respaldo.");
  return FALLBACK_QUESTION;
}

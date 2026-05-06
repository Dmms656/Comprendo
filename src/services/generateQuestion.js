const fallback = {
  question: "¿Cuál es el valor de x en 2x + 3 = 11?",
  options: {
    A: "3",
    B: "4",
    C: "5",
    D: "6"
  },
  correct: "B"
};

const ZHIPU_CHAT_URL =
  process.env.ZHIPU_API_URL ||
  "https://open.bigmodel.cn/api/paas/v4/chat/completions";

export async function generateQuestion(topic) {
  try {
    const apiKey = process.env.ZHIPU_API_KEY;
    if (!apiKey) {
      console.error("Zhipu AI: falta ZHIPU_API_KEY");
      return fallback;
    }

    const model = process.env.ZHIPU_MODEL || "glm-4-flash";

    const response = await fetch(ZHIPU_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "Devuelve solo JSON valido. No uses markdown."
          },
          {
            role: "user",
            content: `Genera 1 pregunta coherente de opcion multiple con una sola opción valida sobre ${topic}.
Devuelve SOLO este formato JSON:
{"question":"texto","options":{"A":"texto","B":"texto","C":"texto","D":"texto"},"correct":"A"}`
          }
        ],
        temperature: 0.2,
        max_tokens: 512
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Zhipu AI error:", JSON.stringify(data));
      return fallback;
    }

    let text = data?.choices?.[0]?.message?.content;

    if (!text || typeof text !== "string") {
      console.error("Zhipu AI contenido vacío:", JSON.stringify(data));
      return fallback;
    }

    text = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      console.error("No se encontro JSON valido en:", text);
      return fallback;
    }

    const jsonText = text.slice(firstBrace, lastBrace + 1);
    const parsed = JSON.parse(jsonText);

    if (
      !parsed.question ||
      !parsed.options ||
      !parsed.options.A ||
      !parsed.options.B ||
      !parsed.options.C ||
      !parsed.options.D ||
      !["A", "B", "C", "D"].includes(parsed.correct)
    ) {
      console.error("Formato invalido devuelto por Zhipu AI:", parsed);
      return fallback;
    }

    return parsed;
  } catch (error) {
    console.error("Fallo generateQuestion, usando fallback:", error.message);
    return fallback;
  }
}

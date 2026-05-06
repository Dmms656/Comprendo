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

export async function generateQuestion(topic) {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
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
        max_tokens: 180
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", JSON.stringify(data));
      return fallback;
    }

    let text = data?.choices?.[0]?.message?.content;

    if (!text || typeof text !== "string") {
      console.error("Groq content vacio:", JSON.stringify(data));
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
      console.error("Formato invalido devuelto por Groq:", parsed);
      return fallback;
    }

    return parsed;
  } catch (error) {
    console.error("Fallo generateQuestion, usando fallback:", error.message);
    return fallback;
  }
}

import { responseSchema, type GeneratedResponse } from "./schemas.ts";

export async function callGemma(prompt: string): Promise<GeneratedResponse> {
  const apiKey = Deno.env.get("GEMMA_API_KEY");
  const model = Deno.env.get("GEMMA_MODEL");
  const baseUrl = Deno.env.get("GEMMA_BASE_URL") ?? "https://generativelanguage.googleapis.com/v1beta";
  if (!apiKey || !model) throw new Error("Gemma no está configurado.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch(`${baseUrl}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, responseMimeType: "application/json" } }),
    });
    if (!response.ok) throw new Error(`Gemma respondió ${response.status}.`);
    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") throw new Error("Gemma devolvió una respuesta vacía.");
    const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
    return responseSchema.parse(JSON.parse(cleaned));
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("Tiempo de espera de Gemma agotado.");
    throw error;
  } finally { clearTimeout(timeout); }
}

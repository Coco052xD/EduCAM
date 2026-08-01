/**
 * La API key va en el header x-goog-api-key, no en el query string: las URLs
 * quedan registradas en logs de proxies y en trazas de error, los headers no.
 */
export async function callGemma(prompt: string): Promise<string> {
  const apiKey = Deno.env.get("GEMMA_API_KEY");
  const model = Deno.env.get("GEMMA_MODEL");
  const baseUrl = Deno.env.get("GEMMA_BASE_URL") ?? "https://generativelanguage.googleapis.com/v1beta";
  if (!apiKey || !model) throw new Error("Gemma no está configurado.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch(`${baseUrl}/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 },
      }),
    });
    if (!response.ok) {
      // El cuerpo de Google dice si es la key, el modelo o la cuota; sin él
      // solo se ve un número y hay que adivinar.
      const detail = await response.text().catch(() => "");
      throw new Error(`Gemma respondió ${response.status}: ${detail.slice(0, 300)}`);
    }
    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string" || !text.trim()) throw new Error("Gemma devolvió una respuesta vacía.");
    return text.trim();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("Tiempo de espera de Gemma agotado.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

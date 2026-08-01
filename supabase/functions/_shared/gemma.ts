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
        // Sin stopSequences: el modelo parafrasea el formato antes de responder
        // y escribía el marcador de cierre dentro de esa paráfrasis, cortando
        // la generación antes de producir nada. El presupuesto es holgado
        // porque el razonamiento, cuando el modelo lo emite, también consume
        // maxOutputTokens y dejaba la respuesta truncada.
        generationConfig: { temperature: 0.25, maxOutputTokens: 2048 },
      }),
    });
    if (!response.ok) {
      // El cuerpo de Google dice si es la key, el modelo o la cuota; sin él
      // solo se ve un número y hay que adivinar.
      const detail = await response.text().catch(() => "");
      throw new Error(`Gemma respondió ${response.status}: ${detail.slice(0, 300)}`);
    }
    const payload = await response.json();
    const candidate = payload?.candidates?.[0];
    const parts: Array<{ text?: string; thought?: boolean }> = candidate?.content?.parts ?? [];
    const textOf = (list: typeof parts) => list.map((part) => part?.text).filter((text): text is string => typeof text === "string").join("\n").trim();

    // Los modelos con razonamiento devuelven el borrador en una parte marcada
    // `thought` y la respuesta en otra posterior. Leer parts[0] devolvía el
    // borrador y tiraba la respuesta.
    const answer = textOf(parts.filter((part) => part?.thought !== true));
    const text = answer || textOf(parts);

    if (!text) {
      if (candidate?.finishReason === "MAX_TOKENS") throw new Error("Gemma agotó el presupuesto de tokens razonando y no llegó a responder.");
      throw new Error(`Gemma devolvió una respuesta vacía (finishReason: ${candidate?.finishReason ?? "desconocido"}).`);
    }
    return text;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("Tiempo de espera de Gemma agotado.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

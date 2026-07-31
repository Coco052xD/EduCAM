const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * El comentario libre del educador es el único campo por el que un nombre puede
 * colarse al modelo: lo escribe una persona, no un catálogo. Se limpia antes de
 * salir, no solo se revisa a la vuelta.
 */
export function scrubName(text: string | null, name: string): string | null {
  if (!text) return text;
  if (name.trim().length <= 2) return text;
  const parts = name.split(/\s+/).filter((part) => part.length > 2).map(escapeRegExp);
  if (!parts.length) return text;
  return text.replace(new RegExp(`\\b(${parts.join("|")})\\b`, "gi"), "el alumno");
}

/** Última línea de defensa: lo que el modelo devuelve no puede traer el nombre. */
export function assertNoName(output: string, name: string) {
  const haystack = output.toLocaleLowerCase("es-MX");
  const leaked = name
    .split(/\s+/)
    .filter((part) => part.length > 2)
    .some((part) => haystack.includes(part.toLocaleLowerCase("es-MX")));
  if (leaked) throw new Error("La respuesta del modelo incluyó el nombre del alumno.");
}

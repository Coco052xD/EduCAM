# Depuración de la generación con Gemma

Bitácora de los fallos al poner en marcha `generate-recommendation`, la Edge
Function que produce las recomendaciones. Rama `feat/frontend-public-schema`,
proyecto Supabase `ijxiskdpelerodbswyme`, modelo `gemma-4-26b-a4b-it`.

> **Estado: sin resolver.** La generación todavía no completa de punta a punta.
> El último despliegue instrumenta el fallo para que el error incluya el texto
> crudo del modelo; falta un intento para leerlo.

---

## Lo que sí está verificado

Esto no es lo que falla, y conviene no volver a revisarlo:

| Comprobación | Resultado |
|---|---|
| Migraciones | 3 aplicadas, `local == remote` |
| RLS activo | Probado: `INSERT` con anon key devuelve `42501` |
| Alumno de prueba (Paquito) | Grado 3, activo, rango 7-9 |
| Perfil de aprendizaje | 9 respuestas cargadas |
| Educador (Juanito) | Activo en `educators` |
| Temas sembrados | Grado 3, coincide con el alumno |
| Límite por hora | 0 de 12 usadas |
| Embeds de PostgREST | Resuelven bien (se sospechó y se descartó) |
| Suite local | 40 tests, `tsc` limpio, `build` limpio |
| Despliegue de la función | Responde 401 a un token que no es de usuario |

De los seis puntos donde la función puede lanzar 422, **cinco quedaron
descartados por eliminación**. El que falla es la llamada al modelo o el
tratamiento de su respuesta.

---

## Cronología

### 1. El deploy no compilaba

```
Failed to bundle the function (reason: Relative import path "zod"
not prefixed with / or ./ or ../)
```

**Causa.** `supabase/functions/deno.json` no viaja en el bundle del deploy — se
ve en la salida del comando: sube los cinco `.ts` y el `deno.json` no aparece.
Sin el import map, `zod` y `@supabase/supabase-js` quedan como specifiers
desnudos y el bundler los toma por rutas relativas.

**Corrección.** Specifiers completos en el import (`jsr:@supabase/supabase-js@2`,
`npm:zod@4`) y se elimina el `deno.json`, que no se estaba aplicando a nada.
Commit `307fb94`.

### 2. "Edge Function returned a non-2xx status code"

**Causa.** No es un error real, es el mensaje genérico de `supabase-js`. La
librería envuelve el fallo en `FunctionsHttpError` y deja el cuerpo de la
respuesta —donde va el motivo— dentro de `error.context`.

**Corrección.** Se lee ese `Response` y se muestra su `error`. Además, el fallo
de Gemma ahora incluye el cuerpo de la respuesta de Google, que es donde dice
si el problema es la key, el modelo o la cuota. Commit `a7fb689`.

> Aquí se perdió tiempo por un log mal atribuido: la entrada con `401` que
> aparecía en el dashboard era `user_agent: curl/8.7.1` y `role: anon` — una
> prueba de humo, no la petición del navegador. **Al leer Invocations, filtra
> por user agent antes de sacar conclusiones.**

### 3. La respuesta traía el razonamiento del modelo

La recomendación guardada empezaba con las instrucciones reescritas en inglés
(`Role:`, `Task:`, `Constraint 1:`…), seguía con la recomendación en español, y
cerraba con una autoverificación (`No diagnosis? Yes.`).

**Causa.** Gemma **no tiene rol de sistema**: su plantilla es solo `user` /
`model`, así que todo el prompt es contenido que puede comentar. Un prompt con
forma de especificación invita a devolver su resumen.

**Corrección (parcial).** Marcadores de salida `###RECOMENDACION###` /
`###FIN###` y extracción del bloque intermedio. Commit `3da5a54`.

### 4. "El modelo devolvió una recomendación demasiado corta"

**Causa.** El `stopSequences: ["###FIN###"]` que se agregó en el paso anterior.
El modelo parafrasea el formato *antes* de responder, escribe `###FIN###` dentro
de esa paráfrasis, y **la generación se corta ahí** — antes de producir una sola
línea útil. El mecanismo pensado para cortar el ruido cortó lo único que servía.

**Corrección.** Fuera `stopSequences`; mientras los marcadores estén escritos en
el prompt, el modelo puede emitirlos al parafrasear. Commit `a38629b`.

### 5. Solo la paráfrasis, truncada a media frase

La salida completa era la especificación comprimida en inglés, terminando en
`Final marker: "`. Dos causas:

**Causa A — bug de parseo, el más caro.**

```ts
const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
```

Leía **solo la primera parte**. Los modelos con razonamiento devuelven el
borrador en una parte marcada `thought: true` y la respuesta en otra posterior.
Se estaba leyendo el borrador y descartando la respuesta.

**Causa B — presupuesto de tokens.** El razonamiento consume el mismo
`maxOutputTokens` que la respuesta; con 900 se agotaba antes de responder.

**Corrección.** Filtrar las partes marcadas como razonamiento y concatenar el
resto; `maxOutputTokens` de 900 a 2048; y el prompt reescrito como prosa en
español que **termina con el primer encabezado de la respuesta**
(`Cómo presentar el tema:`), para que el modelo continúe el texto en vez de
contestar a una ficha técnica. Commit `a0ea588`.

### 6. Otra vez "demasiado corta" — pendiente

**Hipótesis.** La corrección anterior se mordió la cola: si el prompt termina
con el encabezado y el modelo repite la cola del prompt, ese encabezado queda al
final de la salida y la extracción —que tomaba su *última* aparición— se quedaba
con 23 caracteres.

**Corrección.** Recorrer todas las apariciones de atrás hacia adelante hasta
hallar una que deje contenido real. Y el error ahora **incluye el texto crudo
del modelo** en vez de descartarlo. Commit `467b967`.

**Sin verificar.** Falta un intento de generación para leer el crudo y
confirmar.

---

## Lo que aprendimos de Gemma

Aplicable a cualquier prompt que le escribamos en este proyecto:

- **No tiene rol de sistema.** Todo se concatena al turno del usuario. Pasarle
  `systemInstruction` en la API de Gemini da error. Es la raíz de casi todo lo
  anterior.
- **Es un modelo de completado, no de obediencia.** Ante una especificación
  tiende a parafrasearla antes de ejecutarla. Funciona mejor darle prosa que
  continuar.
- **Ancla el idioma al final.** Una instrucción a 200 palabras del punto de
  generación pesa poco; la última línea antes de generar es la que manda.
- **Cuidado con `stopSequences`.** Si el marcador aparece escrito en el prompt,
  el modelo lo emitirá al parafrasear y cortará la generación.
- **El razonamiento consume `maxOutputTokens`.** Presupuesta para borrador y
  respuesta, no solo para la respuesta.
- **Lee todas las `parts`.** `parts[0]` puede ser el borrador.
- **Prompt corto.** La paráfrasis escala con el tamaño del prompt: pasó de una
  especificación larga a 217 palabras.

---

## Siguiente paso

1. Generar una recomendación en la app.
2. Copiar el mensaje de error completo — ahora trae el crudo del modelo.
3. Con ese texto se decide: ajustar la extracción, ajustar el prompt, o cambiar
   `GEMMA_MODEL`.

Los logs de la función están en el dashboard, en **Functions →
`generate-recommendation` → Logs** (no en Invocations, que solo muestra códigos).
`supabase functions logs` no existe en el CLI 2.109.

---

## Limitación de la depuración

Buena parte de estas iteraciones se hicieron a ciegas: no es posible invocar la
función con una sesión de usuario real sin crear una cuenta, ni leer el valor de
`GEMMA_API_KEY` (`supabase secrets list` solo muestra nombres). Por eso el último
cambio prioriza instrumentar sobre corregir — el siguiente ajuste debería
apoyarse en un hecho y no en una hipótesis.

Dos de los fallos de esta bitácora (el paso 4 y el paso 6) fueron introducidos
por correcciones anteriores de esta misma sesión.

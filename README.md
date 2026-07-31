# Aula Puente IA

Prototipo full stack para que educadores de alumnos atendidos en educación especial creen actividades inclusivas con Gemma, manteniendo siempre la revisión y decisión humana.

## Qué incluye

- Registro, inicio de sesión, recuperación de acceso y onboarding mínimo con Supabase Auth.
- Grupos, alumnos, selección de múltiples condiciones y Perfil de aprendizaje estructurado.
- Catálogo curricular y conocimiento pedagógico en esquemas separados.
- Generación inicial de tres propuestas, valoración previa, descarte con motivo y alternativas guiadas.
- Edición, aceptación, impresión, aplicación y retroalimentación de 1 a 5 estrellas.
- Recuperación de feedback relevante como contexto de futuras generaciones.
- Edge Function que verifica el JWT, comprueba propiedad de grupo/alumnos, anonimiza perfiles y valida el JSON de Gemma.
- RLS, funciones SQL seguras, auditoría mínima y límite técnico configurable.
- Pruebas de esquemas, privacidad, autorización y estados.

## Requisitos

- Node.js 20.9 o posterior.
- Un proyecto de Supabase y Supabase CLI para desarrollo local/despliegue.
- Una clave de Google AI compatible con un modelo Gemma disponible en Generative Language API.

## Ejecución local

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Copia `.env.example` a `.env.local` y completa:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-or-anon-key>
   ```

3. Inicia Supabase local o vincula un proyecto remoto:

   ```bash
   supabase start
   # o
   supabase link --project-ref <project-ref>
   ```

4. Aplica esquema y semillas:

   ```bash
   supabase db reset
   # En remoto: supabase db push
   ```

   La semilla siempre carga 3 condiciones, 15 recomendaciones aprobadas, 3 materias y 15 temas. Si ya existe un usuario Auth, también crea un grupo y 3 alumnos ficticios; si no, vuelve a ejecutar `supabase/seed.sql` después de registrar el primer usuario.

   En un proyecto remoto, agrega `app`, `knowledge` y `curriculum` a **API Settings → Exposed schemas**. `supabase/config.toml` ya hace esta configuración en el entorno local.

5. Configura secretos de la Edge Function (ninguno usa prefijo `NEXT_PUBLIC_`):

   ```bash
   supabase secrets set GEMMA_API_KEY=<clave> GEMMA_MODEL=gemma-3-27b-it
   supabase secrets set GEMMA_BASE_URL=https://generativelanguage.googleapis.com/v1beta
   supabase secrets set PROMPT_VERSION=activity-v1 GENERATION_LIMIT_PER_HOUR=12
   ```

6. Despliega o sirve la función:

   ```bash
   supabase functions serve generate-activity
   # Remoto:
   supabase functions deploy generate-activity
   ```

7. Ejecuta Next.js:

   ```bash
   npm run dev
   ```

Abre `http://localhost:3000`.

## Verificación

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Arquitectura y seguridad

| Dominio | Esquema | Contenido |
| --- | --- | --- |
| Aplicación | `app` | perfiles, grupos, alumnos, solicitudes, opciones y feedback |
| Conocimiento | `knowledge` | condiciones, fuentes y recomendaciones aprobadas |
| Currículo | `curriculum` | materias, temas y objetivos |

`proxy.ts` es la convención vigente de Next.js 16 para renovar la sesión. Las lecturas y mutaciones web usan el JWT del educador y RLS. La Edge Function vuelve a validar el JWT antes de usar su cliente de servicio, verifica explícitamente `educator_id`, grupo y alumnos, y nunca devuelve ni envía apodos a Gemma. La clave `service_role` solo existe en el entorno administrado por Supabase.

La función construye claves `student_01`, `student_02`, etc.; recupera únicamente recomendaciones con `validation_status = 'approved'`; resume retroalimentación de actividades relacionadas y rechaza la respuesta si detecta un apodo. La respuesta estructurada se valida con Zod antes de guardarse.

## Decisiones técnicas

- Next.js 16.2 App Router, React 19, acciones de servidor y parámetros de ruta asíncronos.
- Tailwind CSS 4 con componentes propios accesibles para evitar sumar un kit visual completo al prototipo.
- Una fila independiente por alternativa y número de generación monotónico por solicitud.
- Retroalimentación usada como contexto, nunca como entrenamiento automático.
- El límite por hora se basa en auditorías de generaciones exitosas y se configura mediante secreto.

## Pendientes antes de producción

- Sustituir el contenido curricular de demostración por un catálogo revisado y versionado por especialistas.
- Completar revisión editorial y de fuentes de todas las recomendaciones pedagógicas.
- Añadir pruebas de integración contra una instancia efímera de PostgreSQL/Supabase y pruebas E2E del correo Auth.
- Configurar SMTP, dominio, observabilidad, política de retención y respaldo según el entorno de despliegue.
- Ejecutar una evaluación formal de seguridad, privacidad y accesibilidad con usuarios reales.

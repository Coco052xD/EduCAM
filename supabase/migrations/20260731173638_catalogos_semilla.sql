-- Catálogos base de EduCAM: padecimientos, materias y el formulario de perfil.
-- Sin estos datos el frontend no tiene qué mostrar: no hay condiciones que
-- seleccionar, ni temas que elegir, ni formulario de perfil que llenar.
--
-- Van en una migración y no en seed.sql a propósito: seed.sql solo corre en
-- `db reset` local, nunca en `db push` al remoto. Son datos de referencia, no
-- datos de prueba.
--
-- El contenido pedagógico proviene del prototipo de la rama frontend, adaptado
-- al modelo de public. Es contenido de demostración para el hackathon: el CAM
-- debe validarlo antes de usarlo con alumnos reales.

-- El objetivo de aprendizaje alimenta el prompt de Gemma: sin él el modelo
-- adapta la forma de enseñar un tema sin saber qué debe lograr el alumno.
alter table public.subjects add column if not exists learning_objective text;

-- La Edge Function limita generaciones por educador y hora contando esta tabla.
create index if not exists recommendations_educator_created_idx
  on public.recommendations (educator_id, created_at desc);

-- ── Padecimientos ─────────────────────────────────────────
-- Las descripciones evitan inferir capacidades a partir del diagnóstico: es
-- el perfil de aprendizaje el que pesa más en la recomendación.
insert into public.conditions (id, name, description) values
  ('20000000-0000-4000-8000-000000000001','Discapacidad visual','Selección pedagógica; no sustituye una valoración profesional.'),
  ('20000000-0000-4000-8000-000000000002','Discapacidad auditiva','Selección pedagógica; no presupone una forma única de comunicación.'),
  ('20000000-0000-4000-8000-000000000003','Condición del espectro autista','Selección para contextualizar apoyos observables, sin inferir capacidades.'),
  ('20000000-0000-4000-8000-000000000004','Discapacidad intelectual','Selección pedagógica; no determina el nivel del objetivo curricular.'),
  ('20000000-0000-4000-8000-000000000005','Discapacidad motriz','Selección pedagógica; refiere al acceso físico, no a la comprensión.'),
  ('20000000-0000-4000-8000-000000000006','Trastorno por déficit de atención','Selección pedagógica; describe apoyos de atención y regulación.')
on conflict (id) do nothing;

-- ── Materias (categoría + tema + grado) ───────────────────
-- Contenido de 3.º tomado del prototipo; 4.º a 6.º quedan pendientes de que el
-- CAM defina sus temas. El check de grado (3-6) impide sembrar Secundaria.
insert into public.subjects (category, topic, grade, learning_objective) values
  ('Lenguajes','Secuencia narrativa',3,'Reconocer y ordenar inicio, desarrollo y cierre en una narración breve.'),
  ('Lenguajes','Descripción de personajes',3,'Comunicar características observables de personajes usando distintos modos de expresión.'),
  ('Lenguajes','Instrucciones cotidianas',3,'Interpretar y producir instrucciones breves con una secuencia clara.'),
  ('Lenguajes','Lectura de imágenes',3,'Construir significados a partir de elementos presentes en imágenes y símbolos.'),
  ('Lenguajes','Relato oral',3,'Compartir un acontecimiento respetando una secuencia comprensible.'),
  ('Saberes y pensamiento científico','Suma y resta',3,'Resolver situaciones cercanas que implican agregar, quitar o comparar cantidades.'),
  ('Saberes y pensamiento científico','Figuras geométricas',3,'Clasificar figuras a partir de atributos observables y manipulables.'),
  ('Saberes y pensamiento científico','Medición de longitud',3,'Comparar y medir longitudes con unidades convencionales y no convencionales.'),
  ('Saberes y pensamiento científico','Estados del agua',3,'Observar y explicar cambios del agua en situaciones cotidianas.'),
  ('Saberes y pensamiento científico','Registro de datos',3,'Organizar observaciones sencillas en tablas o representaciones accesibles.'),
  ('Ética, naturaleza y sociedades','Cuidado del entorno',3,'Proponer acciones realizables para el cuidado de espacios compartidos.'),
  ('Ética, naturaleza y sociedades','Convivencia y acuerdos',3,'Construir acuerdos de convivencia considerando distintas formas de participación.')
on conflict (category, topic, grade) do nothing;

-- ── Formulario de perfil de aprendizaje ───────────────────
-- Una respuesta por pregunta: el modelo de student_profile_answers tiene PK
-- (student_id, question_id). Donde el prototipo permitía varias selecciones,
-- la pregunta pide la opción que más le sirve al alumno.
insert into public.profile_questions (id, question, help_text, sort_order) values
  ('50000000-0000-4000-8000-000000000001','¿Cómo comprende mejor las instrucciones?','La vía por la que capta la consigna con menos esfuerzo.',1),
  ('50000000-0000-4000-8000-000000000002','¿Cuántos pasos tolera por instrucción?','Antes de necesitar que se repita o se divida.',2),
  ('50000000-0000-4000-8000-000000000003','¿Cómo prefiere participar?','La forma de agrupamiento en la que rinde mejor.',3),
  ('50000000-0000-4000-8000-000000000004','¿Cuánto tiempo sostiene la atención?','En una actividad que le resulta accesible.',4),
  ('50000000-0000-4000-8000-000000000005','¿Con qué frecuencia requiere pausas?','Para regularse y retomar la actividad.',5),
  ('50000000-0000-4000-8000-000000000006','¿Cómo demuestra mejor lo que sabe?','La forma de respuesta que refleja su comprensión real.',6),
  ('50000000-0000-4000-8000-000000000007','¿Qué tema le interesa más?','Una vía opcional de conexión con el contenido.',7),
  ('50000000-0000-4000-8000-000000000008','¿Con qué material trabaja mejor?','El soporte con el que se involucra más.',8),
  ('50000000-0000-4000-8000-000000000009','¿Qué apoyo le ha funcionado mejor?','Registrado por observación previa en clase.',9)
on conflict (id) do nothing;

-- Sin este unique, el `on conflict` de abajo no tendría a qué agarrarse (los
-- id son aleatorios) y reaplicar la migración duplicaría todas las opciones.
alter table public.profile_options
  add constraint profile_options_question_label_key unique (question_id, label);

insert into public.profile_options (question_id, label, sort_order) values
  ('50000000-0000-4000-8000-000000000001','Explicación hablada',1),
  ('50000000-0000-4000-8000-000000000001','Imágenes o pictogramas',2),
  ('50000000-0000-4000-8000-000000000001','Texto escrito',3),
  ('50000000-0000-4000-8000-000000000001','Demostración de la tarea',4),
  ('50000000-0000-4000-8000-000000000001','Objetos físicos',5),

  ('50000000-0000-4000-8000-000000000002','Un paso a la vez',1),
  ('50000000-0000-4000-8000-000000000002','Dos pasos',2),
  ('50000000-0000-4000-8000-000000000002','Tres o más pasos',3),

  ('50000000-0000-4000-8000-000000000003','Individual',1),
  ('50000000-0000-4000-8000-000000000003','En pareja',2),
  ('50000000-0000-4000-8000-000000000003','Grupo pequeño',3),
  ('50000000-0000-4000-8000-000000000003','Grupo completo',4),

  ('50000000-0000-4000-8000-000000000004','Menos de 5 minutos',1),
  ('50000000-0000-4000-8000-000000000004','De 5 a 10 minutos',2),
  ('50000000-0000-4000-8000-000000000004','De 10 a 20 minutos',3),
  ('50000000-0000-4000-8000-000000000004','Más de 20 minutos',4),

  ('50000000-0000-4000-8000-000000000005','Rara vez',1),
  ('50000000-0000-4000-8000-000000000005','Algunas veces',2),
  ('50000000-0000-4000-8000-000000000005','Frecuentemente',3),

  ('50000000-0000-4000-8000-000000000006','Hablando',1),
  ('50000000-0000-4000-8000-000000000006','Escribiendo',2),
  ('50000000-0000-4000-8000-000000000006','Dibujando',3),
  ('50000000-0000-4000-8000-000000000006','Señalando o eligiendo',4),
  ('50000000-0000-4000-8000-000000000006','Manipulando objetos',5),
  ('50000000-0000-4000-8000-000000000006','Con pictogramas',6),

  ('50000000-0000-4000-8000-000000000007','Naturaleza y animales',1),
  ('50000000-0000-4000-8000-000000000007','Deportes',2),
  ('50000000-0000-4000-8000-000000000007','Vehículos y máquinas',3),
  ('50000000-0000-4000-8000-000000000007','Música',4),
  ('50000000-0000-4000-8000-000000000007','Arte y manualidades',5),

  ('50000000-0000-4000-8000-000000000008','Material manipulable',1),
  ('50000000-0000-4000-8000-000000000008','Imágenes',2),
  ('50000000-0000-4000-8000-000000000008','Actividades impresas',3),
  ('50000000-0000-4000-8000-000000000008','Juegos',4),
  ('50000000-0000-4000-8000-000000000008','Recursos digitales',5),

  ('50000000-0000-4000-8000-000000000009','Dividir la tarea en pasos',1),
  ('50000000-0000-4000-8000-000000000009','Material concreto',2),
  ('50000000-0000-4000-8000-000000000009','Ver un ejemplo antes',3),
  ('50000000-0000-4000-8000-000000000009','Tiempo adicional',4),
  ('50000000-0000-4000-8000-000000000009','Apoyo visual permanente',5),
  ('50000000-0000-4000-8000-000000000009','Refuerzo positivo',6)
on conflict (question_id, label) do nothing;

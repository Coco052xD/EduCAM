-- Completa el catálogo de materias para 4.º, 5.º y 6.º de primaria.
--
-- La migración de catálogos solo sembró 3.º (contenido tomado del prototipo
-- original). Un alumno de otro grado se encontraba el selector de tema vacío
-- en /dashboard/recommendations/new, porque el tema debe coincidir con el
-- grado del alumno (lo valida tanto el formulario como la Edge Function).
--
-- Igual que el resto del catálogo: es contenido de demostración para el
-- hackathon: el CAM debe validarlo antes de usarlo con alumnos reales.

insert into public.subjects (category, topic, grade, learning_objective) values
  -- 4.º
  ('Lenguajes','Cuento con diálogos',4,'Incorporar diálogos en un relato distinguiendo quién habla.'),
  ('Lenguajes','Instrucciones para un juego',4,'Redactar y seguir instrucciones de varios pasos con orden claro.'),
  ('Lenguajes','Noticia breve',4,'Distinguir hecho de opinión en un texto informativo breve.'),
  ('Lenguajes','Carta o mensaje personal',4,'Comunicar una idea propia adaptando el mensaje a quien lo recibe.'),
  ('Saberes y pensamiento científico','Multiplicación y división',4,'Resolver problemas cotidianos de reparto y agrupamiento.'),
  ('Saberes y pensamiento científico','Fracciones sencillas',4,'Representar y comparar partes de un entero usando material concreto.'),
  ('Saberes y pensamiento científico','El ciclo del agua',4,'Explicar el ciclo del agua relacionándolo con el clima local.'),
  ('Saberes y pensamiento científico','Los seres vivos y su hábitat',4,'Relacionar características de un ser vivo con el lugar donde habita.'),
  ('Ética, naturaleza y sociedades','Historia de mi comunidad',4,'Ubicar cambios y permanencias en la comunidad a través del tiempo.'),
  ('Ética, naturaleza y sociedades','Cuidado de los recursos naturales',4,'Proponer acciones concretas para cuidar un recurso natural cercano.'),

  -- 5.º
  ('Lenguajes','Reportaje escolar',5,'Organizar información de varias fuentes en un texto propio.'),
  ('Lenguajes','Poema y juego de palabras',5,'Explorar el sonido y el ritmo del lenguaje al crear un texto breve.'),
  ('Lenguajes','Argumento sencillo',5,'Sostener una opinión propia con al menos una razón que la respalde.'),
  ('Lenguajes','Reglamento del salón',5,'Redactar acuerdos claros y verificables para la convivencia del grupo.'),
  ('Saberes y pensamiento científico','Fracciones y decimales',5,'Convertir entre fracciones y decimales en situaciones cotidianas.'),
  ('Saberes y pensamiento científico','Perímetro y área',5,'Calcular perímetro y área de figuras usando unidades convencionales.'),
  ('Saberes y pensamiento científico','La nutrición y el cuerpo humano',5,'Relacionar hábitos de alimentación con el funcionamiento del cuerpo.'),
  ('Saberes y pensamiento científico','Fuerzas y movimiento',5,'Explicar el efecto de una fuerza sobre un objeto con ejemplos observables.'),
  ('Ética, naturaleza y sociedades','Diversidad de mi región',5,'Reconocer expresiones culturales de la región desde el respeto.'),
  ('Ética, naturaleza y sociedades','Consumo responsable',5,'Distinguir necesidades de deseos al tomar una decisión de consumo.'),

  -- 6.º
  ('Lenguajes','Ensayo breve',6,'Desarrollar una idea propia con introducción, desarrollo y cierre.'),
  ('Lenguajes','Debate guiado',6,'Argumentar una postura propia y escuchar la de otros con respeto.'),
  ('Lenguajes','Texto instructivo complejo',6,'Seguir y producir instrucciones con condiciones y excepciones.'),
  ('Lenguajes','Reseña de un texto o película',6,'Distinguir descripción de valoración personal al reseñar una obra.'),
  ('Saberes y pensamiento científico','Porcentajes',6,'Resolver problemas cotidianos que impliquen calcular un porcentaje.'),
  ('Saberes y pensamiento científico','Volumen de cuerpos geométricos',6,'Calcular el volumen de prismas usando unidades cúbicas.'),
  ('Saberes y pensamiento científico','Ecosistemas y cadenas alimentarias',6,'Explicar relaciones de dependencia entre seres vivos de un ecosistema.'),
  ('Saberes y pensamiento científico','Electricidad básica',6,'Explicar el funcionamiento de un circuito eléctrico simple.'),
  ('Ética, naturaleza y sociedades','Transición a secundaria',6,'Identificar cambios esperados y apoyos disponibles para el siguiente nivel.'),
  ('Ética, naturaleza y sociedades','Derechos y responsabilidades',6,'Relacionar un derecho propio con una responsabilidad correspondiente.')
on conflict (category, topic, grade) do nothing;

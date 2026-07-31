-- Catálogo pedagógico y curricular ficticio para desarrollo.
insert into knowledge.sources (id, title, organization, url, publication_year, reviewed_at) values
('10000000-0000-4000-8000-000000000001','Diseño Universal para el Aprendizaje: guía de referencia','CAST','https://udlguidelines.cast.org/',2024,now()),
('10000000-0000-4000-8000-000000000002','Orientaciones para la educación inclusiva','Referencia pedagógica de demostración',null,2025,now())
on conflict (id) do nothing;

insert into knowledge.conditions (id, name, description) values
('20000000-0000-4000-8000-000000000001','Discapacidad visual','Selección pedagógica; no sustituye una valoración profesional.'),
('20000000-0000-4000-8000-000000000002','Discapacidad auditiva','Selección pedagógica; no presupone una forma única de comunicación.'),
('20000000-0000-4000-8000-000000000003','Condición del espectro autista','Selección para contextualizar apoyos observables, sin inferir capacidades.')
on conflict (id) do nothing;

insert into knowledge.recommendations (condition_id, educational_level, category, recommendation, applicability, do_not_assume, source_id, validation_status) values
('20000000-0000-4000-8000-000000000001','Primaria','acceso','Ofrecer materiales con alto contraste y tamaño ajustable.','Cuando el perfil observado indique utilidad del contraste.','No asumir que todas las personas requieren el mismo aumento.','10000000-0000-4000-8000-000000000001','approved'),
('20000000-0000-4000-8000-000000000001','Primaria','representación','Describir verbalmente diagramas, posiciones y cambios visibles.','Durante demostraciones visuales.','No sustituir la exploración directa cuando sea posible.','10000000-0000-4000-8000-000000000001','approved'),
('20000000-0000-4000-8000-000000000001','Primaria','materiales','Incluir objetos táctiles seguros para representar conceptos.','Cuando el objetivo admita representación concreta.','No imponer exploración táctil si el alumno no la prefiere.','10000000-0000-4000-8000-000000000002','approved'),
('20000000-0000-4000-8000-000000000001','Primaria','participación','Permitir respuesta oral, táctil o mediante tecnología de apoyo.','En evaluación formativa.','No equiparar forma de respuesta con nivel de comprensión.','10000000-0000-4000-8000-000000000001','approved'),
('20000000-0000-4000-8000-000000000001','Secundaria','organización','Mantener libres y previsibles las rutas hacia los materiales.','En actividades con desplazamiento.','No retirar autonomía sin observar una necesidad.','10000000-0000-4000-8000-000000000002','approved'),
('20000000-0000-4000-8000-000000000002','Primaria','comunicación','Acompañar instrucciones orales con texto, gestos o apoyos visuales.','Cuando sea consistente con el perfil de comunicación.','No asumir dominio de lengua de señas.','10000000-0000-4000-8000-000000000001','approved'),
('20000000-0000-4000-8000-000000000002','Primaria','ambiente','Reducir ruido de fondo durante explicaciones y trabajo en pareja.','Cuando el ruido interfiera con la participación.','No aislar automáticamente al alumno.','10000000-0000-4000-8000-000000000002','approved'),
('20000000-0000-4000-8000-000000000002','Primaria','posición','Facilitar una ubicación con vista clara del educador y compañeros.','En demostraciones o conversación grupal.','No fijar un lugar sin consultar preferencias.','10000000-0000-4000-8000-000000000002','approved'),
('20000000-0000-4000-8000-000000000002','Secundaria','participación','Permitir respuestas escritas, visuales, gestuales o con dispositivos.','En intercambio de ideas y evaluación.','No valorar fluidez oral como única evidencia.','10000000-0000-4000-8000-000000000001','approved'),
('20000000-0000-4000-8000-000000000002','Secundaria','verificación','Confirmar comprensión mediante una demostración breve, no solo preguntando si entendió.','Después de instrucciones de varios pasos.','No atribuir una confusión a la condición.','10000000-0000-4000-8000-000000000002','approved'),
('20000000-0000-4000-8000-000000000003','Primaria','anticipación','Presentar una secuencia visual breve de los pasos y avisar cambios.','Cuando la anticipación haya funcionado previamente.','No asumir rigidez o rechazo al cambio.','10000000-0000-4000-8000-000000000001','approved'),
('20000000-0000-4000-8000-000000000003','Primaria','instrucciones','Usar instrucciones concretas y dividir tareas extensas en pasos observables.','Cuando el perfil indique beneficio de secuencias breves.','No simplificar el objetivo académico sin necesidad.','10000000-0000-4000-8000-000000000001','approved'),
('20000000-0000-4000-8000-000000000003','Primaria','participación','Ofrecer elección entre participación individual, en pareja o grupal.','Cuando varias formas cumplen el mismo objetivo.','No forzar interacción social como premio o sanción.','10000000-0000-4000-8000-000000000001','approved'),
('20000000-0000-4000-8000-000000000003','Secundaria','regulación','Planear pausas breves y un punto claro para retomar la actividad.','Si las pausas están registradas como apoyo exitoso.','No convertir la pausa en exclusión de la actividad.','10000000-0000-4000-8000-000000000002','approved'),
('20000000-0000-4000-8000-000000000003','Secundaria','intereses','Usar intereses registrados como una vía opcional de conexión con el contenido.','Cuando sea pertinente al objetivo curricular.','No reducir todas las actividades a un solo interés.','10000000-0000-4000-8000-000000000002','approved');

insert into curriculum.subjects (id, educational_level, academic_grade, name, formative_field, curriculum_version) values
('30000000-0000-4000-8000-000000000001','Primaria','3°','Lenguajes','Lenguajes','Plan de estudio 2022 · prototipo'),
('30000000-0000-4000-8000-000000000002','Primaria','3°','Saberes y pensamiento científico','Saberes y pensamiento científico','Plan de estudio 2022 · prototipo'),
('30000000-0000-4000-8000-000000000003','Secundaria','1°','Ética, naturaleza y sociedades','Ética, naturaleza y sociedades','Plan de estudio 2022 · prototipo')
on conflict (id) do nothing;

insert into curriculum.topics (subject_id, name, learning_objective, source_reference) values
('30000000-0000-4000-8000-000000000001','Secuencia narrativa','Reconocer y ordenar inicio, desarrollo y cierre en una narración breve.','Contenido de demostración alineado al Plan 2022'),
('30000000-0000-4000-8000-000000000001','Descripción de personajes','Comunicar características observables de personajes usando distintos modos de expresión.','Contenido de demostración alineado al Plan 2022'),
('30000000-0000-4000-8000-000000000001','Instrucciones cotidianas','Interpretar y producir instrucciones breves con una secuencia clara.','Contenido de demostración alineado al Plan 2022'),
('30000000-0000-4000-8000-000000000001','Lectura de imágenes','Construir significados a partir de elementos presentes en imágenes y símbolos.','Contenido de demostración alineado al Plan 2022'),
('30000000-0000-4000-8000-000000000001','Relato oral','Compartir un acontecimiento respetando una secuencia comprensible.','Contenido de demostración alineado al Plan 2022'),
('30000000-0000-4000-8000-000000000002','Suma y resta','Resolver situaciones cercanas que implican agregar, quitar o comparar cantidades.','Contenido de demostración alineado al Plan 2022'),
('30000000-0000-4000-8000-000000000002','Figuras geométricas','Clasificar figuras a partir de atributos observables y manipulables.','Contenido de demostración alineado al Plan 2022'),
('30000000-0000-4000-8000-000000000002','Medición de longitud','Comparar y medir longitudes con unidades convencionales y no convencionales.','Contenido de demostración alineado al Plan 2022'),
('30000000-0000-4000-8000-000000000002','Estados del agua','Observar y explicar cambios del agua en situaciones cotidianas.','Contenido de demostración alineado al Plan 2022'),
('30000000-0000-4000-8000-000000000002','Registro de datos','Organizar observaciones sencillas en tablas o representaciones accesibles.','Contenido de demostración alineado al Plan 2022'),
('30000000-0000-4000-8000-000000000003','Diversidad cultural','Reconocer expresiones culturales de la comunidad desde una perspectiva respetuosa.','Contenido de demostración alineado al Plan 2022'),
('30000000-0000-4000-8000-000000000003','Cuidado del entorno','Proponer acciones realizables para el cuidado de espacios compartidos.','Contenido de demostración alineado al Plan 2022'),
('30000000-0000-4000-8000-000000000003','Convivencia y acuerdos','Construir acuerdos de convivencia considerando distintas formas de participación.','Contenido de demostración alineado al Plan 2022'),
('30000000-0000-4000-8000-000000000003','Cambios en la comunidad','Identificar cambios y permanencias en la comunidad mediante diversas fuentes.','Contenido de demostración alineado al Plan 2022'),
('30000000-0000-4000-8000-000000000003','Derechos de niñas, niños y adolescentes','Relacionar derechos con situaciones cotidianas y formas de participación.','Contenido de demostración alineado al Plan 2022')
on conflict (subject_id, name) do nothing;

-- Si existe un usuario Auth, crea un grupo y tres perfiles claramente ficticios para ese usuario.
do $$
declare demo_user uuid; demo_group uuid := '40000000-0000-4000-8000-000000000001'; s1 uuid := '40000000-0000-4000-8000-000000000011'; s2 uuid := '40000000-0000-4000-8000-000000000012'; s3 uuid := '40000000-0000-4000-8000-000000000013';
begin
  select id into demo_user from auth.users order by created_at limit 1;
  if demo_user is null then return; end if;
  insert into app.educator_profiles(user_id, display_name, grades_taught, subjects_taught)
    values(demo_user,'Educador demo',array['3° Primaria'],array['Lenguajes','Saberes y pensamiento científico']) on conflict do nothing;
  insert into app.groups(id,educator_id,name,educational_level,academic_grade,school_cycle)
    values(demo_group,demo_user,'Grupo puente (ejemplo)','Primaria','3°','2026-2027') on conflict (id) do nothing;
  insert into app.students(id,educator_id,group_id,nickname,age_value,educational_level,enrolled_grade) values
    (s1,demo_user,demo_group,'Alumno ficticio A',9,'Primaria','3°') on conflict (id) do nothing;
  insert into app.students(id,educator_id,group_id,nickname,age_range,educational_level,enrolled_grade) values
    (s2,demo_user,demo_group,'Alumno ficticio B','8 a 10 años','Primaria','3°') on conflict (id) do nothing;
  insert into app.students(id,educator_id,group_id,nickname,age_value,educational_level,enrolled_grade) values
    (s3,demo_user,demo_group,'Alumno ficticio C',10,'Primaria','3°') on conflict (id) do nothing;
  insert into app.student_conditions(student_id,condition_id) values
    (s1,'20000000-0000-4000-8000-000000000001'),(s2,'20000000-0000-4000-8000-000000000002'),(s3,'20000000-0000-4000-8000-000000000003') on conflict do nothing;
  insert into app.learning_profiles(student_id,preferred_instruction_formats,instruction_steps,preferred_participation,attention_range,needs_breaks,response_methods,interests,preferred_materials,successful_supports) values
    (s1,array['audio','objetos físicos'],'dos','pareja','10 a 20 minutos','algunas veces',array['hablar','objetos'],array['naturaleza'],array['material manipulable'],array['dividir en pasos','material concreto']),
    (s2,array['imágenes','texto'],'tres o más','grupo pequeño','5 a 10 minutos','algunas veces',array['escribir','señalar'],array['deportes'],array['imágenes','actividades impresas'],array['ejemplo previo','tiempo adicional']),
    (s3,array['demostración','imágenes'],'uno','individual','menos de 5 minutos','frecuentemente',array['dibujar','pictogramas'],array['vehículos'],array['juegos'],array['pictogramas','refuerzo positivo']) on conflict (student_id) do nothing;
end $$;

"use client";

import { useActionState, useMemo, useState } from "react";
import { createActivityRequestAction } from "@/lib/actions/activities";
import type { ActionState } from "@/lib/actions/auth";
import type { Group, Student, Subject, Topic } from "@/types/database";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";

type StudentWithProfile = Student & { profileComplete: boolean };
export function ActivityGeneratorForm({ groups, students, subjects, topics, initialGroupId }: { groups: Group[]; students: StudentWithProfile[]; subjects: Subject[]; topics: Topic[]; initialGroupId?: string }) {
  const [state, action] = useActionState(createActivityRequestAction, {} as ActionState);
  const [groupId, setGroupId] = useState(initialGroupId ?? "");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const availableStudents = useMemo(() => students.filter((item) => item.group_id === groupId), [students, groupId]);
  const availableTopics = useMemo(() => topics.filter((item) => item.subject_id === subjectId), [topics, subjectId]);
  const objective = topics.find((item) => item.id === topicId)?.learning_objective;
  return <form action={action} className="mt-8 grid gap-6">
    <section className="card grid gap-5 p-6 sm:p-8"><h2 className="section-title">1. Contexto académico</h2><div className="field"><label htmlFor="groupId">Grupo</label><select className="input" id="groupId" name="groupId" value={groupId} onChange={(event) => setGroupId(event.target.value)} required><option value="" disabled>Selecciona</option>{groups.map((group) => <option value={group.id} key={group.id}>{group.name} · {group.academic_grade}</option>)}</select></div><div className="grid gap-5 sm:grid-cols-2"><div className="field"><label htmlFor="subjectId">Materia o campo</label><select className="input" id="subjectId" name="subjectId" value={subjectId} onChange={(event) => { setSubjectId(event.target.value); setTopicId(""); }} required><option value="" disabled>Selecciona</option>{subjects.map((subject) => <option value={subject.id} key={subject.id}>{subject.name} · {subject.academic_grade}</option>)}</select></div><div className="field"><label htmlFor="topicId">Tema curricular</label><select className="input" disabled={!subjectId} id="topicId" name="topicId" value={topicId} onChange={(event) => setTopicId(event.target.value)} required><option value="" disabled>Selecciona</option>{availableTopics.map((topic) => <option value={topic.id} key={topic.id}>{topic.name}</option>)}</select></div></div>{objective && <div className="rounded-xl bg-[#edf6f1] p-4"><p className="eyebrow">Objetivo curricular</p><p className="mt-2 leading-7">{objective}</p></div>}</section>
    <section className="card p-6 sm:p-8"><h2 className="section-title">2. Alumnos participantes</h2><p className="muted mt-2 text-sm">Solo están disponibles para generación quienes ya tienen Perfil de aprendizaje.</p><div className="mt-5 grid gap-2 sm:grid-cols-2">{availableStudents.length ? availableStudents.map((student) => <label className={`choice ${!student.profileComplete ? "opacity-55" : ""}`} key={student.id}><input disabled={!student.profileComplete} name="selectedStudentIds" type="checkbox" value={student.id}/><span><strong>{student.nickname}</strong><small className="muted block">{student.profileComplete ? "Perfil listo" : "Completa su perfil primero"}</small></span></label>) : <p className="muted">Selecciona un grupo para ver sus alumnos.</p>}</div></section>
    <section className="card grid gap-5 p-6 sm:p-8"><h2 className="section-title">3. Condiciones reales del aula</h2><div className="grid gap-5 sm:grid-cols-2"><div className="field"><label htmlFor="durationMinutes">Duración aproximada</label><input className="input" id="durationMinutes" name="durationMinutes" type="number" min={5} max={180} placeholder="Ej. 40"/></div><div className="field"><label htmlFor="availableMaterials">Materiales disponibles</label><input className="input" id="availableMaterials" name="availableMaterials" placeholder="Hojas, colores, tapas…"/><p className="muted text-xs">Sepáralos con comas.</p></div></div><div className="field"><label htmlFor="extraInstructions">Instrucción adicional <span className="muted font-normal">(opcional)</span></label><textarea className="input min-h-24" id="extraInstructions" name="extraInstructions" maxLength={500} placeholder="Algo importante para esta sesión…"/></div></section>
    <div className="rounded-xl border border-[#e8d1aa] bg-[#fff8eb] p-4 text-sm"><strong>Revisión humana requerida.</strong> Gemma generará borradores. Revisa seguridad, pertinencia y adaptaciones antes de aplicarlos.</div><FormMessage state={state}/><SubmitButton pendingText="Generando propuestas…">Generar tres propuestas</SubmitButton>
  </form>;
}

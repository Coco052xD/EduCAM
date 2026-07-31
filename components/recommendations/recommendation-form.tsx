"use client";

import { useActionState, useState } from "react";
import { requestRecommendationAction } from "@/lib/actions/recommendations";
import type { ActionState } from "@/lib/actions/auth";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Subject } from "@/types/database";

type StudentOption = { id: string; name: string; grade: number; hasProfile: boolean };

export function RecommendationForm({ students, subjects, selectedStudentId }: { students: StudentOption[]; subjects: Subject[]; selectedStudentId?: string }) {
  const [state, action] = useActionState(requestRecommendationAction, {} as ActionState);
  const [studentId, setStudentId] = useState(selectedStudentId ?? "");

  const student = students.find((item) => item.id === studentId);
  // El tema tiene grado propio: ofrecer temas de otro grado produciría una
  // recomendación desalineada del alumno.
  const available = student ? subjects.filter((subject) => subject.grade === student.grade) : [];

  return <form action={action} className="card mt-7 grid gap-6 p-6 sm:p-8">
    <div className="field">
      <label htmlFor="studentId">Alumno</label>
      <select className="input" id="studentId" name="studentId" value={studentId} onChange={(event) => setStudentId(event.target.value)} required>
        <option value="" disabled>Selecciona un alumno</option>
        {students.map((item) => <option key={item.id} value={item.id} disabled={!item.hasProfile}>{item.name} · {item.grade}.º{item.hasProfile ? "" : " · perfil pendiente"}</option>)}
      </select>
      {student && !student.hasProfile && <p className="muted text-xs">Completa el perfil de aprendizaje antes de generar.</p>}
    </div>

    <div className="field">
      <label htmlFor="subjectId">Tema</label>
      <select className="input" id="subjectId" name="subjectId" defaultValue="" disabled={!student} required>
        <option value="" disabled>{student ? "Selecciona un tema" : "Elige primero un alumno"}</option>
        {available.map((subject) => <option key={subject.id} value={subject.id}>{subject.category} · {subject.topic}</option>)}
      </select>
      {student && !available.length && <p className="muted text-xs">No hay temas cargados para {student.grade}.º. Pide al coordinador que los registre.</p>}
    </div>

    <div className="field">
      <label htmlFor="refinement">Indicaciones adicionales <span className="muted font-normal">(opcional)</span></label>
      <textarea className="input min-h-24" id="refinement" name="refinement" maxLength={300} placeholder="Ej. materiales disponibles, duración de la sesión"/>
    </div>

    <FormMessage state={state}/>
    <SubmitButton>Generar recomendación</SubmitButton>
  </form>;
}

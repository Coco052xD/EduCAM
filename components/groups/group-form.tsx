"use client";

import { useActionState } from "react";
import { createGroupAction, updateGroupAction } from "@/lib/actions/groups";
import type { ActionState } from "@/lib/actions/auth";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";

type Initial = { id?: string; name?: string; educational_level?: string; academic_grade?: string; school_cycle?: string | null };
export function GroupForm({ initial = {} }: { initial?: Initial }) {
  const [state, action] = useActionState(initial.id ? updateGroupAction : createGroupAction, {} as ActionState);
  return <form action={action} className="card mt-7 grid gap-5 p-6 sm:p-8">{initial.id && <input type="hidden" name="groupId" value={initial.id}/>}<div className="field"><label htmlFor="name">Nombre del grupo</label><input className="input" id="name" name="name" defaultValue={initial.name} placeholder="Ej. Grupo puente matutino" required/></div><div className="grid gap-5 sm:grid-cols-2"><div className="field"><label htmlFor="educationalLevel">Nivel educativo</label><select className="input" id="educationalLevel" name="educationalLevel" defaultValue={initial.educational_level ?? ""} required><option value="" disabled>Selecciona</option><option>Preescolar</option><option>Primaria</option><option>Secundaria</option></select></div><div className="field"><label htmlFor="academicGrade">Grado académico</label><select className="input" id="academicGrade" name="academicGrade" defaultValue={initial.academic_grade ?? ""} required><option value="" disabled>Selecciona</option>{["1°","2°","3°","4°","5°","6°"].map((grade) => <option key={grade}>{grade}</option>)}</select></div></div><div className="field"><label htmlFor="schoolCycle">Ciclo escolar <span className="muted font-normal">(opcional)</span></label><input className="input" id="schoolCycle" name="schoolCycle" defaultValue={initial.school_cycle ?? ""} placeholder="2026-2027"/></div><FormMessage state={state}/><SubmitButton>{initial.id ? "Guardar cambios" : "Crear grupo"}</SubmitButton></form>;
}

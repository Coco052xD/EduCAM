"use client";

import { useActionState } from "react";
import { createStudentAction, updateStudentAction } from "@/lib/actions/students";
import type { ActionState } from "@/lib/actions/auth";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { AGE_RANGES, GRADES } from "@/types/database";

type Option = { id: string; name: string };
type GroupOption = { id: string; name: string; grade: number; school_year: string };
type Initial = { id?: string; groupId?: string; name?: string; grade?: number; age_range?: string | null; profile_comment?: string | null; conditionIds?: string[] };

const AGE_LABELS: Record<string, string> = { "7-9": "7 a 9 años", "10-12": "10 a 12 años", "12+": "Mayor de 12 años" };

export function StudentForm({ groups, conditions, initial = {}, selectedGroupId }: { groups: GroupOption[]; conditions: Option[]; initial?: Initial; selectedGroupId?: string }) {
  const [state, action] = useActionState(initial.id ? updateStudentAction : createStudentAction, {} as ActionState);
  return <form action={action} className="card mt-7 grid gap-6 p-6 sm:p-8">
    {initial.id && <input name="studentId" type="hidden" value={initial.id}/>}
    <div className="field"><label htmlFor="groupId">Grupo</label><select className="input" id="groupId" name="groupId" defaultValue={initial.groupId || selectedGroupId || ""} required><option value="" disabled>Selecciona un grupo</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name} · {group.grade}.º · {group.school_year}</option>)}</select></div>

    <div className="field"><label htmlFor="name">Nombre o apodo</label><input className="input" id="name" name="name" defaultValue={initial.name} maxLength={80} required/><p className="muted text-xs">Se muestra solo para organizar tu aula. Nunca se envía a Gemma.</p></div>

    <div className="grid gap-5 sm:grid-cols-2">
      <div className="field"><label htmlFor="grade">Grado</label><select className="input" id="grade" name="grade" defaultValue={initial.grade ?? ""} required><option value="" disabled>Selecciona</option>{GRADES.map((grade) => <option key={grade} value={grade}>{grade}.º de primaria</option>)}</select></div>
      <div className="field"><label htmlFor="ageRange">Rango de edad</label><select className="input" id="ageRange" name="ageRange" defaultValue={initial.age_range ?? ""} required><option value="" disabled>Selecciona</option>{AGE_RANGES.map((range) => <option key={range} value={range}>{AGE_LABELS[range]}</option>)}</select><p className="muted text-xs">Rango, no fecha de nacimiento: es el dato mínimo que el sistema necesita.</p></div>
    </div>

    <fieldset><legend className="label mb-3">Padecimientos</legend><div className="grid gap-2 sm:grid-cols-2">{conditions.map((condition) => <label className="choice" key={condition.id}><input defaultChecked={initial.conditionIds?.includes(condition.id)} name="conditionIds" type="checkbox" value={condition.id}/><span>{condition.name}</span></label>)}</div><p className="muted mt-2 text-xs">Esta selección orienta apoyos pedagógicos; no constituye un diagnóstico.</p></fieldset>

    <div className="field"><label htmlFor="profileComment">Comentario del educador</label><textarea className="input min-h-28" id="profileComment" name="profileComment" defaultValue={initial.profile_comment ?? ""} maxLength={500}/><p className="muted text-xs">Máximo 500 caracteres. No incluyas información médica, familiar ni nombres de terceros: este texto sí viaja al modelo.</p></div>

    <FormMessage state={state}/><SubmitButton>{initial.id ? "Guardar cambios" : "Guardar y crear perfil"}</SubmitButton>
  </form>;
}

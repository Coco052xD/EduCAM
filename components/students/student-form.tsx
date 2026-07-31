"use client";

import { useActionState } from "react";
import { createStudentAction, updateStudentAction } from "@/lib/actions/students";
import type { ActionState } from "@/lib/actions/auth";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";

type Option = { id: string; name: string };
type GroupOption = { id: string; name: string; educational_level: string; academic_grade: string };
type Initial = { id?: string; group_id?: string; nickname?: string; age_value?: number | null; age_range?: string | null; educational_level?: string; enrolled_grade?: string; conditionIds?: string[] };
export function StudentForm({ groups, conditions, initial = {}, selectedGroupId }: { groups: GroupOption[]; conditions: Option[]; initial?: Initial; selectedGroupId?: string }) {
  const [state, action] = useActionState(initial.id ? updateStudentAction : createStudentAction, {} as ActionState);
  return <form action={action} className="card mt-7 grid gap-6 p-6 sm:p-8">{initial.id && <input name="studentId" type="hidden" value={initial.id}/>}<div className="field"><label htmlFor="groupId">Grupo</label><select className="input" id="groupId" name="groupId" defaultValue={initial.group_id ?? selectedGroupId ?? ""} required><option value="" disabled>Selecciona un grupo</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name} · {group.academic_grade}</option>)}</select></div><div className="field"><label htmlFor="nickname">Nombre o apodo</label><input className="input" id="nickname" name="nickname" defaultValue={initial.nickname} maxLength={80} required/><p className="muted text-xs">Se muestra solo para organizar tu aula. Nunca se envía a Gemma.</p></div>
    <fieldset><legend className="label mb-3">Edad</legend><div className="grid gap-4 sm:grid-cols-2"><div className="field"><label className="text-sm font-normal" htmlFor="ageValue">Edad en años</label><input className="input" id="ageValue" name="ageValue" defaultValue={initial.age_value ?? ""} type="number" min={3} max={30}/></div><div className="field"><label className="text-sm font-normal" htmlFor="ageRange">O rango de edad</label><input className="input" id="ageRange" name="ageRange" defaultValue={initial.age_range ?? ""} placeholder="Ej. 8 a 10 años"/></div></div><p className="muted mt-2 text-xs">Completa solo una de las dos opciones.</p></fieldset>
    <div className="grid gap-5 sm:grid-cols-2"><div className="field"><label htmlFor="educationalLevel">Nivel educativo</label><select className="input" id="educationalLevel" name="educationalLevel" defaultValue={initial.educational_level ?? ""} required><option value="" disabled>Selecciona</option><option>Preescolar</option><option>Primaria</option><option>Secundaria</option></select></div><div className="field"><label htmlFor="enrolledGrade">Grado inscrito</label><select className="input" id="enrolledGrade" name="enrolledGrade" defaultValue={initial.enrolled_grade ?? ""} required><option value="" disabled>Selecciona</option>{["1°","2°","3°","4°","5°","6°"].map((grade) => <option key={grade}>{grade}</option>)}</select></div></div>
    <fieldset><legend className="label mb-3">Discapacidades o condiciones seleccionadas</legend><div className="grid gap-2 sm:grid-cols-2">{conditions.map((condition) => <label className="choice" key={condition.id}><input defaultChecked={initial.conditionIds?.includes(condition.id)} name="conditionIds" type="checkbox" value={condition.id}/><span>{condition.name}</span></label>)}</div><p className="muted mt-2 text-xs">Esta selección orienta apoyos pedagógicos; no constituye un diagnóstico.</p></fieldset>
    <FormMessage state={state}/><SubmitButton>{initial.id ? "Guardar cambios" : "Guardar y crear perfil"}</SubmitButton>
  </form>;
}

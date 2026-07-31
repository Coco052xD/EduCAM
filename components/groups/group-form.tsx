"use client";

import { useActionState } from "react";
import { createGroupAction, updateGroupAction } from "@/lib/actions/groups";
import type { ActionState } from "@/lib/actions/auth";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { GRADES } from "@/types/database";

type Initial = { id?: string; name?: string; grade?: number; school_year?: string };

export function GroupForm({ initial = {} }: { initial?: Initial }) {
  const [state, action] = useActionState(initial.id ? updateGroupAction : createGroupAction, {} as ActionState);
  return <form action={action} className="card mt-7 grid gap-5 p-6 sm:p-8">
    {initial.id && <input type="hidden" name="groupId" value={initial.id}/>}
    <div className="field"><label htmlFor="name">Nombre del grupo</label><input className="input" id="name" name="name" defaultValue={initial.name} placeholder="Ej. Grupo puente matutino" required/></div>
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="field"><label htmlFor="grade">Grado</label><select className="input" id="grade" name="grade" defaultValue={initial.grade ?? ""} required><option value="" disabled>Selecciona</option>{GRADES.map((grade) => <option key={grade} value={grade}>{grade}.º de primaria</option>)}</select></div>
      <div className="field"><label htmlFor="schoolYear">Ciclo escolar</label><input className="input" id="schoolYear" name="schoolYear" defaultValue={initial.school_year ?? ""} pattern="\d{4}-\d{4}" placeholder="2025-2026" required/></div>
    </div>
    <FormMessage state={state}/><SubmitButton>{initial.id ? "Guardar cambios" : "Crear grupo"}</SubmitButton>
  </form>;
}

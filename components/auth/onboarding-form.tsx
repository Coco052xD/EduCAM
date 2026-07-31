"use client";

import { useActionState } from "react";
import { saveEducatorProfileAction, type ActionState } from "@/lib/actions/auth";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";

const grades = ["Preescolar", "1° Primaria", "2° Primaria", "3° Primaria", "4° Primaria", "5° Primaria", "6° Primaria", "1° Secundaria", "2° Secundaria", "3° Secundaria"];
const subjects = ["Lenguajes", "Saberes y pensamiento científico", "Ética, naturaleza y sociedades", "De lo humano y lo comunitario"];

export function OnboardingForm() {
  const [state, action] = useActionState(saveEducatorProfileAction, {} as ActionState);
  return <form action={action} className="card mt-8 grid gap-7 p-6 sm:p-8">
    <div className="field"><label htmlFor="displayName">Nombre o apodo</label><input className="input" id="displayName" name="displayName" maxLength={80} required/><p className="muted text-xs">Así nos dirigiremos a ti dentro de la plataforma.</p></div>
    <fieldset><legend className="label mb-3">Grados que atiendes</legend><div className="grid gap-2 sm:grid-cols-2">{grades.map((item) => <label className="choice" key={item}><input type="checkbox" name="gradesTaught" value={item}/><span>{item}</span></label>)}</div></fieldset>
    <fieldset><legend className="label mb-3">Campos formativos o materias</legend><div className="grid gap-2">{subjects.map((item) => <label className="choice" key={item}><input type="checkbox" name="subjectsTaught" value={item}/><span>{item}</span></label>)}</div></fieldset>
    <FormMessage state={state}/><SubmitButton>Guardar y continuar</SubmitButton>
  </form>;
}

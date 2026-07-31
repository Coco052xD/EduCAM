"use client";

import { useActionState } from "react";
import { saveLearningProfileAction } from "@/lib/actions/students";
import type { ActionState } from "@/lib/actions/auth";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";

const sections = [
  ["preferredInstructionFormats","Comprensión · formatos preferidos",["imágenes","audio","demostración","texto","objetos físicos","combinación"]],
  ["responseMethods","Formas de respuesta",["hablar","escribir","dibujar","señalar","pictogramas","objetos"]],
  ["interests","Intereses",["animales","música","deportes","tecnología","historias","colores","vehículos","naturaleza","otro"]],
  ["preferredMaterials","Materiales preferidos",["imágenes","videos","material manipulable","actividades impresas","audio","juegos"]],
  ["successfulSupports","Apoyos que han funcionado",["repetir instrucciones","dividir en pasos","pictogramas","ejemplo previo","acompañamiento individual","tiempo adicional","material concreto","refuerzo positivo"]],
] as const;
type Profile = Record<string, string | string[] | null | undefined>;
export function LearningProfileForm({ studentId, initial = {} }: { studentId: string; initial?: Profile }) {
  const [state, action] = useActionState(saveLearningProfileAction, {} as ActionState);
  return <form action={action} className="mt-7 grid gap-6"><input type="hidden" name="studentId" value={studentId}/>
    <div className="card grid gap-6 p-6 sm:p-8">{sections.slice(0,1).map(([name,title,options]) => <CheckboxSection key={name} name={name} title={title} options={options} initial={initial[name]}/>) }
      <RadioSection name="instructionSteps" title="Cantidad de pasos" options={["uno","dos","tres o más"]} initial={initial.instructionSteps}/>
    </div>
    <div className="card grid gap-6 p-6 sm:p-8"><RadioSection name="preferredParticipation" title="Participación preferida" options={["individual","pareja","grupo pequeño","grupo completo"]} initial={initial.preferredParticipation}/>{sections.slice(1,2).map(([name,title,options]) => <CheckboxSection key={name} name={name} title={title} options={options} initial={initial[name]}/>)}</div>
    <div className="card grid gap-6 p-6 sm:p-8"><RadioSection name="attentionRange" title="Rango de atención observado" options={["menos de 5 minutos","5 a 10 minutos","10 a 20 minutos","más de 20 minutos"]} initial={initial.attentionRange}/><RadioSection name="needsBreaks" title="Pausas" options={["frecuentemente","algunas veces","generalmente no"]} initial={initial.needsBreaks}/></div>
    {sections.slice(2).map(([name,title,options]) => <div className="card p-6 sm:p-8" key={name}><CheckboxSection name={name} title={title} options={options} initial={initial[name]}/></div>)}
    <div className="card p-6 sm:p-8"><div className="field"><label htmlFor="educatorNote">Nota pedagógica opcional</label><textarea className="input min-h-28" id="educatorNote" name="educatorNote" defaultValue={String(initial.educatorNote ?? "")} maxLength={500}/><p className="muted text-xs">Máximo 500 caracteres. No incluyas información médica, familiar o sensible.</p></div></div>
    <FormMessage state={state}/><SubmitButton>Guardar Perfil de aprendizaje</SubmitButton>
  </form>;
}
function CheckboxSection({ name, title, options, initial }: { name: string; title: string; options: readonly string[]; initial?: string | string[] | null }) { const selected = Array.isArray(initial) ? initial : []; return <fieldset><legend className="label mb-3">{title}</legend><div className="grid gap-2 sm:grid-cols-2">{options.map((option) => <label className="choice" key={option}><input defaultChecked={selected.includes(option)} name={name} type="checkbox" value={option}/><span className="capitalize">{option}</span></label>)}</div></fieldset>; }
function RadioSection({ name, title, options, initial }: { name: string; title: string; options: string[]; initial?: string | string[] | null }) { return <fieldset><legend className="label mb-3">{title}</legend><div className="grid gap-2 sm:grid-cols-2">{options.map((option) => <label className="choice" key={option}><input defaultChecked={initial === option} required name={name} type="radio" value={option}/><span className="capitalize">{option}</span></label>)}</div></fieldset>; }

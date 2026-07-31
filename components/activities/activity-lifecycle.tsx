"use client";

import { useActionState } from "react";
import { editAndAcceptActivityAction, markAppliedAction, saveFeedbackAction } from "@/lib/actions/activities";
import type { ActionState } from "@/lib/actions/auth";
import type { GeneratedActivity } from "@/lib/schemas/activity";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";

export function ActivityLifecycle({ optionId, status, activity, existingFeedback }: { optionId: string; status: string; activity: GeneratedActivity; existingFeedback?: { rating: number; modification_comment: string } | null }) {
  const [editState, editAction] = useActionState(editAndAcceptActivityAction, {} as ActionState);
  const [feedbackState, feedbackAction] = useActionState(saveFeedbackAction, {} as ActionState);
  const applied = ["applied","evaluated"].includes(status);
  return <aside className="no-print grid gap-4">
    <div className="card p-6"><h2 className="section-title">Estado de la actividad</h2><span className="chip mt-4 capitalize">{status}</span><div className="mt-5 flex flex-wrap gap-2"><button className="button button-secondary" type="button" onClick={() => window.print()}>Imprimir</button>{!applied && <form action={markAppliedAction}><input type="hidden" name="optionId" value={optionId}/><button className="button" type="submit">Marcar como aplicada</button></form>}</div></div>
    {!applied && <details className="card p-6"><summary className="cursor-pointer font-extrabold">Editar contenido</summary><form action={editAction} className="mt-5 grid gap-4"><input type="hidden" name="optionId" value={optionId}/><div className="field"><label>Título</label><input className="input" name="title" defaultValue={activity.title}/></div><div className="field"><label>Objetivo</label><textarea className="input" name="objective" defaultValue={activity.objective}/></div><div className="field"><label>Justificación</label><textarea className="input" name="rationale" defaultValue={activity.rationale}/></div><FormMessage state={editState}/><SubmitButton>Guardar cambios</SubmitButton></form></details>}
    {applied && <form action={feedbackAction} className="card grid gap-5 p-6"><div><p className="eyebrow">Mejora continua</p><h2 className="section-title mt-2">¿Cómo funcionó?</h2></div><input type="hidden" name="optionId" value={optionId}/><fieldset><legend className="label mb-3">Calificación</legend><div className="flex flex-wrap gap-2">{[1,2,3,4,5].map((star) => <label className="choice" key={star}><input defaultChecked={existingFeedback?.rating === star} name="rating" type="radio" value={star} required/><span>{star} ★</span></label>)}</div></fieldset><div className="field"><label htmlFor="modificationComment">¿Qué modificarías para que esta actividad funcione mejor?</label><textarea className="input min-h-28" id="modificationComment" name="modificationComment" defaultValue={existingFeedback?.modification_comment} maxLength={500} required/><p className="muted text-xs">Máximo 500 caracteres.</p></div><FormMessage state={feedbackState}/><SubmitButton>Guardar retroalimentación</SubmitButton><p className="muted text-xs">Se usará como contexto en futuras generaciones; no entrena automáticamente el modelo.</p></form>}
  </aside>;
}

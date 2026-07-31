"use client";

import { useActionState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { rateRecommendationAction, regenerateRecommendationAction } from "@/lib/actions/recommendations";
import type { ActionState } from "@/lib/actions/auth";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import type { RecommendationRating } from "@/types/database";

export function RecommendationFeedback({ recommendationId, rating, comment }: { recommendationId: string; rating: RecommendationRating | null; comment: string | null }) {
  const [state, action] = useActionState(rateRecommendationAction, {} as ActionState);
  const [regenState, regenAction] = useActionState(regenerateRecommendationAction, {} as ActionState);

  return <div className="grid gap-6">
    <form action={action} className="card grid gap-5 p-6 sm:p-8">
      <input type="hidden" name="recommendationId" value={recommendationId}/>
      <h2 className="section-title">¿Te sirvió esta recomendación?</h2>
      <p className="muted text-sm">Las marcadas como buenas se usan como ejemplo en las siguientes generaciones. Es así como el modelo aprende de tu criterio.</p>
      <fieldset><div className="grid gap-2 sm:grid-cols-2">
        <label className="choice"><input defaultChecked={rating === "good"} name="rating" required type="radio" value="good"/><span className="flex items-center gap-2"><ThumbsUp size={16}/>Sí, la usaría</span></label>
        <label className="choice"><input defaultChecked={rating === "bad"} name="rating" required type="radio" value="bad"/><span className="flex items-center gap-2"><ThumbsDown size={16}/>No, necesito otra</span></label>
      </div></fieldset>
      <div className="field"><label htmlFor="comment">¿Por qué? <span className="muted font-normal">(opcional)</span></label><textarea className="input min-h-24" defaultValue={comment ?? ""} id="comment" name="comment" maxLength={500}/></div>
      <FormMessage state={state}/>
      <SubmitButton>Guardar calificación</SubmitButton>
    </form>

    <form action={regenAction} className="card grid gap-5 p-6 sm:p-8">
      <input type="hidden" name="recommendationId" value={recommendationId}/>
      <h2 className="section-title">Generar otra</h2>
      <p className="muted text-sm">La nueva queda encadenada a esta, y el motivo viaja al modelo para que no repita lo que acabas de descartar.</p>
      <div className="field"><label htmlFor="refinement">Qué cambiar <span className="muted font-normal">(opcional)</span></label><input className="input" id="refinement" name="refinement" maxLength={300} placeholder="Ej. menos material impreso"/></div>
      <FormMessage state={regenState}/>
      <SubmitButton>Generar nueva recomendación</SubmitButton>
    </form>
  </div>;
}

"use client";

import { useActionState } from "react";
import { saveEducatorProfileAction, type ActionState } from "@/lib/actions/auth";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";

export function OnboardingForm() {
  const [state, action] = useActionState(saveEducatorProfileAction, {} as ActionState);
  return <form action={action} className="card mt-8 grid gap-7 p-6 sm:p-8">
    <div className="field"><label htmlFor="name">Nombre o apodo</label><input className="input" id="name" name="name" maxLength={80} required/><p className="muted text-xs">Así nos dirigiremos a ti dentro de la plataforma.</p></div>
    <FormMessage state={state}/><SubmitButton>Guardar y continuar</SubmitButton>
  </form>;
}

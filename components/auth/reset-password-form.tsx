"use client";

import { useActionState } from "react";
import { updatePasswordAction, type ActionState } from "@/lib/actions/auth";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePasswordAction, {} as ActionState);
  return <form action={action} className="grid gap-5"><div className="field"><label htmlFor="password">Nueva contraseña</label><input className="input" id="password" name="password" type="password" minLength={8} autoComplete="new-password" required/></div><FormMessage state={state}/><SubmitButton>Guardar nueva contraseña</SubmitButton></form>;
}

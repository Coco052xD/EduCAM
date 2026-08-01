"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction, loginAction, registerAction, type ActionState } from "@/lib/actions/auth";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: ActionState = {};

export function AuthForm({ mode }: { mode: "login" | "register" | "forgot" }) {
  const action = mode === "login" ? loginAction : mode === "register" ? registerAction : forgotPasswordAction;
  const [state, formAction] = useActionState(action, initialState);
  return <form action={formAction} className="grid gap-5">
    <div className="field"><label htmlFor="email">Correo personal</label><input className="input" id="email" name="email" type="email" autoComplete="email" required/></div>
    {mode !== "forgot" && <div className="field"><div className="flex justify-between"><label htmlFor="password">Contraseña</label>{mode === "login" && <Link className="brand-link text-sm" href="/forgot-password">¿La olvidaste?</Link>}</div><input className="input" id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required/></div>}
    <FormMessage state={state}/>
    <SubmitButton pendingText={mode === "forgot" ? "Enviando…" : "Validando…"}>{mode === "login" ? "Entrar" : mode === "register" ? "Crear cuenta" : "Enviar instrucciones"}</SubmitButton>
    <p className="muted text-center text-sm">{mode === "login" ? <>¿Primera vez? <Link className="brand-link" href="/register">Crea tu cuenta</Link></> : <>¿Ya tienes cuenta? <Link className="brand-link" href="/login">Inicia sesión</Link></>}</p>
  </form>;
}

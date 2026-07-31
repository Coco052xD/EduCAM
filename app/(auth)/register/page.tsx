import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
export const metadata: Metadata = { title: "Crear cuenta" };
export default function RegisterPage() { return <><p className="eyebrow mb-3">Comienza aquí</p><h1 className="page-title">Crea tu cuenta</h1><p className="muted mb-8 mt-3">El correo solo se usa como credencial técnica y nunca se envía a Gemma.</p><AuthForm mode="register"/></>; }

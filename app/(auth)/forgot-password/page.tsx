import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
export const metadata: Metadata = { title: "Recuperar acceso" };
export default function ForgotPage() { return <><p className="eyebrow mb-3">Recupera tu acceso</p><h1 className="page-title">Restablece tu contraseña</h1><p className="muted mb-8 mt-3">Te enviaremos un enlace si el correo está registrado.</p><AuthForm mode="forgot"/></>; }

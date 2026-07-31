import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
export const metadata: Metadata = { title: "Iniciar sesión" };
export default function LoginPage() { return <><p className="eyebrow mb-3">Bienvenido de vuelta</p><h1 className="page-title">Inicia sesión</h1><p className="muted mb-8 mt-3">Continúa preparando actividades para tu grupo.</p><AuthForm mode="login"/></>; }

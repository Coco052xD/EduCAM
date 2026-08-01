import { requireUser } from "@/lib/permissions/auth";
import { OnboardingForm } from "@/components/auth/onboarding-form";
export default async function OnboardingPage() { await requireUser(); return <main className="container-app max-w-3xl py-12"><p className="eyebrow mb-3">Tu espacio de trabajo</p><h1 className="page-title">Cuéntanos lo mínimo</h1><p className="muted mt-3">No pedimos escuela, institución, cargo ni especialidad.</p><OnboardingForm/></main>; }

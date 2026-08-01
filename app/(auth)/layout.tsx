import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="grid min-h-screen lg:grid-cols-[.85fr_1.15fr]">
    <section className="auth-aside hidden p-12 text-white lg:flex lg:flex-col lg:justify-between"><Link href="/" className="flex items-center gap-3 font-extrabold"><span className="brand-mark">AP</span>Aula Puente IA</Link><div><p className="text-sm font-black uppercase tracking-[.16em] text-[#fde047]">Diseñado para educadores</p><p className="mt-5 text-4xl font-black leading-tight tracking-[-.04em]">Planea con más contexto. Decide con tu experiencia.</p></div><p className="text-sm text-white/75">Los datos identificables nunca se envían al modelo.</p></section>
    <section className="grid place-items-center p-6"><div className="w-full max-w-md"><Link className="mb-10 flex items-center gap-2 font-extrabold lg:hidden" href="/"><span className="brand-mark !size-8 !rounded-lg text-xs">AP</span>Aula Puente IA</Link>{children}</div></section>
  </main>;
}

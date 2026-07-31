import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="grid min-h-screen lg:grid-cols-[.85fr_1.15fr]">
    <section className="hidden bg-[#18312d] p-12 text-white lg:flex lg:flex-col lg:justify-between"><Link href="/" className="font-extrabold">Aula Puente IA</Link><div><p className="text-sm font-bold uppercase tracking-[.16em] text-[#e9a23b]">Diseñado para educadores</p><p className="mt-5 text-4xl font-black leading-tight tracking-[-.04em]">Planea con más contexto. Decide con tu experiencia.</p></div><p className="text-sm text-white/60">Los datos identificables nunca se envían al modelo.</p></section>
    <section className="grid place-items-center p-6"><div className="w-full max-w-md"><Link className="mb-10 inline-block font-extrabold lg:hidden" href="/">Aula Puente IA</Link>{children}</div></section>
  </main>;
}

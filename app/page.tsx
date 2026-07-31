import Link from "next/link";
import { ArrowRight, BookOpenCheck, ShieldCheck, Sparkles } from "lucide-react";

export default function Home() {
  return <main>
    <header className="container-app flex items-center justify-between py-6">
      <Link href="/" className="flex items-center gap-3 font-extrabold"><span className="grid size-10 place-items-center rounded-xl bg-[#176b5c] text-white">AP</span>Aula Puente IA</Link>
      <Link className="button button-secondary" href="/login">Iniciar sesión</Link>
    </header>
    <section className="container-app grid min-h-[72vh] items-center gap-12 py-16 lg:grid-cols-[1.1fr_.9fr]">
      <div>
        <p className="eyebrow mb-4">Planeación inclusiva con criterio docente</p>
        <h1 className="text-5xl font-black leading-[.98] tracking-[-.055em] sm:text-7xl">Cada actividad puede encontrar otra forma de llegar.</h1>
        <p className="muted mt-7 max-w-2xl text-lg leading-8">Conecta el objetivo curricular, los apoyos que ya funcionan y tu experiencia para crear propuestas revisables, prácticas y respetuosas.</p>
        <div className="mt-8 flex flex-wrap gap-3"><Link className="button" href="/register">Crear cuenta <ArrowRight size={18}/></Link><Link className="button button-secondary" href="/login">Ya tengo cuenta</Link></div>
      </div>
      <div className="card relative overflow-hidden p-7 sm:p-10">
        <div className="absolute -right-12 -top-12 size-44 rounded-full bg-[#e9a23b]/20"/>
        <p className="eyebrow">El ciclo de mejora</p>
        <div className="mt-6 grid gap-4">
          {[ [BookOpenCheck,"Partir del contexto","Perfil de aprendizaje y objetivo curricular."], [Sparkles,"Explorar opciones","Propuestas visuales, manipulativas y colaborativas."], [ShieldCheck,"Decidir y mejorar","Tú revisas, aplicas y compartes qué funcionó."] ].map(([Icon,title,text]) => <div key={String(title)} className="flex gap-4 rounded-xl bg-[#edf6f1] p-4"><Icon className="mt-1 shrink-0 text-[#176b5c]"/><div><h2 className="font-bold">{title as string}</h2><p className="muted mt-1 text-sm leading-6">{text as string}</p></div></div>)}
        </div>
        <p className="muted mt-6 text-xs">La IA propone. El educador decide. No se realizan diagnósticos.</p>
      </div>
    </section>
  </main>;
}

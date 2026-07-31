import Link from "next/link";
import { BookOpen, Home, LogOut, PlusCircle, UsersRound } from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";

const links = [
  { href: "/dashboard", label: "Resumen", icon: Home },
  { href: "/dashboard/groups", label: "Grupos", icon: UsersRound },
  { href: "/dashboard/activities/new", label: "Nueva actividad", icon: PlusCircle },
];

export function DashboardShell({ displayName, children }: { displayName: string; children: React.ReactNode }) {
  return <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
    <aside className="no-print hidden border-r border-[#dce4df] bg-white p-5 lg:flex lg:flex-col">
      <Link className="flex items-center gap-3 font-extrabold" href="/dashboard"><span className="grid size-10 place-items-center rounded-xl bg-[#176b5c] text-white">AP</span>Aula Puente IA</Link>
      <nav className="mt-10 grid gap-2">{links.map(({href,label,icon:Icon}) => <Link key={href} className="flex items-center gap-3 rounded-xl px-3 py-3 font-bold text-[#52615e] hover:bg-[#edf6f1] hover:text-[#105044]" href={href}><Icon size={19}/>{label}</Link>)}</nav>
      <div className="mt-auto border-t border-[#dce4df] pt-5"><p className="text-sm font-bold">{displayName}</p><form action={signOutAction}><button className="mt-3 flex items-center gap-2 text-sm font-bold text-[#62706d]" type="submit"><LogOut size={16}/>Cerrar sesión</button></form></div>
    </aside>
    <div>
      <header className="no-print sticky top-0 z-20 flex items-center justify-between border-b border-[#dce4df] bg-white/95 px-4 py-3 backdrop-blur lg:hidden"><Link href="/dashboard" className="font-extrabold">Aula Puente IA</Link><nav className="flex gap-2"><Link aria-label="Grupos" className="rounded-lg p-2" href="/dashboard/groups"><UsersRound/></Link><Link aria-label="Nueva actividad" className="rounded-lg bg-[#176b5c] p-2 text-white" href="/dashboard/activities/new"><BookOpen/></Link></nav></header>
      <main className="container-app py-8 sm:py-12">{children}</main>
    </div>
  </div>;
}

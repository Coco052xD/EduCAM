import Link from "next/link";
import { BookOpen, Home, LogOut, PlusCircle, UsersRound } from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";

const links = [
  { href: "/dashboard", label: "Resumen", icon: Home },
  { href: "/dashboard/groups", label: "Grupos", icon: UsersRound },
  { href: "/dashboard/recommendations/new", label: "Nueva recomendación", icon: PlusCircle },
];

export function DashboardShell({ displayName, children }: { displayName: string; children: React.ReactNode }) {
  return <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
    <aside className="dashboard-sidebar no-print hidden border-r-2 p-5 lg:flex lg:flex-col">
      <Link className="flex items-center gap-3 font-extrabold" href="/dashboard"><span className="brand-mark">AP</span>Aula Puente IA</Link>
      <nav className="mt-10 grid gap-2">{links.map(({href,label,icon:Icon}) => <Link key={href} className="dashboard-nav-link flex items-center gap-3 rounded-xl px-3 py-3 font-bold" href={href}><Icon size={19}/>{label}</Link>)}</nav>
      <div className="mt-auto border-t-2 border-[#bfdbfe] pt-5"><p className="text-sm font-extrabold">{displayName}</p><form action={signOutAction}><button className="muted mt-3 flex items-center gap-2 text-sm font-bold transition hover:text-[var(--secondary)]" type="submit"><LogOut size={16}/>Cerrar sesión</button></form></div>
    </aside>
    <div>
      <header className="mobile-header no-print sticky top-0 z-20 flex items-center justify-between border-b-2 px-4 py-3 backdrop-blur lg:hidden"><Link href="/dashboard" className="flex items-center gap-2 font-extrabold"><span className="brand-mark !size-8 !rounded-lg text-xs">AP</span>Aula Puente IA</Link><nav className="flex gap-2"><Link aria-label="Grupos" className="rounded-lg bg-[var(--soft)] p-2 text-[var(--brand-dark)]" href="/dashboard/groups"><UsersRound/></Link><Link aria-label="Nueva recomendación" className="mobile-primary-action rounded-lg p-2" href="/dashboard/recommendations/new"><BookOpen/></Link></nav></header>
      <main className="container-app py-8 sm:py-12">{children}</main>
    </div>
  </div>;
}

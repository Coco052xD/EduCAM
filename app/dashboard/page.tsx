import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Users } from "lucide-react";
import { requireUser } from "@/lib/permissions/auth";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const [{ data: groups }, { count: studentCount }, { count: unrated }, { count: good }] = await Promise.all([
    supabase.from("student_groups").select("id,name,grade,school_year").order("name").limit(4),
    supabase.from("students").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("recommendations").select("id", { count: "exact", head: true }).eq("educator_id", user.id).is("rating", null),
    supabase.from("recommendations").select("id", { count: "exact", head: true }).eq("educator_id", user.id).eq("rating", "good"),
  ]);
  const stats = [
    [Users, "Alumnos activos", studentCount ?? 0],
    [Clock3, "Sin calificar", unrated ?? 0],
    [CheckCircle2, "Marcadas como buenas", good ?? 0],
  ] as const;
  return <div className="grid gap-9"><PageHeader eyebrow="Tu aula" title="Un vistazo al trabajo de hoy" description="Continúa desde el grupo o genera una recomendación con los perfiles que ya registraste." action={<Link className="button" href="/dashboard/recommendations/new">Nueva recomendación <ArrowRight size={18}/></Link>}/>
    <section className="grid-cards">{stats.map(([Icon,label,value]) => <div className="card p-5" key={label}><Icon className="text-[#176b5c]"/><p className="mt-5 text-3xl font-black">{value}</p><p className="muted mt-1 text-sm">{label}</p></div>)}</section>
    <section><div className="mb-4 flex items-center justify-between"><h2 className="section-title">Grupos</h2><Link className="text-sm font-bold text-[#176b5c]" href="/dashboard/groups">Ver todos</Link></div>
      {groups?.length ? <div className="grid-cards">{groups.map((group) => <Link className="card p-5 transition hover:-translate-y-1 hover:border-[#176b5c]" href={`/dashboard/groups/${group.id}`} key={group.id}><span className="chip">{group.grade}.º · {group.school_year}</span><h3 className="mt-5 text-lg font-extrabold">{group.name}</h3><p className="muted mt-2 text-sm">Abrir grupo →</p></Link>)}</div> : <EmptyState title="Aún no hay grupos" description="Crea el primero para registrar alumnos y comenzar a planear." action={<Link className="button" href="/dashboard/groups/new">Crear grupo</Link>}/>}
    </section>
  </div>;
}

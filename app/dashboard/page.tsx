import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Users } from "lucide-react";
import { requireUser } from "@/lib/permissions/auth";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const app = supabase.schema("app");
  const [{ data: groups }, { count: studentCount }, { count: pendingApply }, { count: pendingFeedback }] = await Promise.all([
    app.from("groups").select("id,name,educational_level,academic_grade").eq("educator_id", user.id).eq("active", true).order("created_at", { ascending: false }).limit(4),
    app.from("students").select("id", { count: "exact", head: true }).eq("educator_id", user.id).eq("active", true),
    app.from("activity_options").select("id,activity_requests!inner(educator_id)", { count: "exact", head: true }).eq("activity_requests.educator_id", user.id).in("status", ["accepted","edited"]),
    app.from("activity_options").select("id,activity_requests!inner(educator_id)", { count: "exact", head: true }).eq("activity_requests.educator_id", user.id).eq("status", "applied"),
  ]);
  const stats = [[Users,"Alumnos activos",studentCount ?? 0],[Clock3,"Pendientes de aplicar",pendingApply ?? 0],[CheckCircle2,"Pendientes de evaluar",pendingFeedback ?? 0]] as const;
  return <div className="grid gap-9"><PageHeader eyebrow="Tu aula" title="Un vistazo al trabajo de hoy" description="Continúa desde el grupo o crea una actividad con los perfiles que ya registraste." action={<Link className="button" href="/dashboard/activities/new">Nueva actividad <ArrowRight size={18}/></Link>}/>
    <section className="grid-cards">{stats.map(([Icon,label,value]) => <div className="card p-5" key={label}><Icon className="text-[#176b5c]"/><p className="mt-5 text-3xl font-black">{value}</p><p className="muted mt-1 text-sm">{label}</p></div>)}</section>
    <section><div className="mb-4 flex items-center justify-between"><h2 className="section-title">Grupos activos</h2><Link className="text-sm font-bold text-[#176b5c]" href="/dashboard/groups">Ver todos</Link></div>
      {groups?.length ? <div className="grid-cards">{groups.map((group) => <Link className="card p-5 transition hover:-translate-y-1 hover:border-[#176b5c]" href={`/dashboard/groups/${group.id}`} key={group.id}><span className="chip">{group.educational_level} · {group.academic_grade}</span><h3 className="mt-5 text-lg font-extrabold">{group.name}</h3><p className="muted mt-2 text-sm">Abrir grupo →</p></Link>)}</div> : <EmptyState title="Aún no hay grupos" description="Crea el primero para registrar alumnos y comenzar a planear." action={<Link className="button" href="/dashboard/groups/new">Crear grupo</Link>}/>} 
    </section>
  </div>;
}

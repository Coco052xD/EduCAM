import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/permissions/auth";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default async function GroupsPage() {
  const { supabase } = await requireUser();
  const { data: groups } = await supabase
    .from("student_groups")
    .select("id,name,grade,school_year,student_group_members(count)")
    .order("school_year", { ascending: false })
    .order("name");
  return <div className="grid gap-8"><PageHeader eyebrow="Organización" title="Grupos del CAM" description="Todo educador activo del plantel ve a todos los grupos; el acceso lo controla RLS." action={<Link className="button" href="/dashboard/groups/new"><Plus size={18}/>Crear grupo</Link>}/>{groups?.length ? <div className="grid-cards">{groups.map((group) => <Link key={group.id} className="card card-link p-6 transition hover:-translate-y-1" href={`/dashboard/groups/${group.id}`}><div className="flex items-center justify-between"><span className="chip">{group.grade}.º de primaria</span></div><h2 className="mt-5 text-xl font-extrabold">{group.name}</h2><p className="muted mt-2 text-sm">Ciclo {group.school_year} · {Array.isArray(group.student_group_members) ? group.student_group_members[0]?.count ?? 0 : 0} alumnos</p></Link>)}</div> : <EmptyState title="Crea tu primer grupo" description="Después podrás agregar alumnos y completar sus perfiles de aprendizaje." action={<Link className="button" href="/dashboard/groups/new">Crear grupo</Link>}/>}</div>;
}

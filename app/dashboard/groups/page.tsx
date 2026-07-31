import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/permissions/auth";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default async function GroupsPage() {
  const { supabase, user } = await requireUser();
  const { data: groups } = await supabase.schema("app").from("groups").select("id,name,educational_level,academic_grade,school_cycle,active,students(count)").eq("educator_id", user.id).order("created_at", { ascending: false });
  return <div className="grid gap-8"><PageHeader eyebrow="Organización" title="Tus grupos" description="Cada alumno permanece aislado por tu identidad mediante políticas RLS." action={<Link className="button" href="/dashboard/groups/new"><Plus size={18}/>Crear grupo</Link>}/>{groups?.length ? <div className="grid-cards">{groups.map((group) => <Link key={group.id} className="card p-6 transition hover:border-[#176b5c]" href={`/dashboard/groups/${group.id}`}><div className="flex items-center justify-between"><span className="chip">{group.educational_level} · {group.academic_grade}</span>{!group.active && <span className="muted text-xs">Archivado</span>}</div><h2 className="mt-5 text-xl font-extrabold">{group.name}</h2><p className="muted mt-2 text-sm">{group.school_cycle || "Sin ciclo escolar"} · {Array.isArray(group.students) ? group.students[0]?.count ?? 0 : 0} alumnos</p></Link>)}</div> : <EmptyState title="Crea tu primer grupo" description="Después podrás agregar alumnos y completar sus perfiles de aprendizaje." action={<Link className="button" href="/dashboard/groups/new">Crear grupo</Link>}/>}</div>;
}

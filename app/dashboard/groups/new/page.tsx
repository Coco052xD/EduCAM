import { PageHeader } from "@/components/ui/page-header";
import { GroupForm } from "@/components/groups/group-form";
export default function NewGroupPage() { return <div className="mx-auto max-w-2xl"><PageHeader eyebrow="Nuevo grupo" title="Organiza tu aula" description="Solo pedimos datos académicos básicos; no solicitamos información de la institución."/><GroupForm/></div>; }

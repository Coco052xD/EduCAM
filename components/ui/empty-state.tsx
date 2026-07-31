export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="empty"><h2 className="font-bold text-[#18312d]">{title}</h2><p className="mt-2">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

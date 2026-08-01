export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="flex flex-wrap items-end justify-between gap-5"><div>{eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}<h1 className="page-title">{title}</h1>{description && <p className="muted mt-3 max-w-2xl">{description}</p>}</div>{action}</div>;
}

export function assertResourceOwner(resource: { educator_id: string } | null, userId: string) {
  if (!resource || resource.educator_id !== userId) throw new Error("Recurso no encontrado o sin acceso.");
  return resource;
}

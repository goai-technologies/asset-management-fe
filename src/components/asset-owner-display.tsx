export function AssetOwnerDisplay({ name }: { name?: string | null }) {
  if (name) {
    return <span>{name}</span>;
  }
  return <span className="text-muted-foreground">Unassigned</span>;
}

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { statusLabel } from "@/lib/format";

const ASSET_STATUS_STYLES: Record<string, string> = {
  available: "bg-success/15 text-success border-success/30",
  assigned: "bg-info/15 text-info border-info/30",
  reserved: "bg-accent text-accent-foreground border-border",
  repair: "bg-warning/20 text-warning-foreground border-warning/40",
  lost: "bg-destructive/15 text-destructive border-destructive/30",
  disposed: "bg-muted text-muted-foreground border-border",
  retired: "bg-muted text-muted-foreground border-border",
};

const ASSIGNMENT_STATUS_STYLES: Record<string, string> = {
  active: "bg-info/15 text-info border-info/30",
  returned: "bg-success/15 text-success border-success/30",
  overdue: "bg-destructive/15 text-destructive border-destructive/30",
};

const REPAIR_STATUS_STYLES: Record<string, string> = {
  pending: "bg-warning/20 text-warning-foreground border-warning/40",
  in_progress: "bg-info/15 text-info border-info/30",
  completed: "bg-success/15 text-success border-success/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status, kind = "asset" }: { status: string; kind?: "asset" | "assignment" | "repair" | "warranty" }) {
  let styles: Record<string, string> = ASSET_STATUS_STYLES;
  if (kind === "assignment") styles = ASSIGNMENT_STATUS_STYLES;
  if (kind === "repair") styles = REPAIR_STATUS_STYLES;
  if (kind === "warranty") {
    const map: Record<string, string> = {
      active: "bg-success/15 text-success border-success/30",
      expiring: "bg-warning/20 text-warning-foreground border-warning/40",
      expired: "bg-destructive/15 text-destructive border-destructive/30",
      none: "bg-muted text-muted-foreground border-border",
    };
    return <Badge variant="outline" className={cn("font-medium", map[status] ?? map.none)}>{statusLabel(status)}</Badge>;
  }
  return (
    <Badge variant="outline" className={cn("font-medium capitalize", styles[status] ?? "bg-muted text-muted-foreground")}>
      {statusLabel(status)}
    </Badge>
  );
}

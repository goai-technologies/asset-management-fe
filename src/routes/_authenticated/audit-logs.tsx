import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { History } from "lucide-react";

export const Route = createFileRoute("/_authenticated/audit-logs")({
  component: AuditLogsPlaceholder,
});

function AuditLogsPlaceholder() {
  return (
    <div>
      <PageHeader title="Audit Logs" description="Review system activity and security events." />
      <div className="mt-8 flex flex-col items-center justify-center p-12 text-center bg-card border rounded-lg border-dashed">
        <div className="rounded-full bg-muted p-4 mb-4">
          <History className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold">Audit Logs Coming Soon</h3>
        <p className="text-muted-foreground mt-2 max-w-md">
          This section is currently under development. You will soon be able to view a complete history of system changes here.
        </p>
      </div>
    </div>
  );
}

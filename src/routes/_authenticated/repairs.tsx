import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Wrench } from "lucide-react";

export const Route = createFileRoute("/_authenticated/repairs")({
  component: RepairsPlaceholder,
});

function RepairsPlaceholder() {
  return (
    <div>
      <PageHeader title="Repairs" description="Manage asset repairs and maintenance schedules." />
      <div className="mt-8 flex flex-col items-center justify-center p-12 text-center bg-card border rounded-lg border-dashed">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Wrench className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold">Repairs Module Coming Soon</h3>
        <p className="text-muted-foreground mt-2 max-w-md">
          This section is currently under development. You will soon be able to track and manage all asset repairs here.
        </p>
      </div>
    </div>
  );
}

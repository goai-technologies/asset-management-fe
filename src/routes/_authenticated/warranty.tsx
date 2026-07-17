import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/warranty")({
  component: WarrantyPlaceholder,
});

function WarrantyPlaceholder() {
  return (
    <div>
      <PageHeader title="Warranty Tracking" description="Monitor asset warranties and expiry dates." />
      <div className="mt-8 flex flex-col items-center justify-center p-12 text-center bg-card border rounded-lg border-dashed">
        <div className="rounded-full bg-muted p-4 mb-4">
          <ShieldCheck className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold">Warranty Module Coming Soon</h3>
        <p className="text-muted-foreground mt-2 max-w-md">
          This section is currently under development. You will soon be able to track warranty claims and expiries here.
        </p>
      </div>
    </div>
  );
}

import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { currency, shortDate, warrantyState } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/assets/$id")({
  component: AssetDetail,
});

function AssetDetail() {
  const { id } = useParams({ from: "/_authenticated/assets/$id" });

  const { data: asset, isLoading } = useQuery({
    queryKey: ["asset", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("assets")
        .select("*, categories(category_name), vendors(vendor_name), employees:assigned_employee_id(name, employee_code)")
        .eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["asset-assignments", id],
    queryFn: async () =>
      (await supabase.from("assignments").select("*, employees(name, employee_code)")
        .eq("asset_id", id).order("assigned_date", { ascending: false })).data ?? [],
  });

  const { data: repairs = [] } = useQuery({
    queryKey: ["asset-repairs", id],
    queryFn: async () =>
      (await supabase.from("repairs").select("*, vendors(vendor_name)")
        .eq("asset_id", id).order("repair_date", { ascending: false })).data ?? [],
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!asset) return <p className="text-muted-foreground">Asset not found.</p>;

  const cat = (asset.categories as { category_name?: string } | null)?.category_name;
  const vendor = (asset.vendors as { vendor_name?: string } | null)?.vendor_name;
  const employee = asset.employees as { name?: string; employee_code?: string } | null;
  const wState = warrantyState(asset.warranty_expiry);

  return (
    <div>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm"><Link to="/assets"><ArrowLeft className="h-4 w-4 mr-1" />Back to assets</Link></Button>
      </div>
      <PageHeader
        title={asset.asset_name}
        description={`${asset.asset_code} · ${cat ?? "Uncategorized"}`}
        actions={<StatusBadge status={asset.status} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle>General Information</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Brand" value={asset.brand} />
            <Row label="Model" value={asset.model} />
            <Row label="Category" value={cat} />
            <Row label="Serial Number" value={asset.serial_number} mono />
            <Row label="Location" value={asset.location} />
            <Row label="Currently Assigned" value={employee?.name ? `${employee.name} (${employee.employee_code})` : "—"} />
            {asset.remarks && <Row label="Remarks" value={asset.remarks} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Purchase & Warranty</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Vendor" value={vendor} />
            <Row label="Purchase Date" value={shortDate(asset.purchase_date)} />
            <Row label="Purchase Cost" value={currency(asset.purchase_cost)} />
            <Row label="Warranty Start" value={shortDate(asset.warranty_start)} />
            <Row label="Warranty Expiry" value={shortDate(asset.warranty_expiry)} />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Warranty Status</span>
              <StatusBadge status={wState} kind="warranty" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>Assignment History</CardTitle></CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assignments yet.</p>
          ) : (
            <ul className="divide-y">
              {assignments.map((a) => {
                const emp = a.employees as { name?: string; employee_code?: string } | null;
                return (
                  <li key={a.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{emp?.name} <span className="text-xs text-muted-foreground">({emp?.employee_code})</span></div>
                      <div className="text-xs text-muted-foreground">
                        Assigned {shortDate(a.assigned_date)}
                        {a.returned_date && <> · Returned {shortDate(a.returned_date)}</>}
                      </div>
                    </div>
                    <StatusBadge status={a.status} kind="assignment" />
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Repair History</CardTitle></CardHeader>
        <CardContent>
          {repairs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No repairs on record.</p>
          ) : (
            <ul className="divide-y">
              {repairs.map((r) => {
                const v = r.vendors as { vendor_name?: string } | null;
                return (
                  <li key={r.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">{r.issue}</div>
                      <div className="text-xs text-muted-foreground">
                        {shortDate(r.repair_date)}{v?.vendor_name && <> · {v.vendor_name}</>}{r.repair_cost != null && <> · {currency(r.repair_cost)}</>}
                      </div>
                    </div>
                    <StatusBadge status={r.status} kind="repair" />
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs" : "font-medium text-right"}>{value ?? "—"}</span>
    </div>
  );
}

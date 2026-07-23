import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { MockDB } from "@/lib/mock-db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { currency, shortDate, warrantyState } from "@/lib/format";
import { AssetOwnerDisplay } from "@/components/asset-owner-display";
import { useMockDbRefresh } from "@/hooks/use-mock-db-refresh";

export const Route = createFileRoute("/_authenticated/assets/$id")({
  component: AssetDetail,
});

function AssetDetail() {
  useMockDbRefresh();
  const { id } = useParams({ from: "/_authenticated/assets/$id" });

  const asset = MockDB.getAssets().find((a) => a.id === id);
  const categories = new Map(MockDB.getCategories().map((c) => [c.id, c.category_name]));
  const vendors = new Map(MockDB.getVendors().map((v) => [v.id, v.vendor_name]));
  const employees = new Map(MockDB.getEmployees().map((e) => [e.id, e]));

  const assignments = MockDB.getAssetAssignments(id).map((a) => ({
    ...a,
    employee: employees.get(a.employee_id),
  }));

  const repairs = MockDB.getAssetRepairs(id);

  if (!asset) return <p className="text-muted-foreground">Asset not found.</p>;

  const cat = asset.category_id ? categories.get(asset.category_id) : undefined;
  const vendor = asset.vendor_id ? vendors.get(asset.vendor_id) : undefined;
  const employee = asset.assigned_employee_id
    ? employees.get(asset.assigned_employee_id)
    : null;
  const wState = warrantyState(asset.warranty_expiry);

  return (
    <div>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/assets">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to assets
          </Link>
        </Button>
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
            <Row
              label="Assigned to"
              value={
                employee?.name
                  ? `${employee.name} (${employee.employee_code})`
                  : <AssetOwnerDisplay />
              }
            />
            {asset.remarks && <Row label="Remarks" value={asset.remarks} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Purchase & Warranty</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Vendor" value={vendor} />
            <Row label="Purchase Date" value={shortDate(asset.purchase_date)} />
            <Row label="Purchase Cost" value={currency(asset.purchase_cost)} />
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
              {assignments.map((a) => (
                <li key={a.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {a.employee?.name}{" "}
                      <span className="text-xs text-muted-foreground">({a.employee?.employee_code})</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Assigned {shortDate(a.assigned_date)}
                      {a.returned_date && <> · Returned {shortDate(a.returned_date)}</>}
                    </div>
                  </div>
                  <StatusBadge status={a.status} kind="assignment" />
                </li>
              ))}
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
              {repairs.map((r) => (
                <li key={r.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">{r.unassign_reason ?? r.repair_notes ?? "Repair"}</div>
                    <div className="text-xs text-muted-foreground">
                      {shortDate(r.created_at)}
                      {r.vendor_id && vendors.get(r.vendor_id) && <> · {vendors.get(r.vendor_id)}</>}
                      {r.repair_cost != null && <> · {currency(r.repair_cost)}</>}
                    </div>
                  </div>
                  <StatusBadge status={r.status} kind="repair" />
                </li>
              ))}
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

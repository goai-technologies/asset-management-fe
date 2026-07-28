import { createFileRoute } from "@tanstack/react-router";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import {
  exportDataSnapshot,
  fetchAssets,
  fetchCategories,
  fetchVendors,
} from "@/lib/api/asset-management";
import {
  downloadAssetsExcel,
  downloadAssetsPdf,
  downloadAssignmentsExcel,
  downloadAssignmentsPdf,
} from "@/lib/api/reports";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { downloadCSV } from "@/lib/csv";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

const REPORTS = [
  {
    key: "inventory",
    title: "Asset Inventory",
    description: "Full list of every asset with category, status, cost, and location.",
    build: async () => {
      const [categories, vendors, assets] = await Promise.all([
        fetchCategories(),
        fetchVendors(),
        fetchAssets(),
      ]);
      const categoryMap = new Map(categories.map((c) => [c.id, c.category_name]));
      const vendorMap = new Map(vendors.map((v) => [v.id, v.vendor_name]));
      return assets.map((a) => ({
        code: a.asset_code,
        name: a.asset_name,
        category: a.category_id ? categoryMap.get(a.category_id) ?? "" : "",
        brand: a.brand ?? "",
        model: a.model ?? "",
        serial: a.serial_number ?? "",
        status: a.status,
        purchase_date: a.purchase_date ?? "",
        purchase_cost: a.purchase_cost ?? "",
        warranty_expiry: a.warranty_expiry ?? "",
        location: a.location ?? "",
        vendor: a.vendor_id ? vendorMap.get(a.vendor_id) ?? "" : "",
      }));
    },
    exports: {
      excel: () => downloadAssetsExcel(),
      pdf: () => downloadAssetsPdf(),
    },
  },
  {
    key: "by-department",
    title: "Assets by Department",
    description: "Assets grouped by the department of the assigned employee.",
    build: async () => {
      const snap = await exportDataSnapshot();
      const employees = new Map(snap.employees.map((e) => [e.id, e]));
      const assets = new Map(snap.assets.map((a) => [a.id, a]));
      return snap.assignments
        .filter((r) => r.status === "active" || r.status === "assigned")
        .map((r) => {
          const a = assets.get(r.asset_id);
          const e = employees.get(r.employee_id);
          return {
            department: e?.department ?? "",
            employee: e?.name ?? "",
            code: a?.asset_code ?? "",
            asset: a?.asset_name ?? "",
            status: a?.status ?? "",
          };
        });
    },
  },
  {
    key: "assigned",
    title: "Assigned Assets",
    description: "All currently assigned assets with assignee and assignment date.",
    build: async () => {
      const snap = await exportDataSnapshot();
      const employees = new Map(snap.employees.map((e) => [e.id, e]));
      const assets = new Map(snap.assets.map((a) => [a.id, a]));
      return snap.assignments
        .filter((r) => r.status === "active" || r.status === "assigned")
        .map((r) => {
          const a = assets.get(r.asset_id);
          const e = employees.get(r.employee_id);
          return {
            code: a?.asset_code,
            asset: a?.asset_name,
            employee: e?.name,
            employee_code: e?.employee_code,
            assigned: r.assigned_date,
            expected_return: "",
          };
        });
    },
    exports: {
      excel: () => downloadAssignmentsExcel(),
      pdf: () => downloadAssignmentsPdf(),
    },
  },
  {
    key: "employee",
    title: "Employee Assets",
    description: "One row per (employee, asset) pairing across all assignments.",
    build: async () => {
      const snap = await exportDataSnapshot();
      const employees = new Map(snap.employees.map((e) => [e.id, e]));
      const assets = new Map(snap.assets.map((a) => [a.id, a]));
      return snap.assignments.map((r) => {
        const a = assets.get(r.asset_id);
        const e = employees.get(r.employee_id);
        return {
          employee_code: e?.employee_code,
          employee: e?.name,
          department: e?.department,
          asset_code: a?.asset_code,
          asset: a?.asset_name,
          assigned: r.assigned_date,
          returned: r.returned_date ?? "",
          status: r.status,
        };
      });
    },
    exports: {
      excel: () => downloadAssignmentsExcel(),
      pdf: () => downloadAssignmentsPdf(),
    },
  },
  {
    key: "repairs",
    title: "Repair Report",
    description: "Every repair record with issue, dates, cost, and vendor.",
    build: async () => {
      const [snap, vendors] = await Promise.all([exportDataSnapshot(), fetchVendors()]);
      const assets = new Map(snap.assets.map((a) => [a.id, a]));
      const vendorMap = new Map(vendors.map((v) => [v.id, v.vendor_name]));
      return snap.repairs.map((r) => {
        const a = assets.get(r.asset_id);
        return {
          asset_code: a?.asset_code,
          asset: a?.asset_name,
          issue: r.unassign_reason ?? r.repair_notes ?? "Repair",
          repair_date: r.created_at,
          completed_date: r.completed_at ?? "",
          cost: r.repair_cost ?? "",
          vendor: r.vendor_id ? vendorMap.get(r.vendor_id) ?? "" : "",
          status: r.status,
        };
      });
    },
  },
  {
    key: "vendors",
    title: "Vendor Report",
    description: "Vendors and how many assets are linked to each.",
    build: async () => {
      const [assets, vendors] = await Promise.all([fetchAssets(), fetchVendors()]);
      const stats = new Map<string, { count: number; total: number }>();
      for (const a of assets) {
        if (!a.vendor_id) continue;
        const s = stats.get(a.vendor_id) ?? { count: 0, total: 0 };
        s.count += 1;
        s.total += Number(a.purchase_cost ?? 0);
        stats.set(a.vendor_id, s);
      }
      return vendors.map((v) => ({
        vendor: v.vendor_name,
        contact: v.contact_person ?? "",
        email: v.email ?? "",
        phone: v.phone ?? "",
        asset_count: stats.get(v.id)?.count ?? 0,
        total_spend: stats.get(v.id)?.total ?? 0,
      }));
    },
  },
];

function ReportsPage() {
  const run = async (r: (typeof REPORTS)[number]) => {
    try {
      const rows = await r.build();
      if (rows.length === 0) return toast.info("No data for this report.");
      downloadCSV(r.key, rows);
      toast.success(`${r.title} exported (${rows.length} rows)`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Export failed";
      toast.error(message);
    }
  };

  const runServerExport = async (
    label: string,
    exporter?: () => Promise<void>,
  ) => {
    if (!exporter) return;
    try {
      await exporter();
      toast.success(`${label} downloaded`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Export failed";
      toast.error(message);
    }
  };

  return (
    <div>
      <PageHeader title="Reports" description="Generate CSV exports of asset, employee, and vendor activity." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORTS.map((r) => (
          <Card key={r.key}>
            <CardHeader>
              <CardTitle>{r.title}</CardTitle>
              <CardDescription>{r.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button onClick={() => void run(r)}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              {r.exports?.excel && (
                <Button variant="outline" onClick={() => void runServerExport(`${r.title} Excel`, r.exports?.excel)}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              )}
              {r.exports?.pdf && (
                <Button variant="outline" onClick={() => void runServerExport(`${r.title} PDF`, r.exports?.pdf)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

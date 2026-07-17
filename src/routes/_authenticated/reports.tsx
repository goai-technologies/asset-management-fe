import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
    key: "inventory", title: "Asset Inventory",
    description: "Full list of every asset with category, status, cost, and location.",
    build: async () => {
      const { data } = await supabase.from("assets")
        .select("asset_code, asset_name, brand, model, serial_number, status, purchase_date, purchase_cost, warranty_expiry, location, categories(category_name), vendors(vendor_name)");
      return (data ?? []).map((a) => ({
        code: a.asset_code, name: a.asset_name,
        category: (a.categories as { category_name?: string } | null)?.category_name ?? "",
        brand: a.brand ?? "", model: a.model ?? "", serial: a.serial_number ?? "",
        status: a.status, purchase_date: a.purchase_date ?? "", purchase_cost: a.purchase_cost ?? "",
        warranty_expiry: a.warranty_expiry ?? "", location: a.location ?? "",
        vendor: (a.vendors as { vendor_name?: string } | null)?.vendor_name ?? "",
      }));
    },
  },
  {
    key: "by-department", title: "Assets by Department",
    description: "Assets grouped by the department of the employee they're assigned to.",
    build: async () => {
      const { data } = await supabase.from("assignments")
        .select("assets(asset_code, asset_name, status), employees(name, department)")
        .eq("status", "active");
      return (data ?? []).map((r) => {
        const a = r.assets as { asset_code?: string; asset_name?: string; status?: string } | null;
        const e = r.employees as { name?: string; department?: string } | null;
        return { department: e?.department ?? "", employee: e?.name ?? "", code: a?.asset_code ?? "", asset: a?.asset_name ?? "", status: a?.status ?? "" };
      });
    },
  },
  {
    key: "assigned", title: "Assigned Assets",
    description: "All currently assigned assets with owner and assignment date.",
    build: async () => {
      const { data } = await supabase.from("assignments")
        .select("assigned_date, expected_return_date, assets(asset_code, asset_name), employees(name, employee_code)")
        .eq("status", "active");
      return (data ?? []).map((r) => {
        const a = r.assets as { asset_code?: string; asset_name?: string } | null;
        const e = r.employees as { name?: string; employee_code?: string } | null;
        return { code: a?.asset_code, asset: a?.asset_name, employee: e?.name, employee_code: e?.employee_code, assigned: r.assigned_date, expected_return: r.expected_return_date ?? "" };
      });
    },
  },
  {
    key: "employee", title: "Employee Assets",
    description: "One row per (employee, asset) pairing across all assignments.",
    build: async () => {
      const { data } = await supabase.from("assignments")
        .select("assigned_date, returned_date, status, assets(asset_code, asset_name), employees(name, employee_code, department)");
      return (data ?? []).map((r) => {
        const a = r.assets as { asset_code?: string; asset_name?: string } | null;
        const e = r.employees as { name?: string; employee_code?: string; department?: string } | null;
        return { employee_code: e?.employee_code, employee: e?.name, department: e?.department, asset_code: a?.asset_code, asset: a?.asset_name, assigned: r.assigned_date, returned: r.returned_date ?? "", status: r.status };
      });
    },
  },
  {
    key: "repairs", title: "Repair Report",
    description: "Every repair record with issue, dates, cost, and vendor.",
    build: async () => {
      const { data } = await supabase.from("repairs")
        .select("issue, repair_date, completed_date, repair_cost, status, assets(asset_code, asset_name), vendors(vendor_name)");
      return (data ?? []).map((r) => {
        const a = r.assets as { asset_code?: string; asset_name?: string } | null;
        const v = r.vendors as { vendor_name?: string } | null;
        return { asset_code: a?.asset_code, asset: a?.asset_name, issue: r.issue, repair_date: r.repair_date, completed_date: r.completed_date ?? "", cost: r.repair_cost ?? "", vendor: v?.vendor_name ?? "", status: r.status };
      });
    },
  },
  {
    key: "vendors", title: "Vendor Report",
    description: "Vendors and how many assets are linked to each.",
    build: async () => {
      const [vendorsRes, assetsRes] = await Promise.all([
        supabase.from("vendors").select("*"),
        supabase.from("assets").select("vendor_id, purchase_cost"),
      ]);
      const stats = new Map<string, { count: number; total: number }>();
      for (const a of assetsRes.data ?? []) {
        if (!a.vendor_id) continue;
        const s = stats.get(a.vendor_id) ?? { count: 0, total: 0 };
        s.count += 1; s.total += Number(a.purchase_cost ?? 0);
        stats.set(a.vendor_id, s);
      }
      return (vendorsRes.data ?? []).map((v) => ({
        vendor: v.vendor_name, contact: v.contact_person ?? "", email: v.email ?? "", phone: v.phone ?? "",
        asset_count: stats.get(v.id)?.count ?? 0, total_spend: stats.get(v.id)?.total ?? 0,
      }));
    },
  },
];

function ReportsPage() {
  const run = async (r: typeof REPORTS[number]) => {
    const rows = await r.build();
    if (rows.length === 0) return toast.info("No data for this report.");
    downloadCSV(r.key, rows);
    toast.success(`${r.title} exported (${rows.length} rows)`);
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
            <CardContent>
              <Button onClick={() => run(r)}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

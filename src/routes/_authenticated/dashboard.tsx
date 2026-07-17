import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Boxes, Users, CheckCircle2, Wrench, Archive, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const CHART_COLORS = ["#2563EB", "#0891B2", "#059669", "#D97706", "#DC2626", "#7C3AED", "#DB2777"];

function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [assets, employees] = await Promise.all([
        supabase.from("assets").select("id,status,category_id,categories(category_name)"),
        supabase.from("employees").select("id", { count: "exact", head: true }),
      ]);
      const rows = assets.data ?? [];
      const byStatus: Record<string, number> = {};
      const byCategory: Record<string, number> = {};
      for (const a of rows) {
        byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
        const cat = (a.categories as { category_name?: string } | null)?.category_name ?? "Uncategorized";
        byCategory[cat] = (byCategory[cat] ?? 0) + 1;
      }
      return {
        totalAssets: rows.length,
        totalEmployees: employees.count ?? 0,
        byStatus,
        byCategory,
      };
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["dashboard-recent"],
    queryFn: async () => {
      const { data } = await supabase
        .from("assignments")
        .select("id, assigned_date, returned_date, status, assets(asset_name, asset_code), employees(name)")
        .order("created_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  const cards = [
    { label: "Total Assets", value: stats?.totalAssets ?? 0, icon: Boxes, tint: "text-primary bg-primary/10" },
    { label: "Assigned", value: stats?.byStatus.assigned ?? 0, icon: UserCheck, tint: "text-info bg-info/10" },
    { label: "Available", value: stats?.byStatus.available ?? 0, icon: CheckCircle2, tint: "text-success bg-success/10" },
    { label: "Under Repair", value: stats?.byStatus.repair ?? 0, icon: Wrench, tint: "text-warning-foreground bg-warning/20" },
    { label: "Retired", value: (stats?.byStatus.retired ?? 0) + (stats?.byStatus.disposed ?? 0), icon: Archive, tint: "text-muted-foreground bg-muted" },
    { label: "Employees", value: stats?.totalEmployees ?? 0, icon: Users, tint: "text-primary bg-primary/10" },
  ];

  const categoryData = Object.entries(stats?.byCategory ?? {}).map(([name, value]) => ({ name, value }));
  const statusData = Object.entries(stats?.byStatus ?? {}).map(([name, value]) => ({ name: name.replace(/\b\w/g, (c) => c.toUpperCase()), value }));

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of asset inventory, allocation, and activity." />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</p>
                  <p className="text-2xl font-bold mt-1">{c.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-md grid place-items-center ${c.tint}`}>
                  <c.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Assets by Category</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="value" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Assets by Status</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Assignments</CardTitle></CardHeader>
        <CardContent>
          {(recent ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity yet.</p>
          ) : (
            <ul className="divide-y">
              {(recent ?? []).map((r) => {
                const asset = r.assets as { asset_name?: string; asset_code?: string } | null;
                const emp = r.employees as { name?: string } | null;
                return (
                  <li key={r.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">{asset?.asset_name} <span className="text-xs text-muted-foreground">({asset?.asset_code})</span></div>
                      <div className="text-xs text-muted-foreground">
                        Assigned to <span className="font-medium">{emp?.name ?? "—"}</span> · {shortDate(r.assigned_date)}
                        {r.returned_date && <> · Returned {shortDate(r.returned_date)}</>}
                      </div>
                    </div>
                    <StatusBadge status={r.status} kind="assignment" />
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

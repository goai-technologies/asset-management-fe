import { createFileRoute } from "@tanstack/react-router";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Boxes, Users, CheckCircle2, Wrench, Archive, UserCheck, Clock, ShieldAlert, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { shortDate, dateTime } from "@/lib/format";
import { MockDB } from "@/lib/mock-db";
import { useMockDbRefresh } from "@/hooks/use-mock-db-refresh";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const CHART_COLORS = ["#2563EB", "#0891B2", "#059669", "#D97706", "#DC2626", "#7C3AED", "#DB2777"];

function Dashboard() {
  useMockDbRefresh();

  const stats = MockDB.getDashboardStats();
  const recent = MockDB.getRecentAssignments(6);
  const assets = MockDB.getAssets();
  const openRepairs = MockDB.getOpenRepairs();

  const expiringWarranty = assets
    .filter(a => a.warranty_expiry)
    .map(a => {
      const days = Math.floor((new Date(a.warranty_expiry!).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      return { ...a, days };
    })
    .filter(a => a.days > 0 && a.days <= 90)
    .sort((a, b) => a.days - b.days)
    .slice(0, 5);

  const cards = [
    { label: "Total Assets", value: stats.totalAssets, icon: Boxes, tint: "text-primary bg-primary/10" },
    { label: "Assigned Assets", value: stats.byStatus.assigned || 0, icon: UserCheck, tint: "text-info bg-info/10" },
    { label: "Available Assets", value: stats.byStatus.available || 0, icon: CheckCircle2, tint: "text-success bg-success/10" },
    { label: "Under Repair", value: stats.byStatus.repair || 0, icon: Wrench, tint: "text-warning-foreground bg-warning/20" },
    { label: "Retired", value: (stats.byStatus.retired || 0) + (stats.byStatus.disposed || 0), icon: Archive, tint: "text-muted-foreground bg-muted" },
    { label: "Employees", value: stats.totalEmployees, icon: Users, tint: "text-primary bg-primary/10" },
  ];

  const categoryData = Object.entries(stats.byCategory).map(([name, value]) => ({ name, value }));
  const statusData = Object.entries(stats.byStatus).map(([name, value]) => ({
    name: name === "repair" ? "Under Repair" : name.replace(/\b\w/g, (c) => c.toUpperCase()),
    value,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of asset inventory, allocation, and activity." />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Assets by Category</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'var(--muted)' }} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                  <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No assets yet</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Assets by Status</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} paddingAngle={5}>
                    {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", color: "var(--muted-foreground)" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No assets yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-muted-foreground"/> Recent Activity</CardTitle></CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity yet.</p>
            ) : (
              <div className="relative border-l-2 border-muted ml-3 space-y-6 pb-4">
                {recent.map((r) => (
                  <div key={r.id} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-background bg-primary"></div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-medium text-sm">
                          {r.status === "unassigned" ? (
                            <>Asset Unassigned from {r.employees?.name || "Unknown Employee"}</>
                          ) : (
                            <>
                              {r.assets?.asset_name || "Unknown Asset"}
                              <span className="text-muted-foreground font-normal">
                                {r.status === "returned" ? " returned by " : " assigned to "}
                              </span>
                              {r.employees?.name || "Unknown Employee"}
                            </>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {r.status === "unassigned" ? dateTime(r.assigned_date) : shortDate(r.assigned_date)}
                        </div>
                      </div>
                      <StatusBadge status={r.status} kind="assignment" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="h-4 w-4 text-warning-foreground" /> Warranty Expiring Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expiringWarranty.length > 0 ? expiringWarranty.map(item => (
                  <div key={item.asset_code} className="flex justify-between items-center text-sm border-b last:border-0 pb-2 last:pb-0">
                    <div>
                      <div className="font-medium">{item.asset_name}</div>
                      <div className="text-xs text-muted-foreground">{item.asset_code}</div>
                    </div>
                    <div className="text-warning-foreground font-medium text-xs bg-warning/10 px-2 py-1 rounded">
                      In {item.days} days
                    </div>
                  </div>
                )) : <div className="text-sm text-muted-foreground">No warranties expiring soon.</div>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-muted-foreground" /> Open Repair Tickets
                </span>
                <span className="text-sm font-bold text-primary">{stats.openRepairTickets}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {openRepairs.length > 0 ? openRepairs.slice(0, 5).map((repair) => (
                  <div key={repair.id} className="flex justify-between items-center text-sm border-b last:border-0 pb-2 last:pb-0">
                    <div>
                      <div className="font-medium">{repair.assets?.asset_name ?? "Unknown Asset"}</div>
                      <div className="text-xs text-muted-foreground font-mono">{repair.assets?.asset_code}</div>
                    </div>
                    <StatusBadge status={repair.status} kind="repair" />
                  </div>
                )) : <div className="text-sm text-muted-foreground">No open repair tickets.</div>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

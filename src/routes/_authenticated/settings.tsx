import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useRoles, type AppRole } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArchivedAssetsPanel } from "@/components/archived-assets-panel";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

type UserRow = { id: string; name: string; email: string; role: AppRole };

function SettingsPage() {
  const qc = useQueryClient();
  const { user } = useSession();
  const { isAdmin, loading } = useRoles(user?.id);

  const { data: users = [] } = useQuery({
    queryKey: ["all-users"],
    enabled: isAdmin,
    queryFn: async () => {
      const [profiles, roles] = await Promise.all([
        supabase.from("profiles").select("id, name, email"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const roleByUser = new Map<string, AppRole>();
      for (const r of roles.data ?? []) roleByUser.set(r.user_id, r.role as AppRole);
      return (profiles.data ?? []).map<UserRow>((p) => ({
        id: p.id, name: p.name, email: p.email, role: roleByUser.get(p.id) ?? "employee",
      }));
    },
  });

  const setRole = async (userId: string, newRole: AppRole) => {
    const a = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (a.error) return toast.error(a.error.message);
    const b = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    if (b.error) return toast.error(b.error.message);
    toast.success("Role updated");
    qc.invalidateQueries({ queryKey: ["all-users"] });
  };

  if (loading) return null;
  if (!isAdmin) return (
    <div>
      <PageHeader title="Settings" />
      <Card><CardContent className="p-6">
        <p className="text-muted-foreground">Only Administrators can access system settings.</p>
      </CardContent></Card>
    </div>
  );

  return (
    <div>
      <PageHeader title="Settings" description="Manage users, roles, and system defaults." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle>Company</CardTitle><CardDescription>Basic organization info.</CardDescription></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Company Name" value="EAMS Demo Co." />
            <Row label="Asset ID Prefix" value="AST-" />
            <Row label="Currency" value="USD" />
            <p className="text-xs text-muted-foreground pt-2">These defaults are used across the app.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Roles</CardTitle><CardDescription>What each role can do.</CardDescription></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><Badge className="mr-2">Administrator</Badge>Full access — manages users, assets, employees, vendors, categories, reports and settings.</div>
            <div><Badge variant="secondary" className="mr-2">IT Team</Badge>Manages assets, employees, vendors, categories, assignments and repairs. Cannot manage users or system settings.</div>
            <div><Badge variant="outline" className="mr-2">Employee</Badge>Can view, edit, delete, and unassign assets. Can manage employee records. Cannot access system settings.</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Users & Roles</CardTitle><CardDescription>Promote or demote signed-in users.</CardDescription></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead className="w-56">Role</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name || "—"}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Select value={u.role} onValueChange={(v) => setRole(u.id, v as AppRole)} disabled={u.id === user?.id}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="administrator">Administrator</SelectItem>
                        <SelectItem value="it_team">IT Team</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                    {u.id === user?.id && <p className="text-xs text-muted-foreground mt-1">You cannot change your own role.</p>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-6">
        <ArchivedAssetsPanel />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useRoles } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/employees")({
  component: EmployeesPage,
});

type Employee = {
  id: string; employee_code: string; name: string; email: string;
  department: string | null; designation: string | null; manager: string | null; location: string | null;
};

function EmployeesPage() {
  const qc = useQueryClient();
  const { user } = useSession();
  const { canManage } = useRoles(user?.id);
  const [q, setQ] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [profileOpen, setProfileOpen] = useState<Employee | null>(null);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => (await supabase.from("employees").select("*").order("name")).data as Employee[] ?? [],
  });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return employees;
    return employees.filter((e) => [e.employee_code, e.name, e.email, e.department, e.designation]
      .some((v) => v?.toLowerCase().includes(needle)));
  }, [employees, q]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this employee?")) return;
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Employee deleted");
    qc.invalidateQueries({ queryKey: ["employees"] });
  };

  return (
    <div>
      <PageHeader title="Employees" description="Company employees and their assigned assets."
        actions={canManage ? (
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />Add Employee
          </Button>
        ) : undefined}
      />

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search name, email, department…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="w-32"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Loading…</TableCell></TableRow>
                : filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No employees found.</TableCell></TableRow>
                : filtered.map((e) => (
                  <TableRow key={e.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-xs">{e.employee_code}</TableCell>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell className="text-sm">{e.email}</TableCell>
                    <TableCell>{e.department ?? "—"}</TableCell>
                    <TableCell>{e.designation ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{e.location ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setProfileOpen(e)}><Eye className="h-4 w-4" /></Button>
                        {canManage && (
                          <>
                            <Button size="icon" variant="ghost" onClick={() => { setEditing(e); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(e.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {canManage && (
        <EmployeeDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["employees"] }); setDialogOpen(false); }} />
      )}

      <ProfileDialog employee={profileOpen} onOpenChange={(v) => !v && setProfileOpen(null)} />
    </div>
  );
}

function EmployeeDialog({
  open, onOpenChange, editing, onSaved,
}: { open: boolean; onOpenChange: (v: boolean) => void; editing: Employee | null; onSaved: () => void }) {
  const [form, setForm] = useState<Partial<Employee>>({});
  const [saving, setSaving] = useState(false);
  useMemo(() => { if (open) setForm(editing ?? { employee_code: "", name: "", email: "" }); }, [open, editing]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      employee_code: form.employee_code!, name: form.name!, email: form.email!,
      department: form.department || null, designation: form.designation || null,
      manager: form.manager || null, location: form.location || null,
    };
    const res = editing
      ? await supabase.from("employees").update(payload).eq("id", editing.id)
      : await supabase.from("employees").insert(payload);
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(editing ? "Employee updated" : "Employee created");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Edit Employee" : "New Employee"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Employee Code *</Label><Input required value={form.employee_code ?? ""} onChange={(e) => setForm({ ...form, employee_code: e.target.value })} /></div>
          <div className="space-y-2"><Label>Name *</Label><Input required value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="space-y-2 col-span-2"><Label>Email *</Label><Input type="email" required value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="space-y-2"><Label>Department</Label><Input value={form.department ?? ""} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
          <div className="space-y-2"><Label>Designation</Label><Input value={form.designation ?? ""} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></div>
          <div className="space-y-2"><Label>Manager</Label><Input value={form.manager ?? ""} onChange={(e) => setForm({ ...form, manager: e.target.value })} /></div>
          <div className="space-y-2"><Label>Office Location</Label><Input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProfileDialog({ employee, onOpenChange }: { employee: Employee | null; onOpenChange: (v: boolean) => void }) {
  const { data: assignments = [] } = useQuery({
    queryKey: ["employee-assignments", employee?.id],
    enabled: !!employee,
    queryFn: async () => (await supabase.from("assignments")
      .select("*, assets(asset_code, asset_name, status)")
      .eq("employee_id", employee!.id)
      .order("assigned_date", { ascending: false })).data ?? [],
  });

  const current = assignments.filter((a) => a.status === "active");
  const past = assignments.filter((a) => a.status !== "active");

  return (
    <Dialog open={!!employee} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee?.name}</DialogTitle>
          <DialogDescription>
            {employee?.employee_code} · {employee?.department ?? "—"} · {employee?.designation ?? "—"}
          </DialogDescription>
        </DialogHeader>
        <div>
          <h3 className="font-semibold mb-2">Currently assigned assets</h3>
          {current.length === 0 ? <p className="text-sm text-muted-foreground mb-4">None.</p> : (
            <ul className="space-y-2 mb-4">
              {current.map((a) => {
                const asset = a.assets as { asset_code?: string; asset_name?: string; status?: string } | null;
                return (
                  <li key={a.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                    <div>
                      <div className="font-medium">{asset?.asset_name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{asset?.asset_code} · since {shortDate(a.assigned_date)}</div>
                    </div>
                    {asset?.status && <StatusBadge status={asset.status} />}
                  </li>
                );
              })}
            </ul>
          )}
          <h3 className="font-semibold mb-2">History</h3>
          {past.length === 0 ? <p className="text-sm text-muted-foreground">No history.</p> : (
            <ul className="space-y-2">
              {past.map((a) => {
                const asset = a.assets as { asset_code?: string; asset_name?: string } | null;
                return (
                  <li key={a.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                    <div>
                      <div className="font-medium">{asset?.asset_name}</div>
                      <div className="text-xs text-muted-foreground">{shortDate(a.assigned_date)} → {shortDate(a.returned_date)}</div>
                    </div>
                    <StatusBadge status={a.status} kind="assignment" />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

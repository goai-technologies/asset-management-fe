import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, RotateCcw, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/assignments")({
  component: AssignmentsPage,
});

function AssignmentsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["assignments"],
    queryFn: async () => (await supabase.from("assignments")
      .select("*, assets(asset_code, asset_name), employees(name, employee_code)")
      .order("assigned_date", { ascending: false })).data ?? [],
  });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) => {
      const a = r.assets as { asset_code?: string; asset_name?: string } | null;
      const e = r.employees as { name?: string; employee_code?: string } | null;
      return [a?.asset_code, a?.asset_name, e?.name, e?.employee_code].some((v) => v?.toLowerCase().includes(needle));
    });
  }, [rows, q]);

  const handleReturn = async (row: { id: string; asset_id: string }) => {
    if (!confirm("Mark this asset as returned?")) return;
    const today = new Date().toISOString().slice(0, 10);
    const a = await supabase.from("assignments").update({ returned_date: today, status: "returned" }).eq("id", row.id);
    if (a.error) return toast.error(a.error.message);
    const b = await supabase.from("assets").update({ status: "available", assigned_employee_id: null }).eq("id", row.asset_id);
    if (b.error) return toast.error(b.error.message);
    toast.success("Asset returned");
    qc.invalidateQueries({ queryKey: ["assignments"] });
    qc.invalidateQueries({ queryKey: ["assets"] });
  };

  return (
    <div>
      <PageHeader title="Assignments" description="Assign assets to employees and record returns."
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />New Assignment</Button>}
      />

      <Card className="mb-4"><CardContent className="p-4">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search asset or employee…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Expected Return</TableHead>
              <TableHead>Returned</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Loading…</TableCell></TableRow>
              : filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No assignments.</TableCell></TableRow>
              : filtered.map((r) => {
                const a = r.assets as { asset_code?: string; asset_name?: string } | null;
                const e = r.employees as { name?: string; employee_code?: string } | null;
                return (
                  <TableRow key={r.id}>
                    <TableCell><div className="font-medium">{a?.asset_name}</div><div className="text-xs text-muted-foreground font-mono">{a?.asset_code}</div></TableCell>
                    <TableCell><div className="font-medium">{e?.name}</div><div className="text-xs text-muted-foreground font-mono">{e?.employee_code}</div></TableCell>
                    <TableCell className="text-sm">{shortDate(r.assigned_date)}</TableCell>
                    <TableCell className="text-sm">{shortDate(r.expected_return_date)}</TableCell>
                    <TableCell className="text-sm">{shortDate(r.returned_date)}</TableCell>
                    <TableCell><StatusBadge status={r.status} kind="assignment" /></TableCell>
                    <TableCell>
                      {r.status === "active" && (
                        <Button size="sm" variant="outline" onClick={() => handleReturn({ id: r.id, asset_id: r.asset_id })}>
                          <RotateCcw className="h-3.5 w-3.5 mr-1" />Return
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </CardContent></Card>

      <NewAssignmentDialog open={open} onOpenChange={setOpen} onSaved={() => {
        qc.invalidateQueries({ queryKey: ["assignments"] });
        qc.invalidateQueries({ queryKey: ["assets"] });
        setOpen(false);
      }} />
    </div>
  );
}

function NewAssignmentDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const [assetId, setAssetId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [expected, setExpected] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: assets = [] } = useQuery({
    queryKey: ["available-assets"],
    enabled: open,
    queryFn: async () => (await supabase.from("assets").select("id, asset_code, asset_name, status")
      .in("status", ["available", "reserved"]).order("asset_name")).data ?? [],
  });
  const { data: employees = [] } = useQuery({
    queryKey: ["employees-min"],
    enabled: open,
    queryFn: async () => (await supabase.from("employees").select("id, name, employee_code").order("name")).data ?? [],
  });

  useMemo(() => { if (open) { setAssetId(""); setEmployeeId(""); setExpected(""); } }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const a = await supabase.from("assignments").insert({
      asset_id: assetId, employee_id: employeeId,
      assigned_date: new Date().toISOString().slice(0, 10),
      expected_return_date: expected || null, status: "active",
    });
    if (a.error) { setSaving(false); return toast.error(a.error.message); }
    const b = await supabase.from("assets").update({ status: "assigned", assigned_employee_id: employeeId }).eq("id", assetId);
    setSaving(false);
    if (b.error) return toast.error(b.error.message);
    toast.success("Asset assigned");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Assignment</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Asset *</Label>
            <Select value={assetId} onValueChange={setAssetId} required>
              <SelectTrigger><SelectValue placeholder="Choose an available asset" /></SelectTrigger>
              <SelectContent>
                {assets.length === 0 && <div className="p-2 text-sm text-muted-foreground">No available assets.</div>}
                {assets.map((a) => <SelectItem key={a.id} value={a.id}>{a.asset_code} — {a.asset_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Employee *</Label>
            <Select value={employeeId} onValueChange={setEmployeeId} required>
              <SelectTrigger><SelectValue placeholder="Choose an employee" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name} ({e.employee_code})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Expected Return</Label>
            <Input type="date" value={expected} onChange={(e) => setExpected(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !assetId || !employeeId}>{saving ? "Assigning…" : "Assign asset"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

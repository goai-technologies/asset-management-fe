import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Search, Download, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useRoles } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { currency, shortDate } from "@/lib/format";
import { downloadCSV } from "@/lib/csv";

export const Route = createFileRoute("/_authenticated/assets")({
  component: AssetsPage,
});

const STATUSES = ["available","assigned","reserved","repair","lost","disposed","retired"] as const;

type AssetRow = {
  id: string; asset_code: string; asset_name: string; brand: string | null; model: string | null;
  serial_number: string | null; status: string; purchase_date: string | null; purchase_cost: number | null;
  warranty_expiry: string | null; location: string | null; remarks: string | null;
  category_id: string | null; vendor_id: string | null; assigned_employee_id: string | null;
  categories: { category_name: string } | null;
  vendors: { vendor_name: string } | null;
  employees: { name: string } | null;
};

function AssetsPage() {
  const qc = useQueryClient();
  const { user } = useSession();
  const { canManage } = useRoles(user?.id);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AssetRow | null>(null);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("assets")
        .select("*, categories(category_name), vendors(vendor_name), employees:assigned_employee_id(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AssetRow[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("category_name")).data ?? [],
  });
  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => (await supabase.from("vendors").select("id, vendor_name").order("vendor_name")).data ?? [],
  });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return assets.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (categoryFilter !== "all" && a.category_id !== categoryFilter) return false;
      if (!needle) return true;
      return [a.asset_code, a.asset_name, a.serial_number, a.brand, a.model, a.employees?.name]
        .some((v) => v?.toLowerCase().includes(needle));
    });
  }, [assets, q, statusFilter, categoryFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this asset? This will also remove its assignment history.")) return;
    const { error } = await supabase.from("assets").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Asset deleted");
    qc.invalidateQueries({ queryKey: ["assets"] });
  };

  const exportCSV = () => {
    downloadCSV("assets", filtered.map((a) => ({
      code: a.asset_code, name: a.asset_name, category: a.categories?.category_name ?? "",
      brand: a.brand ?? "", model: a.model ?? "", serial: a.serial_number ?? "", status: a.status,
      assigned_to: a.employees?.name ?? "", vendor: a.vendors?.vendor_name ?? "",
      purchase_date: a.purchase_date ?? "", purchase_cost: a.purchase_cost ?? "",
      warranty_expiry: a.warranty_expiry ?? "", location: a.location ?? "",
    })));
  };

  return (
    <div>
      <PageHeader
        title="Assets"
        description="All company assets with lifecycle status, ownership, and warranty info."
        actions={
          <>
            <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
            {canManage && (
              <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />Add Asset
              </Button>
            )}
          </>
        }
      />

      <Card className="mb-4">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search code, name, serial, employee…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.category_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Brand / Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Warranty</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No assets match your filters.</TableCell></TableRow>
              ) : filtered.map((a) => (
                <TableRow key={a.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-xs">
                    <Link to="/assets/$id" params={{ id: a.id }} className="text-primary hover:underline">{a.asset_code}</Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link to="/assets/$id" params={{ id: a.id }} className="hover:underline">{a.asset_name}</Link>
                  </TableCell>
                  <TableCell>{a.categories?.category_name ?? "—"}</TableCell>
                  <TableCell className="text-sm">{[a.brand, a.model].filter(Boolean).join(" ") || "—"}</TableCell>
                  <TableCell><StatusBadge status={a.status} /></TableCell>
                  <TableCell>{a.employees?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{shortDate(a.warranty_expiry)}</TableCell>
                  <TableCell>
                    {canManage && (
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setEditing(a); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(a.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {canManage && (
        <AssetDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          editing={editing}
          categories={categories}
          vendors={vendors}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["assets"] }); setDialogOpen(false); }}
        />
      )}
    </div>
  );
}

function AssetDialog({
  open, onOpenChange, editing, categories, vendors, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: AssetRow | null;
  categories: Array<{ id: string; category_name: string }>;
  vendors: Array<{ id: string; vendor_name: string }>;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    asset_name: "", category_id: "", brand: "", model: "", serial_number: "",
    purchase_date: "", purchase_cost: "", vendor_id: "", warranty_expiry: "",
    status: "available", location: "", remarks: "",
  });
  const [saving, setSaving] = useState(false);

  // Reset form when opening
  useMemo(() => {
    if (open) {
      setForm(editing ? {
        asset_name: editing.asset_name, category_id: editing.category_id ?? "",
        brand: editing.brand ?? "", model: editing.model ?? "",
        serial_number: editing.serial_number ?? "",
        purchase_date: editing.purchase_date ?? "", purchase_cost: editing.purchase_cost?.toString() ?? "",
        vendor_id: editing.vendor_id ?? "", warranty_expiry: editing.warranty_expiry ?? "",
        status: editing.status, location: editing.location ?? "", remarks: editing.remarks ?? "",
      } : {
        asset_name: "", category_id: "", brand: "", model: "", serial_number: "",
        purchase_date: "", purchase_cost: "", vendor_id: "", warranty_expiry: "",
        status: "available", location: "", remarks: "",
      });
    }
  }, [open, editing]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      asset_name: form.asset_name,
      category_id: form.category_id || null,
      brand: form.brand || null,
      model: form.model || null,
      serial_number: form.serial_number || null,
      purchase_date: form.purchase_date || null,
      purchase_cost: form.purchase_cost ? Number(form.purchase_cost) : null,
      vendor_id: form.vendor_id || null,
      warranty_expiry: form.warranty_expiry || null,
      status: form.status as AssetRow["status"],
      location: form.location || null,
      remarks: form.remarks || null,
    };
    const res = editing
      ? await supabase.from("assets").update(payload).eq("id", editing.id)
      : await supabase.from("assets").insert(payload);
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(editing ? "Asset updated" : "Asset created");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Edit Asset" : "New Asset"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Asset Name" required><Input value={form.asset_name} required onChange={(e) => setForm({ ...form, asset_name: e.target.value })} /></Field>
          <Field label="Category">
            <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.category_name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Brand"><Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></Field>
          <Field label="Model"><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></Field>
          <Field label="Serial Number"><Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} /></Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Vendor">
            <Select value={form.vendor_id} onValueChange={(v) => setForm({ ...form, vendor_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
              <SelectContent>{vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.vendor_name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Purchase Date"><Input type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} /></Field>
          <Field label="Purchase Cost (USD)"><Input type="number" step="0.01" value={form.purchase_cost} onChange={(e) => setForm({ ...form, purchase_cost: e.target.value })} /></Field>
          <Field label="Warranty Expiry"><Input type="date" value={form.warranty_expiry} onChange={(e) => setForm({ ...form, warranty_expiry: e.target.value })} /></Field>
          <Field label="Location"><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
          <div className="md:col-span-2">
            <Field label="Remarks"><Textarea rows={2} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></Field>
          </div>
          <DialogFooter className="md:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Create asset"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      {children}
    </div>
  );
}

// silence unused-var linter for currency import guard
void currency;

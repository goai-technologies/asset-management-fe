import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/vendors")({
  component: VendorsPage,
});

type Vendor = {
  id: string; vendor_name: string; contact_person: string | null;
  email: string | null; phone: string | null; address: string | null;
};

function VendorsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [form, setForm] = useState<Partial<Vendor>>({});

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["vendors-full"],
    queryFn: async () => (await supabase.from("vendors").select("*").order("vendor_name")).data as Vendor[] ?? [],
  });

  useMemo(() => { if (open) setForm(editing ?? { vendor_name: "" }); }, [open, editing]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      vendor_name: form.vendor_name!, contact_person: form.contact_person || null,
      email: form.email || null, phone: form.phone || null, address: form.address || null,
    };
    const res = editing
      ? await supabase.from("vendors").update(payload).eq("id", editing.id)
      : await supabase.from("vendors").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["vendors-full"] });
    setOpen(false);
  };

  const del = async (id: string) => {
    if (!confirm("Delete vendor?")) return;
    const { error } = await supabase.from("vendors").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["vendors-full"] });
  };

  return (
    <div>
      <PageHeader title="Vendors" description="Suppliers of assets and repair services."
        actions={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Vendor</Button>}
      />

      <Card><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead><TableHead>Contact</TableHead>
              <TableHead>Email</TableHead><TableHead>Phone</TableHead>
              <TableHead>Address</TableHead><TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
              : vendors.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No vendors yet.</TableCell></TableRow>
              : vendors.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.vendor_name}</TableCell>
                  <TableCell>{v.contact_person ?? "—"}</TableCell>
                  <TableCell className="text-sm">{v.email ?? "—"}</TableCell>
                  <TableCell className="text-sm">{v.phone ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{v.address ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(v); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => del(v.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Vendor" : "New Vendor"}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2"><Label>Vendor Name *</Label><Input required value={form.vendor_name ?? ""} onChange={(e) => setForm({ ...form, vendor_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Contact Person</Label><Input value={form.contact_person ?? ""} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-2 col-span-2"><Label>Phone</Label><Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="space-y-2 col-span-2"><Label>Address</Label><Textarea rows={2} value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? "Save" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

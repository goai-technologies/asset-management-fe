import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MockDB, AssetRow } from "@/lib/mock-db";

const STATUSES = ["available","assigned","reserved","repair","lost","disposed","retired"] as const;

export function AssetDialog({
  open, onOpenChange, editing, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: AssetRow | null;
  onSaved: () => void;
}) {
  const categories = MockDB.getCategories();
  const vendors = MockDB.getVendors();

  const [form, setForm] = useState({
    asset_name: "", category_id: "", brand: "", model: "", serial_number: "",
    purchase_date: "", purchase_cost: "", vendor_id: "", warranty_expiry: "",
    status: "available", location: "", remarks: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
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
    
    // Validate required fields
    if (!form.asset_name || !form.category_id || !form.status) {
      toast.error("Please fill in all required fields (Name, Category, Status)");
      setSaving(false);
      return;
    }

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
      status: form.status,
      location: form.location || null,
      remarks: form.remarks || null,
      assigned_employee_id: editing?.assigned_employee_id || null,
    };
    
    try {
      if (editing) {
        MockDB.updateAsset(editing.id, payload);
        toast.success("Asset updated successfully");
      } else {
        MockDB.addAsset(payload);
        toast.success("Asset added successfully");
      }
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Edit Asset" : "New Asset"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Asset Name" required><Input value={form.asset_name} required onChange={(e) => setForm({ ...form, asset_name: e.target.value })} /></Field>
          <Field label="Category" required>
            <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.category_name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Brand"><Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></Field>
          <Field label="Model"><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></Field>
          <Field label="Serial Number"><Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} /></Field>
          <Field label="Status" required>
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

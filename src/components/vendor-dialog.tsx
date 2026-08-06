import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useCreateVendorMutation, useUpdateVendorMutation } from "@/hooks/use-asset-management";
import { VENDOR_TYPES, type Vendor } from "@/lib/types/asset-management";

export function VendorDialog({
  open, onOpenChange, onSaved, editing = null,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
  editing?: Vendor | null;
}) {
  const [form, setForm] = useState({
    vendor_name: "",
    contact_person: "",
    email: "",
    phone: "",
    office_address: "",
    vendor_type: "General Supplier" as string,
    status: "active" as "active" | "inactive",
    website: "",
    gst_number: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const createMutation = useCreateVendorMutation();
  const updateMutation = useUpdateVendorMutation();

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          vendor_name: editing.vendor_name,
          contact_person: editing.contact_person ?? "",
          email: editing.email ?? "",
          phone: editing.phone ?? "",
          office_address: editing.office_address ?? "",
          vendor_type: editing.vendor_type ?? "General Supplier",
          status: editing.status ?? "active",
          website: editing.website ?? "",
          gst_number: editing.gst_number ?? "",
          notes: editing.notes ?? "",
        });
      } else {
        setForm({
          vendor_name: "",
          contact_person: "",
          email: "",
          phone: "",
          office_address: "",
          vendor_type: "General Supplier",
          status: "active",
          website: "",
          gst_number: "",
          notes: "",
        });
      }
    }
  }, [open, editing]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const missing: string[] = [];
    if (!form.vendor_name.trim()) missing.push("Vendor Name");
    if (!form.contact_person.trim()) missing.push("Contact Person");
    if (!form.email.trim()) missing.push("Email Address");
    if (!form.phone.trim()) missing.push("Phone Number");
    if (!form.office_address.trim()) missing.push("Office Address");
    if (!form.gst_number.trim()) missing.push("GST Number");

    if (missing.length > 0) {
      toast.error(`Please fill in required fields: ${missing.join(", ")}`);
      setSaving(false);
      return;
    }

    const phoneDigits = form.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      toast.error("Phone must be between 10 and 15 digits");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        vendor_name: form.vendor_name.trim(),
        contact_person: form.contact_person.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        office_address: form.office_address.trim(),
        vendor_type: form.vendor_type || null,
        status: form.status,
        website: form.website.trim() || null,
        gst_number: form.gst_number.trim(),
        notes: form.notes.trim() || null,
      };

      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, updates: payload });
        toast.success("Vendor updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Vendor added successfully");
      }
      onSaved();
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An error occurred";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {editing && (
            <Field label="Vendor ID" className="sm:col-span-2">
              <Input value={editing.vendor_code} disabled className="font-mono bg-muted" />
            </Field>
          )}
          <Field label="Vendor Name" required className="sm:col-span-2">
            <Input value={form.vendor_name} required onChange={(e) => setForm({ ...form, vendor_name: e.target.value })} />
          </Field>
          <Field label="Contact Person" required>
            <Input
              value={form.contact_person}
              required
              onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
            />
          </Field>
          <Field label="Email Address" required>
            <Input
              type="email"
              value={form.email}
              required
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Phone Number" required>
            <Input
              type="tel"
              value={form.phone}
              required
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="Vendor Type">
            <Select value={form.vendor_type} onValueChange={(v) => setForm({ ...form, vendor_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {VENDOR_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Office Address" required className="sm:col-span-2">
            <Textarea
              rows={2}
              required
              placeholder="Street, city, state, postal code, country"
              value={form.office_address}
              onChange={(e) => setForm({ ...form, office_address: e.target.value })}
            />
          </Field>
          <Field label="Website">
            <Input type="url" placeholder="https://example.com" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          </Field>
          <Field label="GST Number" required>
            <Input
              value={form.gst_number}
              required
              onChange={(e) => setForm({ ...form, gst_number: e.target.value })}
            />
          </Field>
          {editing && (
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "active" | "inactive" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
          <Field label="Notes" className="sm:col-span-2">
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <DialogFooter className="sm:col-span-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save Changes" : "Add Vendor"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      {children}
    </div>
  );
}

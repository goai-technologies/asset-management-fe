import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MockDB, AssetRow } from "@/lib/mock-db";
import { AssetImageUpload } from "@/components/asset-images/asset-image-upload";
import {
  getAssetImageStorage,
  type ImageUploadItem,
} from "@/lib/asset-images";

function toUploadItems(images: ReturnType<ReturnType<typeof getAssetImageStorage>["getImages"]>): ImageUploadItem[] {
  return images.map((img) => ({
    id: img.id,
    fileName: img.fileName,
    fileSize: img.fileSize,
    imageUrl: img.imageUrl,
    uploadDate: img.uploadDate,
    isExisting: true,
  }));
}

function todayDateString() {
  return new Date().toISOString().split("T")[0];
}

function validateAssetForm(form: {
  asset_name: string;
  category_id: string;
  vendor_id: string;
  purchase_cost_inr: string;
  invoice_number: string;
  purchase_date: string;
  warranty_expiry: string;
}): string | null {
  if (!form.asset_name.trim()) return "Asset name is required";
  if (!form.category_id) return "Category is required";
  if (!form.vendor_id) return "Vendor is required";

  if (form.purchase_cost_inr) {
    const cost = Number(form.purchase_cost_inr);
    if (!Number.isFinite(cost) || cost <= 0) {
      return "Purchase cost must be a positive number";
    }
  }

  if (form.invoice_number && form.invoice_number.length > 50) {
    return "Invoice number cannot exceed 50 characters";
  }

  if (form.purchase_date) {
    const purchaseDate = new Date(form.purchase_date);
    const today = new Date(todayDateString());
    if (purchaseDate > today) {
      return "Purchase date cannot be in the future";
    }
  }

  if (form.warranty_expiry && form.purchase_date) {
    if (new Date(form.warranty_expiry) < new Date(form.purchase_date)) {
      return "Warranty expiry cannot be earlier than purchase date";
    }
  }

  return null;
}

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
  const storage = getAssetImageStorage();

  const [form, setForm] = useState({
    asset_name: "",
    category_id: "",
    brand: "",
    model: "",
    serial_number: "",
    vendor_id: "",
    purchase_cost_inr: "",
    invoice_number: "",
    purchase_date: "",
    warranty_expiry: "",
    location: "",
    remarks: "",
  });
  const [images, setImages] = useState<ImageUploadItem[]>([]);
  const [initialImageIds, setInitialImageIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(editing ? {
        asset_name: editing.asset_name,
        category_id: editing.category_id ?? "",
        brand: editing.brand ?? "",
        model: editing.model ?? "",
        serial_number: editing.serial_number ?? "",
        vendor_id: editing.vendor_id ?? "",
        purchase_cost_inr: (editing.purchase_cost_inr ?? editing.purchase_cost)?.toString() ?? "",
        invoice_number: editing.invoice_number ?? "",
        purchase_date: editing.purchase_date ?? "",
        warranty_expiry: editing.warranty_expiry ?? "",
        location: editing.location ?? "",
        remarks: editing.remarks ?? "",
      } : {
        asset_name: "",
        category_id: "",
        brand: "",
        model: "",
        serial_number: "",
        vendor_id: "",
        purchase_cost_inr: "",
        invoice_number: "",
        purchase_date: "",
        warranty_expiry: "",
        location: "",
        remarks: "",
      });

      if (editing) {
        const existing = toUploadItems(storage.getImages(editing.id));
        setImages(existing);
        setInitialImageIds(existing.map((img) => img.id));
      } else {
        setImages([]);
        setInitialImageIds([]);
      }
    }
  }, [open, editing, storage]);

  const syncImages = (assetId: string) => {
    const removedIds = initialImageIds.filter((id) => !images.some((img) => img.id === id));
    removedIds.forEach((id) => storage.deleteImage(id));

    const finalIds: string[] = [];
    for (const img of images) {
      if (img.isExisting) {
        finalIds.push(img.id);
      } else {
        const [created] = storage.addImages(assetId, [{
          fileName: img.fileName,
          fileSize: img.fileSize,
          imageUrl: img.imageUrl,
        }]);
        finalIds.push(created.id);
      }
    }
    if (finalIds.length) storage.reorderImages(assetId, finalIds);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const validationError = validateAssetForm(form);
    if (validationError) {
      toast.error(validationError);
      setSaving(false);
      return;
    }

    const payload = {
      asset_name: form.asset_name.trim(),
      category_id: form.category_id || null,
      brand: form.brand || null,
      model: form.model || null,
      serial_number: form.serial_number || null,
      purchase_cost_inr: form.purchase_cost_inr ? Number(form.purchase_cost_inr) : null,
      purchase_cost: null,
      invoice_number: form.invoice_number.trim() || null,
      purchase_date: form.purchase_date || null,
      vendor_id: form.vendor_id || null,
      warranty_expiry: form.warranty_expiry || null,
      status: editing?.status ?? "available",
      location: form.location || null,
      remarks: form.remarks || null,
      assigned_employee_id: editing?.assigned_employee_id || null,
    };

    try {
      if (editing) {
        MockDB.updateAsset(editing.id, payload);
        syncImages(editing.id);
        toast.success("Asset updated successfully");
      } else {
        const created = MockDB.addAsset(payload);
        if (images.length) {
          storage.addImages(
            created.id,
            images.map((img) => ({
              fileName: img.fileName,
              fileSize: img.fileSize,
              imageUrl: img.imageUrl,
            })),
          );
        }
        toast.success("Asset added successfully");
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Edit Asset" : "New Asset"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Asset Name" required>
            <Input value={form.asset_name} required onChange={(e) => setForm({ ...form, asset_name: e.target.value })} />
          </Field>
          <Field label="Category" required>
            <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.category_name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>

          <Field label="Brand">
            <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          </Field>
          <Field label="Model">
            <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          </Field>

          <Field label="Serial Number">
            <Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} />
          </Field>
          <Field label="Vendor" required>
            <Select value={form.vendor_id} onValueChange={(v) => setForm({ ...form, vendor_id: v })}>
              <SelectTrigger><SelectValue placeholder="Enter vendor name" /></SelectTrigger>
              <SelectContent>{vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.vendor_name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>

          <Field label="Purchase Cost (INR)">
            <Input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Enter purchase cost in INR"
              value={form.purchase_cost_inr}
              onChange={(e) => setForm({ ...form, purchase_cost_inr: e.target.value })}
            />
          </Field>
          <Field label="Invoice Number">
            <Input
              placeholder="Enter invoice number"
              maxLength={50}
              value={form.invoice_number}
              onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
            />
          </Field>

          <Field label="Purchase Date">
            <Input
              type="date"
              max={todayDateString()}
              value={form.purchase_date}
              onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
            />
          </Field>
          <Field label="Warranty Expiry">
            <Input
              type="date"
              min={form.purchase_date || undefined}
              value={form.warranty_expiry}
              onChange={(e) => setForm({ ...form, warranty_expiry: e.target.value })}
            />
          </Field>

          <Field label="Location">
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Field>
          <div className="hidden md:block" aria-hidden="true" />

          <div className="md:col-span-2">
            <Field label="Remarks">
              <Textarea rows={2} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
            </Field>
          </div>
          <div className="md:col-span-2 border-t pt-4">
            <AssetImageUpload value={images} onChange={setImages} />
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

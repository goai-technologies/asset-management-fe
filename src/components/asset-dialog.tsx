import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  useCategories,
  useCreateAssetMutation,
  useUpdateAssetMutation,
  useVendors,
} from "@/hooks/use-asset-management";
import type { AssetRow } from "@/lib/types/asset-management";
import { AssetImageUpload } from "@/components/asset-images/asset-image-upload";
import {
  type ImageUploadItem,
} from "@/lib/asset-images";
import { loadAssetImages } from "@/lib/asset-images/api-storage-adapter";

function toUploadItems(images: Awaited<ReturnType<typeof loadAssetImages>>): ImageUploadItem[] {
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

type AssetFormState = {
  asset_name: string;
  category_id: string;
  brand: string;
  serial_number: string;
  vendor_id: string;
  purchase_cost_inr: string;
  invoice_number: string;
  purchase_date: string;
  warranty_expiry: string;
  location: string;
  remarks: string;
};

type AssetFormErrors = Partial<Record<keyof AssetFormState | "images", string>>;

function validateAssetForm(form: AssetFormState, options?: { requireImages?: boolean; imageCount?: number }): AssetFormErrors {
  const errors: AssetFormErrors = {};
  const { requireImages = false, imageCount = 0 } = options ?? {};

  if (!form.asset_name.trim()) errors.asset_name = "Asset name is required";
  if (!form.category_id) errors.category_id = "Category is required";
  if (!form.brand.trim()) errors.brand = "Brand is required";
  if (!form.serial_number.trim()) errors.serial_number = "Serial number is required";
  if (!form.vendor_id) errors.vendor_id = "Vendor is required";

  if (!form.purchase_cost_inr.trim()) {
    errors.purchase_cost_inr = "Purchase cost is required";
  } else {
    const cost = Number(form.purchase_cost_inr);
    if (!Number.isFinite(cost) || cost <= 0) {
      errors.purchase_cost_inr = "Purchase cost must be a positive number";
    }
  }

  if (!form.invoice_number.trim()) {
    errors.invoice_number = "Invoice number is required";
  } else if (form.invoice_number.length > 50) {
    errors.invoice_number = "Invoice number cannot exceed 50 characters";
  }

  if (!form.purchase_date) {
    errors.purchase_date = "Purchase date is required";
  } else {
    const purchaseDate = new Date(form.purchase_date);
    const today = new Date(todayDateString());
    if (purchaseDate > today) {
      errors.purchase_date = "Purchase date cannot be in the future";
    }
  }

  if (!form.warranty_expiry) {
    errors.warranty_expiry = "Warranty expiry is required";
  } else if (form.purchase_date && new Date(form.warranty_expiry) < new Date(form.purchase_date)) {
    errors.warranty_expiry = "Warranty expiry cannot be earlier than purchase date";
  }

  if (!form.location.trim()) errors.location = "Location is required";
  if (requireImages && imageCount === 0) errors.images = "At least one asset image is required";

  return errors;
}

function validateEditAssetForm(form: AssetFormState): string | null {
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
  const { data: vendors = [] } = useVendors();
  const { data: allCategories = [] } = useCategories();
  const createMutation = useCreateAssetMutation();
  const updateMutation = useUpdateAssetMutation();

  const categories = useMemo(() => {
    if (!editing) {
      return allCategories.filter((c) => (c.status ?? "active") === "active");
    }
    return allCategories.filter(
      (c) => (c.status ?? "active") === "active" || c.id === editing.category_id,
    );
  }, [allCategories, editing?.category_id]);

  const [form, setForm] = useState<AssetFormState>({
    asset_name: "",
    category_id: "",
    brand: "",
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
  const [errors, setErrors] = useState<AssetFormErrors>({});
  const [saving, setSaving] = useState(false);

  const updateForm = <K extends keyof AssetFormState>(key: K, value: AssetFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updateImages = (nextImages: ImageUploadItem[]) => {
    setImages(nextImages);
    setErrors((prev) => {
      if (!prev.images) return prev;
      const next = { ...prev };
      delete next.images;
      return next;
    });
  };

  useEffect(() => {
    if (open) {
      setErrors({});
      setForm(editing ? {
        asset_name: editing.asset_name,
        category_id: editing.category_id ?? "",
        brand: editing.brand ?? "",
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
        void loadAssetImages(editing.id).then((existing) => {
          setImages(toUploadItems(existing));
        });
      } else {
        setImages([]);
      }
    }
  }, [open, editing]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (editing) {
      const validationError = validateEditAssetForm(form);
      if (validationError) {
        toast.error(validationError);
        setSaving(false);
        return;
      }
    } else {
      const validationErrors = validateAssetForm(form, { requireImages: false, imageCount: images.length });
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        toast.error("Please complete all required fields before creating the asset.");
        setSaving(false);
        return;
      }
    }

    const imageFiles = images.map((image) => image.file).filter((file): file is File => Boolean(file));
    const payload = {
      asset_name: form.asset_name.trim(),
      category_id: form.category_id || null,
      brand: form.brand || null,
      model: editing?.model ?? null,
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
      _imageFiles: imageFiles,
    };

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, updates: payload });
        toast.success("Asset updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
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
          <Field label="Asset Name" required error={errors.asset_name}>
            <Input value={form.asset_name} required onChange={(e) => updateForm("asset_name", e.target.value)} />
          </Field>
          <Field label="Category" required error={errors.category_id}>
            <Select value={form.category_id} onValueChange={(v) => updateForm("category_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.category_name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>

          <Field label="Brand" required error={errors.brand}>
            <Input value={form.brand} required onChange={(e) => updateForm("brand", e.target.value)} />
          </Field>
          <Field label="Serial Number" required error={errors.serial_number}>
            <Input value={form.serial_number} required onChange={(e) => updateForm("serial_number", e.target.value)} />
          </Field>
          <Field label="Vendor" required error={errors.vendor_id}>
            <Select value={form.vendor_id} onValueChange={(v) => updateForm("vendor_id", v)}>
              <SelectTrigger><SelectValue placeholder="Enter vendor name" /></SelectTrigger>
              <SelectContent>{vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.vendor_name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>

          <Field label="Purchase Cost (INR)" required error={errors.purchase_cost_inr}>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="Enter purchase cost in INR"
              value={form.purchase_cost_inr}
              onChange={(e) => updateForm("purchase_cost_inr", e.target.value)}
            />
          </Field>
          <Field label="Invoice Number" required error={errors.invoice_number}>
            <Input
              placeholder="Enter invoice number"
              maxLength={50}
              required
              value={form.invoice_number}
              onChange={(e) => updateForm("invoice_number", e.target.value)}
            />
          </Field>

          <Field label="Purchase Date" required error={errors.purchase_date}>
            <Input
              type="date"
              required
              max={todayDateString()}
              value={form.purchase_date}
              onChange={(e) => updateForm("purchase_date", e.target.value)}
            />
          </Field>
          <Field label="Warranty Expiry" required error={errors.warranty_expiry}>
            <Input
              type="date"
              required
              min={form.purchase_date || undefined}
              value={form.warranty_expiry}
              onChange={(e) => updateForm("warranty_expiry", e.target.value)}
            />
          </Field>

          <Field label="Location" required={!editing} error={errors.location}>
            <Input value={form.location} required={!editing} onChange={(e) => updateForm("location", e.target.value)} />
          </Field>
          <div className="hidden md:block" aria-hidden="true" />

          <div className="md:col-span-2">
            <Field label="Remarks">
              <Textarea rows={2} value={form.remarks} onChange={(e) => updateForm("remarks", e.target.value)} />
            </Field>
          </div>
          <div className="md:col-span-2 border-t pt-4">
            <Field label="Asset Image" error={errors.images}>
              <AssetImageUpload value={images} onChange={updateImages} />
            </Field>
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

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

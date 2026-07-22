import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MockDB, type VendorRow } from "@/lib/mock-db";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export function DeleteVendorDialog({
  open,
  onOpenChange,
  vendor,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  vendor: VendorRow | null;
  onDeleted: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const linkedCount = vendor ? MockDB.getVendorLinkedAssetCount(vendor.id) : 0;
  const hasLinkedAssets = linkedCount > 0;

  const handleConfirm = async () => {
    if (!vendor || hasLinkedAssets) return;
    setSaving(true);
    try {
      MockDB.deleteVendor(vendor.id);
      toast.success("Vendor deleted successfully");
      onDeleted();
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An error occurred";
      if (message === "LINKED_ASSETS") {
        toast.error("Cannot delete vendor with linked assets. Please reassign assets first.");
      } else {
        toast.error(message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            {hasLinkedAssets ? (
              <>
                <span className="block font-medium text-destructive">This vendor is linked to existing assets.</span>
                <span className="block">Please reassign those assets before deleting this vendor.</span>
              </>
            ) : (
              <>
                <span className="block">You are about to remove this vendor from the directory.</span>
                <span className="block font-medium text-foreground">This action cannot be undone.</span>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {vendor && (
          <div className={`rounded-lg border p-4 space-y-2 text-sm ${hasLinkedAssets ? "border-destructive/20 bg-destructive/5" : "border-border bg-muted/30"}`}>
            <DetailRow label="Vendor ID" value={<span className="font-mono">{vendor.vendor_code}</span>} />
            <DetailRow label="Vendor Name" value={vendor.vendor_name} />
            <DetailRow label="Vendor Type" value={vendor.vendor_type ?? "—"} />
            <DetailRow label="Linked Assets" value={linkedCount} />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
          {!hasLinkedAssets && (
            <Button variant="destructive" onClick={handleConfirm} disabled={saving || !vendor}>
              {saving ? "Deleting…" : "Delete Vendor"}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

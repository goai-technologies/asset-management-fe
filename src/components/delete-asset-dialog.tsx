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
import { useSoftDeleteAssetMutation } from "@/hooks/use-asset-management";
import type { AssetRow } from "@/lib/types/asset-management";
import { AssetOwnerDisplay } from "@/components/asset-owner-display";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export function DeleteAssetDialog({
  open,
  onOpenChange,
  asset,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  asset: AssetRow | null;
  onDeleted: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const deleteMutation = useSoftDeleteAssetMutation();

  const handleConfirm = async () => {
    if (!asset) return;
    setSaving(true);
    try {
      await deleteMutation.mutateAsync(asset.id);
      toast.success("🗑️ Asset deleted successfully.");
      onDeleted();
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An error occurred";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Asset</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">You are about to permanently remove this asset from the inventory.</span>
            <span className="block font-medium text-foreground">This action cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {asset && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-2 text-sm">
            <DetailRow label="Asset ID" value={<span className="font-mono">{asset.asset_code}</span>} />
            <DetailRow label="Asset Name" value={asset.asset_name} />
            <DetailRow label="Category" value={asset.categories?.category_name ?? "—"} />
            <DetailRow label="Serial Number" value={asset.serial_number ?? "—"} />
            <DetailRow label="Assigned to" value={<AssetOwnerDisplay name={asset.employees?.name} />} />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleConfirm} disabled={saving || !asset}>
            {saving ? "Deleting…" : "Delete Asset"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

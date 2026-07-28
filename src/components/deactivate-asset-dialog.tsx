import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/status-badge";
import { toast } from "sonner";
import { useDeactivateAssetMutation } from "@/hooks/use-asset-management";
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

export function DeactivateAssetDialog({
  open,
  onOpenChange,
  asset,
  performedBy,
  onDeactivated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  asset: AssetRow | null;
  performedBy?: string;
  onDeactivated: () => void;
}) {
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const deactivateMutation = useDeactivateAssetMutation();

  useEffect(() => {
    if (open) {
      setRemarks("");
    }
  }, [open, asset?.id]);

  const handleConfirm = async () => {
    if (!asset) return;

    setSaving(true);
    try {
      await deactivateMutation.mutateAsync({
        assetId: asset.id,
        options: { remarks, performedBy },
      });
      toast.success("✅ Asset deactivated successfully.");
      onDeactivated();
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
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Deactivate Asset</DialogTitle>
          <DialogDescription>
            Temporarily remove this asset from active use. It cannot be assigned until reactivated.
          </DialogDescription>
        </DialogHeader>

        {asset && (
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 space-y-2 text-sm">
            <DetailRow label="Asset ID" value={<span className="font-mono">{asset.asset_code}</span>} />
            <DetailRow label="Asset Name" value={asset.asset_name} />
            <DetailRow label="Current Status" value={<StatusBadge status={asset.status} />} />
            <DetailRow label="Assigned to" value={<AssetOwnerDisplay name={asset.employees?.name} />} />
          </div>
        )}

        <div className="space-y-2">
          <Label>Remarks</Label>
          <Textarea
            rows={3}
            placeholder="Optional notes about this deactivation"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            className="bg-warning/20 text-warning-foreground hover:bg-warning/30 border border-warning/40"
            onClick={handleConfirm}
            disabled={saving || !asset}
          >
            {saving ? "Deactivating…" : "Deactivate Asset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

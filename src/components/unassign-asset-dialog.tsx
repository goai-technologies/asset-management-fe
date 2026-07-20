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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { toast } from "sonner";
import { MockDB, UNASSIGN_REASONS, type AssetRow } from "@/lib/mock-db";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export function UnassignAssetDialog({
  open,
  onOpenChange,
  asset,
  performedBy,
  onUnassigned,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  asset: AssetRow | null;
  performedBy?: string;
  onUnassigned: () => void;
}) {
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setReason("");
      setRemarks("");
    }
  }, [open, asset?.id]);

  const handleConfirm = async () => {
    if (!asset) return;
    if (!reason) {
      toast.error("Please select a reason for unassignment");
      return;
    }

    setSaving(true);
    try {
      const result = MockDB.unassignAsset(asset.id, {
        reason,
        remarks,
        performedBy,
      });
      toast.success(
        result.sentForRepair
          ? "✅ Asset unassigned and sent for repair."
          : "✅ Asset successfully unassigned.",
      );
      onUnassigned();
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
          <DialogTitle>Unassign Asset</DialogTitle>
          <DialogDescription>
            Are you sure you want to unassign this asset from the current employee?
          </DialogDescription>
        </DialogHeader>

        {asset && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2 text-sm">
            <DetailRow label="Asset ID" value={<span className="font-mono">{asset.asset_code}</span>} />
            <DetailRow label="Asset Name" value={asset.asset_name} />
            <DetailRow label="Assigned to" value={asset.employees?.name ?? "—"} />
            <DetailRow label="Current Status" value={<StatusBadge status={asset.status} />} />
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Reason <span className="text-destructive">*</span></Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
              <SelectContent>
                {UNASSIGN_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Additional Remarks</Label>
            <Textarea
              rows={3}
              placeholder="Optional notes about this unassignment"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={saving || !asset || !reason}>
            {saving ? "Unassigning…" : "Confirm Unassign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

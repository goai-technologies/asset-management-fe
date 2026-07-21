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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { toast } from "sonner";
import { MockDB, DISPOSAL_REASONS, type AssetRow } from "@/lib/mock-db";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export function DisposeAssetDialog({
  open,
  onOpenChange,
  asset,
  performedBy,
  onDisposed,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  asset: AssetRow | null;
  performedBy?: string;
  onDisposed: () => void;
}) {
  const [reason, setReason] = useState("");
  const [disposalDate, setDisposalDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setReason("");
      setRemarks("");
      setDisposalDate(new Date().toISOString().split("T")[0]);
    }
  }, [open, asset?.id]);

  const handleConfirm = async () => {
    if (!asset) return;
    if (!reason) {
      toast.error("Please select a disposal reason");
      return;
    }
    if (!disposalDate) {
      toast.error("Please select a disposal date");
      return;
    }

    setSaving(true);
    try {
      MockDB.disposeAsset(asset.id, {
        reason,
        disposal_date: disposalDate,
        remarks,
        performedBy,
      });
      toast.success("✅ Asset disposed successfully.");
      onDisposed();
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
          <DialogTitle>Dispose Asset</DialogTitle>
          <DialogDescription>
            Permanently mark this asset as disposed. The record and history will be retained.
          </DialogDescription>
        </DialogHeader>

        {asset && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-2 text-sm">
            <DetailRow label="Asset ID" value={<span className="font-mono">{asset.asset_code}</span>} />
            <DetailRow label="Asset Name" value={asset.asset_name} />
            <DetailRow label="Current Status" value={<StatusBadge status={asset.status} />} />
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Disposal Reason <span className="text-destructive">*</span></Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
              <SelectContent>
                {DISPOSAL_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Disposal Date <span className="text-destructive">*</span></Label>
            <Input
              type="date"
              value={disposalDate}
              onChange={(e) => setDisposalDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Remarks</Label>
            <Textarea
              rows={3}
              placeholder="Optional notes about this disposal"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={saving || !asset}>
            {saving ? "Disposing…" : "Dispose Asset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

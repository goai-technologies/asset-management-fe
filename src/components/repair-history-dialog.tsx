import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Wrench } from "lucide-react";
import { toast } from "sonner";
import {
  useAssetRepairs,
  useCompleteRepairMutation,
  useUpdateRepairMutation,
  useVendors,
} from "@/hooks/use-asset-management";
import type { AssetRow, RepairRow } from "@/lib/types/asset-management";
import { currencyINR, dateTime, shortDate } from "@/lib/format";

export function RepairHistoryDialog({
  open,
  onOpenChange,
  asset,
  canManage,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  asset: AssetRow | null;
  canManage: boolean;
  onUpdated: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    vendor_id: "",
    repair_cost: "",
    expected_return_date: "",
    actual_return_date: "",
    repair_notes: "",
  });
  const [saving, setSaving] = useState(false);

  const { data: vendors = [] } = useVendors();
  const { data: repairs = [], refetch: refetchRepairs } = useAssetRepairs(open ? asset?.id : undefined);
  const updateMutation = useUpdateRepairMutation();
  const completeMutation = useCompleteRepairMutation();

  useEffect(() => {
    if (open && asset) {
      setEditingId(null);
    }
  }, [open, asset]);

  const startEdit = (repair: RepairRow) => {
    setEditingId(repair.id);
    setForm({
      vendor_id: repair.vendor_id ?? "",
      repair_cost: repair.repair_cost?.toString() ?? "",
      expected_return_date: repair.expected_return_date ?? "",
      actual_return_date: repair.actual_return_date ?? "",
      repair_notes: repair.repair_notes ?? "",
    });
  };

  const handleSave = async (repairId: string) => {
    setSaving(true);
    try {
      await updateMutation.mutateAsync({
        repairId,
        updates: {
          vendor_id: form.vendor_id || null,
          repair_cost: form.repair_cost ? Number(form.repair_cost) : null,
          expected_return_date: form.expected_return_date || null,
          actual_return_date: form.actual_return_date || null,
          repair_notes: form.repair_notes.trim() || null,
        },
      });
      await refetchRepairs();
      setEditingId(null);
      toast.success("Repair details updated");
      onUpdated();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update repair");
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (repairId: string) => {
    setSaving(true);
    try {
      await completeMutation.mutateAsync({
        repairId,
        updates: {
          vendor_id: form.vendor_id || null,
          repair_cost: form.repair_cost ? Number(form.repair_cost) : null,
          expected_return_date: form.expected_return_date || null,
          actual_return_date: form.actual_return_date || undefined,
          repair_notes: form.repair_notes.trim() || null,
        },
      });
      await refetchRepairs();
      setEditingId(null);
      toast.success("Repair marked complete. Asset is now available.");
      onUpdated();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to complete repair");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Repair History</DialogTitle>
          {asset && (
            <p className="text-sm text-muted-foreground">
              {asset.asset_name} ({asset.asset_code})
            </p>
          )}
        </DialogHeader>

        {repairs.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No repair records"
            description="Repairs will appear here when an asset is unassigned with reason “Sent for Repair”."
          />
        ) : (
          <ul className="space-y-4">
            {repairs.map((repair) => (
              <li key={repair.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-sm">Repair Record</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Started {dateTime(repair.created_at)}
                      {repair.unassign_reason && <> · {repair.unassign_reason}</>}
                    </div>
                  </div>
                  <StatusBadge status={repair.status} kind="repair" />
                </div>

                {editingId === repair.id && canManage && repair.status === "in_progress" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                    <div className="space-y-2">
                      <Label>Repair Vendor</Label>
                      <Select value={form.vendor_id} onValueChange={(v) => setForm({ ...form, vendor_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                        <SelectContent>
                          {vendors.map((v) => (
                            <SelectItem key={v.id} value={v.id}>{v.vendor_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Repair Cost (INR)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.repair_cost}
                        onChange={(e) => setForm({ ...form, repair_cost: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Expected Return Date</Label>
                      <Input
                        type="date"
                        value={form.expected_return_date}
                        onChange={(e) => setForm({ ...form, expected_return_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Actual Return Date</Label>
                      <Input
                        type="date"
                        value={form.actual_return_date}
                        onChange={(e) => setForm({ ...form, actual_return_date: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <Label>Repair Notes</Label>
                      <Textarea
                        rows={2}
                        value={form.repair_notes}
                        onChange={(e) => setForm({ ...form, repair_notes: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-2 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)} disabled={saving}>
                        Cancel
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleSave(repair.id)} disabled={saving}>
                        Save Details
                      </Button>
                      <Button size="sm" onClick={() => handleComplete(repair.id)} disabled={saving}>
                        Mark as Repaired
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Repair Vendor: </span>
                      {repair.vendors?.vendor_name ?? "—"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Repair Cost: </span>
                      {repair.repair_cost != null ? currencyINR(repair.repair_cost) : "—"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Expected Return: </span>
                      {shortDate(repair.expected_return_date)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Actual Return: </span>
                      {shortDate(repair.actual_return_date)}
                    </div>
                    {repair.repair_notes && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Notes: </span>
                        {repair.repair_notes}
                      </div>
                    )}
                    {canManage && repair.status === "in_progress" && (
                      <div className="col-span-2 pt-1">
                        <Button size="sm" variant="outline" onClick={() => startEdit(repair)}>
                          Edit Repair Details
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

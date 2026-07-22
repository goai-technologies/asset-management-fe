import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MockDB, AssetRow } from "@/lib/mock-db";

export function AssignDialog({
  open, onOpenChange, preSelectedAssetId, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  preSelectedAssetId?: string;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    asset_id: preSelectedAssetId || "",
    employee_id: "",
    assigned_date: new Date().toISOString().split('T')[0],
    expected_return: "",
    notes: "",
  });
  
  const [saving, setSaving] = useState(false);
  const [availableAssets, setAvailableAssets] = useState<AssetRow[]>([]);
  const employees = MockDB.getEmployees();
  const selectedAsset =
    availableAssets.find((a) => a.id === form.asset_id) ??
    (form.asset_id ? MockDB.getAssets().find((a) => a.id === form.asset_id) ?? null : null);

  useEffect(() => {
    if (open) {
      // Only show assets that are 'available' or the currently pre-selected one
      const assets = MockDB.getAssets().filter(a => a.status === 'available' || a.id === preSelectedAssetId);
      setAvailableAssets(assets);
      setForm({
        asset_id: preSelectedAssetId || "",
        employee_id: "",
        assigned_date: new Date().toISOString().split('T')[0],
        expected_return: "",
        notes: "",
      });
    }
  }, [open, preSelectedAssetId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    if (!form.asset_id || !form.employee_id || !form.assigned_date) {
      toast.error("Please select an Asset, an Employee, and an Assigned Date.");
      setSaving(false);
      return;
    }

    try {
      MockDB.assignAsset(
        form.asset_id, 
        form.employee_id, 
        form.assigned_date, 
        form.expected_return || null, 
        form.notes || null
      );
      toast.success("Asset assigned successfully");
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader><DialogTitle>Assign Asset</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4 pt-4">
          <Field label="Asset" required>
            <Select value={form.asset_id} onValueChange={(v) => setForm({ ...form, asset_id: v })} disabled={!!preSelectedAssetId}>
              <SelectTrigger>
                <SelectValue placeholder="Select available asset">
                  {selectedAsset ? formatAssetOption(selectedAsset) : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableAssets.map(a => (
                  <SelectItem key={a.id} value={a.id}>{formatAssetOption(a)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAsset && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground font-normal">Serial Number</Label>
                <Input
                  readOnly
                  tabIndex={-1}
                  aria-label="Asset serial number"
                  value={selectedAsset.serial_number?.trim() ? selectedAsset.serial_number : "—"}
                  className="bg-muted font-mono text-sm"
                />
              </div>
            )}
          </Field>
          
          <Field label="Assigned to" required>
            <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                {employees.map(e => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name} ({e.employee_code}){e.department ? ` · ${e.department}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          
          <Field label="Assigned Date" required>
            <Input type="date" value={form.assigned_date} required onChange={(e) => setForm({ ...form, assigned_date: e.target.value })} />
          </Field>
          
          <Field label="Expected Return">
            <Input type="date" value={form.expected_return} onChange={(e) => setForm({ ...form, expected_return: e.target.value })} />
          </Field>
          
          <Field label="Notes">
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Assign Asset"}</Button>
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

function formatAssetOption(asset: AssetRow): string {
  const base = `${asset.asset_name} (${asset.asset_code})`;
  const serial = asset.serial_number?.trim();
  return serial ? `${base} – SN: ${serial}` : base;
}

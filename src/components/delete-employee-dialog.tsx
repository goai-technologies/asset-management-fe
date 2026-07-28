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
import { useDeleteEmployeeMutation } from "@/hooks/use-asset-management";
import type { EmployeeRow } from "@/lib/types/asset-management";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export function DeleteEmployeeDialog({
  open,
  onOpenChange,
  employee,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employee: EmployeeRow | null;
  onDeleted: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const deleteMutation = useDeleteEmployeeMutation();
  const assignedCount = employee?.assigned_asset_count ?? 0;
  const hasAssignedAssets = assignedCount > 0;

  const handleConfirm = async () => {
    if (!employee || hasAssignedAssets) return;
    setSaving(true);
    try {
      await deleteMutation.mutateAsync(employee.id);
      toast.success("Employee deleted successfully");
      onDeleted();
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An error occurred";
      if (message === "ASSIGNED_ASSETS") {
        toast.error("Cannot delete employee with assigned assets. Please unassign assets first.");
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
          <AlertDialogTitle>Delete Employee</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            {hasAssignedAssets ? (
              <>
                <span className="block font-medium text-destructive">This employee currently has assigned assets.</span>
                <span className="block">Please unassign or transfer the assets before deleting.</span>
              </>
            ) : (
              <>
                <span className="block">You are about to remove this employee from the directory.</span>
                <span className="block font-medium text-foreground">This action cannot be undone.</span>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {employee && (
          <div className={`rounded-lg border p-4 space-y-2 text-sm ${hasAssignedAssets ? "border-destructive/20 bg-destructive/5" : "border-border bg-muted/30"}`}>
            <DetailRow label="Employee ID" value={<span className="font-mono">{employee.employee_code}</span>} />
            <DetailRow label="Employee Name" value={employee.name} />
            <DetailRow label="Department" value={employee.department ?? "—"} />
            <DetailRow label="Assigned Assets" value={assignedCount} />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
          {!hasAssignedAssets && (
            <Button variant="destructive" onClick={handleConfirm} disabled={saving || !employee}>
              {saving ? "Deleting…" : "Delete Employee"}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

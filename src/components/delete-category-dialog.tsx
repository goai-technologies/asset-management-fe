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
import { useDeleteCategoryMutation } from "@/hooks/use-asset-management";
import type { CategoryRow } from "@/lib/types/asset-management";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export function DeleteCategoryDialog({
  open,
  onOpenChange,
  category,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  category: CategoryRow | null;
  onDeleted: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const deleteMutation = useDeleteCategoryMutation();
  const assetCount = category?.asset_count ?? 0;
  const hasLinkedAssets = assetCount > 0;

  const handleConfirm = async () => {
    if (!category || hasLinkedAssets) return;
    setSaving(true);
    try {
      await deleteMutation.mutateAsync(category.id);
      toast.success("Category deleted successfully");
      onDeleted();
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An error occurred";
      if (message === "LINKED_ASSETS") {
        toast.error("This category is assigned to existing assets. Reassign those assets before deleting this category.");
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
          <AlertDialogTitle>Delete Category</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            {hasLinkedAssets ? (
              <>
                <span className="block font-medium text-destructive">
                  This category is assigned to existing assets. Reassign those assets before deleting this category.
                </span>
              </>
            ) : (
              <>
                <span className="block">You are about to remove this category from the directory.</span>
                <span className="block font-medium text-foreground">This action cannot be undone.</span>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {category && (
          <div className={`rounded-lg border p-4 space-y-2 text-sm ${hasLinkedAssets ? "border-destructive/20 bg-destructive/5" : "border-border bg-muted/30"}`}>
            <DetailRow label="Category Name" value={category.category_name} />
            <DetailRow label="Asset Count" value={assetCount} />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
          {!hasLinkedAssets && (
            <Button variant="destructive" onClick={handleConfirm} disabled={saving || !category}>
              {saving ? "Deleting…" : "Delete Category"}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

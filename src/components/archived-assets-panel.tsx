import { useState } from "react";
import { Archive, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MockDB } from "@/lib/mock-db";
import { useMockDbRefresh } from "@/hooks/use-mock-db-refresh";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { AssetOwnerDisplay } from "@/components/asset-owner-display";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ArchivedAssetsPanel() {
  const { refresh: triggerRefresh } = useMockDbRefresh();
  const [permanentDeleteId, setPermanentDeleteId] = useState<string | null>(null);
  const archived = MockDB.getArchivedAssets();

  const assetToDelete = permanentDeleteId
    ? archived.find((a) => a.id === permanentDeleteId) ?? null
    : null;

  const handleRestore = (id: string) => {
    MockDB.restoreAsset(id);
    toast.success("Asset restored successfully");
    triggerRefresh();
  };

  const handlePermanentDelete = () => {
    if (!permanentDeleteId) return;
    MockDB.permanentlyDeleteAsset(permanentDeleteId);
    toast.success("Asset permanently deleted");
    setPermanentDeleteId(null);
    triggerRefresh();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-muted-foreground" />
            Archived Assets
          </CardTitle>
          <CardDescription>
            Soft-deleted assets are hidden from the main inventory. Restore or permanently remove them here.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {archived.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6">No archived assets.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset ID</TableHead>
                  <TableHead>Asset Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Assigned to</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archived.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.asset_code}</TableCell>
                    <TableCell className="font-medium">{a.asset_name}</TableCell>
                    <TableCell>{a.categories?.category_name ?? "—"}</TableCell>
                    <TableCell><AssetOwnerDisplay name={a.employees?.name} /></TableCell>
                    <TableCell><StatusBadge status={a.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleRestore(a.id)}>
                          <RotateCcw className="h-3.5 w-3.5 mr-1" />
                          Restore
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setPermanentDeleteId(a.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Permanently Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!permanentDeleteId} onOpenChange={(open) => !open && setPermanentDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{assetToDelete?.asset_name}</strong> ({assetToDelete?.asset_code})
              and all associated images. Assignment history will be removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handlePermanentDelete}>
              Permanently Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

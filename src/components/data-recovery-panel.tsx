import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { assetKeys, exportDataSnapshot } from "@/lib/api/asset-management";
import { useInvalidateAssetData } from "@/hooks/use-asset-management";

export function DataRecoveryPanel() {
  const invalidateAssetData = useInvalidateAssetData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);

  const { data: snapshot } = useQuery({
    queryKey: [...assetKeys.all, "snapshot"],
    queryFn: exportDataSnapshot,
  });

  const counts = {
    employees: snapshot?.employees.length ?? 0,
    assets: snapshot?.assets.length ?? 0,
    categories: snapshot?.categories.length ?? 0,
    vendors: snapshot?.vendors.length ?? 0,
  };

  const exportBackup = async () => {
    try {
      const data = snapshot ?? await exportDataSnapshot();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `eams-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Export failed";
      toast.error(message);
    }
  };

  const importBackup = (_raw: string) => {
    try {
      JSON.parse(_raw);
      invalidateAssetData();
      toast.error("Import is not supported with server-backed storage. Use database restore tools instead.");
      setImportText("");
      setShowImport(false);
    } catch {
      toast.error("Could not import backup. Check that the JSON is valid.");
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => importBackup(String(reader.result ?? ""));
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Backup & Recovery</CardTitle>
        <CardDescription>
          Export a snapshot of assets, employees, categories, and vendors from the database.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <Stat label="Employees" value={counts.employees} />
          <Stat label="Assets" value={counts.assets} />
          <Stat label="Categories" value={counts.categories} />
          <Stat label="Vendors" value={counts.vendors} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportBackup}>
            <Download className="h-4 w-4 mr-2" />Export Backup
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />Import Backup File
          </Button>
          <Button variant="ghost" onClick={() => setShowImport((v) => !v)}>
            {showImport ? "Hide paste import" : "Paste JSON to restore"}
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFileChange} />
        </div>
        {showImport && (
          <div className="space-y-2">
            <Textarea
              rows={6}
              placeholder='Paste exported JSON backup here…'
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <Button onClick={() => importBackup(importText)} disabled={!importText.trim()}>
              Restore from pasted JSON
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

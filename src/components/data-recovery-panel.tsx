import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MockDB } from "@/lib/mock-db";
import { useMockDbRefresh } from "@/hooks/use-mock-db-refresh";

export function DataRecoveryPanel() {
  const { refresh } = useMockDbRefresh();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);

  const snapshot = MockDB.exportSnapshot();
  const counts = {
    employees: snapshot.employees.length,
    assets: snapshot.assets.length,
    categories: snapshot.categories.length,
    vendors: snapshot.vendors.length,
  };

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eams-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
  };

  const importBackup = (raw: string) => {
    try {
      const data = JSON.parse(raw);
      const result = MockDB.importSnapshot(data);
      refresh();
      toast.success(`Restored ${result.employees} employees and ${result.assets} assets`);
      setImportText("");
      setShowImport(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Import failed";
      if (message === "INVALID_BACKUP") {
        toast.error("Invalid backup file. Expected employees, assets, and categories arrays.");
      } else {
        toast.error("Could not import backup. Check that the JSON is valid.");
      }
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
          Assets and employees are stored in this browser only. Export regularly to avoid losing data.
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

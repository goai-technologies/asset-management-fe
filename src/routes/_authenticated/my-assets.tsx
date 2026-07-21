import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Boxes } from "lucide-react";
import { useSession } from "@/hooks/use-auth";
import { useMockDbRefresh } from "@/hooks/use-mock-db-refresh";
import { getMyAssignedAssets } from "@/hooks/use-user-account";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MockDB } from "@/lib/mock-db";
import { shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/my-assets")({
  component: MyAssetsPage,
});

function MyAssetsPage() {
  const { user } = useSession();
  const { tick: refreshTick } = useMockDbRefresh();
  const [assets, setAssets] = useState<ReturnType<typeof MockDB.getEmployeeAssignedAssets>>([]);

  useEffect(() => {
    setAssets(getMyAssignedAssets(user?.email).assets);
  }, [user?.email, refreshTick]);

  const rows = useMemo(
    () => assets.map((asset) => {
      const employee = getMyAssignedAssets(user?.email).employee;
      const assignment = employee
        ? MockDB.getEmployeeAssignments(employee.id).find((a) => a.asset_id === asset.id && a.status === "assigned")
        : null;
      return { asset, assignment };
    }),
    [assets, user?.email],
  );

  return (
    <div>
      <PageHeader title="My Assets" description="Assets currently assigned to you." />
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {rows.length === 0 ? (
            <div className="p-8">
              <EmptyState icon={Boxes} title="No assets assigned" description="No assets are currently assigned to you." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset ID</TableHead>
                  <TableHead>Asset Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Brand & Model</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Assignment Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ asset, assignment }) => (
                  <TableRow key={asset.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-xs">{asset.asset_code}</TableCell>
                    <TableCell className="font-medium">{asset.asset_name}</TableCell>
                    <TableCell>{asset.categories?.category_name ?? "—"}</TableCell>
                    <TableCell className="text-sm">
                      <div>{asset.brand || "—"}</div>
                      <div className="text-xs text-muted-foreground">{asset.model || ""}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{asset.serial_number || "—"}</TableCell>
                    <TableCell className="text-sm">{shortDate(assignment?.assigned_date ?? asset.created_at)}</TableCell>
                    <TableCell><StatusBadge status={asset.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

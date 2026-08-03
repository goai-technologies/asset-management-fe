import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Download, Trash2, ArrowLeftRight, Boxes, History, UserPlus } from "lucide-react";
import { useSession, useRoles } from "@/hooks/use-auth";
import { useAssets, useCategories, useAssetAssignments, useSoftDeleteAssetMutation, useInvalidateAssetData } from "@/hooks/use-asset-management";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { currencyINR, shortDate, dateTime } from "@/lib/format";
import { downloadCSV } from "@/lib/csv";
import {
  CLICKABLE_TABLE_ROW_CLASS,
  handleClickableRowClick,
  handleClickableRowKeyDown,
} from "@/lib/clickable-table-row";
import type { AssetRow } from "@/lib/types/asset-management";
import { AssetDialog } from "@/components/asset-dialog";
import { EmployeeDialog } from "@/components/employee-dialog";
import { AssignDialog } from "@/components/assign-dialog";
import { UnassignAssetDialog } from "@/components/unassign-asset-dialog";
import { DisposeAssetDialog } from "@/components/dispose-asset-dialog";
import { DeactivateAssetDialog } from "@/components/deactivate-asset-dialog";
import { AssetActionsMenu, type AssetDetailsTab } from "@/components/asset-actions-menu";
import { AssetOwnerDisplay } from "@/components/asset-owner-display";
import { AssetImageGallery } from "@/components/asset-images/asset-image-gallery";
import { RepairHistoryDialog } from "@/components/repair-history-dialog";

export const Route = createFileRoute("/_authenticated/assets")({
  component: AssetsPage,
});

const STATUSES = ["available","assigned","reserved","repair","lost","inactive","disposed","retired"] as const;

function AssetsPage() {
  const { user } = useSession();
  const { canManage } = useRoles(user?.id);
  const performerName = (user?.user_metadata?.name as string | undefined) ?? user?.email ?? "Administrator";
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [employeeOpen, setEmployeeOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [unassignOpen, setUnassignOpen] = useState(false);
  const [editing, setEditing] = useState<AssetRow | null>(null);
  const [viewAsset, setViewAsset] = useState<AssetRow | null>(null);
  const [viewTab, setViewTab] = useState<AssetDetailsTab>("general");
  const [assignAssetId, setAssignAssetId] = useState<string | undefined>(undefined);
  const [unassignAsset, setUnassignAsset] = useState<AssetRow | null>(null);
  const [disposeAsset, setDisposeAsset] = useState<AssetRow | null>(null);
  const [disposeOpen, setDisposeOpen] = useState(false);
  const [deactivateAsset, setDeactivateAsset] = useState<AssetRow | null>(null);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [repairHistoryAsset, setRepairHistoryAsset] = useState<AssetRow | null>(null);
  const [repairHistoryOpen, setRepairHistoryOpen] = useState(false);
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: assets = [], refetch: refetchAssets } = useAssets();
  const { data: categories = [] } = useCategories();
  const softDeleteMutation = useSoftDeleteAssetMutation();
  const invalidateAssetData = useInvalidateAssetData();
  const triggerRefresh = () => {
    void refetchAssets();
    invalidateAssetData();
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return assets.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (categoryFilter !== "all" && a.category_id !== categoryFilter) return false;
      if (!needle) return true;
      return [a.asset_code, a.asset_name, a.serial_number, a.brand, a.model, a.employees?.name]
        .some((v) => v?.toLowerCase().includes(needle));
    });
  }, [assets, q, statusFilter, categoryFilter]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(a => a.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const openAssetDetails = (asset: AssetRow, tab: AssetDetailsTab = "general") => {
    setViewAsset(asset);
    setViewTab(tab);
  };

  const handleBulkDelete = async () => {
    if (!canManage) return;
    await Promise.all([...selectedIds].map((id) => softDeleteMutation.mutateAsync(id)));
    toast.success(`🗑️ ${selectedIds.size} asset${selectedIds.size > 1 ? "s" : ""} deleted successfully.`);
    setSelectedIds(new Set());
    if (viewAsset && selectedIds.has(viewAsset.id)) setViewAsset(null);
    void refetchAssets();
  };

  const exportCSV = () => {
    downloadCSV("assets", filtered.map((a) => ({
      code: a.asset_code, name: a.asset_name, category: a.categories?.category_name ?? "",
      brand: a.brand ?? "", model: a.model ?? "", serial: a.serial_number ?? "", status: a.status,
      assigned_to: a.employees?.name ?? "", vendor: a.vendors?.vendor_name ?? "",
      purchase_date: a.purchase_date ?? "", purchase_cost_inr: a.purchase_cost_inr ?? a.purchase_cost ?? "",
      invoice_number: a.invoice_number ?? "",
      warranty_expiry: a.warranty_expiry ?? "", location: a.location ?? "",
    })));
  };

  return (
    <div>
      <PageHeader
        title="Assets"
        description="All company assets with lifecycle status, assignments, and warranty info."
        actions={
          canManage ? (
            <>
              <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />Add Asset
              </Button>
              <Button variant="outline" onClick={() => setEmployeeOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />Add Employee
              </Button>
              <Button variant="outline" onClick={() => setAssignOpen(true)}>
                <ArrowLeftRight className="h-4 w-4 mr-2" />Assign Asset
              </Button>
              <Button variant="outline" onClick={exportCSV} title="Export CSV">
                <Download className="h-4 w-4 mr-2" />CSV
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={exportCSV} title="Export CSV">
                <Download className="h-4 w-4 mr-2" />CSV
              </Button>
            </>
          )
        }
      />

      <Card className="mb-4">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search code, name, serial, assigned to…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.category_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedIds.size > 0 && (
        <div className="bg-muted/50 border rounded-md p-2 mb-4 flex items-center justify-between">
          <span className="text-sm font-medium ml-2">{selectedIds.size} assets selected</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setAssignOpen(true)}><ArrowLeftRight className="h-4 w-4 mr-2"/>Assign</Button>
            <Button variant="secondary" size="sm" onClick={() => toast.success("Mock: Exported selection")}><Download className="h-4 w-4 mr-2"/>Export</Button>
            {canManage && <Button variant="destructive" size="sm" onClick={handleBulkDelete}><Trash2 className="h-4 w-4 mr-2"/>Delete</Button>}
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState 
                icon={Boxes} 
                title="No assets found" 
                description={q || statusFilter !== 'all' || categoryFilter !== 'all' ? "Try adjusting your filters or search terms." : "Get started by adding your first asset to the inventory."}
                actionLabel={canManage && !q ? "Add Asset" : undefined}
                onAction={() => { setEditing(null); setDialogOpen(true); }}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">
                    <Checkbox checked={selectedIds.size === filtered.length && filtered.length > 0} onCheckedChange={toggleSelectAll} />
                  </TableHead>
                  <TableHead>Asset ID</TableHead>
                  <TableHead>Asset Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Brand & Model</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Assigned to</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow
                    key={a.id}
                    tabIndex={0}
                    className={CLICKABLE_TABLE_ROW_CLASS}
                    aria-label={`View details for ${a.asset_name}`}
                    onClick={(event) => handleClickableRowClick(event, () => openAssetDetails(a))}
                    onKeyDown={(event) => handleClickableRowKeyDown(event, () => openAssetDetails(a))}
                  >
                    <TableCell className="text-center" data-stop-row-click>
                      <Checkbox checked={selectedIds.has(a.id)} onCheckedChange={() => toggleSelect(a.id)} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{a.asset_code}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="font-medium text-primary hover:underline cursor-pointer text-left"
                        onClick={() => openAssetDetails(a)}
                      >
                        {a.asset_name}
                      </button>
                    </TableCell>
                    <TableCell>{a.categories?.category_name ?? "—"}</TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium">{a.brand || "—"}</div>
                      <div className="text-xs text-muted-foreground">{a.model}</div>
                    </TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">{a.serial_number || "—"}</TableCell>
                    <TableCell><AssetOwnerDisplay name={a.employees?.name} /></TableCell>
                    <TableCell className="text-sm">{a.location || "—"}</TableCell>
                    <TableCell><StatusBadge status={a.status} /></TableCell>
                    <TableCell data-stop-row-click>
                      <AssetActionsMenu
                        asset={a}
                        canManage={canManage}
                        onViewDetails={() => openAssetDetails(a)}
                        onViewHistory={() => openAssetDetails(a, "history")}
                        onEdit={() => { setEditing(a); setDialogOpen(true); }}
                        onAssign={() => { setAssignAssetId(a.id); setAssignOpen(true); }}
                        onUnassign={() => { setUnassignAsset(a); setUnassignOpen(true); }}
                        onRepairHistory={() => {
                          setRepairHistoryAsset(a);
                          setRepairHistoryOpen(true);
                        }}
                        onDispose={() => { setDisposeAsset(a); setDisposeOpen(true); }}
                        onDeactivate={() => { setDeactivateAsset(a); setDeactivateOpen(true); }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Asset Dialog — create (IT/Admin) or edit (Admin) */}
      {canManage && (
        <AssetDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
          editing={editing}
          onSaved={triggerRefresh}
        />
      )}
      
      {canManage && (
        <EmployeeDialog
          open={employeeOpen}
          onOpenChange={setEmployeeOpen}
          onSaved={triggerRefresh}
        />
      )}

      {/* Assign Dialog */}
      <AssignDialog 
        open={assignOpen} 
        onOpenChange={(v) => {
          setAssignOpen(v);
          if (!v) setAssignAssetId(undefined); // Reset pre-selection when closed
        }}
        preSelectedAssetId={assignAssetId} 
        onSaved={triggerRefresh} 
      />

      <UnassignAssetDialog
        open={unassignOpen}
        onOpenChange={(v) => {
          setUnassignOpen(v);
          if (!v) setUnassignAsset(null);
        }}
        asset={unassignAsset}
        performedBy={performerName}
        onUnassigned={triggerRefresh}
      />

      <DisposeAssetDialog
        open={disposeOpen}
        onOpenChange={(v) => {
          setDisposeOpen(v);
          if (!v) setDisposeAsset(null);
        }}
        asset={disposeAsset}
        performedBy={performerName}
        onDisposed={triggerRefresh}
      />

      <DeactivateAssetDialog
        open={deactivateOpen}
        onOpenChange={(v) => {
          setDeactivateOpen(v);
          if (!v) setDeactivateAsset(null);
        }}
        asset={deactivateAsset}
        performedBy={performerName}
        onDeactivated={triggerRefresh}
      />

      <RepairHistoryDialog
        open={repairHistoryOpen}
        onOpenChange={(open) => {
          setRepairHistoryOpen(open);
          if (!open) setRepairHistoryAsset(null);
        }}
        asset={repairHistoryAsset}
        canManage={canManage}
        onUpdated={triggerRefresh}
      />

      {/* Asset Details Drawer */}
      <Sheet open={!!viewAsset} onOpenChange={(open) => !open && setViewAsset(null)}>
        <SheetContent className="sm:max-w-[600px] overflow-y-auto w-full">
          {viewAsset && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-2xl">{viewAsset.asset_name}</SheetTitle>
                <SheetDescription className="flex items-center gap-2 mt-2">
                  <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">{viewAsset.asset_code}</span>
                  <StatusBadge status={viewAsset.status} />
                </SheetDescription>
              </SheetHeader>

              <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as AssetDetailsTab)}>
                <TabsList className="w-full grid grid-cols-3 mb-6">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="images">Images</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailItem label="Asset ID" value={<span className="font-mono">{viewAsset.asset_code}</span>} />
                    <DetailItem label="Asset Name" value={viewAsset.asset_name} />
                    <DetailItem label="Category" value={viewAsset.categories?.category_name} />
                    <DetailItem label="Location" value={viewAsset.location} />
                    <DetailItem label="Brand" value={viewAsset.brand} />
                    <DetailItem label="Model" value={viewAsset.model} />
                    <DetailItem label="Serial Number" value={viewAsset.serial_number} className="font-mono text-sm" />
                    <DetailItem label="Asset Owner" value={<AssetOwnerDisplay name={viewAsset.employees?.name} />} />
                    <DetailItem label="Vendor" value={viewAsset.vendors?.vendor_name} />
                    <DetailItem label="Status" value={<StatusBadge status={viewAsset.status} />} />
                    <DetailItem
                      label="Purchase Cost (INR)"
                      value={viewAsset.purchase_cost_inr ?? viewAsset.purchase_cost
                        ? currencyINR(viewAsset.purchase_cost_inr ?? viewAsset.purchase_cost)
                        : undefined}
                    />
                    <DetailItem label="Purchase Date" value={shortDate(viewAsset.purchase_date)} />
                    <DetailItem label="Invoice Number" value={viewAsset.invoice_number} className="font-mono text-sm" />
                    <DetailItem label="Warranty Expiry" value={shortDate(viewAsset.warranty_expiry)} />
                  </div>
                  <div className="border-t pt-4">
                    <DetailItem label="Remarks" value={viewAsset.remarks} className="whitespace-pre-wrap" />
                  </div>
                </TabsContent>

                <TabsContent value="images" className="space-y-4">
                  <AssetImageGallery
                    key={viewAsset.id}
                    assetId={viewAsset.id}
                    canManage={canManage}
                    onChange={triggerRefresh}
                  />
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  <AssignmentHistoryList assetId={viewAsset.id} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function AssignmentHistoryList({ assetId }: { assetId: string }) {
  const { data: assignments = [] } = useAssetAssignments(assetId);

  if (assignments.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No history yet"
        description="Assignment and unassignment events will appear here."
      />
    );
  }

  return (
    <ul className="divide-y">
      {assignments.map((entry) => (
        <li key={entry.id} className="py-3 flex items-start justify-between gap-4">
          <div>
            {entry.status === "unassigned" ? (
              <>
                <div className="font-medium text-sm">Asset Unassigned</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Assigned To: {entry.employees?.name ?? "—"}
                </div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  Unassigned On: {dateTime(entry.assigned_date)}
                </div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  Reason: {entry.reason ?? "—"}
                </div>
                {entry.notes && (
                  <div className="text-sm text-muted-foreground mt-0.5">
                    Remarks: {entry.notes}
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  Performed By: {entry.performed_by ?? "System"}
                </div>
              </>
            ) : entry.status === "disposed" ? (
              <>
                <div className="font-medium text-sm">Asset Disposed</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Disposal Date: {shortDate(entry.assigned_date)}
                </div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  Reason: {entry.reason ?? "—"}
                </div>
                {entry.notes && (
                  <div className="text-sm text-muted-foreground mt-0.5">
                    Remarks: {entry.notes}
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  Performed By: {entry.performed_by ?? "System"}
                </div>
              </>
            ) : entry.status === "inactive" ? (
              <>
                <div className="font-medium text-sm">Asset Deactivated</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Deactivated On: {dateTime(entry.assigned_date)}
                </div>
                {entry.notes && (
                  <div className="text-sm text-muted-foreground mt-0.5">
                    Remarks: {entry.notes}
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  Performed By: {entry.performed_by ?? "System"}
                </div>
              </>
            ) : entry.status === "assigned" ? (
              <>
                <div className="font-medium text-sm">
                  Assigned To: {entry.employees?.name ?? "—"}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Serial Number: {entry.assets?.serial_number?.trim() || "—"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Assigned On: {dateTime(entry.assigned_date)}
                </div>
              </>
            ) : (
              <>
                <div className="font-medium text-sm">
                  {entry.status === "returned" ? "Returned by" : "Assigned to"}{" "}
                  {entry.employees?.name ?? "—"}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Serial Number: {entry.assets?.serial_number?.trim() || "—"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {entry.status === "returned" && entry.returned_date
                    ? `Returned ${shortDate(entry.returned_date)}`
                    : `Assigned ${shortDate(entry.assigned_date)}`}
                </div>
              </>
            )}
          </div>
          <StatusBadge status={entry.status} kind="assignment" />
        </li>
      ))}
    </ul>
  );
}

function DetailItem({ label, value, className }: { label: string; value?: React.ReactNode; className?: string }) {
  return (
    <div>
      <div className="text-sm font-semibold text-foreground mb-1">{label}</div>
      <div className={`text-sm ${value ? "text-muted-foreground" : "text-muted-foreground/70"} ${className || ""}`}>
        {value || "—"}
      </div>
    </div>
  );
}

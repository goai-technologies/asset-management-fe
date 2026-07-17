import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Plus, Search, Download, Trash2, Pencil, Upload, MoreHorizontal, Eye, History, Wrench, ArrowLeftRight, Boxes, FileDown } from "lucide-react";
import { useSession, useRoles } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { currency, shortDate } from "@/lib/format";
import { downloadCSV } from "@/lib/csv";
import { MockDB, AssetRow } from "@/lib/mock-db";
import { AssetDialog } from "@/components/asset-dialog";
import { AssignDialog } from "@/components/assign-dialog";

export const Route = createFileRoute("/_authenticated/assets")({
  component: AssetsPage,
});

const STATUSES = ["available","assigned","reserved","repair","lost","disposed","retired"] as const;

function AssetsPage() {
  const { user } = useSession();
  const { canManage } = useRoles(user?.id);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editing, setEditing] = useState<AssetRow | null>(null);
  const [viewAsset, setViewAsset] = useState<AssetRow | null>(null);
  const [assignAssetId, setAssignAssetId] = useState<string | undefined>(undefined);
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [refreshTick, setRefreshTick] = useState(0);
  const triggerRefresh = () => setRefreshTick(t => t + 1);

  const [assets, setAssets] = useState<AssetRow[]>([]);
  const categories = MockDB.getCategories();
  
  useEffect(() => {
    setAssets(MockDB.getAssets());
    // Also refresh the viewAsset if it's currently open
    if (viewAsset) {
      setViewAsset(MockDB.getAssets().find(a => a.id === viewAsset.id) || null);
    }
  }, [refreshTick]);

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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this asset? This will also remove its assignment history.")) return;
    MockDB.deleteAsset(id);
    toast.success("Asset deleted");
    triggerRefresh();
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} assets?`)) return;
    selectedIds.forEach(id => MockDB.deleteAsset(id));
    toast.success(`Deleted ${selectedIds.size} assets`);
    setSelectedIds(new Set());
    triggerRefresh();
  };

  const exportCSV = () => {
    downloadCSV("assets", filtered.map((a) => ({
      code: a.asset_code, name: a.asset_name, category: a.categories?.category_name ?? "",
      brand: a.brand ?? "", model: a.model ?? "", serial: a.serial_number ?? "", status: a.status,
      assigned_to: a.employees?.name ?? "", vendor: a.vendors?.vendor_name ?? "",
      purchase_date: a.purchase_date ?? "", purchase_cost: a.purchase_cost ?? "",
      warranty_expiry: a.warranty_expiry ?? "", location: a.location ?? "",
    })));
  };

  return (
    <div>
      <PageHeader
        title="Assets"
        description="All company assets with lifecycle status, ownership, and warranty info."
        actions={
          <>
            <Button variant="outline" onClick={exportCSV} title="Export CSV"><Download className="h-4 w-4 mr-2" />CSV</Button>
            <Button variant="outline" onClick={() => toast.success("Mock: PDF Exported")} title="Export PDF"><FileDown className="h-4 w-4 mr-2" />PDF</Button>
            <Button variant="outline" onClick={() => toast.success("Mock: Opened Import Modal")}><Upload className="h-4 w-4 mr-2" />Import</Button>
            {canManage && (
              <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />Add Asset
              </Button>
            )}
          </>
        }
      />

      <Card className="mb-4">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search code, name, serial, employee…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
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
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => setViewAsset(a)}>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selectedIds.has(a.id)} onCheckedChange={() => toggleSelect(a.id)} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{a.asset_code}</TableCell>
                    <TableCell className="font-medium">{a.asset_name}</TableCell>
                    <TableCell>{a.categories?.category_name ?? "—"}</TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium">{a.brand || "—"}</div>
                      <div className="text-xs text-muted-foreground">{a.model}</div>
                    </TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">{a.serial_number || "—"}</TableCell>
                    <TableCell>{a.employees?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-sm">{a.location || "—"}</TableCell>
                    <TableCell><StatusBadge status={a.status} /></TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setViewAsset(a)}><Eye className="h-4 w-4 mr-2" /> View Details</DropdownMenuItem>
                          {canManage && <DropdownMenuItem onClick={() => { setEditing(a); setDialogOpen(true); }}><Pencil className="h-4 w-4 mr-2" /> Edit Asset</DropdownMenuItem>}
                          {a.status === 'available' && <DropdownMenuItem onClick={() => { setAssignAssetId(a.id); setAssignOpen(true); }}><ArrowLeftRight className="h-4 w-4 mr-2" /> Assign Asset</DropdownMenuItem>}
                          <DropdownMenuItem onClick={() => toast.success("Mock: Assignment History")}><History className="h-4 w-4 mr-2" /> Assignment History</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.success("Mock: Repair History")}><Wrench className="h-4 w-4 mr-2" /> Repair History</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {canManage && <DropdownMenuItem onClick={() => handleDelete(a.id)} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Delete Asset</DropdownMenuItem>}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Asset Dialog */}
      {canManage && (
        <AssetDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          editing={editing}
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

              <Tabs defaultValue="general">
                <TabsList className="w-full grid grid-cols-4 mb-6">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="purchase">Purchase</TabsTrigger>
                  <TabsTrigger value="assignment">Assignment</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Category" value={viewAsset.categories?.category_name} />
                    <DetailItem label="Location" value={viewAsset.location} />
                    <DetailItem label="Brand" value={viewAsset.brand} />
                    <DetailItem label="Model" value={viewAsset.model} />
                    <DetailItem label="Serial Number" value={viewAsset.serial_number} className="font-mono text-sm" />
                    <DetailItem label="Status" value={<StatusBadge status={viewAsset.status} />} />
                  </div>
                  <div className="mt-4 border-t pt-4">
                    <DetailItem label="Remarks" value={viewAsset.remarks} />
                  </div>
                </TabsContent>

                <TabsContent value="purchase" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Vendor" value={viewAsset.vendors?.vendor_name} />
                    <DetailItem label="Purchase Date" value={shortDate(viewAsset.purchase_date)} />
                    <DetailItem label="Purchase Cost" value={viewAsset.purchase_cost ? currency(viewAsset.purchase_cost) : undefined} />
                    <DetailItem label="Warranty Expiry" value={shortDate(viewAsset.warranty_expiry)} />
                  </div>
                </TabsContent>

                <TabsContent value="assignment" className="space-y-4">
                  {viewAsset.status === 'assigned' ? (
                    <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Currently assigned to</div>
                        <div className="font-medium text-lg mt-1">{viewAsset.employees?.name}</div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => {
                        MockDB.updateAsset(viewAsset.id, { status: 'available', assigned_employee_id: null });
                        toast.success("Asset returned and is now available");
                        triggerRefresh();
                      }}>Revoke</Button>
                    </div>
                  ) : (
                    <EmptyState 
                      icon={ArrowLeftRight} 
                      title="Not Assigned" 
                      description="This asset is currently available in the inventory." 
                      actionLabel="Assign Asset"
                      onAction={() => { setAssignAssetId(viewAsset.id); setAssignOpen(true); }}
                    />
                  )}
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  <EmptyState 
                    icon={History} 
                    title="Mock Data" 
                    description="Assignment and repair history timeline would appear here." 
                  />
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetailItem({ label, value, className }: { label: string, value?: React.ReactNode, className?: string }) {
  return (
    <div>
      <div className="text-sm font-medium text-muted-foreground mb-1">{label}</div>
      <div className={`text-sm ${value ? 'text-foreground' : 'text-muted-foreground'} ${className || ''}`}>
        {value || '—'}
      </div>
    </div>
  );
}

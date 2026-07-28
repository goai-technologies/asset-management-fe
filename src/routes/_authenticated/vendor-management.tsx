import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Download, Store, MapPin, ExternalLink } from "lucide-react";
import { useSession, useRoles } from "@/hooks/use-auth";
import { useVendorRows, useInvalidateAssetData } from "@/hooks/use-asset-management";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { downloadCSV } from "@/lib/csv";
import { getGoogleMapsSearchUrl } from "@/lib/google-maps";
import {
  CLICKABLE_TABLE_ROW_CLASS,
  handleClickableRowClick,
  handleClickableRowKeyDown,
} from "@/lib/clickable-table-row";
import { VENDOR_TYPES, type VendorRow } from "@/lib/types/asset-management";
import { VendorDialog } from "@/components/vendor-dialog";
import { VendorActionsMenu } from "@/components/vendor-actions-menu";
import { DeleteVendorDialog } from "@/components/delete-vendor-dialog";

export const Route = createFileRoute("/_authenticated/vendor-management")({
  component: VendorManagementPage,
});

const VENDOR_STATUSES = ["active", "inactive"] as const;

function VendorManagementPage() {
  const { user } = useSession();
  const { canManage } = useRoles(user?.id);
  const { data: vendors = [], refetch } = useVendorRows();
  const invalidateAssetData = useInvalidateAssetData();
  const triggerRefresh = () => {
    void refetch();
    invalidateAssetData();
  };
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VendorRow | null>(null);
  const [viewVendor, setViewVendor] = useState<VendorRow | null>(null);
  const [deleteVendor, setDeleteVendor] = useState<VendorRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return vendors.filter((v) => {
      if (statusFilter !== "all" && (v.status ?? "active") !== statusFilter) return false;
      if (typeFilter !== "all" && v.vendor_type !== typeFilter) return false;
      if (!needle) return true;
      return [
        v.vendor_code,
        v.vendor_name,
        v.contact_person,
        v.email,
        v.phone,
        v.office_address,
        v.vendor_type,
      ].some((field) => field?.toLowerCase().includes(needle));
    });
  }, [vendors, q, statusFilter, typeFilter]);

  const exportCSV = () => {
    downloadCSV("vendors", filtered.map((v) => ({
      vendor_id: v.vendor_code,
      vendor_name: v.vendor_name,
      contact_person: v.contact_person ?? "",
      email: v.email ?? "",
      phone: v.phone ?? "",
      office_address: v.office_address ?? "",
      vendor_type: v.vendor_type ?? "",
      status: v.status ?? "active",
      website: v.website ?? "",
      gst_number: v.gst_number ?? "",
      notes: v.notes ?? "",
    })));
  };

  const mapsUrl = viewVendor?.office_address ? getGoogleMapsSearchUrl(viewVendor.office_address) : "";

  return (
    <div>
      <PageHeader
        title="Vendor Management"
        description="Manage suppliers, contact details, and vendor information."
        actions={
          <>
            {canManage && (
              <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />Add Vendor
              </Button>
            )}
            <Button variant="outline" onClick={exportCSV} title="Export CSV">
              <Download className="h-4 w-4 mr-2" />Export CSV
            </Button>
          </>
        }
      />

      <Card className="mb-4">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search vendor ID, name, email, phone, address…"
              className="pl-9"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Vendor Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {VENDOR_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {VENDOR_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Store}
                title="No vendors found"
                description={q || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your filters or search terms."
                  : "Get started by adding your first vendor."}
                actionLabel={canManage && !q ? "Add Vendor" : undefined}
                onAction={() => { setEditing(null); setDialogOpen(true); }}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor ID</TableHead>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email Address</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Office Address</TableHead>
                  <TableHead>Vendor Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v) => (
                  <TableRow
                    key={v.id}
                    tabIndex={0}
                    className={CLICKABLE_TABLE_ROW_CLASS}
                    aria-label={`View details for ${v.vendor_name}`}
                    onClick={(event) => handleClickableRowClick(event, () => setViewVendor(v))}
                    onKeyDown={(event) => handleClickableRowKeyDown(event, () => setViewVendor(v))}
                  >
                    <TableCell className="font-mono text-xs">{v.vendor_code}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="font-medium text-primary hover:underline text-left"
                        onClick={() => setViewVendor(v)}
                      >
                        {v.vendor_name}
                      </button>
                    </TableCell>
                    <TableCell>{v.contact_person ?? "—"}</TableCell>
                    <TableCell className="text-sm">{v.email ?? "—"}</TableCell>
                    <TableCell className="text-sm">{v.phone ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate" title={v.office_address ?? undefined}>
                      {v.office_address ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">{v.vendor_type ?? "—"}</TableCell>
                    <TableCell><VendorStatusBadge status={v.status ?? "active"} /></TableCell>
                    <TableCell data-stop-row-click>
                      <VendorActionsMenu
                        vendor={v}
                        canManage={canManage}
                        onViewDetails={() => setViewVendor(v)}
                        onEdit={() => { setEditing(v); setDialogOpen(true); }}
                        onDelete={() => { setDeleteVendor(v); setDeleteOpen(true); }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {canManage && (
        <VendorDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
          editing={editing}
          onSaved={triggerRefresh}
        />
      )}

      <DeleteVendorDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeleteVendor(null);
        }}
        vendor={deleteVendor}
        onDeleted={() => {
          if (viewVendor && deleteVendor && viewVendor.id === deleteVendor.id) {
            setViewVendor(null);
          }
          triggerRefresh();
        }}
      />

      <Sheet open={!!viewVendor} onOpenChange={(open) => !open && setViewVendor(null)}>
        <SheetContent className="sm:max-w-[600px] overflow-y-auto w-full">
          {viewVendor && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-2xl">{viewVendor.vendor_name}</SheetTitle>
                <SheetDescription className="flex items-center gap-2 mt-2">
                  <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">{viewVendor.vendor_code}</span>
                  <VendorStatusBadge status={viewVendor.status ?? "active"} />
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DetailItem label="Vendor Name" value={viewVendor.vendor_name} />
                  <DetailItem label="Vendor Type" value={viewVendor.vendor_type} />
                  <DetailItem label="Contact Person" value={viewVendor.contact_person} />
                  <DetailItem label="Email Address" value={viewVendor.email} />
                  <DetailItem label="Phone Number" value={viewVendor.phone} />
                  <DetailItem label="GST Number" value={viewVendor.gst_number} />
                  <DetailItem label="Website" value={viewVendor.website ? (
                    <a href={viewVendor.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                      {viewVendor.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : undefined} className="sm:col-span-2" />
                  <DetailItem label="Complete Office Address" value={viewVendor.office_address} className="sm:col-span-2" />
                  <DetailItem label="Notes" value={viewVendor.notes} className="sm:col-span-2" />
                </div>

                {mapsUrl && (
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => window.open(mapsUrl, "_blank", "noopener,noreferrer")}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    View on Google Maps
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function VendorStatusBadge({ status }: { status: string }) {
  const isActive = status === "active";
  return (
    <Badge
      variant="outline"
      className={isActive
        ? "bg-success/15 text-success border-success/30 font-medium capitalize"
        : "bg-muted text-muted-foreground border-border font-medium capitalize"}
    >
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

function DetailItem({ label, value, className }: { label: string; value?: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="font-medium">{value || "—"}</div>
    </div>
  );
}

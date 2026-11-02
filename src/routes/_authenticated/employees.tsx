import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, Download, Users, History, Wrench } from "lucide-react";
import { toast } from "sonner";
import { useSession, useRoles } from "@/hooks/use-auth";
import { useEmployeeRows, useEmployeeAssignedAssets, useEmployeeAssignments, useEmployeeRepairHistory, useInvalidateAssetData } from "@/hooks/use-asset-management";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { shortDate, dateTime } from "@/lib/format";
import { downloadCSV } from "@/lib/csv";
import {
  CLICKABLE_TABLE_ROW_CLASS,
  handleClickableRowClick,
  handleClickableRowKeyDown,
} from "@/lib/clickable-table-row";
import type { EmployeeRow } from "@/lib/types/asset-management";
import { syncEmployeesFromZoho } from "@/lib/api/employees";
import { EmployeeActionsMenu, type EmployeeDetailsTab } from "@/components/employee-actions-menu";
import { DeleteEmployeeDialog } from "@/components/delete-employee-dialog";

export const Route = createFileRoute("/_authenticated/employees")({
  component: EmployeesPage,
});

const EMPLOYEE_STATUSES = ["active", "inactive"] as const;
const PAGE_SIZE = 10;

function getPageItems(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const items: Array<number | "ellipsis"> = [1];
  if (current > 3) items.push("ellipsis");
  for (let page = Math.max(2, current - 1); page <= Math.min(total - 1, current + 1); page += 1) {
    items.push(page);
  }
  if (current < total - 2) items.push("ellipsis");
  items.push(total);
  return items;
}

function EmployeesPage() {
  const { user } = useSession();
  const { canManage } = useRoles(user?.id);
  const { data: employees = [], refetch } = useEmployeeRows();
  const invalidateAssetData = useInvalidateAssetData();
  const triggerRefresh = () => {
    void refetch();
    invalidateAssetData();
  };
  const [viewEmployee, setViewEmployee] = useState<EmployeeRow | null>(null);
  const [viewTab, setViewTab] = useState<EmployeeDetailsTab>("general");
  const [deleteEmployee, setDeleteEmployee] = useState<EmployeeRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [q, setQ] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [page, setPage] = useState(1);

  const handleSyncFromZoho = async () => {
    setSyncing(true);
    try {
      const result = await syncEmployeesFromZoho();
      toast.success(
        `Synced ${result.total} employees from Zoho (${result.created} created, ${result.updated} updated, ${result.deactivated} deactivated).`,
      );
      triggerRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sync employees from Zoho");
    } finally {
      setSyncing(false);
    }
  };

  const departments = useMemo(
    () => [...new Set(employees.map((e) => e.department).filter(Boolean))] as string[],
    [employees],
  );
  const locations = useMemo(
    () => [...new Set(employees.map((e) => e.location).filter(Boolean))] as string[],
    [employees],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return employees.filter((e) => {
      if (departmentFilter !== "all" && e.department !== departmentFilter) return false;
      if (statusFilter !== "all" && (e.status ?? "active") !== statusFilter) return false;
      if (locationFilter !== "all" && e.location !== locationFilter) return false;
      if (!needle) return true;
      return [e.employee_code, e.name, e.email, e.department]
        .some((v) => v?.toLowerCase().includes(needle));
    });
  }, [employees, q, departmentFilter, statusFilter, locationFilter]);

  useEffect(() => {
    setPage(1);
  }, [q, departmentFilter, statusFilter, locationFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);
  const paged = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );
  const pageItems = useMemo(
    () => getPageItems(currentPage, totalPages),
    [currentPage, totalPages],
  );

  const openEmployeeDetails = (employee: EmployeeRow, tab: EmployeeDetailsTab = "general") => {
    setViewEmployee(employee);
    setViewTab(tab);
  };

  const exportCSV = () => {
    downloadCSV("employees", filtered.map((e) => ({
      employee_id: e.employee_code,
      name: e.name,
      email: e.email,
      department: e.department ?? "",
      designation: e.designation ?? "",
      phone: e.phone ?? "",
      location: e.location ?? "",
      assigned_assets: e.assigned_asset_count,
      status: e.status ?? "active",
    })));
  };

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Employees sync from Zoho People. Assign assets and view history here."
        actions={
          <>
            {canManage && (
              <Button onClick={() => void handleSyncFromZoho()} disabled={syncing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing…" : "Sync from Zoho"}
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
              placeholder="Search employee ID, name, email, department…"
              className="pl-9"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {EMPLOYEE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Location" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {locations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
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
                icon={Users}
                title="No employees found"
                description={q || departmentFilter !== "all" || statusFilter !== "all" || locationFilter !== "all"
                  ? "Try adjusting your filters or search terms."
                  : "Sync employees from Zoho People to get started."}
                actionLabel={canManage && !q ? "Sync from Zoho" : undefined}
                onAction={() => { void handleSyncFromZoho(); }}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">Assigned Asset Count</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((e) => (
                  <TableRow
                    key={e.id}
                    tabIndex={0}
                    className={CLICKABLE_TABLE_ROW_CLASS}
                    aria-label={`View details for ${e.name}`}
                    onClick={(event) => handleClickableRowClick(event, () => openEmployeeDetails(e))}
                    onKeyDown={(event) => handleClickableRowKeyDown(event, () => openEmployeeDetails(e))}
                  >
                    <TableCell className="font-mono text-xs">{e.employee_code}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="font-medium text-primary hover:underline text-left"
                        onClick={() => openEmployeeDetails(e)}
                      >
                        {e.name}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm">{e.email}</TableCell>
                    <TableCell>{e.department ?? "—"}</TableCell>
                    <TableCell>{e.designation ?? "—"}</TableCell>
                    <TableCell className="text-sm">{e.phone ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{e.location ?? "—"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={e.assigned_asset_count > 0 ? "default" : "secondary"}>
                        {e.assigned_asset_count}
                      </Badge>
                    </TableCell>
                    <TableCell><EmployeeStatusBadge status={e.status ?? "active"} /></TableCell>
                    <TableCell data-stop-row-click>
                      <EmployeeActionsMenu
                        employee={e}
                        canManage={canManage}
                        allowEdit={false}
                        onViewDetails={() => openEmployeeDetails(e)}
                        onViewAssignedAssets={() => openEmployeeDetails(e, "assets")}
                        onEdit={() => undefined}
                        onDelete={() => { setDeleteEmployee(e); setDeleteOpen(true); }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {filtered.length > 0 && (
          <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {pageStart}–{pageEnd} of {filtered.length}
            </p>
            <Pagination className="mx-0 w-full justify-start sm:w-auto sm:justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-disabled={currentPage <= 1}
                    className={currentPage <= 1 ? "pointer-events-none opacity-50" : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      if (currentPage > 1) setPage(currentPage - 1);
                    }}
                  />
                </PaginationItem>
                {pageItems.map((item, index) =>
                  item === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink
                        href="#"
                        isActive={item === currentPage}
                        onClick={(event) => {
                          event.preventDefault();
                          setPage(item);
                        }}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    aria-disabled={currentPage >= totalPages}
                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      if (currentPage < totalPages) setPage(currentPage + 1);
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>

      <DeleteEmployeeDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeleteEmployee(null);
        }}
        employee={deleteEmployee}
        onDeleted={() => {
          if (viewEmployee && deleteEmployee && viewEmployee.id === deleteEmployee.id) {
            setViewEmployee(null);
          }
          triggerRefresh();
        }}
      />

      <Sheet open={!!viewEmployee} onOpenChange={(open) => !open && setViewEmployee(null)}>
        <SheetContent className="sm:max-w-[600px] overflow-y-auto w-full">
          {viewEmployee && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-2xl">{viewEmployee.name}</SheetTitle>
                <SheetDescription className="flex items-center gap-2 mt-2">
                  <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">{viewEmployee.employee_code}</span>
                  <EmployeeStatusBadge status={viewEmployee.status ?? "active"} />
                </SheetDescription>
              </SheetHeader>

              <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as EmployeeDetailsTab)}>
                <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 mb-6">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="assets">Assigned Assets</TabsTrigger>
                  <TabsTrigger value="history">Assignment History</TabsTrigger>
                  <TabsTrigger value="repairs">Repair History</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailItem label="Employee ID" value={<span className="font-mono">{viewEmployee.employee_code}</span>} />
                    <DetailItem label="Employee Name" value={viewEmployee.name} />
                    <DetailItem label="Email" value={viewEmployee.email} />
                    <DetailItem label="Phone" value={viewEmployee.phone} />
                    <DetailItem label="Department" value={viewEmployee.department} />
                    <DetailItem label="Designation" value={viewEmployee.designation} />
                    <DetailItem label="Location" value={viewEmployee.location} />
                    <DetailItem label="Status" value={<EmployeeStatusBadge status={viewEmployee.status ?? "active"} />} />
                    <DetailItem label="Assigned Assets" value={viewEmployee.assigned_asset_count} />
                  </div>
                </TabsContent>

                <TabsContent value="assets">
                  <AssignedAssetsList employeeId={viewEmployee.id} />
                </TabsContent>

                <TabsContent value="history">
                  <AssignmentHistoryList employeeId={viewEmployee.id} />
                </TabsContent>

                <TabsContent value="repairs">
                  <RepairHistoryList employeeId={viewEmployee.id} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function EmployeeStatusBadge({ status }: { status: string }) {
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
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={className ?? "font-medium"}>{value || "—"}</div>
    </div>
  );
}

function AssignedAssetsList({ employeeId }: { employeeId: string }) {
  const { data: assets = [] } = useEmployeeAssignedAssets(employeeId);
  const { data: assignments = [] } = useEmployeeAssignments(employeeId);

  if (assets.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No assigned assets"
        description="This employee does not currently have any assets assigned."
      />
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Asset Name</TableHead>
            <TableHead>Asset ID</TableHead>
            <TableHead>Assigned Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => {
            const assignment = assignments
              .find((a) => a.asset_id === asset.id && a.status === "assigned");
            return (
              <TableRow key={asset.id}>
                <TableCell className="font-medium">{asset.asset_name}</TableCell>
                <TableCell className="font-mono text-xs">{asset.asset_code}</TableCell>
                <TableCell className="text-sm">{shortDate(assignment?.assigned_date ?? asset.created_at)}</TableCell>
                <TableCell><StatusBadge status={asset.status} /></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function AssignmentHistoryList({ employeeId }: { employeeId: string }) {
  const { data: assignments = [] } = useEmployeeAssignments(employeeId);

  if (assignments.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No assignment history"
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
                  Asset: {entry.assets?.asset_name ?? "—"} ({entry.assets?.asset_code ?? "—"})
                </div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  Serial Number: {entry.assets?.serial_number?.trim() || "—"}
                </div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  Unassigned On: {dateTime(entry.assigned_date)}
                </div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  Reason: {entry.reason ?? "—"}
                </div>
              </>
            ) : (
              <>
                <div className="font-medium text-sm">Asset Assigned</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Asset: {entry.assets?.asset_name ?? "—"} ({entry.assets?.asset_code ?? "—"})
                </div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  Serial Number: {entry.assets?.serial_number?.trim() || "—"}
                </div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  Assigned On: {dateTime(entry.assigned_date)}
                </div>
                {entry.returned_date && (
                  <div className="text-sm text-muted-foreground mt-0.5">
                    Returned On: {shortDate(entry.returned_date)}
                  </div>
                )}
              </>
            )}
          </div>
          <StatusBadge status={entry.status} kind="assignment" />
        </li>
      ))}
    </ul>
  );
}

function RepairHistoryList({ employeeId }: { employeeId: string }) {
  const { data: repairs = [] } = useEmployeeRepairHistory(employeeId);

  if (repairs.length === 0) {
    return (
      <EmptyState
        icon={Wrench}
        title="No repair history"
        description="Repair records for assets linked to this employee will appear here."
      />
    );
  }

  return (
    <ul className="divide-y">
      {repairs.map((repair) => (
        <li key={repair.id} className="py-3 flex items-start justify-between gap-4">
          <div>
            <div className="font-medium text-sm">{repair.assets?.asset_name ?? "Unknown Asset"}</div>
            <div className="text-xs text-muted-foreground font-mono mt-0.5">{repair.assets?.asset_code}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Started: {shortDate(repair.created_at)}
            </div>
            {repair.completed_at && (
              <div className="text-sm text-muted-foreground mt-0.5">
                Completed: {shortDate(repair.completed_at)}
              </div>
            )}
            {repair.repair_notes && (
              <div className="text-sm text-muted-foreground mt-0.5">{repair.repair_notes}</div>
            )}
          </div>
          <StatusBadge status={repair.status} kind="repair" />
        </li>
      ))}
    </ul>
  );
}

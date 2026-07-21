import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Download, Users, History, Wrench } from "lucide-react";
import { useSession, useRoles } from "@/hooks/use-auth";
import { useMockDbRefresh } from "@/hooks/use-mock-db-refresh";
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
import { shortDate, dateTime } from "@/lib/format";
import { downloadCSV } from "@/lib/csv";
import {
  CLICKABLE_TABLE_ROW_CLASS,
  handleClickableRowClick,
  handleClickableRowKeyDown,
} from "@/lib/clickable-table-row";
import { MockDB, type EmployeeRow } from "@/lib/mock-db";
import { EmployeeDialog } from "@/components/employee-dialog";
import { EmployeeActionsMenu, type EmployeeDetailsTab } from "@/components/employee-actions-menu";
import { DeleteEmployeeDialog } from "@/components/delete-employee-dialog";

export const Route = createFileRoute("/_authenticated/employees")({
  component: EmployeesPage,
});

const EMPLOYEE_STATUSES = ["active", "inactive"] as const;

function EmployeesPage() {
  const { user } = useSession();
  const { canManage } = useRoles(user?.id);
  const { tick: refreshTick, refresh: triggerRefresh } = useMockDbRefresh();

  const [q, setQ] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeRow | null>(null);
  const [viewEmployee, setViewEmployee] = useState<EmployeeRow | null>(null);
  const [viewTab, setViewTab] = useState<EmployeeDetailsTab>("general");
  const [deleteEmployee, setDeleteEmployee] = useState<EmployeeRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    setEmployees(MockDB.getEmployeeRows());
    if (viewEmployee) {
      setViewEmployee(MockDB.getEmployeeById(viewEmployee.id));
    }
  }, [refreshTick]);

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
        description="Manage company employees, assignments, and contact information."
        actions={
          <>
            {canManage && (
              <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />Add Employee
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
                  : "Get started by adding your first employee."}
                actionLabel={canManage && !q ? "Add Employee" : undefined}
                onAction={() => { setEditing(null); setDialogOpen(true); }}
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
                {filtered.map((e) => (
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
                        onViewDetails={() => openEmployeeDetails(e)}
                        onViewAssignedAssets={() => openEmployeeDetails(e, "assets")}
                        onEdit={() => { setEditing(e); setDialogOpen(true); }}
                        onDelete={() => { setDeleteEmployee(e); setDeleteOpen(true); }}
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
        <EmployeeDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
          editing={editing}
          onSaved={triggerRefresh}
        />
      )}

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
                  <AssignedAssetsList employeeId={viewEmployee.id} refreshTick={refreshTick} />
                </TabsContent>

                <TabsContent value="history">
                  <AssignmentHistoryList employeeId={viewEmployee.id} refreshTick={refreshTick} />
                </TabsContent>

                <TabsContent value="repairs">
                  <RepairHistoryList employeeId={viewEmployee.id} refreshTick={refreshTick} />
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

function AssignedAssetsList({ employeeId, refreshTick }: { employeeId: string; refreshTick: number }) {
  const assets = useMemo(() => MockDB.getEmployeeAssignedAssets(employeeId), [employeeId, refreshTick]);

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
            const assignment = MockDB.getEmployeeAssignments(employeeId)
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

function AssignmentHistoryList({ employeeId, refreshTick }: { employeeId: string; refreshTick: number }) {
  const assignments = useMemo(() => MockDB.getEmployeeAssignments(employeeId), [employeeId, refreshTick]);

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

function RepairHistoryList({ employeeId, refreshTick }: { employeeId: string; refreshTick: number }) {
  const repairs = useMemo(() => MockDB.getEmployeeRepairHistory(employeeId), [employeeId, refreshTick]);

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

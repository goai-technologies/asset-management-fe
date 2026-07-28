import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, FolderTree } from "lucide-react";
import { useSession, useRoles } from "@/hooks/use-auth";
import { useCategoryRows, useInvalidateAssetData } from "@/hooks/use-asset-management";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  CLICKABLE_TABLE_ROW_CLASS,
  handleClickableRowClick,
  handleClickableRowKeyDown,
} from "@/lib/clickable-table-row";
import type { CategoryRow } from "@/lib/types/asset-management";
import { getCategoryIcon } from "@/lib/category-icons";
import { CategoryDialog } from "@/components/category-dialog";
import { CategoryActionsMenu } from "@/components/category-actions-menu";
import { DeleteCategoryDialog } from "@/components/delete-category-dialog";

export const Route = createFileRoute("/_authenticated/categories")({
  component: CategoriesPage,
});

const CATEGORY_STATUSES = ["active", "inactive"] as const;

function CategoriesPage() {
  const { user } = useSession();
  const { canManage } = useRoles(user?.id);
  const { data: categories = [], refetch } = useCategoryRows();
  const invalidateAssetData = useInvalidateAssetData();
  const triggerRefresh = () => {
    void refetch();
    invalidateAssetData();
  };
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [viewCategory, setViewCategory] = useState<CategoryRow | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<CategoryRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return categories.filter((c) => {
      if (statusFilter !== "all" && (c.status ?? "active") !== statusFilter) return false;
      if (!needle) return true;
      return [c.category_name, c.description]
        .some((field) => field?.toLowerCase().includes(needle));
    });
  }, [categories, q, statusFilter]);

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Manage asset categories used across the inventory."
        actions={
          canManage ? (
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />Add Category
            </Button>
          ) : undefined
        }
      />

      <Card className="mb-4">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search category name or description…"
              className="pl-9"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {CATEGORY_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={FolderTree}
                title="No categories found"
                description={q || statusFilter !== "all"
                  ? "Try adjusting your filters or search terms."
                  : "Get started by adding your first category."}
                actionLabel={canManage && !q ? "Add Category" : undefined}
                onAction={() => { setEditing(null); setDialogOpen(true); }}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Asset Count</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const Icon = getCategoryIcon(c.icon);
                  return (
                    <TableRow
                      key={c.id}
                      tabIndex={0}
                      className={CLICKABLE_TABLE_ROW_CLASS}
                      aria-label={`View details for ${c.category_name}`}
                      onClick={(event) => handleClickableRowClick(event, () => setViewCategory(c))}
                      onKeyDown={(event) => handleClickableRowKeyDown(event, () => setViewCategory(c))}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <button
                            type="button"
                            className="font-medium text-primary hover:underline text-left"
                            onClick={() => setViewCategory(c)}
                          >
                            {c.category_name}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[280px] truncate" title={c.description ?? undefined}>
                        {c.description ?? "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={c.asset_count > 0 ? "default" : "secondary"}>
                          {c.asset_count}
                        </Badge>
                      </TableCell>
                      <TableCell><CategoryStatusBadge status={c.status ?? "active"} /></TableCell>
                      <TableCell data-stop-row-click>
                        <CategoryActionsMenu
                          category={c}
                          canManage={canManage}
                          onViewDetails={() => setViewCategory(c)}
                          onEdit={() => { setEditing(c); setDialogOpen(true); }}
                          onDelete={() => { setDeleteCategory(c); setDeleteOpen(true); }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {canManage && (
        <CategoryDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
          editing={editing}
          onSaved={triggerRefresh}
        />
      )}

      <DeleteCategoryDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeleteCategory(null);
        }}
        category={deleteCategory}
        onDeleted={() => {
          if (viewCategory && deleteCategory && viewCategory.id === deleteCategory.id) {
            setViewCategory(null);
          }
          triggerRefresh();
        }}
      />

      <Sheet open={!!viewCategory} onOpenChange={(open) => !open && setViewCategory(null)}>
        <SheetContent className="sm:max-w-[520px] overflow-y-auto w-full">
          {viewCategory && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-2xl flex items-center gap-2">
                  {(() => {
                    const Icon = getCategoryIcon(viewCategory.icon);
                    return <Icon className="h-6 w-6 text-muted-foreground" />;
                  })()}
                  {viewCategory.category_name}
                </SheetTitle>
                <SheetDescription className="mt-2">
                  <CategoryStatusBadge status={viewCategory.status ?? "active"} />
                </SheetDescription>
              </SheetHeader>

              <div className="grid grid-cols-1 gap-4">
                <DetailItem label="Category Name" value={viewCategory.category_name} />
                <DetailItem label="Description" value={viewCategory.description} />
                <DetailItem label="Asset Count" value={viewCategory.asset_count} />
                <DetailItem label="Status" value={<CategoryStatusBadge status={viewCategory.status ?? "active"} />} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CategoryStatusBadge({ status }: { status: string }) {
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

function DetailItem({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="font-medium">{value || "—"}</div>
    </div>
  );
}

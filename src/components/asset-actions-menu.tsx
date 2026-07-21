import {
  Eye, Pencil, History, Wrench, RefreshCw, MoreHorizontal, ArrowLeftRight, Archive, Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AssetRow } from "@/lib/mock-db";

export type AssetDetailsTab = "general" | "images" | "history";

export function AssetActionsMenu({
  asset,
  canManage,
  onViewDetails,
  onViewHistory,
  onEdit,
  onAssign,
  onUnassign,
  onRepairHistory,
  onDispose,
  onDeactivate,
}: {
  asset: AssetRow;
  canManage: boolean;
  onViewDetails: () => void;
  onViewHistory: () => void;
  onEdit: () => void;
  onAssign: () => void;
  onUnassign: () => void;
  onRepairHistory: () => void;
  onDispose: () => void;
  onDeactivate: () => void;
}) {
  const isAssigned = !!asset.assigned_employee_id;
  const canDispose = !isAssigned && asset.status !== "disposed";
  const canDeactivate = asset.status !== "disposed" && asset.status !== "inactive";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={onViewDetails}>
          <Eye className="h-4 w-4 mr-2" /> View Details
        </DropdownMenuItem>
        {canManage && (
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" /> Edit Asset
          </DropdownMenuItem>
        )}
        {canManage && !isAssigned && asset.status !== "inactive" && asset.status !== "disposed" && (
          <DropdownMenuItem onClick={onAssign}>
            <ArrowLeftRight className="h-4 w-4 mr-2" /> Assign Asset
          </DropdownMenuItem>
        )}
        {canManage && isAssigned && (
          <DropdownMenuItem onClick={onUnassign}>
            <RefreshCw className="h-4 w-4 mr-2" /> Unassign Asset
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onRepairHistory}>
          <Wrench className="h-4 w-4 mr-2" /> Repair History
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onViewHistory}>
          <History className="h-4 w-4 mr-2" /> Assignment History
        </DropdownMenuItem>

        {canManage && (canDispose || canDeactivate) ? <DropdownMenuSeparator /> : null}

        {canManage && canDispose && (
          <DropdownMenuItem
            onClick={onDispose}
            className="text-destructive focus:text-destructive"
          >
            <Archive className="h-4 w-4 mr-2" /> Dispose Asset
          </DropdownMenuItem>
        )}
        {canManage && canDeactivate && (
          <DropdownMenuItem onClick={onDeactivate} className="text-warning-foreground focus:text-warning-foreground">
            <Ban className="h-4 w-4 mr-2" /> Deactivate Asset
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

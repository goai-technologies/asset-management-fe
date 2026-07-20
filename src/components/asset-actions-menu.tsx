import {
  Eye, Pencil, History, Wrench, RefreshCw, Trash2, MoreHorizontal, ArrowLeftRight,
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
  onDelete,
  onRepairHistory,
}: {
  asset: AssetRow;
  canManage: boolean;
  onViewDetails: () => void;
  onViewHistory: () => void;
  onEdit: () => void;
  onAssign: () => void;
  onUnassign: () => void;
  onDelete: () => void;
  onRepairHistory: () => void;
}) {
  const isAssigned = !!asset.assigned_employee_id;

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
        {canManage && !isAssigned && (
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

        {canManage ? <DropdownMenuSeparator /> : null}

        {canManage && (
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" /> Delete Asset
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import {
  Eye, Pencil, History, Wrench, RefreshCw, Trash2, MoreHorizontal,
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
  isAdmin,
  onViewDetails,
  onViewHistory,
  onEdit,
  onUnassign,
  onDelete,
  onRepairHistory,
}: {
  asset: AssetRow;
  isAdmin: boolean;
  onViewDetails: () => void;
  onViewHistory: () => void;
  onEdit: () => void;
  onUnassign: () => void;
  onDelete: () => void;
  onRepairHistory: () => void;
}) {
  const hasOwner = !!asset.assigned_employee_id;

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
        {isAdmin && (
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" /> Edit Asset
          </DropdownMenuItem>
        )}
        {isAdmin && hasOwner && (
          <DropdownMenuItem onClick={onUnassign}>
            <RefreshCw className="h-4 w-4 mr-2" /> Unassign Asset
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onViewHistory}>
          <History className="h-4 w-4 mr-2" /> Assignment History
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onRepairHistory}>
          <Wrench className="h-4 w-4 mr-2" /> Repair History
        </DropdownMenuItem>

        {isAdmin ? <DropdownMenuSeparator /> : null}

        {isAdmin && (
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" /> Delete Asset
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import { Eye, Pencil, Trash2, MoreHorizontal, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { EmployeeRow } from "@/lib/types/asset-management";

export type EmployeeDetailsTab = "general" | "assets" | "history" | "repairs";

export function EmployeeActionsMenu({
  employee,
  canManage,
  onViewDetails,
  onViewAssignedAssets,
  onEdit,
  onDelete,
}: {
  employee: EmployeeRow;
  canManage: boolean;
  onViewDetails: () => void;
  onViewAssignedAssets: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
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
        <DropdownMenuItem onClick={onViewAssignedAssets}>
          <Boxes className="h-4 w-4 mr-2" /> View Assigned Assets
        </DropdownMenuItem>
        {canManage && (
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" /> Edit Employee
          </DropdownMenuItem>
        )}
        {canManage ? <DropdownMenuSeparator /> : null}
        {canManage && (
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" /> Delete Employee
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

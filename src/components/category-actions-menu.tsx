import { Eye, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CategoryRow } from "@/lib/types/asset-management";

export function CategoryActionsMenu({
  category,
  canManage,
  onViewDetails,
  onEdit,
  onDelete,
}: {
  category: CategoryRow;
  canManage: boolean;
  onViewDetails: () => void;
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
          <Eye className="h-4 w-4 mr-2" /> View
        </DropdownMenuItem>
        {canManage && (
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" /> Edit
          </DropdownMenuItem>
        )}
        {canManage ? <DropdownMenuSeparator /> : null}
        {canManage && (
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

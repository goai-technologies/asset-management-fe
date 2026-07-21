import type { KeyboardEvent, MouseEvent } from "react";

const INTERACTIVE_SELECTOR =
  'button, a, input, textarea, select, label, [role="checkbox"], [role="menuitem"], [role="combobox"], [data-stop-row-click]';

export const CLICKABLE_TABLE_ROW_CLASS =
  "cursor-pointer transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset";

export function isRowInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !!target.closest(INTERACTIVE_SELECTOR);
}

export function handleClickableRowClick(event: MouseEvent, onActivate: () => void) {
  if (isRowInteractiveTarget(event.target)) return;
  onActivate();
}

export function handleClickableRowKeyDown(event: KeyboardEvent, onActivate: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onActivate();
  }
}

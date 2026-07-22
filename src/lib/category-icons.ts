import {
  Box,
  Keyboard,
  Laptop,
  Monitor,
  Printer,
  Server,
  Smartphone,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICON_OPTIONS = [
  { value: "laptop", label: "Laptop", Icon: Laptop },
  { value: "monitor", label: "Monitor", Icon: Monitor },
  { value: "smartphone", label: "Phone", Icon: Smartphone },
  { value: "keyboard", label: "Peripheral", Icon: Keyboard },
  { value: "printer", label: "Printer", Icon: Printer },
  { value: "server", label: "Server", Icon: Server },
  { value: "box", label: "General", Icon: Box },
  { value: "wrench", label: "Equipment", Icon: Wrench },
] as const;

const ICON_MAP = Object.fromEntries(
  CATEGORY_ICON_OPTIONS.map((option) => [option.value, option.Icon]),
) as Record<string, LucideIcon>;

export function getCategoryIcon(icon?: string | null): LucideIcon {
  if (icon && ICON_MAP[icon]) return ICON_MAP[icon];
  return Box;
}

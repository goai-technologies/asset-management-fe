import { useEffect } from "react";
import {
  Bell,
  Boxes,
  UserPlus,
  Wrench,
  ShieldAlert,
  User,
  Settings,
  UserMinus,
  Trash2,
  X,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";
import { checkWarrantyNotifications } from "@/lib/notifications";
import { MockDB } from "@/lib/mock-db";
import type { Notification, NotificationCategory } from "@/lib/notifications";

const CATEGORY_STYLES: Record<
  NotificationCategory,
  { icon: typeof Boxes; iconClass: string; dotClass: string }
> = {
  asset: { icon: Boxes, iconClass: "bg-primary/10 text-primary", dotClass: "bg-primary" },
  assignment: { icon: UserPlus, iconClass: "bg-success/10 text-success", dotClass: "bg-success" },
  repair: { icon: Wrench, iconClass: "bg-warning/15 text-warning-foreground", dotClass: "bg-warning" },
  warranty: { icon: ShieldAlert, iconClass: "bg-destructive/10 text-destructive", dotClass: "bg-destructive" },
  employee: { icon: User, iconClass: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300", dotClass: "bg-violet-500" },
  system: { icon: Settings, iconClass: "bg-muted text-muted-foreground", dotClass: "bg-muted-foreground" },
};

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function NotificationIcon({ notification }: { notification: Notification }) {
  const style = CATEGORY_STYLES[notification.type];
  const Icon =
    notification.title === "Asset Unassigned" || notification.title === "Employee Deleted"
      ? UserMinus
      : style.icon;

  return (
    <div className={cn("h-9 w-9 shrink-0 rounded-full grid place-items-center", style.iconClass)}>
      <Icon className="h-4 w-4" />
    </div>
  );
}

function NotificationItem({
  notification,
  onRead,
  onDelete,
}: {
  notification: Notification;
  onRead: () => void;
  onDelete: () => void;
}) {
  const style = CATEGORY_STYLES[notification.type];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !notification.isRead && onRead()}
      onKeyDown={(e) => { if (e.key === "Enter" && !notification.isRead) onRead(); }}
      className={cn(
        "group flex gap-3 px-4 py-3 border-b last:border-b-0 transition-colors cursor-default",
        !notification.isRead && "bg-primary/5 hover:bg-primary/10",
        notification.isRead && "hover:bg-muted/50",
      )}
    >
      <NotificationIcon notification={notification} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug">{notification.title}</p>
          <div className="flex items-center gap-1.5 shrink-0">
            {!notification.isRead && <span className={cn("h-2 w-2 rounded-full shrink-0", style.dotClass)} title="Unread" />}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              aria-label="Delete notification"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
        <p className="text-[11px] text-muted-foreground/80 mt-1">{timeAgo(notification.createdAt)}</p>
      </div>
    </div>
  );
}

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications();

  useEffect(() => {
    const assets = MockDB.getAssets().map((a) => ({
      id: a.id,
      asset_name: a.asset_name,
      warranty_expiry: a.warranty_expiry,
    }));
    checkWarrantyNotifications(assets);
  }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold grid place-items-center leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[350px] p-0 shadow-lg border animate-in slide-in-from-top-2 fade-in-0 duration-200">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <div className="flex items-center gap-1">
            {notifications.length > 0 && (
              <>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={markAllAsRead}>
                    Mark All as Read
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={clearAll} title="Clear all notifications" aria-label="Clear all notifications">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="h-12 w-12 rounded-full bg-muted grid place-items-center mb-3">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-sm">No Notifications Yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">You&apos;ll see important asset updates here.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[min(420px,70vh)]">
            <div>
              {notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onRead={() => markAsRead(n.id)} onDelete={() => deleteNotification(n.id)} />
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}

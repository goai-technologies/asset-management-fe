import { useEffect, useState, useCallback } from "react";
import { NotificationStore, NOTIFICATIONS_CHANGED } from "@/lib/notifications";
import type { Notification } from "@/lib/notifications";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(() => NotificationStore.getAll());
  const [unreadCount, setUnreadCount] = useState(() => NotificationStore.getUnreadCount());

  const refresh = useCallback(() => {
    setNotifications(NotificationStore.getAll());
    setUnreadCount(NotificationStore.getUnreadCount());
  }, []);

  useEffect(() => {
    const onChange = () => refresh();
    window.addEventListener(NOTIFICATIONS_CHANGED, onChange);
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED, onChange);
  }, [refresh]);

  return {
    notifications,
    unreadCount,
    markAsRead: (id: string) => NotificationStore.markAsRead(id),
    markAllAsRead: () => NotificationStore.markAllAsRead(),
    deleteNotification: (id: string) => NotificationStore.delete(id),
    clearAll: () => NotificationStore.clearAll(),
    refresh,
  };
}

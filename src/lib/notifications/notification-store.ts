import type { CreateNotificationInput, Notification } from "./types";

const STORAGE_KEY = "eams_notifications";
export const NOTIFICATIONS_CHANGED = "eams:notifications-changed";

function genId() {
  return `n_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function readAll(): Notification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Notification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(notifications: Notification[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGED));
}

/** API-ready store — swap persistence for fetch/WebSocket later without UI changes. */
export const NotificationStore = {
  getAll(): Notification[] {
    return readAll().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  getUnreadCount(): number {
    return readAll().filter((n) => !n.isRead).length;
  },

  add(input: CreateNotificationInput): Notification {
    const notification: Notification = {
      id: input.id ?? genId(),
      type: input.type,
      title: input.title,
      message: input.message,
      createdAt: input.createdAt ?? new Date().toISOString(),
      isRead: input.isRead ?? false,
      relatedAssetId: input.relatedAssetId ?? null,
      relatedEmployeeId: input.relatedEmployeeId ?? null,
    };
    const next = [notification, ...readAll()].slice(0, 200);
    writeAll(next);
    return notification;
  },

  markAsRead(id: string) {
    const next = readAll().map((n) => (n.id === id ? { ...n, isRead: true } : n));
    writeAll(next);
  },

  markAllAsRead() {
    const next = readAll().map((n) => ({ ...n, isRead: true }));
    writeAll(next);
  },

  delete(id: string) {
    writeAll(readAll().filter((n) => n.id !== id));
  },

  clearAll() {
    writeAll([]);
  },

  hasRecent(
    type: Notification["type"],
    title: string,
    relatedAssetId?: string | null,
    withinMs = 24 * 60 * 60 * 1000,
  ): boolean {
    const cutoff = Date.now() - withinMs;
    return readAll().some(
      (n) =>
        n.type === type &&
        n.title === title &&
        (relatedAssetId == null || n.relatedAssetId === relatedAssetId) &&
        new Date(n.createdAt).getTime() >= cutoff,
    );
  },
};

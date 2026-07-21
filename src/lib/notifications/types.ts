export type NotificationCategory =
  | "asset"
  | "assignment"
  | "repair"
  | "warranty"
  | "employee"
  | "system";

export type Notification = {
  id: string;
  type: NotificationCategory;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  relatedAssetId?: string | null;
  relatedEmployeeId?: string | null;
};

export type CreateNotificationInput = Omit<Notification, "id" | "createdAt" | "isRead"> & {
  id?: string;
  createdAt?: string;
  isRead?: boolean;
};

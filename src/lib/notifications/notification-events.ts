import { NotificationStore } from "./notification-store";

export const NotificationEvents = {
  assetAdded(asset: { id: string; asset_name: string }) {
    NotificationStore.add({
      type: "asset",
      title: "Asset Added",
      message: `${asset.asset_name} was added to the inventory.`,
      relatedAssetId: asset.id,
    });
  },

  assetUpdated(asset: { id: string; asset_name: string }) {
    NotificationStore.add({
      type: "asset",
      title: "Asset Updated",
      message: `${asset.asset_name} details were updated.`,
      relatedAssetId: asset.id,
    });
  },

  assetDeleted(asset: { id: string; asset_name: string }) {
    NotificationStore.add({
      type: "asset",
      title: "Asset Deleted",
      message: `${asset.asset_name} was removed from the inventory.`,
      relatedAssetId: asset.id,
    });
  },

  assetAssigned(asset: { id: string; asset_name: string }, employee: { id: string; name: string }) {
    NotificationStore.add({
      type: "assignment",
      title: "Asset Assigned",
      message: `${asset.asset_name} assigned to ${employee.name}.`,
      relatedAssetId: asset.id,
      relatedEmployeeId: employee.id,
    });
  },

  assetUnassigned(asset: { id: string; asset_name: string }, employee: { id: string; name: string }) {
    NotificationStore.add({
      type: "assignment",
      title: "Asset Unassigned",
      message: `${asset.asset_name} unassigned from ${employee.name}.`,
      relatedAssetId: asset.id,
      relatedEmployeeId: employee.id,
    });
  },

  assetSentForRepair(asset: { id: string; asset_name: string }) {
    NotificationStore.add({
      type: "repair",
      title: "Asset Sent for Repair",
      message: `${asset.asset_name} is now under repair.`,
      relatedAssetId: asset.id,
    });
  },

  repairCompleted(asset: { id: string; asset_name: string }) {
    NotificationStore.add({
      type: "repair",
      title: "Repair Completed",
      message: `Repair completed for ${asset.asset_name}. Asset is available.`,
      relatedAssetId: asset.id,
    });
  },

  warrantyExpiringSoon(asset: { id: string; asset_name: string; days: number }) {
    if (NotificationStore.hasRecent("warranty", "Warranty Expiring Soon", asset.id)) return;
    NotificationStore.add({
      type: "warranty",
      title: "Warranty Expiring Soon",
      message: `${asset.asset_name} warranty expires in ${asset.days} days.`,
      relatedAssetId: asset.id,
    });
  },

  warrantyExpired(asset: { id: string; asset_name: string }) {
    if (NotificationStore.hasRecent("warranty", "Warranty Expired", asset.id)) return;
    NotificationStore.add({
      type: "warranty",
      title: "Warranty Expired",
      message: `Warranty has expired for ${asset.asset_name}.`,
      relatedAssetId: asset.id,
    });
  },

  employeeAdded(employee: { id: string; name: string }) {
    NotificationStore.add({
      type: "employee",
      title: "Employee Added",
      message: `${employee.name} was added to the directory.`,
      relatedEmployeeId: employee.id,
    });
  },

  employeeDeleted(employee: { id: string; name: string }) {
    NotificationStore.add({
      type: "employee",
      title: "Employee Deleted",
      message: `${employee.name} was removed from the directory.`,
      relatedEmployeeId: employee.id,
    });
  },

  loginSuccessful(email?: string) {
    NotificationStore.add({
      type: "system",
      title: "Login Successful",
      message: email ? `Signed in as ${email}.` : "You have signed in successfully.",
    });
  },
};

export function checkWarrantyNotifications(
  assets: Array<{ id: string; asset_name: string; warranty_expiry: string | null }>,
) {
  const now = Date.now();
  for (const asset of assets) {
    if (!asset.warranty_expiry) continue;
    const days = Math.floor((new Date(asset.warranty_expiry).getTime() - now) / 86400000);
    if (days < 0) {
      NotificationEvents.warrantyExpired(asset);
    } else if (days <= 90) {
      NotificationEvents.warrantyExpiringSoon({ ...asset, days });
    }
  }
}

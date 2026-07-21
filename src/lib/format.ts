export const currency = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n));

export const currencyINR = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(n));

export const shortDate = (d: string | null | undefined) =>
  !d ? "—" : new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

export const dateTime = (d: string | null | undefined) =>
  !d ? "—" : new Date(d).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });

export const statusLabel = (s: string) => {
  if (s === "repair") return "Under Repair";
  if (s === "inactive") return "Inactive";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export function warrantyState(expiry: string | null | undefined): "expired" | "expiring" | "active" | "none" {
  if (!expiry) return "none";
  const now = new Date();
  const exp = new Date(expiry);
  const days = (exp.getTime() - now.getTime()) / 86400000;
  if (days < 0) return "expired";
  if (days < 60) return "expiring";
  return "active";
}

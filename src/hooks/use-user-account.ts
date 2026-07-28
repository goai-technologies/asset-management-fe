import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuthUser } from "@/lib/api/auth-types";
import {
  useEmployeeAssignedAssets,
  useEmployeeAssignments,
  useEmployees,
} from "@/hooks/use-asset-management";
import type { Employee } from "@/lib/types/asset-management";
import {
  UserAccountStore,
  USER_ACCOUNT_CHANGED,
  type StoredUserProfile,
  type UserPreferences,
} from "@/lib/user-account-store";

export type ResolvedUserProfile = {
  fullName: string;
  email: string;
  role: string;
  phone: string;
  location: string;
  profilePicture: string | null;
  employeeId: string | null;
  department: string | null;
};

function findEmployeeByEmail(employees: Employee[], email?: string | null) {
  if (!email) return null;
  const needle = email.trim().toLowerCase();
  return employees.find((e) => e.email.trim().toLowerCase() === needle) ?? null;
}

function buildDefaults(
  user: AuthUser | null,
  roleLabel: string,
  employee: Employee | null,
): ResolvedUserProfile {
  const email = user?.email ?? "";
  const metaName = typeof user?.user_metadata?.name === "string" ? user.user_metadata.name : "";
  const stored = user?.id ? UserAccountStore.getProfile(user.id) : null;

  return {
    fullName: stored?.fullName || metaName || employee?.name || email.split("@")[0] || "User",
    email,
    role: roleLabel,
    phone: stored?.phone || employee?.phone || "",
    location: stored?.location || employee?.location || "",
    profilePicture: stored?.profilePicture ?? null,
    employeeId: employee?.employee_code ?? null,
    department: employee?.department ?? null,
  };
}

export function useUserProfile(user: AuthUser | null, roleLabel: string) {
  const [version, setVersion] = useState(0);
  const { data: employees = [] } = useEmployees();
  const employee = useMemo(
    () => findEmployeeByEmail(employees, user?.email),
    [employees, user?.email],
  );

  useEffect(() => {
    const onChange = () => setVersion((v) => v + 1);
    window.addEventListener(USER_ACCOUNT_CHANGED, onChange);
    return () => window.removeEventListener(USER_ACCOUNT_CHANGED, onChange);
  }, []);

  const profile = useMemo(
    () => buildDefaults(user, roleLabel, employee),
    [user, roleLabel, employee, version],
  );

  const saveProfile = useCallback(
    (updates: Pick<StoredUserProfile, "fullName" | "phone" | "location" | "profilePicture">) => {
      if (!user?.id) return;
      UserAccountStore.saveProfile(user.id, {
        fullName: updates.fullName.trim() || profile.fullName,
        phone: updates.phone.trim(),
        location: updates.location.trim(),
        profilePicture: updates.profilePicture,
      });
    },
    [user?.id, profile.fullName],
  );

  return { profile, saveProfile };
}

export function useUserPreferences(userId: string | null | undefined) {
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    userId ? UserAccountStore.getPreferences(userId) : UserAccountStore.getPreferences(""),
  );

  useEffect(() => {
    if (!userId) return;
    setPreferences(UserAccountStore.getPreferences(userId));
    const onChange = () => setPreferences(UserAccountStore.getPreferences(userId));
    window.addEventListener(USER_ACCOUNT_CHANGED, onChange);
    return () => window.removeEventListener(USER_ACCOUNT_CHANGED, onChange);
  }, [userId]);

  const savePreferences = useCallback(
    (next: UserPreferences) => {
      if (!userId) return;
      UserAccountStore.savePreferences(userId, next);
      setPreferences(next);
    },
    [userId],
  );

  return { preferences, savePreferences };
}

export function useMyAssignedAssets(email?: string | null) {
  const { data: employees = [] } = useEmployees();
  const employee = useMemo(
    () => findEmployeeByEmail(employees, email),
    [employees, email],
  );
  const { data: assets = [] } = useEmployeeAssignedAssets(employee?.id);
  const { data: assignments = [] } = useEmployeeAssignments(employee?.id);

  return { employee, assets, assignments };
}
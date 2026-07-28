import { apiGet, apiPost, apiPut } from "./axios";
import type { AppRole, AuthSession } from "./auth-types";
import { getStoredToken, setStoredSession } from "./client";

const AUTH_CHANGED = "eams:auth-changed";

type LoginResult = {
  accessToken: string;
  user: { id: string; email: string; name: string; roles: string[] };
};

type Profile = LoginResult["user"];

function toAppRole(role: string): AppRole | null {
  const normalized = role.trim().toLowerCase();
  if (normalized === "administrator" || normalized === "admin") return "administrator";
  if (normalized === "it_team" || normalized === "it team") return "it_team";
  if (normalized === "employee") return "employee";
  return null;
}

function toSession(token: string, profile: Profile): AuthSession {
  return {
    access_token: token,
    user: {
      id: profile.id,
      email: profile.email,
      user_metadata: { name: profile.name },
    },
  };
}

export function notifyAuthChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGED));
  }
}

export function onAuthChanged(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(AUTH_CHANGED, listener);
  return () => window.removeEventListener(AUTH_CHANGED, listener);
}

export async function getSession(): Promise<AuthSession | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const profile = await apiGet<Profile>("/auth/profile");
    const session = toSession(token, profile);
    setStoredSession(session);
    return session;
  } catch {
    setStoredSession(null);
    return null;
  }
}

export async function signIn(email: string, password: string): Promise<{ error?: string }> {
  try {
    const result = await apiPost<LoginResult>("/auth/login", { email, password });
    const session = toSession(result.accessToken, result.user);
    setStoredSession(session);
    notifyAuthChanged();
    return {};
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Sign in failed" };
  }
}

export async function signUp(
  email: string,
  password: string,
  name: string,
): Promise<{ error?: string }> {
  try {
    const result = await apiPost<LoginResult>("/auth/register", { email, password, name });
    const session = toSession(result.accessToken, result.user);
    setStoredSession(session);
    notifyAuthChanged();
    return {};
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Sign up failed" };
  }
}

export async function signOut(): Promise<void> {
  try {
    await apiPost("/auth/logout");
  } catch {
    // Clear local session even if logout request fails.
  }
  setStoredSession(null);
  notifyAuthChanged();
}

export async function updatePassword(password: string): Promise<{ error?: string }> {
  try {
    await apiPut("/auth/change-password", { password });
    return {};
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Password update failed" };
  }
}

export async function requestPasswordReset(
  email: string,
): Promise<{ error?: string; devToken?: string }> {
  try {
    const result = await apiPost<{ devToken?: string }>("/auth/forgot-password", { email });
    return { devToken: result.devToken };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Password reset request failed" };
  }
}

export async function resetPassword(
  email: string,
  token: string,
  password: string,
): Promise<{ error?: string }> {
  try {
    await apiPost("/auth/reset-password", { email, token, password });
    return {};
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Password reset failed" };
  }
}

export async function getRoles(_userId: string): Promise<AppRole[]> {
  const token = getStoredToken();
  if (!token) return [];

  try {
    const profile = await apiGet<Profile>("/auth/profile");
    const roles = profile.roles
      .map(toAppRole)
      .filter((role): role is AppRole => role !== null);
    return roles;
  } catch {
    return [];
  }
}

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
};

export async function getAdminUsers(): Promise<AdminUser[]> {
  const session = await getSession();
  if (!session) return [];

  const roles = await getRoles(session.user.id);
  const role = roles[0] ?? "employee";
  return [
    {
      id: session.user.id,
      name: session.user.user_metadata?.name ?? session.user.email,
      email: session.user.email,
      role,
    },
  ];
}

export async function setUserRole(_userId: string, _role: AppRole): Promise<{ error?: string }> {
  return { error: "User role management is not available via the REST API yet." };
}

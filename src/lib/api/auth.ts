import { getStoredToken, setStoredSession } from "./client";
import type { AppRole, AuthSession } from "./auth-types";
import {
  getAdminUsersFn,
  getRolesFn,
  getSessionFn,
  loginFn,
  requestPasswordResetFn,
  resetPasswordFn,
  setUserRoleFn,
  signupFn,
  updatePasswordFn,
} from "@/functions/auth";

const AUTH_CHANGED = "eams:auth-changed";

function authOpts() {
  const token = getStoredToken();
  return token
    ? { headers: { Authorization: `Bearer ${token}` } as HeadersInit }
    : {};
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

  const result = await getSessionFn({
    ...authOpts(),
  });

  if (!result.session) {
    setStoredSession(null);
    return null;
  }

  setStoredSession(result.session);
  return result.session;
}

export async function signIn(email: string, password: string): Promise<{ error?: string }> {
  const result = await loginFn({ data: { email, password } });
  if ("error" in result && result.error) return { error: result.error };
  if (!result.session) return { error: "Sign in failed" };

  setStoredSession(result.session);
  notifyAuthChanged();
  return {};
}

export async function signUp(
  email: string,
  password: string,
  name: string,
): Promise<{ error?: string }> {
  const result = await signupFn({ data: { email, password, name } });
  if ("error" in result && result.error) return { error: result.error };
  if (!result.session) return { error: "Sign up failed" };

  setStoredSession(result.session);
  notifyAuthChanged();
  return {};
}

export async function signOut(): Promise<void> {
  setStoredSession(null);
  notifyAuthChanged();
}

export async function updatePassword(password: string): Promise<{ error?: string }> {
  const token = getStoredToken();
  const result = await updatePasswordFn({
    data: { password, token: token ?? undefined },
    ...authOpts(),
  });
  if ("error" in result && result.error) return { error: result.error };
  return {};
}

export async function requestPasswordReset(
  email: string,
): Promise<{ error?: string; devToken?: string }> {
  const result = await requestPasswordResetFn({ data: { email } });
  if ("error" in result && result.error) return { error: result.error };
  return { devToken: result.devToken };
}

export async function resetPassword(
  email: string,
  token: string,
  password: string,
): Promise<{ error?: string }> {
  const result = await resetPasswordFn({ data: { email, token, password } });
  if ("error" in result && result.error) return { error: result.error };
  return {};
}

export async function getRoles(_userId: string): Promise<AppRole[]> {
  const token = getStoredToken();
  const result = await getRolesFn({
    data: { token: token ?? undefined },
    ...authOpts(),
  });
  return result.roles ?? [];
}

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
};

export async function getAdminUsers(): Promise<AdminUser[]> {
  const token = getStoredToken();
  const result = await getAdminUsersFn({
    data: { token: token ?? undefined },
    ...authOpts(),
  });
  if ("error" in result && result.error) return [];
  return result.users ?? [];
}

export async function setUserRole(userId: string, role: AppRole): Promise<{ error?: string }> {
  const token = getStoredToken();
  const result = await setUserRoleFn({
    data: { userId, role, token: token ?? undefined },
    ...authOpts(),
  });
  if ("error" in result && result.error) return { error: result.error };
  return {};
}

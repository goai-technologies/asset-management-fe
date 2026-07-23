import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { query } from "@/db-server/db";
import {
  buildSession,
  getUserById,
  getUserRoles,
  hashPassword,
  requireAdminFromToken,
  requireAuthFromToken,
  verifyPassword,
  verifyToken,
  type AuthSession,
} from "@/db-server/auth";
import type { AppRole } from "@/lib/api/auth-types";

function authHeaders(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getBearerFromRequest(): string | null {
  const auth = getRequestHeader("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

export const loginFn = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    const { rows } = await query<{
      id: string;
      email: string;
      encrypted_password: string | null;
    }>("SELECT id, email, encrypted_password FROM auth.users WHERE lower(email) = lower($1)", [
      data.email.trim(),
    ]);

    const user = rows[0];
    if (!user?.encrypted_password) {
      return { error: "Invalid email or password" as const };
    }

    const valid = await verifyPassword(data.password, user.encrypted_password);
    if (!valid) {
      return { error: "Invalid email or password" as const };
    }

    const session = await buildSession(user.id, user.email);
    return { session };
  });

export const signupFn = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; password: string; name: string }) => data)
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    const name = data.name.trim() || email.split("@")[0];
    const passwordHash = await hashPassword(data.password);

    const existing = await query("SELECT id FROM auth.users WHERE lower(email) = $1", [email]);
    if (existing.rows.length > 0) {
      return { error: "An account with this email already exists" as const };
    }

    const id = crypto.randomUUID();
    await query(
      `INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data)
       VALUES ($1, $2, $3, $4::jsonb)`,
      [id, email, passwordHash, JSON.stringify({ name })],
    );

    const session = await buildSession(id, email);
    return { session };
  });

export const getSessionFn = createServerFn({ method: "GET" }).handler(async () => {
  const token = getBearerFromRequest();
  if (!token) return { session: null as AuthSession | null };

  try {
    const { userId, email } = await verifyToken(token);
    const user = await getUserById(userId);
    if (!user) return { session: null };
    return { session: { access_token: token, user: { ...user, email } } };
  } catch {
    return { session: null };
  }
});

export const updatePasswordFn = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string; token?: string }) => data)
  .handler(async ({ data }) => {
    const token = data.token ?? getBearerFromRequest();
    if (!token) return { error: "Unauthorized" as const };

    const auth = await requireAuthFromToken(token);
    if (data.password.length < 6) {
      return { error: "Password must be at least 6 characters" as const };
    }

    const passwordHash = await hashPassword(data.password);
    await query("UPDATE auth.users SET encrypted_password = $1 WHERE id = $2", [
      passwordHash,
      auth.userId,
    ]);
    return { ok: true as const };
  });

export const requestPasswordResetFn = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    const token = generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await query(
      `INSERT INTO auth.password_reset_tokens (email, token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET token = $2, expires_at = $3`,
      [email, token, expiresAt],
    );

    if (process.env.NODE_ENV !== "production") {
      console.log(`[Auth] Password reset code for ${email}: ${token}`);
    }

    return {
      ok: true as const,
      devToken: process.env.NODE_ENV !== "production" ? token : undefined,
    };
  });

export const resetPasswordFn = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; token: string; password: string }) => data)
  .handler(async ({ data }) => {
    if (data.password.length < 6) {
      return { error: "Password must be at least 6 characters" as const };
    }

    const email = data.email.trim().toLowerCase();
    const { rows } = await query<{ token: string; expires_at: string }>(
      "SELECT token, expires_at FROM auth.password_reset_tokens WHERE email = $1",
      [email],
    );

    const reset = rows[0];
    if (!reset || reset.token !== data.token) {
      return { error: "Invalid verification code" as const };
    }
    if (new Date(reset.expires_at) < new Date()) {
      return { error: "Verification code has expired" as const };
    }

    const passwordHash = await hashPassword(data.password);
    await query("UPDATE auth.users SET encrypted_password = $1 WHERE lower(email) = $2", [
      passwordHash,
      email,
    ]);
    await query("DELETE FROM auth.password_reset_tokens WHERE email = $1", [email]);

    return { ok: true as const };
  });

export const getRolesFn = createServerFn({ method: "GET" })
  .inputValidator((data: { token?: string } | undefined) => data ?? {})
  .handler(async ({ data }) => {
    const token = data?.token ?? getBearerFromRequest();
    if (!token) return { roles: [] as AppRole[] };
    const auth = await requireAuthFromToken(token);
    const roles = await getUserRoles(auth.userId);
    return { roles: roles as AppRole[] };
  });

export const getAdminUsersFn = createServerFn({ method: "GET" })
  .inputValidator((data: { token?: string } | undefined) => data ?? {})
  .handler(async ({ data }) => {
    const token = data?.token ?? getBearerFromRequest();
    if (!token) return { error: "Unauthorized" as const };
    await requireAdminFromToken(token);

    const [profiles, roles] = await Promise.all([
      query<{ id: string; name: string; email: string }>(
        "SELECT id, name, email FROM public.profiles ORDER BY name",
      ),
      query<{ user_id: string; role: string }>(
        "SELECT user_id, role::text FROM public.user_roles",
      ),
    ]);

    const roleByUser = new Map(roles.rows.map((r) => [r.user_id, r.role]));
    const users = profiles.rows.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      role: (roleByUser.get(p.id) ?? "employee") as AppRole,
    }));

    return { users };
  });

export const setUserRoleFn = createServerFn({ method: "POST" })
  .inputValidator((data: { userId: string; role: AppRole; token?: string }) => data)
  .handler(async ({ data }) => {
    const token = data.token ?? getBearerFromRequest();
    if (!token) return { error: "Unauthorized" as const };
    await requireAdminFromToken(token);

    await query("DELETE FROM public.user_roles WHERE user_id = $1", [data.userId]);
    await query("INSERT INTO public.user_roles (user_id, role) VALUES ($1, $2::public.app_role)", [
      data.userId,
      data.role,
    ]);

    return { ok: true as const };
  });

export { authHeaders };

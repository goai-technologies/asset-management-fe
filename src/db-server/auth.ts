import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { createError } from "h3";
import { query } from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "goai-dev-jwt-secret-change-in-production",
);

export type AuthUser = {
  id: string;
  email: string;
  user_metadata?: { name?: string };
};

export type AuthSession = {
  access_token: string;
  user: AuthUser;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ sub: userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<{ userId: string; email: string }> {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  const userId = payload.sub;
  const email = payload.email;
  if (typeof userId !== "string" || typeof email !== "string") {
    throw createError({ statusCode: 401, statusMessage: "Invalid token" });
  }
  return { userId, email };
}

export function getBearerTokenFromHeader(authHeader: string | null | undefined): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

export async function requireAuthFromToken(token: string): Promise<{ userId: string; email: string }> {
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
  try {
    return await verifyToken(token);
  } catch {
    throw createError({ statusCode: 401, statusMessage: "Invalid or expired token" });
  }
}

export async function requireAdminFromToken(token: string): Promise<{ userId: string; email: string }> {
  const auth = await requireAuthFromToken(token);
  const roles = await getUserRoles(auth.userId);
  if (!roles.includes("administrator")) {
    throw createError({ statusCode: 403, statusMessage: "Administrator access required" });
  }
  return auth;
}

export async function getUserById(userId: string): Promise<AuthUser | null> {
  const { rows } = await query<{
    id: string;
    email: string;
    raw_user_meta_data: { name?: string } | null;
  }>("SELECT id, email, raw_user_meta_data FROM auth.users WHERE id = $1", [userId]);

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    user_metadata: row.raw_user_meta_data ?? undefined,
  };
}

export async function buildSession(userId: string, email: string): Promise<AuthSession> {
  const user = (await getUserById(userId)) ?? { id: userId, email };
  const access_token = await signToken(userId, email);
  return { access_token, user };
}

export async function getUserRoles(userId: string): Promise<string[]> {
  const { rows } = await query<{ role: string }>(
    "SELECT role::text FROM public.user_roles WHERE user_id = $1",
    [userId],
  );
  return rows.map((r) => r.role);
}


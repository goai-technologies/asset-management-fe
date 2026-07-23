-- Password auth for standalone PostgreSQL (replaces Supabase GoTrue).

ALTER TABLE auth.users
  ADD COLUMN IF NOT EXISTS encrypted_password TEXT;

CREATE TABLE IF NOT EXISTS auth.password_reset_tokens (
  email TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON auth.password_reset_tokens TO goai_app;

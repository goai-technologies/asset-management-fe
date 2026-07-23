-- Minimal auth schema so existing migrations (auth.users FKs, auth.uid(), triggers) work on vanilla PostgreSQL.

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  raw_user_meta_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Used by RLS policies in migrations. Set per session when using direct SQL:
--   SELECT set_config('request.jwt.claim.sub', '<user-uuid>', true);
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID;
$$;

GRANT USAGE ON SCHEMA auth TO authenticated, anon, service_role, goai_app;
GRANT SELECT ON auth.users TO authenticated, service_role, goai_app;

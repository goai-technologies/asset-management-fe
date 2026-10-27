-- Standalone PostgreSQL bootstrap for goAI Asset Management
-- Run before applying postgres/migrations/*.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Supabase-compatible roles (used by GRANT/RLS policies in migrations)
DO $$ BEGIN
  CREATE ROLE authenticated NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE ROLE anon NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE ROLE service_role NOLOGIN BYPASSRLS;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Application DB user (change password in production)
DO $$ BEGIN
  CREATE ROLE goai_app LOGIN PASSWORD 'change_me_in_production';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role, goai_app;
GRANT CREATE ON SCHEMA public TO goai_app;

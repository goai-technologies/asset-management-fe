#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"
IN_DIR="${ROOT_DIR}/postgres/export"

if [[ -f .env.postgres ]]; then
  # shellcheck disable=SC1091
  source .env.postgres
fi

: "${DATABASE_URL:?Set DATABASE_URL in .env.postgres}"

if [[ ! -d "$IN_DIR" ]]; then
  echo "Run scripts/migrate/02-export-from-supabase.sh first"
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql client not found in PATH. Install PostgreSQL client tools."
  exit 1
fi

if ! psql "$DATABASE_URL" -c "SELECT 1" >/dev/null 2>&1; then
  echo "ERROR: Cannot connect to DATABASE_URL. Check .env.postgres and that PostgreSQL is running."
  exit 1
fi

psql_query() {
  psql "$DATABASE_URL" -tAc "$1" | tr -d '[:space:]'
}

schema_already_applied() {
  [[ "$(psql_query "SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role' AND typnamespace = 'public'::regnamespace);")" == "t" ]]
}

table_exists() {
  local table="$1"
  [[ "$(psql_query "SELECT to_regclass('${table}') IS NOT NULL;")" == "t" ]]
}

require_fresh_database() {
  if schema_already_applied; then
    cat <<'EOF'
ERROR: Target database already contains migrated schema (e.g. type "app_role" exists).

This import script expects a fresh PostgreSQL database. Schema dumps are not
idempotent — rerunning after a partial import will fail on duplicate types,
tables, or constraints.

Recreate the database and run the import again:

  docker compose -f docker-compose.postgres.yml down -v
  docker compose -f docker-compose.postgres.yml up -d
  ./scripts/migrate/03-import-to-postgres.sh

Or drop and recreate manually:

  psql "<admin-connection-url>" -c "DROP DATABASE goai_assets WITH (FORCE);"
  psql "<admin-connection-url>" -c "CREATE DATABASE goai_assets;"
EOF
    exit 1
  fi
}

echo "==> Check target database is fresh"
require_fresh_database

echo "==> Bootstrap extensions, roles, and auth compatibility (idempotent)"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f postgres/bootstrap/00_extensions_and_roles.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f postgres/bootstrap/01_auth_compat.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f postgres/bootstrap/02_auth_password.sql

if [[ -f "${IN_DIR}/auth_users_data.sql" ]]; then
  echo "==> Import auth.users (before public schema — FKs reference auth.users)"
  if grep -qE 'VALUES[[:space:]]*\(' "${IN_DIR}/auth_users_data.sql"; then
    auth_user_count="$(psql_query "SELECT COUNT(*) FROM auth.users;")"
    if [[ "${auth_user_count:-0}" == "0" ]]; then
      psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "${IN_DIR}/auth_users_data.sql"
    else
      echo "    auth.users already has rows; skipping auth_users_data.sql"
    fi
  else
    echo "    auth_users_data.sql has no user rows; skipping"
  fi
else
  echo "==> No auth_users_data.sql — skipping auth user import"
fi

echo "==> Apply public schema"
if [[ -f "${IN_DIR}/public_schema.sql" ]]; then
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "${IN_DIR}/public_schema.sql"
else
  echo "No public_schema.sql — applying schema from supabase/migrations instead"
  bash scripts/migrate/01-apply-schema-to-postgres.sh
fi

if [[ -f "${IN_DIR}/public_data.sql" ]]; then
  echo "==> Import public data"
  if table_exists "public.assets"; then
    asset_count="$(psql_query "SELECT COUNT(*) FROM public.assets;")"
    if [[ "${asset_count:-0}" == "0" ]]; then
      psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "${IN_DIR}/public_data.sql"
    else
      echo "    public.assets already has rows; skipping public_data.sql"
      echo "    (recreate the database to perform a full reimport)"
    fi
  else
    echo "WARNING: public.assets not found after schema import; skipping public_data.sql"
  fi
else
  echo "==> No public_data.sql — skipping data import"
fi

echo "Import complete."

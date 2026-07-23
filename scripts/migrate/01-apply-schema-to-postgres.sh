#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

if [[ -f .env.postgres ]]; then
  # shellcheck disable=SC1091
  source .env.postgres
elif [[ -f .env.postgres.example ]]; then
  echo "Copy .env.postgres.example to .env.postgres and set DATABASE_URL"
  exit 1
fi

: "${DATABASE_URL:?Set DATABASE_URL in .env.postgres}"

echo "==> Bootstrap extensions, roles, auth compat"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f postgres/bootstrap/00_extensions_and_roles.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f postgres/bootstrap/01_auth_compat.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f postgres/bootstrap/02_auth_password.sql

echo "==> Apply Supabase migrations (same schema)"
for file in supabase/migrations/*.sql; do
  echo "    -> $file"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file"
done

echo "==> Grant app user access"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO goai_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO goai_app;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
SQL

echo "Schema applied successfully."

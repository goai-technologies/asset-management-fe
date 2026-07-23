#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"
OUT_DIR="${ROOT_DIR}/postgres/export"
mkdir -p "$OUT_DIR"

if [[ -f .env.postgres ]]; then
  # shellcheck disable=SC1091
  source .env.postgres
fi

: "${SUPABASE_DB_PASSWORD:?Set SUPABASE_DB_PASSWORD in .env.postgres}"

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI is required. Install: https://supabase.com/docs/guides/cli"
  exit 1
fi

if [[ ! -f supabase/config.toml ]]; then
  echo "Missing supabase/config.toml — run 'supabase link' from the project root first."
  exit 1
fi

# Uses the linked project from supabase/config.toml (project_id). The CLI routes
# pg_dump through Supabase's pooler, which works when direct IPv6 connections fail.
DUMP_FLAGS=(--linked -p "$SUPABASE_DB_PASSWORD")

echo "==> Export public schema structure (via Supabase CLI)"
supabase db dump "${DUMP_FLAGS[@]}" \
  --schema public \
  -f "${OUT_DIR}/public_schema.sql"

echo "==> Export public data"
supabase db dump "${DUMP_FLAGS[@]}" \
  --data-only \
  --schema public \
  -f "${OUT_DIR}/public_data.sql"

echo "==> Export auth.users (required for profiles / user_roles FKs)"
AUTH_TMP="$(mktemp)"
trap 'rm -f "$AUTH_TMP"' EXIT

if supabase db dump "${DUMP_FLAGS[@]}" \
  --data-only \
  --schema auth \
  -f "$AUTH_TMP" 2>/dev/null; then
  {
    grep -E '^SET session_replication_role' "$AUTH_TMP" || echo "SET session_replication_role = replica;"
    grep '^INSERT INTO "auth"\."users"' "$AUTH_TMP" || true
    echo "RESET ALL;"
  } > "${OUT_DIR}/auth_users_data.sql"

  if grep -q '^INSERT INTO "auth"\."users"' "${OUT_DIR}/auth_users_data.sql"; then
    echo "    auth.users rows exported"
  else
    rm -f "${OUT_DIR}/auth_users_data.sql"
    echo "    (auth.users export skipped — no rows found; migrate users manually)"
  fi
else
  echo "    (auth.users export skipped — export failed; migrate users manually)"
fi

echo "Export complete: ${OUT_DIR}/"

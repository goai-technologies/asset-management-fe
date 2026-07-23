# Supabase → Standalone PostgreSQL Migration

Migrate the goAI Asset Management database from **Supabase Cloud** to your own **PostgreSQL** server with the **same schema**.

## Important context

| Layer | Supabase today | After DB migration |
|--------|----------------|-------------------|
| **Database** | Supabase-hosted PostgreSQL | Your PostgreSQL (RDS, Docker, VM, etc.) |
| **Schema** | `supabase/migrations/*.sql` | Same SQL (re-applied or pg_dump) |
| **Web app API** | Supabase JS client (REST + Auth) | **Still uses Supabase** unless you change auth/API separately |

Supabase **is** PostgreSQL. You are moving **where the data lives**, not automatically changing how the React app connects. The app today uses:

- `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` for login and data API
- Browser cannot connect to PostgreSQL port `5432` directly

**After this migration you must either:**

1. **Self-host Supabase** against your new PostgreSQL (keeps app working with minimal changes), or  
2. **Add a backend API** (Node/PostgREST) + new auth, and update the app later.

This guide covers **database migration only**.

---

## What gets migrated

**Tables:** `categories`, `vendors`, `employees`, `assets`, `assignments`, `repairs`, `profiles`, `user_roles`, `asset_images`, `asset_disposals`, `notifications`, `activity_logs`  

**Views:** `dashboard_summary`, `dashboard_assets_by_category`, etc.  

**Enums, indexes, triggers, RLS** — same as Supabase migrations.

---

## Option A — Fresh schema on new PostgreSQL (no live data yet)

### 1. Start local PostgreSQL (optional)

```bash
docker compose -f docker-compose.postgres.yml up -d
```

Connection: `postgresql://postgres:postgres@localhost:5432/goai_assets`

### 2. Configure environment

```bash
cp .env.postgres.example .env.postgres
# Edit DATABASE_URL and passwords
```

### 3. Apply schema (same as Supabase migrations)

```bash
chmod +x scripts/migrate/*.sh
./scripts/migrate/01-apply-schema-to-postgres.sh
```

This runs:

1. `postgres/bootstrap/00_extensions_and_roles.sql` — extensions + roles  
2. `postgres/bootstrap/01_auth_compat.sql` — minimal `auth.users` for FKs  
3. All files in `supabase/migrations/` in order  

---

## Option B — Migrate existing Supabase data

### 1. Install and link the Supabase CLI

```bash
# Install: https://supabase.com/docs/guides/cli
supabase login
# Repo is already configured with project_id in supabase/config.toml
# If needed: supabase link --project-ref lovkcglrpzqxyasnncsf
```

Get your database password from Supabase Dashboard → **Project Settings** → **Database**.

### 2. Export from Supabase

```bash
cp .env.postgres.example .env.postgres
# Set SUPABASE_DB_PASSWORD and DATABASE_URL (target)

./scripts/migrate/02-export-from-supabase.sh
```

Uses `supabase db dump --linked` (routes through Supabase’s pooler), so it works when direct `pg_dump` to the database host fails (e.g. IPv6-only direct connections).

Creates `postgres/export/public_schema.sql`, `public_data.sql`, and optionally `auth_users_data.sql`.

### 3. Import into target PostgreSQL

```bash
./scripts/migrate/03-import-to-postgres.sh
```

### 4. Verify

```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM assets;"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM employees;"
psql "$DATABASE_URL" -c "\dt public.*"
```

---

## Option C — One-shot export / restore (production)

Prefer the Supabase CLI when direct database host connections are unavailable:

```bash
# Schema + data (public)
supabase db dump --linked -p "$SUPABASE_DB_PASSWORD" --schema public -f public_schema.sql
supabase db dump --linked -p "$SUPABASE_DB_PASSWORD" --data-only --schema public -f public_data.sql

# Import on target
psql "$DATABASE_URL" -f public_schema.sql
psql "$DATABASE_URL" -f public_data.sql
```

For custom-format dumps with `pg_restore`, use a connection that your network supports (often the Supabase pooler with user `postgres.<project-ref>`), not necessarily the direct `db.*.supabase.co` host.

Run `postgres/bootstrap/*.sql` first if `auth` schema / roles are missing.

---

## Schema source of truth

| File | Purpose |
|------|---------|
| `supabase/migrations/20260717101213_*.sql` | Base schema + seed data |
| `supabase/migrations/20260717101242_*.sql` | Security hardening |
| `supabase/migrations/20260722120000_*.sql` | Full module schema (APDM) |
| `postgres/bootstrap/*.sql` | Vanilla PostgreSQL compatibility |

---

## App connection (next step)

The web app **will not** read from raw PostgreSQL until you either:

| Approach | Effort | App changes |
|----------|--------|-------------|
| **Self-hosted Supabase** pointing at your PG | Medium | Update `.env` URLs only |
| **PostgREST** + JWT auth | High | Replace Supabase client calls |
| **Custom Node API** | High | New backend + client refactor |

Until then, keep `VITE_SUPABASE_*` pointed at Supabase Cloud for the running app, and use the new PostgreSQL for reporting, backups, or parallel cutover planning.

---

## Checklist

- [ ] Target PostgreSQL 14+ running with SSL (production)
- [ ] `pgcrypto` extension enabled
- [ ] Bootstrap scripts applied
- [ ] Migrations or pg_dump restore completed
- [ ] Row counts match Supabase source
- [ ] `auth.users` migrated if using `profiles` / `user_roles`
- [ ] App cutover plan (Supabase self-host vs new API) agreed
- [ ] `.env.postgres` not committed (passwords)

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `supabase: command not found` | Install [Supabase CLI](https://supabase.com/docs/guides/cli) |
| `not logged in` / link errors | Run `supabase login` and `supabase link` |
| `pg_dump` / connection timeout to `db.*.supabase.co` | Use `02-export-from-supabase.sh` (Supabase CLI pooler), not a manual direct URL |
| `relation "auth.users" does not exist` | Run `postgres/bootstrap/01_auth_compat.sql` |
| `role "authenticated" does not exist` | Run `postgres/bootstrap/00_extensions_and_roles.sql` |
| FK violation on `profiles` | Import `auth.users` before `profiles` |
| RLS blocks direct SQL | Connect as `service_role` or `goai_app` with RLS bypass for admin tasks |

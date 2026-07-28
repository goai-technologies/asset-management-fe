# Enterprise Asset Management System (EAMS)

React frontend + Express REST API backend for asset, employee, vendor, and assignment management.

## Architecture

```
React UI (TanStack Router + React Query)
  → src/lib/api/* (Axios)
    → Express API (http://localhost:5001/api)
      → PostgreSQL
```

## Quick start

The backend lives in a **separate folder** so you can run frontend and API independently:

**Backend:** `/Users/varsha/Downloads/Asset Management BE`

### Backend

```bash
cd "/Users/varsha/Downloads/Asset Management BE"
npm install
npm run dev
```

API: `http://localhost:5001/api`

Ensure PostgreSQL is running and `DATABASE_URL` in that folder's `.env` is correct (see `.env.example`).

### Frontend

```bash
cd "/Users/varsha/Desktop/joy-weaver-app-25/joy-weaver-app-25-1"
cp .env.example .env
npm install
npm run dev
```

Set in `.env`:

```
VITE_API_URL=http://localhost:5001/api
```

Frontend typically runs on **http://localhost:8080** (Lovable/Vite). Backend `CORS_ORIGIN` must include that origin.

## Frontend API layer (`src/lib/api/`)

| File | Purpose |
|------|---------|
| `axios.ts` | Axios client, JWT interceptor, global 401/403/500 handling |
| `client.ts` | Token storage (`eams_auth_token` in localStorage) |
| `auth.ts` | Login, logout, profile, password reset |
| `dashboard.ts` | Dashboard aggregates |
| `categories.ts` | Category CRUD |
| `vendors.ts` | Vendor CRUD |
| `employees.ts` | Employee CRUD |
| `assets.ts` | Asset CRUD, multipart image upload |
| `assignments.ts` | Assign, unassign, return, history |
| `reports.ts` | Report data + Excel/PDF downloads |
| `asset-management.ts` | React Query facade (query keys + re-exports) |
| `mappers.ts` | Backend camelCase → frontend domain types |

## Migrated pages

All authenticated routes use the Express REST API:

- `/auth` — login & signup
- `/dashboard` — summary, charts, activity, warranty
- `/categories` — CRUD
- `/vendor-management` — CRUD
- `/employees` — CRUD
- `/assets` — CRUD, assign/unassign/dispose/deactivate, image upload
- `/assets/:id` — detail, assignments, images
- `/my-assets` — employee assigned assets
- `/reports` — CSV + Excel/PDF exports
- `/settings` — admin panels, archived assets, backup export

## Environment

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Express API base URL (default `http://localhost:5001/api`) |

## Known limitations

Features not yet exposed by the REST API return empty data or show an error:

- Archived asset list / restore / permanent delete
- Repair CRUD (repair history shows empty; under-repair assets appear on dashboard)
- Multi-user role management in Settings (only current user profile is shown)
- Server-side image deletion

See the backend README at `/Users/varsha/Downloads/Asset Management BE/README.md` for full API documentation.

# Project Manager

Multi-tier project management: Projects → Stories → Tasks → Subtasks, with RBAC (Admin/Manager/Developer), a List (tree) view, and a drag-and-drop Kanban board. Next.js (App Router) + Supabase (Postgres, Auth, RLS).

## Setup

1. Copy `.env.example` to `.env.local` and fill in your Supabase project's keys (Project Settings → API, and the direct Postgres connection string under Database → Connection string → URI, non-pooling).
2. Install dependencies: `npm install`
3. Apply database migrations (schema, RLS policies, triggers):
   ```bash
   npm run db:migrate
   ```
4. Seed the first System Admin account (reads `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` from `.env.local`):
   ```bash
   npm run db:seed
   ```
5. Start the dev server:
   ```bash
   npm run dev
   ```

Login uses a **username**, not an email — Admin/Manager/Developer accounts are created from the Users admin page (`/admin/users`, Admin-only). Under the hood each username maps to a synthetic `username@users.internal` address for Supabase Auth; this is never shown in the UI.

## Notes

- All Supabase keys live in `.env.local` only (gitignored). `SUPABASE_SERVICE_ROLE_KEY` is used server-side only, in Admin-gated server actions.
- RBAC is enforced twice: in server actions (role checks) and at the database via Postgres Row-Level Security — see `supabase/migrations/0001_init.sql`.
- `npm run db:migrate` is idempotent — it tracks applied migrations in `public.schema_migrations` and only runs new files under `supabase/migrations/`.

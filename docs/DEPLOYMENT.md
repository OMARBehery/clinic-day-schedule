# Deployment

The UI and REST API deploy together on **Vercel**. Postgres is hosted on **Neon**.

## 1. Database (Neon)

1. Create a free Neon project (or the Vercel Neon integration).
2. Copy the pooled `DATABASE_URL`.
3. From this repo, with that URL in `.env`:

```bash
pnpm db:migrate
pnpm db:seed
```

Re-seed only when you want to reset fictional demo data. Seed always writes **today** in `CLINIC_TIMEZONE`.

## 2. Vercel project

```bash
pnpm i -g vercel
vercel login
vercel
```

Environment variables (Production and Preview):

- `DATABASE_URL` — Neon connection string
- `CLINIC_TIMEZONE` — `Africa/Cairo` unless the clinic zone changes
- `NEXT_PUBLIC_CLINIC_TIMEZONE` — same value as `CLINIC_TIMEZONE`

Framework preset: Next.js. Build command: `pnpm build`. Output: default Next.js.

The DICOM fixture is traced into the serverless function via `outputFileTracingIncludes` in `next.config.ts`.

## 3. After the first deploy

Confirm `/api/health` returns `{ "ok": true }`.  
Open `/` and load today's board. If the database is empty, run seed against Neon again.

Put the production URL at the top of the README.

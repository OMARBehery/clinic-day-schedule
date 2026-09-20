# Clinic Day Schedule

Fictional clinic staff board for **one day of appointments** and **one anonymized DICOM scan**.  
This is a take-home engineering exercise, **not** a diagnostic or production medical system. All names are invented.

**Demo:** _pending Vercel deploy — URL will be added here._

## What it does

Clinic staff can:

1. View appointments for a selected clinic-local date
2. Filter by doctor and status (filters combine)
3. Create an appointment
4. Change status without a page reload
5. See a conflict message when the same doctor is already booked — **form values are kept**
6. Open **View scan** on the seeded Nora El-Sayed appointment and inspect the DICOM image

Overlapping non-cancelled appointments for the same doctor are blocked in **PostgreSQL**, including two requests that arrive at the same time.

## Stack

- Next.js (App Router) + React + TypeScript
- REST API at `/api/v1/*` with shared Zod contracts
- PostgreSQL + Drizzle ORM
- Cornerstone3D DICOM viewer
- Vitest for business rules, Playwright for a smoke path

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) 9 (`corepack enable` then `corepack prepare pnpm@9.15.4 --activate`)
- PostgreSQL 16 (Docker Compose is the documented local path)

```bash
docker compose up -d
```

If Docker is not available, point `DATABASE_URL` at any Postgres 16 instance (local install or [Neon](https://neon.tech)).

## Setup from a clean checkout

```bash
pnpm install
cp .env.example .env
# edit DATABASE_URL if your Postgres is not on localhost:5432
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

Seeded board date is **today in `CLINIC_TIMEZONE`** (default `Africa/Cairo`). Look for **Nora El-Sayed** at 09:00 with **View scan**.

## Tests

```bash
pnpm test          # unit tests always; overlap/concurrency tests need DATABASE_URL
pnpm test:e2e      # Playwright smoke (app + database must be running)
pnpm lint
pnpm typecheck
```

## Useful scripts

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Next.js dev server (webpack, required for Cornerstone workers) |
| `pnpm build` / `pnpm start` | Production server |
| `pnpm db:migrate` | Apply `drizzle/0000_init.sql` |
| `pnpm db:seed` | Replace data with fictional demo rows |
| `pnpm db:studio` | Drizzle Studio |

## DICOM fixture

The assignment PDF mentioned a supplied `.dcm` file; it was not present next to the brief. The repo vendors an anonymized single-frame CT from the [pydicom test files](https://github.com/pydicom/pydicom) at `fixtures/dicom/anonymized-ct.dcm`. Replace that file in place and re-seed if you have the original.

## Documentation

- [Architecture and trade-offs](docs/ARCHITECTURE.md)
- [HTTP API](docs/API.md)
- [OpenAPI](docs/openapi.yaml)
- [Deployment (Vercel + Neon)](docs/DEPLOYMENT.md)
- [AI assistance disclosure](docs/AI-ASSISTANCE.md)

## Security notes

- No authentication (out of scope). Treat the demo as a private staff tool.
- Unexpected 500 responses never include stack traces.
- The viewer and metadata endpoint only expose modality, study date, and pixel dimensions.
- `.env` is gitignored. Do not commit secrets.

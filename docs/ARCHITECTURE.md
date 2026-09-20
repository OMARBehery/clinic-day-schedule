# Architecture and trade-offs

This is a small clinic **day board**, not a hospital information system. Choices stay proportional to that scope.

## Project structure

```
src/
  app/                # React UI + REST route handlers
  components/         # Schedule board and DICOM modal
  lib/contracts/      # Shared Zod schemas (API + forms)
  lib/timezone.ts     # Clinic-local calendar math
  server/             # Domain logic, independent of Next.js HTTP
    appointments.ts
    imaging.ts
    db/
fixtures/dicom/       # Anonymized single-frame sample
drizzle/              # SQL migrations
```

Route handlers in `src/app/api` only parse HTTP, call `src/server/*`, and map errors. Tests hit the domain layer directly.

## Library choices

| Choice | Why |
| --- | --- |
| Next.js App Router | One TypeScript codebase and one Vercel deploy, while still exposing a documented REST API |
| PostgreSQL | Relational data plus a GiST exclusion constraint for true overlap safety |
| Drizzle | SQL-shaped schema and room for a constraint Prisma cannot express cleanly |
| Zod in `src/lib/contracts` | Same types for request validation and the create form |
| TanStack Query | Status updates and creates without a full page reload |
| Cornerstone3D + dicom-image-loader | Established viewer; we do not parse pixels ourselves |
| `@date-fns/tz` (`TZDate`) | Explicit clinic timezone instead of the browser's local zone |

Webpack is used in `dev`/`build` (`next --webpack`) because Cornerstone's decode **web worker** needs a real worker URL. Turbopack is a poor fit for that loader today.

## How concurrent appointment conflicts are prevented

Application code is not the source of truth. Postgres enforces:

```sql
EXCLUDE USING gist (
  doctor_id WITH =,
  tstzrange(starts_at, ends_at, '[)') WITH &&
) WHERE (status <> 'cancelled')
```

- Range is **half-open** `[start, end)`, so an appointment ending at 10:30 may be followed by one starting at 10:30.
- Cancelled rows are omitted from the constraint, so they do not occupy the doctor.
- Two overlapping inserts in concurrent transactions: one commits, the other fails with SQLSTATE `23P01`.
- `ends_at` is stored (not computed in the index) so the GiST expression stays `IMMUTABLE` on Postgres/Neon.
- The API maps that to **HTTP 409** `{ error: { code: "APPOINTMENT_OVERLAP", details: { conflictingAppointmentId, ... } } }`.

There is also a lookup after the violation so the UI can name the conflicting slot. That lookup is for messaging only; the constraint is what keeps the calendar correct.

Status updates that would revive a cancelled appointment into a busy slot hit the same constraint.

## DICOM viewer lifecycle (React)

`DicomViewerModal` loads metadata from the API, then dynamically imports `DicomViewport` with `ssr: false`.

On mount, the viewport:

1. Initializes Cornerstone once (`ensureCornerstone`)
2. Creates a **new** `RenderingEngine` and STACK viewport bound to a dedicated DOM node
3. Loads `wadouri:<origin>/api/v1/imaging-studies/:id/file`
4. Calls `resetCamera()` (Fit) and `render()`
5. Attaches a `ResizeObserver` that calls `renderingEngine.resize(true, true)`
6. Optionally uses wheel zoom as a non-blocking extra

On unmount or close:

- `ResizeObserver.disconnect()`
- wheel listener removed
- `renderingEngine.destroy()`

That teardown lives in `destroyViewer` so it can be unit-tested without WebGL. Closing and reopening allocates a new engine id, so handlers and canvases are not reused.

Safe metadata (modality, study date, rows × columns) is parsed on the **server** with `dicom-parser`. Patient tags such as `(0010,0010)` are never read or logged.

## Time-zone assumptions

- Instants are stored as `timestamptz` (UTC).
- The staff “selected date” is a **calendar day in `CLINIC_TIMEZONE`** (default `Africa/Cairo`).
- Listing uses `[local midnight, next local midnight)`.
- The create form sends an ISO-8601 instant built from clinic-local date + time.

If the clinic moves, change `CLINIC_TIMEZONE` and `NEXT_PUBLIC_CLINIC_TIMEZONE`. Do not store naive local timestamps.

## Security and privacy

- Authentication is out of scope (assignment). The API is open; a real clinic would put it behind SSO.
- 500 responses are `{ code: "INTERNAL_ERROR", message: "An unexpected error occurred" }` plus a request id. Stack traces stay on the server log as JSON.
- DICOM bytes are served only from `fixtures/dicom` after a path-containment check.
- No secrets in git. `.env*` is ignored except `.env.example`.

## What we would improve next

- A real identity (staff user, audit trail) and HTTPS-only cookies
- Suggest the next free slot in the 409 payload
- Persist viewer VOI/window on the study row
- Move the DICOM object to object storage instead of the git fixture
- Add a queue/lock dashboard for ops when exclusion violations spike

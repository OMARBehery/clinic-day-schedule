# HTTP API

Base URL: the site origin. All JSON error bodies use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "path": "durationMinutes", "message": "durationMinutes must be a positive value" }]
  },
  "requestId": "uuid"
}
```

Pass `x-request-id` if you want to correlate logs; otherwise the server generates one and echoes it on the response.

Unexpected failures return **500** with `code: INTERNAL_ERROR` and no stack trace.

## `GET /api/health`

Liveness plus the clinic timezone.

## `GET /api/v1/doctors`

Returns `{ "data": [{ "id", "name" }] }`.

## `GET /api/v1/appointments`

Query:

| Param | Required | Notes |
| --- | --- | --- |
| `date` | yes | `YYYY-MM-DD` in `CLINIC_TIMEZONE` |
| `doctorId` | no | UUID |
| `status` | no | `scheduled` \| `checked_in` \| `completed` \| `cancelled` |

Filters combine with AND. Each appointment may include `imagingStudy: { id, modality, description }` when a scan is attached.

## `POST /api/v1/appointments`

```json
{
  "patientName": "Ada West",
  "doctorId": "c1a1d0c0-0a11-4a11-8a11-000000000001",
  "startsAt": "2026-01-15T08:00:00.000Z",
  "durationMinutes": 30,
  "reason": "optional"
}
```

- **201** `{ data: appointment }`
- **400** validation (`durationMinutes` must be a positive integer)
- **404** unknown doctor
- **409** `APPOINTMENT_OVERLAP` with `details.conflictingAppointmentId`

`startsAt` must be ISO-8601 with an offset (`Z` is fine). The server stores UTC.

## `PATCH /api/v1/appointments/:id/status`

```json
{ "status": "checked_in" }
```

Unsupported values → **400**. Unknown id → **404**. Reviving a cancelled row into a busy slot → **409**.

## `GET /api/v1/appointments/:id/imaging-study`

Safe metadata only: modality, study date (if present), rows, columns. Never patient name or ID.

## `GET /api/v1/imaging-studies/:id/file`

Raw Part-10 DICOM (`Content-Type: application/dicom`).

See [openapi.yaml](./openapi.yaml) for a machine-readable copy.

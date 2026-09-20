CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  CREATE TYPE appointment_status AS ENUM (
    'scheduled',
    'checked_in',
    'completed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name text NOT NULL,
  doctor_id uuid NOT NULL REFERENCES doctors(id),
  starts_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  status appointment_status NOT NULL DEFAULT 'scheduled',
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS imaging_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  modality text NOT NULL,
  description text NOT NULL,
  dicom_file_path text NOT NULL
);

CREATE INDEX IF NOT EXISTS appointments_doctor_starts_idx
  ON appointments (doctor_id, starts_at);

CREATE INDEX IF NOT EXISTS appointments_status_idx
  ON appointments (status);

CREATE INDEX IF NOT EXISTS imaging_studies_appointment_idx
  ON imaging_studies (appointment_id);

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_no_doctor_overlap;

-- Adjacent appointments are allowed because the range is half-open [start, end).
-- Cancelled rows are excluded so they do not occupy the doctor's calendar.
ALTER TABLE appointments
  ADD CONSTRAINT appointments_no_doctor_overlap
  EXCLUDE USING gist (
    doctor_id WITH =,
    tstzrange(
      starts_at,
      starts_at + make_interval(mins => duration_minutes),
      '[)'
    ) WITH &&
  )
  WHERE (status <> 'cancelled');

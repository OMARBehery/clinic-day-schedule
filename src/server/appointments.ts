import { and, eq, gte, lt, ne, sql } from "drizzle-orm";
import type { AppointmentDto, CreateAppointmentInput } from "@/lib/contracts";
import { AppError, isExclusionViolation } from "@/lib/errors";
import { addMinutes, clinicDayRangeUtc } from "@/lib/timezone";
import { getDb } from "@/server/db/client";
import {
  appointments,
  doctors,
  imagingStudies,
} from "@/server/db/schema";

export type AppointmentFilters = {
  date: string;
  doctorId?: string;
  status?: AppointmentDto["status"];
};

function toDto(row: {
  id: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  startsAt: Date;
  durationMinutes: number;
  status: AppointmentDto["status"];
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
  imagingStudyId: string | null;
  imagingModality: string | null;
  imagingDescription: string | null;
}): AppointmentDto {
  return {
    id: row.id,
    patientName: row.patientName,
    doctorId: row.doctorId,
    doctorName: row.doctorName,
    startsAt: row.startsAt.toISOString(),
    durationMinutes: row.durationMinutes,
    status: row.status,
    reason: row.reason,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    imagingStudy: row.imagingStudyId
      ? {
          id: row.imagingStudyId,
          modality: row.imagingModality ?? "",
          description: row.imagingDescription ?? "",
        }
      : null,
  };
}

export async function listDoctors() {
  const db = getDb();
  return db.select().from(doctors).orderBy(doctors.name);
}

export async function listAppointments(filters: AppointmentFilters) {
  const db = getDb();
  const { start, end } = clinicDayRangeUtc(filters.date);
  const conditions = [
    gte(appointments.startsAt, start),
    lt(appointments.startsAt, end),
  ];
  if (filters.doctorId) {
    conditions.push(eq(appointments.doctorId, filters.doctorId));
  }
  if (filters.status) {
    conditions.push(eq(appointments.status, filters.status));
  }

  const rows = await db
    .select({
      id: appointments.id,
      patientName: appointments.patientName,
      doctorId: appointments.doctorId,
      doctorName: doctors.name,
      startsAt: appointments.startsAt,
      durationMinutes: appointments.durationMinutes,
      status: appointments.status,
      reason: appointments.reason,
      createdAt: appointments.createdAt,
      updatedAt: appointments.updatedAt,
      imagingStudyId: imagingStudies.id,
      imagingModality: imagingStudies.modality,
      imagingDescription: imagingStudies.description,
    })
    .from(appointments)
    .innerJoin(doctors, eq(doctors.id, appointments.doctorId))
    .leftJoin(imagingStudies, eq(imagingStudies.appointmentId, appointments.id))
    .where(and(...conditions))
    .orderBy(appointments.startsAt, doctors.name);

  return rows.map(toDto);
}

async function findOverlappingAppointment(input: {
  doctorId: string;
  startsAt: Date;
  durationMinutes: number;
  excludeId?: string;
}) {
  const db = getDb();
  const rangeEnd = addMinutes(input.startsAt, input.durationMinutes);
  const conditions = [
    eq(appointments.doctorId, input.doctorId),
    ne(appointments.status, "cancelled"),
    sql`tstzrange(${appointments.startsAt}, ${appointments.endsAt}, '[)') && tstzrange(${input.startsAt.toISOString()}::timestamptz, ${rangeEnd.toISOString()}::timestamptz, '[)')`,
  ];
  if (input.excludeId) {
    conditions.push(ne(appointments.id, input.excludeId));
  }

  const [conflict] = await db
    .select({
      id: appointments.id,
      startsAt: appointments.startsAt,
      durationMinutes: appointments.durationMinutes,
      patientName: appointments.patientName,
    })
    .from(appointments)
    .where(and(...conditions))
    .limit(1);

  return conflict ?? null;
}

function overlapError(conflict: {
  id: string;
  startsAt: Date;
  durationMinutes: number;
  patientName: string;
} | null) {
  return new AppError(
    "APPOINTMENT_OVERLAP",
    "This time overlaps another non-cancelled appointment for the same doctor.",
    409,
    {
      conflictingAppointmentId: conflict?.id ?? null,
      conflictingStartsAt: conflict?.startsAt.toISOString() ?? null,
      conflictingDurationMinutes: conflict?.durationMinutes ?? null,
    },
  );
}

export async function createAppointment(input: CreateAppointmentInput) {
  const db = getDb();
  const [doctor] = await db
    .select()
    .from(doctors)
    .where(eq(doctors.id, input.doctorId))
    .limit(1);
  if (!doctor) {
    throw new AppError("DOCTOR_NOT_FOUND", "Doctor not found", 404);
  }

  const startsAt = new Date(input.startsAt);

  try {
    const [created] = await db
      .insert(appointments)
      .values({
        patientName: input.patientName,
        doctorId: input.doctorId,
        startsAt,
        endsAt: addMinutes(startsAt, input.durationMinutes),
        durationMinutes: input.durationMinutes,
        reason: input.reason,
        status: "scheduled",
      })
      .returning();

    const [row] = await db
      .select({
        id: appointments.id,
        patientName: appointments.patientName,
        doctorId: appointments.doctorId,
        doctorName: doctors.name,
        startsAt: appointments.startsAt,
        durationMinutes: appointments.durationMinutes,
        status: appointments.status,
        reason: appointments.reason,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        imagingStudyId: imagingStudies.id,
        imagingModality: imagingStudies.modality,
        imagingDescription: imagingStudies.description,
      })
      .from(appointments)
      .innerJoin(doctors, eq(doctors.id, appointments.doctorId))
      .leftJoin(imagingStudies, eq(imagingStudies.appointmentId, appointments.id))
      .where(eq(appointments.id, created.id));

    return toDto(row);
  } catch (error) {
    if (isExclusionViolation(error)) {
      const conflict = await findOverlappingAppointment({
        doctorId: input.doctorId,
        startsAt,
        durationMinutes: input.durationMinutes,
      });
      throw overlapError(conflict);
    }
    throw error;
  }
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentDto["status"],
) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, id))
    .limit(1);
  if (!existing) {
    throw new AppError("APPOINTMENT_NOT_FOUND", "Appointment not found", 404);
  }

  try {
    const [updated] = await db
      .update(appointments)
      .set({ status, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();

    const [row] = await db
      .select({
        id: appointments.id,
        patientName: appointments.patientName,
        doctorId: appointments.doctorId,
        doctorName: doctors.name,
        startsAt: appointments.startsAt,
        durationMinutes: appointments.durationMinutes,
        status: appointments.status,
        reason: appointments.reason,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        imagingStudyId: imagingStudies.id,
        imagingModality: imagingStudies.modality,
        imagingDescription: imagingStudies.description,
      })
      .from(appointments)
      .innerJoin(doctors, eq(doctors.id, appointments.doctorId))
      .leftJoin(imagingStudies, eq(imagingStudies.appointmentId, appointments.id))
      .where(eq(appointments.id, updated.id));

    return toDto(row);
  } catch (error) {
    if (isExclusionViolation(error)) {
      const conflict = await findOverlappingAppointment({
        doctorId: existing.doctorId,
        startsAt: existing.startsAt,
        durationMinutes: existing.durationMinutes,
        excludeId: existing.id,
      });
      throw overlapError(conflict);
    }
    throw error;
  }
}

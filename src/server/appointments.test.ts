import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import {
  createAppointment,
  listAppointments,
  updateAppointmentStatus,
} from "@/server/appointments";
import { getDb } from "@/server/db/client";
import { doctors } from "@/server/db/schema";
import { clinicLocalToUtc } from "@/lib/timezone";
import { postgresAvailable } from "@/test/db";

const hasDb = await postgresAvailable();

describe.skipIf(!hasDb)("appointment overlap rules", () => {
  async function insertDoctor() {
    const db = getDb();
    const id = crypto.randomUUID();
    await db.insert(doctors).values({ id, name: `Test Doctor ${id.slice(0, 8)}` });
    return id;
  }

  it("persists a valid appointment on the selected clinic day", async () => {
    const doctorId = await insertDoctor();
    const created = await createAppointment({
      patientName: "Ada West",
      doctorId,
      startsAt: clinicLocalToUtc("2026-03-01", "09:00").toISOString(),
      durationMinutes: 30,
    });
    const listed = await listAppointments({ date: "2026-03-01", doctorId });
    expect(listed.some((row) => row.id === created.id)).toBe(true);
  });

  it("rejects overlapping appointments and allows adjacent ones", async () => {
    const doctorId = await insertDoctor();
    await createAppointment({
      patientName: "First",
      doctorId,
      startsAt: clinicLocalToUtc("2026-03-02", "10:00").toISOString(),
      durationMinutes: 30,
    });

    await expect(
      createAppointment({
        patientName: "Overlap",
        doctorId,
        startsAt: clinicLocalToUtc("2026-03-02", "10:15").toISOString(),
        durationMinutes: 30,
      }),
    ).rejects.toMatchObject({ code: "APPOINTMENT_OVERLAP", status: 409 });

    const adjacent = await createAppointment({
      patientName: "Adjacent",
      doctorId,
      startsAt: clinicLocalToUtc("2026-03-02", "10:30").toISOString(),
      durationMinutes: 30,
    });
    expect(adjacent.patientName).toBe("Adjacent");
  });

  it("lets a cancelled appointment free the slot", async () => {
    const doctorId = await insertDoctor();
    const original = await createAppointment({
      patientName: "Will Cancel",
      doctorId,
      startsAt: clinicLocalToUtc("2026-03-03", "11:00").toISOString(),
      durationMinutes: 30,
    });
    await updateAppointmentStatus(original.id, "cancelled");
    const replacement = await createAppointment({
      patientName: "Replacement",
      doctorId,
      startsAt: clinicLocalToUtc("2026-03-03", "11:00").toISOString(),
      durationMinutes: 30,
    });
    expect(replacement.patientName).toBe("Replacement");
  });

  it("cannot create two overlapping appointments concurrently", async () => {
    const doctorId = await insertDoctor();
    const startsAt = clinicLocalToUtc("2026-03-04", "13:00").toISOString();
    const results = await Promise.allSettled([
      createAppointment({
        patientName: "Race A",
        doctorId,
        startsAt,
        durationMinutes: 45,
      }),
      createAppointment({
        patientName: "Race B",
        doctorId,
        startsAt,
        durationMinutes: 45,
      }),
    ]);

    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    const reason = (rejected[0] as PromiseRejectedResult).reason as AppError;
    expect(reason.code).toBe("APPOINTMENT_OVERLAP");
    expect(reason.status).toBe(409);
  });
});

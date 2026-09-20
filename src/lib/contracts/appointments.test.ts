import { describe, expect, it } from "vitest";
import {
  createAppointmentFormSchema,
  createAppointmentSchema,
  listAppointmentsQuerySchema,
  updateAppointmentStatusSchema,
} from "@/lib/contracts";

describe("shared contracts", () => {
  it("rejects a non-positive duration", () => {
    const result = createAppointmentSchema.safeParse({
      patientName: "Ada West",
      doctorId: "c1a1d0c0-0a11-4a11-8a11-000000000001",
      startsAt: "2026-01-15T08:00:00.000Z",
      durationMinutes: 0,
    });
    expect(result.success).toBe(false);
  });

  it("requires patient name and a valid ISO start", () => {
    const result = createAppointmentSchema.safeParse({
      patientName: " ",
      doctorId: "not-a-uuid",
      startsAt: "tomorrow",
      durationMinutes: 30,
    });
    expect(result.success).toBe(false);
  });

  it("accepts combined list filters", () => {
    const result = listAppointmentsQuerySchema.parse({
      date: "2026-01-15",
      doctorId: "c1a1d0c0-0a11-4a11-8a11-000000000001",
      status: "scheduled",
    });
    expect(result.status).toBe("scheduled");
  });

  it("rejects unsupported status values", () => {
    const result = updateAppointmentStatusSchema.safeParse({ status: "no-show" });
    expect(result.success).toBe(false);
  });

  it("validates the create form the UI uses", () => {
    const result = createAppointmentFormSchema.safeParse({
      patientName: "Ada West",
      doctorId: "c1a1d0c0-0a11-4a11-8a11-000000000001",
      date: "2026-01-15",
      time: "09:15",
      durationMinutes: "45",
    });
    expect(result.success).toBe(true);
  });
});

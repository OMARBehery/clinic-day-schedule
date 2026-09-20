import { updateAppointmentStatusSchema } from "@/lib/contracts";
import { AppError } from "@/lib/errors";
import { updateAppointmentStatus } from "@/server/appointments";
import { apiHandler, jsonOk, parseOrThrow } from "@/server/http";

export const PATCH = apiHandler(async (request, context) => {
  const { id } = await context.params;
  if (!id) {
    throw new AppError("VALIDATION_ERROR", "Appointment id is required", 400);
  }
  const body = await request.json().catch(() => ({}));
  const input = parseOrThrow(updateAppointmentStatusSchema, body);
  const updated = await updateAppointmentStatus(id, input.status);
  return jsonOk(request, { data: updated });
});

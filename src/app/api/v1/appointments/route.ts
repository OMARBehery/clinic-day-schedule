import { createAppointmentSchema, listAppointmentsQuerySchema } from "@/lib/contracts";
import { AppError } from "@/lib/errors";
import { createAppointment, listAppointments } from "@/server/appointments";
import { apiHandler, jsonOk, parseOrThrow } from "@/server/http";

export const GET = apiHandler(async (request) => {
  const url = new URL(request.url);
  const query = parseOrThrow(listAppointmentsQuerySchema, {
    date: url.searchParams.get("date") ?? undefined,
    doctorId: url.searchParams.get("doctorId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
  });
  const data = await listAppointments(query);
  return jsonOk(request, { data });
});

export const POST = apiHandler(async (request) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new AppError("VALIDATION_ERROR", "Request body must be JSON", 400);
  }
  const input = parseOrThrow(createAppointmentSchema, body);
  const created = await createAppointment(input);
  return jsonOk(request, { data: created }, 201);
});

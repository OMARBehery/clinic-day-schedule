import { AppError } from "@/lib/errors";
import { getImagingStudyForAppointment } from "@/server/imaging";
import { apiHandler, jsonOk } from "@/server/http";

export const GET = apiHandler(async (request, context) => {
  const { id } = await context.params;
  if (!id) {
    throw new AppError("VALIDATION_ERROR", "Appointment id is required", 400);
  }
  const data = await getImagingStudyForAppointment(id);
  return jsonOk(request, { data });
});

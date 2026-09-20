import { apiHandler, jsonOk } from "@/server/http";
import { getClinicTimezone } from "@/lib/timezone";

export const GET = apiHandler(async (request) => {
  return jsonOk(request, {
    ok: true,
    timezone: getClinicTimezone(),
    requestId: request.headers.get("x-request-id") ?? undefined,
  });
});

import { apiHandler, jsonOk } from "@/server/http";
import { listDoctors } from "@/server/appointments";

export const GET = apiHandler(async (request) => {
  const doctors = await listDoctors();
  return jsonOk(request, { data: doctors });
});

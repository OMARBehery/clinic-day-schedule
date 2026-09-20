import type { AppointmentDto, AppointmentStatus, DoctorDto, ImagingStudyDto } from "@/lib/contracts";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const response = await fetch(input, { ...init, headers });
  const payload = (await response.json().catch(() => ({}))) as {
    data?: T;
    error?: { code?: string; message?: string; details?: unknown };
  };
  if (!response.ok) {
    throw new ApiError(
      payload.error?.code ?? "UNKNOWN",
      payload.error?.message ?? "Request failed",
      response.status,
      payload.error?.details,
    );
  }
  return (payload.data ?? payload) as T;
}

export function fetchDoctors() {
  return requestJson<DoctorDto[]>("/api/v1/doctors");
}

export function fetchAppointments(params: {
  date: string;
  doctorId?: string;
  status?: AppointmentStatus | "";
}) {
  const search = new URLSearchParams({ date: params.date });
  if (params.doctorId) search.set("doctorId", params.doctorId);
  if (params.status) search.set("status", params.status);
  return requestJson<AppointmentDto[]>(`/api/v1/appointments?${search.toString()}`);
}

export function createAppointmentRequest(body: {
  patientName: string;
  doctorId: string;
  startsAt: string;
  durationMinutes: number;
  reason?: string;
}) {
  return requestJson<AppointmentDto>("/api/v1/appointments", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateAppointmentStatusRequest(
  id: string,
  status: AppointmentStatus,
) {
  return requestJson<AppointmentDto>(`/api/v1/appointments/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function fetchImagingStudy(appointmentId: string) {
  return requestJson<ImagingStudyDto>(
    `/api/v1/appointments/${appointmentId}/imaging-study`,
  );
}

export function dicomFileUrl(studyId: string) {
  return `/api/v1/imaging-studies/${studyId}/file`;
}

export async function fetchHealth() {
  const response = await fetch("/api/health");
  return (await response.json()) as { ok: boolean; timezone: string };
}

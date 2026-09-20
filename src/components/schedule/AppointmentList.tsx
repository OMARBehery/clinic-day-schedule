"use client";

import type { AppointmentDto, AppointmentStatus } from "@/lib/contracts";
import { appointmentStatuses } from "@/lib/contracts";
import { utcToClinicParts } from "@/lib/timezone";
import { statusLabels, statusStyles } from "@/lib/status";
import { ScanEye } from "lucide-react";

type Props = {
  appointments: AppointmentDto[];
  timezone: string;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  onViewScan: (appointmentId: string) => void;
  pendingId: string | null | undefined;
  statusError: string | null;
};

export function AppointmentList({
  appointments,
  timezone,
  onStatusChange,
  onViewScan,
  pendingId,
  statusError,
}: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white" aria-label="Appointment list">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Appointments</h2>
        <p className="text-xs text-slate-500">{appointments.length} on this board</p>
      </div>
      {statusError ? (
        <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-800" role="alert">
          {statusError}
        </p>
      ) : null}
      <ul className="divide-y divide-slate-100">
        {appointments.map((appointment) => {
          const parts = utcToClinicParts(new Date(appointment.startsAt), timezone);
          return (
            <li key={appointment.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{appointment.patientName}</p>
                  <p className="text-sm text-slate-600">
                    {appointment.doctorName} · {parts.time} · {appointment.durationMinutes} min
                  </p>
                  {appointment.reason ? (
                    <p className="mt-1 text-xs text-slate-500">{appointment.reason}</p>
                  ) : null}
                </div>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusStyles[appointment.status]}`}
                >
                  {statusLabels[appointment.status]}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor={`status-${appointment.id}`}>
                  Status for {appointment.patientName}
                </label>
                <select
                  id={`status-${appointment.id}`}
                  value={appointment.status}
                  disabled={pendingId === appointment.id}
                  onChange={(event) =>
                    onStatusChange(
                      appointment.id,
                      event.target.value as AppointmentStatus,
                    )
                  }
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                >
                  {appointmentStatuses.map((value) => (
                    <option key={value} value={value}>
                      {statusLabels[value]}
                    </option>
                  ))}
                </select>
                {appointment.imagingStudy ? (
                  <button
                    type="button"
                    onClick={() => onViewScan(appointment.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-sm font-medium text-teal-800 hover:bg-teal-100"
                  >
                    <ScanEye className="h-4 w-4" aria-hidden />
                    View scan
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

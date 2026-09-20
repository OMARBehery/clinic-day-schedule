"use client";

import type { AppointmentStatus, DoctorDto } from "@/lib/contracts";
import { appointmentStatuses } from "@/lib/contracts";
import { statusLabels } from "@/lib/status";

type Props = {
  date: string;
  doctorId: string;
  status: AppointmentStatus | "";
  doctors: DoctorDto[];
  timezone: string;
  onDateChange: (date: string) => void;
  onDoctorChange: (doctorId: string) => void;
  onStatusChange: (status: AppointmentStatus | "") => void;
};

export function ScheduleToolbar({
  date,
  doctorId,
  status,
  doctors,
  timezone,
  onDateChange,
  onDoctorChange,
  onStatusChange,
}: Props) {
  return (
    <form
      className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3"
      onSubmit={(event) => event.preventDefault()}
    >
      <div>
        <label htmlFor="board-date" className="block text-sm font-medium text-slate-700">
          Date
        </label>
        <input
          id="board-date"
          type="date"
          value={date}
          onChange={(event) => onDateChange(event.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
        />
        <p className="mt-1 text-xs text-slate-500">Clinic calendar day ({timezone})</p>
      </div>
      <div>
        <label htmlFor="board-doctor" className="block text-sm font-medium text-slate-700">
          Doctor
        </label>
        <select
          id="board-doctor"
          value={doctorId}
          onChange={(event) => onDoctorChange(event.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
        >
          <option value="">All doctors</option>
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="board-status" className="block text-sm font-medium text-slate-700">
          Status
        </label>
        <select
          id="board-status"
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value as AppointmentStatus | "")
          }
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
        >
          <option value="">All statuses</option>
          {appointmentStatuses.map((value) => (
            <option key={value} value={value}>
              {statusLabels[value]}
            </option>
          ))}
        </select>
      </div>
    </form>
  );
}

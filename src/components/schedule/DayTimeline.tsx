"use client";

import type { AppointmentDto, DoctorDto } from "@/lib/contracts";
import { utcToClinicParts } from "@/lib/timezone";
import { timelineStatusStyles } from "@/lib/status";

const START_HOUR = 8;
const END_HOUR = 18;
const PX_PER_HOUR = 48;

type Props = {
  date: string;
  timezone: string;
  doctors: DoctorDto[];
  appointments: AppointmentDto[];
  onViewScan: (appointmentId: string) => void;
};

export function DayTimeline({
  timezone,
  doctors,
  appointments,
  onViewScan,
}: Props) {
  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, index) => START_HOUR + index,
  );
  const height = (END_HOUR - START_HOUR) * PX_PER_HOUR;

  return (
    <section
      className="overflow-hidden rounded-xl border border-slate-200 bg-white"
      aria-label="Day timeline"
    >
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Day timeline</h2>
        <p className="text-xs text-slate-500">
          {START_HOUR}:00–{END_HOUR}:00 clinic hours
        </p>
      </div>
      <div className="overflow-x-auto">
        <div
          className="grid min-w-[640px]"
          style={{
            gridTemplateColumns: `4rem repeat(${Math.max(doctors.length, 1)}, minmax(9rem, 1fr))`,
          }}
        >
          <div className="border-r border-slate-100" />
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="border-r border-slate-100 px-3 py-2 text-xs font-medium text-slate-600 last:border-r-0"
            >
              {doctor.name}
            </div>
          ))}
        </div>
        <div
          className="grid min-w-[640px]"
          style={{
            gridTemplateColumns: `4rem repeat(${Math.max(doctors.length, 1)}, minmax(9rem, 1fr))`,
          }}
        >
          <div className="relative border-r border-slate-100" style={{ height }}>
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute right-2 -translate-y-2 text-xs text-slate-400"
                style={{ top: (hour - START_HOUR) * PX_PER_HOUR }}
              >
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="relative border-r border-slate-100 last:border-r-0 timeline-grid"
              style={{ height }}
            >
              {appointments
                .filter((appointment) => appointment.doctorId === doctor.id)
                .map((appointment) => {
                  const parts = utcToClinicParts(
                    new Date(appointment.startsAt),
                    timezone,
                  );
                  const [hour, minute] = parts.time.split(":").map(Number);
                  const startMin = hour * 60 + minute - START_HOUR * 60;
                  const top = (startMin / 60) * PX_PER_HOUR;
                  const blockHeight = Math.max(
                    (appointment.durationMinutes / 60) * PX_PER_HOUR,
                    28,
                  );
                  return (
                    <button
                      key={appointment.id}
                      type="button"
                      onClick={() =>
                        appointment.imagingStudy
                          ? onViewScan(appointment.id)
                          : undefined
                      }
                      className={`absolute inset-x-1 overflow-hidden rounded-md px-2 py-1 text-left text-[11px] text-white shadow-sm ${timelineStatusStyles[appointment.status]} ${appointment.imagingStudy ? "cursor-pointer" : "cursor-default"}`}
                      style={{ top, height: blockHeight }}
                      title={`${appointment.patientName} · ${parts.time}`}
                    >
                      <span className="block truncate font-medium">
                        {appointment.patientName}
                      </span>
                      <span className="block truncate opacity-90">
                        {parts.time} · {appointment.durationMinutes}m
                      </span>
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

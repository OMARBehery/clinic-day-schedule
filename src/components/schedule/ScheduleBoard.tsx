"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Plus, Stethoscope } from "lucide-react";
import { useMemo, useState } from "react";
import {
  fetchAppointments,
  fetchDoctors,
  fetchHealth,
  updateAppointmentStatusRequest,
} from "@/lib/api";
import type { AppointmentStatus } from "@/lib/contracts";
import { todayInClinic } from "@/lib/timezone";
import { CreateAppointmentForm } from "./CreateAppointmentForm";
import { AppointmentList } from "./AppointmentList";
import { DayTimeline } from "./DayTimeline";
import { ScheduleToolbar } from "./ScheduleToolbar";
import { DicomViewerModal } from "@/components/viewer/DicomViewerModal";

export function ScheduleBoard() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(todayInClinic());
  const [doctorId, setDoctorId] = useState("");
  const [status, setStatus] = useState<AppointmentStatus | "">("");
  const [createOpen, setCreateOpen] = useState(false);
  const [scanAppointmentId, setScanAppointmentId] = useState<string | null>(
    null,
  );

  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
  });
  const timezone = healthQuery.data?.timezone ?? "Africa/Cairo";

  const doctorsQuery = useQuery({
    queryKey: ["doctors"],
    queryFn: fetchDoctors,
  });

  const appointmentsQuery = useQuery({
    queryKey: ["appointments", date, doctorId, status],
    queryFn: () =>
      fetchAppointments({
        date,
        doctorId: doctorId || undefined,
        status,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      nextStatus,
    }: {
      id: string;
      nextStatus: AppointmentStatus;
    }) => updateAppointmentStatusRequest(id, nextStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  const doctors = useMemo(() => doctorsQuery.data ?? [], [doctorsQuery.data]);
  const appointments = appointmentsQuery.data ?? [];
  const visibleDoctors = useMemo(
    () => (doctorId ? doctors.filter((doctor) => doctor.id === doctorId) : doctors),
    [doctorId, doctors],
  );

  return (
    <div className="min-h-full">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-teal-700 p-2 text-white">
              <Stethoscope className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                Northside Day Clinic
              </p>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                Appointment board
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                Fictional staff tool for one clinic day. Not a diagnostic or
                production medical system. Times are shown in {timezone}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            <Plus className="h-4 w-4" aria-hidden />
            New appointment
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <ScheduleToolbar
          date={date}
          doctorId={doctorId}
          status={status}
          doctors={doctors}
          timezone={timezone}
          onDateChange={setDate}
          onDoctorChange={setDoctorId}
          onStatusChange={setStatus}
        />

        {appointmentsQuery.isLoading || doctorsQuery.isLoading ? (
          <div
            className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-600"
            role="status"
          >
            Loading the day board…
          </div>
        ) : appointmentsQuery.isError || doctorsQuery.isError ? (
          <div
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-8 text-sm text-red-800"
            role="alert"
          >
            Could not load appointments. Check that the API and database are
            running, then retry.
            <button
              type="button"
              className="ml-3 font-medium underline"
              onClick={() => appointmentsQuery.refetch()}
            >
              Retry
            </button>
          </div>
        ) : appointments.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-slate-400" aria-hidden />
            <h2 className="mt-3 text-base font-semibold text-slate-900">
              No appointments for this filter
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Try another date, clear a filter, or create an appointment.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <DayTimeline
              date={date}
              timezone={timezone}
              doctors={visibleDoctors}
              appointments={appointments}
              onViewScan={setScanAppointmentId}
            />
            <AppointmentList
              appointments={appointments}
              timezone={timezone}
              statusError={
                statusMutation.isError ? statusMutation.error.message : null
              }
              onStatusChange={(id, nextStatus) =>
                statusMutation.mutate({ id, nextStatus })
              }
              onViewScan={setScanAppointmentId}
              pendingId={statusMutation.isPending ? statusMutation.variables?.id : null}
            />
          </div>
        )}
      </main>

      {createOpen ? (
        <CreateAppointmentForm
          date={date}
          doctors={doctors}
          timezone={timezone}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            setCreateOpen(false);
          }}
        />
      ) : null}

      {scanAppointmentId ? (
        <DicomViewerModal
          appointmentId={scanAppointmentId}
          onClose={() => setScanAppointmentId(null)}
        />
      ) : null}
    </div>
  );
}

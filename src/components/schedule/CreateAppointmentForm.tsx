"use client";

import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  ApiError,
  createAppointmentRequest,
} from "@/lib/api";
import {
  createAppointmentFormSchema,
  type DoctorDto,
} from "@/lib/contracts";
import { clinicLocalToUtc } from "@/lib/timezone";

type Props = {
  date: string;
  doctors: DoctorDto[];
  timezone: string;
  onClose: () => void;
  onCreated: () => void;
};

export function CreateAppointmentForm({
  date,
  doctors,
  timezone,
  onClose,
  onCreated,
}: Props) {
  const formId = useId();
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const [patientName, setPatientName] = useState("");
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "");
  const [selectedDate, setSelectedDate] = useState(date);
  const [time, setTime] = useState("10:00");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [reason, setReason] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [conflict, setConflict] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const mutation = useMutation({
    mutationFn: createAppointmentRequest,
    onSuccess: (created) => {
      setConflict(null);
      setSuccess(`Saved ${created.patientName}.`);
      onCreated();
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === "APPOINTMENT_OVERLAP") {
        const details = error.details as
          | { conflictingStartsAt?: string | null }
          | undefined;
        const when = details?.conflictingStartsAt
          ? new Date(details.conflictingStartsAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "an existing booking";
        setConflict(
          `${error.message} Conflicting start: ${when}. Your form values are still here — adjust the time and try again.`,
        );
        return;
      }
      setConflict(error instanceof Error ? error.message : "Could not save");
    },
  });

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setConflict(null);
    setSuccess(null);
    const parsed = createAppointmentFormSchema.safeParse({
      patientName,
      doctorId,
      date: selectedDate,
      time,
      durationMinutes,
      reason,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        next[key] = issue.message;
      }
      setFieldErrors(next);
      return;
    }
    setFieldErrors({});
    const startsAt = clinicLocalToUtc(
      parsed.data.date,
      parsed.data.time,
      timezone,
    ).toISOString();
    mutation.mutate({
      patientName: parsed.data.patientName,
      doctorId: parsed.data.doctorId,
      startsAt,
      durationMinutes: parsed.data.durationMinutes,
      reason: parsed.data.reason,
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Close create appointment"
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${formId}-title`}
        className="relative z-50 flex h-full w-full max-w-md flex-col bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id={`${formId}-title`} className="text-base font-semibold text-slate-900">
            Create appointment
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-y-auto px-5 py-4">
          {conflict ? (
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950" role="alert">
              {conflict}
            </p>
          ) : null}
          {success ? (
            <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              {success}
            </p>
          ) : null}

          <label htmlFor={`${formId}-patient`} className="text-sm font-medium text-slate-700">
            Patient name
          </label>
          <input
            ref={firstFieldRef}
            id={`${formId}-patient`}
            value={patientName}
            onChange={(event) => setPatientName(event.target.value)}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            autoComplete="off"
          />
          {fieldErrors.patientName ? (
            <p className="mt-1 text-xs text-red-700">{fieldErrors.patientName}</p>
          ) : null}

          <label htmlFor={`${formId}-doctor`} className="mt-4 text-sm font-medium text-slate-700">
            Doctor
          </label>
          <select
            id={`${formId}-doctor`}
            value={doctorId}
            onChange={(event) => setDoctorId(event.target.value)}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
          >
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
          </select>
          {fieldErrors.doctorId ? (
            <p className="mt-1 text-xs text-red-700">{fieldErrors.doctorId}</p>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`${formId}-date`} className="text-sm font-medium text-slate-700">
                Date
              </label>
              <input
                id={`${formId}-date`}
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
              />
            </div>
            <div>
              <label htmlFor={`${formId}-time`} className="text-sm font-medium text-slate-700">
                Start time
              </label>
              <input
                id={`${formId}-time`}
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
              />
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-500">Interpreted in {timezone}.</p>

          <label htmlFor={`${formId}-duration`} className="mt-4 text-sm font-medium text-slate-700">
            Duration (minutes)
          </label>
          <input
            id={`${formId}-duration`}
            type="number"
            min={1}
            step={1}
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(event.target.value)}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
          />
          {fieldErrors.durationMinutes ? (
            <p className="mt-1 text-xs text-red-700">{fieldErrors.durationMinutes}</p>
          ) : null}

          <label htmlFor={`${formId}-reason`} className="mt-4 text-sm font-medium text-slate-700">
            Reason (optional)
          </label>
          <textarea
            id={`${formId}-reason`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
          />

          <div className="mt-auto flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {mutation.isPending ? "Saving…" : "Create appointment"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

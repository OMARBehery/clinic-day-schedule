"use client";

import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { dicomFileUrl, fetchImagingStudy } from "@/lib/api";

const DicomViewport = dynamic(
  () => import("./DicomViewport").then((mod) => mod.DicomViewport),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[min(70vh,520px)] items-center justify-center rounded-lg bg-slate-950 text-sm text-slate-200">
        Loading viewer…
      </div>
    ),
  },
);

type Props = {
  appointmentId: string;
  onClose: () => void;
};

export function DicomViewerModal({ appointmentId, onClose }: Props) {
  const studyQuery = useQuery({
    queryKey: ["imaging-study", appointmentId],
    queryFn: () => fetchImagingStudy(appointmentId),
  });

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/70"
        aria-label="Close scan viewer"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dicom-title"
        className="relative z-10 flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id="dicom-title" className="text-base font-semibold text-slate-900">
              Imaging study
            </h2>
            <p className="text-xs text-slate-500">
              Safe metadata only. Patient-identifying DICOM tags are not shown.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close viewer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 p-5">
          {studyQuery.isLoading ? (
            <p className="text-sm text-slate-600" role="status">
              Loading study metadata…
            </p>
          ) : studyQuery.isError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {studyQuery.error.message || "Could not load the imaging study."}
            </p>
          ) : studyQuery.data ? (
            <>
              <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Modality</dt>
                  <dd className="font-medium text-slate-900">{studyQuery.data.modality}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Study date</dt>
                  <dd className="font-medium text-slate-900">
                    {studyQuery.data.studyDate ?? "Not available"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Dimensions</dt>
                  <dd className="font-medium text-slate-900">
                    {studyQuery.data.columns && studyQuery.data.rows
                      ? `${studyQuery.data.columns} × ${studyQuery.data.rows}`
                      : "Not available"}
                  </dd>
                </div>
              </dl>
              <DicomViewport
                imageUrl={dicomFileUrl(studyQuery.data.id)}
                onError={() => undefined}
              />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

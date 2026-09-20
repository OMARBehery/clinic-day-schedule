export const statusLabels = {
  scheduled: "Scheduled",
  checked_in: "Checked in",
  completed: "Completed",
  cancelled: "Cancelled",
} as const;

export const statusStyles = {
  scheduled: "bg-sky-50 text-sky-800 ring-sky-200",
  checked_in: "bg-amber-50 text-amber-900 ring-amber-200",
  completed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-200 line-through",
} as const;

export const timelineStatusStyles = {
  scheduled: "bg-sky-600",
  checked_in: "bg-amber-500",
  completed: "bg-emerald-600",
  cancelled: "bg-slate-400",
} as const;

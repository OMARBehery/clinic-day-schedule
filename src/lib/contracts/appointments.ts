import { z } from "zod";

export const appointmentStatuses = [
  "scheduled",
  "checked_in",
  "completed",
  "cancelled",
] as const;

export type AppointmentStatus = (typeof appointmentStatuses)[number];

export const appointmentStatusSchema = z.enum(appointmentStatuses);

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD");

const uuid = z.uuid("must be a UUID");

export const listAppointmentsQuerySchema = z.object({
  date: isoDate,
  doctorId: z
    .string()
    .optional()
    .transform((value) => (value ? value : undefined))
    .pipe(uuid.optional()),
  status: z
    .string()
    .optional()
    .transform((value) => (value ? value : undefined))
    .pipe(appointmentStatusSchema.optional()),
});

export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuerySchema>;

export const createAppointmentSchema = z.object({
  patientName: z
    .string()
    .trim()
    .min(1, "patientName is required")
    .max(120, "patientName is too long"),
  doctorId: uuid,
  startsAt: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      error: "startsAt must be a valid ISO-8601 date-time",
    }),
  durationMinutes: z.coerce
    .number()
    .int("durationMinutes must be a whole number")
    .positive("durationMinutes must be a positive value"),
  reason: z.string().trim().max(500).optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const createAppointmentFormSchema = z.object({
  patientName: z.string().trim().min(1, "Enter a patient name").max(120),
  doctorId: uuid,
  date: isoDate,
  time: z.string().regex(/^\d{2}:\d{2}$/, "Choose a start time"),
  durationMinutes: z.coerce
    .number()
    .int("Duration must be a whole number of minutes")
    .positive("Duration must be greater than zero"),
  reason: z.string().trim().max(500).optional(),
});

export type CreateAppointmentFormInput = z.infer<
  typeof createAppointmentFormSchema
>;

export const updateAppointmentStatusSchema = z.object({
  status: appointmentStatusSchema,
});

export type UpdateAppointmentStatusInput = z.infer<
  typeof updateAppointmentStatusSchema
>;

export const imagingStudySchema = z.object({
  id: uuid,
  appointmentId: uuid,
  modality: z.string(),
  description: z.string(),
  studyDate: z.string().nullable(),
  rows: z.number().int().nullable(),
  columns: z.number().int().nullable(),
});

export const appointmentSchema = z.object({
  id: uuid,
  patientName: z.string(),
  doctorId: uuid,
  doctorName: z.string(),
  startsAt: z.string(),
  durationMinutes: z.number().int().positive(),
  status: appointmentStatusSchema,
  reason: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  imagingStudy: imagingStudySchema
    .pick({ id: true, modality: true, description: true })
    .nullable(),
});

export type AppointmentDto = z.infer<typeof appointmentSchema>;
export type ImagingStudyDto = z.infer<typeof imagingStudySchema>;

export const doctorSchema = z.object({
  id: uuid,
  name: z.string(),
});

export type DoctorDto = z.infer<typeof doctorSchema>;

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
  requestId: z.string(),
});

export type ApiErrorBody = z.infer<typeof apiErrorSchema>;

import { relations } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "scheduled",
  "checked_in",
  "completed",
  "cancelled",
]);

export const doctors = pgTable("doctors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
});

export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientName: text("patient_name").notNull(),
  doctorId: uuid("doctor_id")
    .notNull()
    .references(() => doctors.id),
  startsAt: timestamp("starts_at", { withTimezone: true, mode: "date" }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true, mode: "date" }).notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  status: appointmentStatusEnum("status").notNull().default("scheduled"),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const imagingStudies = pgTable("imaging_studies", {
  id: uuid("id").primaryKey().defaultRandom(),
  appointmentId: uuid("appointment_id")
    .notNull()
    .references(() => appointments.id, { onDelete: "cascade" }),
  modality: text("modality").notNull(),
  description: text("description").notNull(),
  dicomFilePath: text("dicom_file_path").notNull(),
});

export const doctorsRelations = relations(doctors, ({ many }) => ({
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  doctor: one(doctors, {
    fields: [appointments.doctorId],
    references: [doctors.id],
  }),
  imagingStudies: many(imagingStudies),
}));

export const imagingStudiesRelations = relations(imagingStudies, ({ one }) => ({
  appointment: one(appointments, {
    fields: [imagingStudies.appointmentId],
    references: [appointments.id],
  }),
}));

export type DoctorRow = typeof doctors.$inferSelect;
export type AppointmentRow = typeof appointments.$inferSelect;
export type ImagingStudyRow = typeof imagingStudies.$inferSelect;

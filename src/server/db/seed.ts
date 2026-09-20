import { config } from "dotenv";
import { getDb, getSql } from "./client";
import { appointments, doctors, imagingStudies } from "./schema";
import { DICOM_FIXTURE_PATH, seedIds } from "./ids";
import { clinicLocalToUtc, todayInClinic } from "@/lib/timezone";

config({ path: ".env", quiet: true });
config({ path: ".env.local", override: true, quiet: true });

export async function seedDatabase() {
  const db = getDb();
  const today = todayInClinic();

  await db.delete(imagingStudies);
  await db.delete(appointments);
  await db.delete(doctors);

  await db.insert(doctors).values([
    { id: seedIds.doctors.amira, name: "Dr. Amira Hassan" },
    { id: seedIds.doctors.omar, name: "Dr. Omar Khalil" },
    { id: seedIds.doctors.lina, name: "Dr. Lina Farouk" },
  ]);

  await db.insert(appointments).values([
    {
      id: seedIds.appointments.noraScan,
      patientName: "Nora El-Sayed",
      doctorId: seedIds.doctors.amira,
      startsAt: clinicLocalToUtc(today, "09:00"),
      durationMinutes: 30,
      status: "scheduled",
      reason: "CT chest follow-up (fictional)",
    },
    {
      id: seedIds.appointments.karimFollowup,
      patientName: "Karim Adel",
      doctorId: seedIds.doctors.amira,
      startsAt: clinicLocalToUtc(today, "09:30"),
      durationMinutes: 30,
      status: "scheduled",
      reason: "Results review",
    },
    {
      id: seedIds.appointments.laylaCheckin,
      patientName: "Layla Mostafa",
      doctorId: seedIds.doctors.amira,
      startsAt: clinicLocalToUtc(today, "11:00"),
      durationMinutes: 45,
      status: "checked_in",
      reason: "Ultrasound consult",
    },
    {
      id: seedIds.appointments.yusufOrtho,
      patientName: "Yusuf Nabil",
      doctorId: seedIds.doctors.omar,
      startsAt: clinicLocalToUtc(today, "10:00"),
      durationMinutes: 30,
      status: "scheduled",
      reason: "Knee pain assessment",
    },
    {
      id: seedIds.appointments.hanaCompleted,
      patientName: "Hana Ibrahim",
      doctorId: seedIds.doctors.omar,
      startsAt: clinicLocalToUtc(today, "08:30"),
      durationMinutes: 30,
      status: "completed",
      reason: "Post-op check",
    },
    {
      id: seedIds.appointments.samiCancelled,
      patientName: "Sami Fawzy",
      doctorId: seedIds.doctors.omar,
      startsAt: clinicLocalToUtc(today, "10:00"),
      durationMinutes: 30,
      status: "cancelled",
      reason: "Patient rescheduled",
    },
    {
      id: seedIds.appointments.raniaInternal,
      patientName: "Rania Tarek",
      doctorId: seedIds.doctors.lina,
      startsAt: clinicLocalToUtc(today, "14:00"),
      durationMinutes: 30,
      status: "scheduled",
      reason: "Annual physical",
    },
  ]);

  await db.insert(imagingStudies).values({
    id: seedIds.imaging.ctChest,
    appointmentId: seedIds.appointments.noraScan,
    modality: "CT",
    description: "Anonymized single-frame CT chest sample",
    dicomFilePath: DICOM_FIXTURE_PATH,
  });

  return { date: today };
}

async function main() {
  const result = await seedDatabase();
  console.log(`Seeded fictional clinic data for ${result.date}`);
  await getSql().end({ timeout: 5 });
}

if (process.argv[1]?.includes("seed.ts")) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

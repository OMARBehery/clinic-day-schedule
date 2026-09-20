import { readFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import dicomParser from "dicom-parser";
import type { ImagingStudyDto } from "@/lib/contracts";
import { AppError } from "@/lib/errors";
import { getDb } from "@/server/db/client";
import { imagingStudies } from "@/server/db/schema";

const SAFE_TAGS = {
  modality: "x00080060",
  studyDate: "x00080020",
  rows: "x00280010",
  columns: "x00280011",
} as const;

function formatStudyDate(raw: string | undefined) {
  if (!raw || raw.length !== 8) {
    return null;
  }
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

export async function getImagingStudyForAppointment(appointmentId: string) {
  const db = getDb();
  const [study] = await db
    .select()
    .from(imagingStudies)
    .where(eq(imagingStudies.appointmentId, appointmentId))
    .limit(1);
  if (!study) {
    throw new AppError(
      "IMAGING_STUDY_NOT_FOUND",
      "No imaging study is attached to this appointment",
      404,
    );
  }
  return toSafeMetadata(study);
}

export async function getImagingStudyById(id: string) {
  const db = getDb();
  const [study] = await db
    .select()
    .from(imagingStudies)
    .where(eq(imagingStudies.id, id))
    .limit(1);
  if (!study) {
    throw new AppError("IMAGING_STUDY_NOT_FOUND", "Imaging study not found", 404);
  }
  return study;
}

export async function readDicomFile(relativePath: string) {
  const fixturesRoot = path.resolve(process.cwd(), "fixtures", "dicom");
  const absolute = path.resolve(process.cwd(), relativePath);
  const relative = path.relative(fixturesRoot, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new AppError("INVALID_DICOM_PATH", "Invalid imaging file path", 400);
  }
  try {
    return await readFile(absolute);
  } catch {
    throw new AppError("DICOM_FILE_MISSING", "DICOM file is not available", 404);
  }
}

export async function toSafeMetadata(study: {
  id: string;
  appointmentId: string;
  modality: string;
  description: string;
  dicomFilePath: string;
}): Promise<ImagingStudyDto> {
  const bytes = await readDicomFile(study.dicomFilePath);
  let parsedModality = study.modality;
  let studyDate: string | null = null;
  let rows: number | null = null;
  let columns: number | null = null;

  try {
    const dataSet = dicomParser.parseDicom(new Uint8Array(bytes));
    parsedModality = dataSet.string(SAFE_TAGS.modality) || study.modality;
    studyDate = formatStudyDate(dataSet.string(SAFE_TAGS.studyDate));
    rows = dataSet.uint16(SAFE_TAGS.rows) ?? null;
    columns = dataSet.uint16(SAFE_TAGS.columns) ?? null;
  } catch {
    throw new AppError(
      "DICOM_UNREADABLE",
      "The DICOM file could not be read",
      422,
    );
  }

  return {
    id: study.id,
    appointmentId: study.appointmentId,
    modality: parsedModality,
    description: study.description,
    studyDate,
    rows,
    columns,
  };
}

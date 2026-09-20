import { AppError } from "@/lib/errors";
import { getImagingStudyById, readDicomFile } from "@/server/imaging";
import { apiHandler, getRequestId } from "@/server/http";

export const runtime = "nodejs";

export const GET = apiHandler(async (request, context) => {
  const { id } = await context.params;
  if (!id) {
    throw new AppError("VALIDATION_ERROR", "Imaging study id is required", 400);
  }
  const study = await getImagingStudyById(id);
  const bytes = await readDicomFile(study.dicomFilePath);
  return new Response(Uint8Array.from(bytes), {
    status: 200,
    headers: {
      "content-type": "application/dicom",
      "content-disposition": `inline; filename="${id}.dcm"`,
      "cache-control": "private, max-age=60",
      "x-request-id": getRequestId(request),
    },
  });
});

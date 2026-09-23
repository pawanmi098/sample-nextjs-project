/**
 * POST /api/documents/upload — where a document row sends the file the moment
 * it is chosen.
 *
 * PROVISIONAL: the real service isn't wired up yet, so this route validates
 * the upload and acknowledges it without storing anything. The page points at
 * it through `documents.upload.endpoint` in src/data/documentUploadContent.json,
 * so swapping in the real URL is a JSON edit.
 *
 * Failures answer with a `code` rather than a sentence: the copy for each one
 * lives in that same JSON (`documents.status.errors`), which keeps every
 * string a traveller reads in one place.
 */

const MAX_BYTES = 7 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "application/pdf"]);

function refuse(code, status) {
  return Response.json({ error: { code } }, { status });
}

export async function POST(request) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return refuse("failed", 400);
  }

  const file = form.get("file");
  if (!file || typeof file === "string" || file.size === 0) return refuse("failed", 400);
  if (file.size > MAX_BYTES) return refuse("tooLarge", 413);
  if (!ACCEPTED_TYPES.has(file.type)) return refuse("type", 415);

  return Response.json(
    {
      travellerId: form.get("travellerId"),
      documentId: form.get("documentId"),
      file: { name: file.name, size: file.size, type: file.type },
    },
    { status: 201 },
  );
}

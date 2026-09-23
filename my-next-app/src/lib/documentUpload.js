/**
 * A document row's upload state, and the request that drives it.
 *
 * Choosing a file starts the upload straight away — there is no submit step —
 * so a row moves `idle → uploading → uploaded | failed`, and back to `idle`
 * when the upload is cancelled. Figma "Accordian" (1338:114192) draws all
 * four: the formats line and the "Upload" button, "Uploading... 60%" over a
 * progress bar with a cancel disc, the file name with a green tick, and the
 * red-edged row with "Try again".
 *
 * The request uses XMLHttpRequest rather than fetch, because only XHR reports
 * how much of the body has gone out — which is the number the row shows.
 * Everything here is framework-free and takes its endpoint, limits and copy
 * from the caller, so the page's JSON stays the one place copy lives.
 */

export const UPLOAD_IDLE = "idle";
export const UPLOAD_UPLOADING = "uploading";
export const UPLOAD_UPLOADED = "uploaded";
export const UPLOAD_FAILED = "failed";

/** The rejection codes shared with the API route, keyed to `status.errors`. */
export const REJECTED_TOO_LARGE = "tooLarge";
export const REJECTED_TYPE = "type";
export const UPLOAD_ERROR = "failed";

/** `error.name` of the rejection a cancelled upload settles with. */
export const UPLOAD_ABORTED = "AbortError";

export const IDLE_STATE = { status: UPLOAD_IDLE };

/**
 * Does the file match one entry of an `accept` list (".png,image/png,image/*")?
 * The browser applies the same list to the picker, but a file can still arrive
 * by drag or from a picker that ignores it.
 */
function accepts(file, accept) {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();

  return accept
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .some((entry) => {
      if (entry.startsWith(".")) return name.endsWith(entry);
      if (entry.endsWith("/*")) return type.startsWith(entry.slice(0, -1));
      return type === entry;
    });
}

/**
 * Why this file can't be sent, or `null` if it can — checked before the
 * request so an oversized file isn't uploaded only to be turned away.
 *
 * @returns "tooLarge" | "type" | null
 */
export function fileRejection(file, { maxBytes, accept } = {}) {
  if (!file) return UPLOAD_ERROR;
  if (maxBytes && file.size > maxBytes) return REJECTED_TOO_LARGE;
  if (!accepts(file, accept)) return REJECTED_TYPE;
  return null;
}

function rejection(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function parse(request) {
  try {
    return JSON.parse(request.responseText);
  } catch {
    return null;
  }
}

/**
 * POST the file and follow it out.
 *
 * @param endpoint    the upload API
 * @param file        the chosen File
 * @param fields      extra form fields, e.g. `{ travellerId, documentId }`
 * @param onProgress  `(percent) => void`, 0–100, whole numbers
 * @returns `{ done, cancel }` — `done` resolves with the parsed body, or
 *          rejects with an Error carrying `code` (one of the rejection codes)
 *          and, when cancelled, `name === "AbortError"`
 */
export function startUpload({ endpoint, file, fields = {}, onProgress }) {
  const request = new XMLHttpRequest();
  const body = new FormData();
  body.append("file", file, file.name);
  Object.entries(fields).forEach(([name, value]) => body.append(name, value));

  const done = new Promise((resolve, reject) => {
    request.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable || !onProgress) return;
      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    });

    request.addEventListener("load", () => {
      const payload = parse(request);
      if (request.status >= 200 && request.status < 300) {
        resolve(payload ?? {});
        return;
      }
      reject(rejection(payload?.error?.code ?? UPLOAD_ERROR));
    });

    request.addEventListener("error", () => reject(rejection(UPLOAD_ERROR)));
    request.addEventListener("timeout", () => reject(rejection(UPLOAD_ERROR)));
    request.addEventListener("abort", () => {
      const cancelled = rejection(UPLOAD_ABORTED);
      cancelled.name = UPLOAD_ABORTED;
      reject(cancelled);
    });

    request.open("POST", endpoint);
    request.send(body);
  });

  return { done, cancel: () => request.abort() };
}

/** How many of a traveller's documents are through — the accordion's count. */
export function uploadedCount(states) {
  return Object.values(states).filter(({ status }) => status === UPLOAD_UPLOADED).length;
}

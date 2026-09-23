"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { ResponsiveCopy } from "@/components/common/PageIntro/PageIntro";
import { format } from "@/lib/trip";
import {
  IDLE_STATE,
  UPLOAD_ABORTED,
  UPLOAD_ERROR,
  UPLOAD_FAILED,
  UPLOAD_IDLE,
  UPLOAD_UPLOADED,
  UPLOAD_UPLOADING,
  fileRejection,
  startUpload,
  uploadedCount,
} from "@/lib/documentUpload";
import DocumentGuide from "../DocumentGuide/DocumentGuide";
import styles from "./TravellerDocuments.module.scss";

/**
 * One traveller's accordion of required documents — Figma web "Accordian"
 * (761:196646, with its uploaded / failed / uploading rows at 1338:114192).
 *
 * Choosing a file uploads it there and then: the row goes to "Uploading… 60%"
 * over a progress bar with a cancel disc, and settles on the file name with a
 * green tick, or on the red-edged row with "Try again". The head's
 * "1 of 5 uploaded" counts the rows that got through, so the card owns the
 * state for its five documents and is the page's one upload client island.
 *
 * "Try again" resends the same file when the upload itself failed; when the
 * file was the problem (too large, wrong type) it opens the picker instead,
 * because resending it would fail the same way.
 *
 * @param content    documentUploadContent.documents
 * @param traveller  `{ id, position, firstName, lastName, primary, uploads? }`
 *                   — `uploads` seeds rows already uploaded, keyed by document id
 * @param open       whether the card starts open (the first traveller's does)
 */
export default function TravellerDocuments({ content, traveller, open = false }) {
  const { required, upload, status, chevronIcon } = content;
  const [isOpen, setIsOpen] = useState(open);
  const [states, setStates] = useState(() => traveller.uploads ?? {});
  // The live request per document id, so its cancel button can call abort.
  const pending = useRef({});

  const name = `${traveller.firstName} ${traveller.lastName}`;

  const setDocumentState = useCallback((id, next) => {
    setStates((current) => ({
      ...current,
      [id]: typeof next === "function" ? next(current[id] ?? IDLE_STATE) : next,
    }));
  }, []);

  const send = (doc, file) => {
    const { id } = doc;
    const rejected = fileRejection(file, { maxBytes: upload.maxBytes, accept: upload.accept });

    // A file the browser shouldn't have offered: refused here, so nothing is
    // uploaded only to be turned away. `file` is left off the state, which is
    // what sends "Try again" to the picker rather than back to the API.
    if (rejected) {
      setDocumentState(id, { status: UPLOAD_FAILED, error: status.errors[rejected] ?? status.errors.failed });
      return;
    }

    setDocumentState(id, { status: UPLOAD_UPLOADING, percent: 0, fileName: file.name });

    const request = startUpload({
      endpoint: upload.endpoint,
      file,
      fields: { travellerId: traveller.id, documentId: id },
      // A late tick from a request that has already settled must not drag the
      // row back into "uploading".
      onProgress: (percent) =>
        setDocumentState(id, (current) =>
          current.status === UPLOAD_UPLOADING ? { ...current, percent } : current,
        ),
    });

    pending.current[id] = request.cancel;

    request.done
      .then((payload) =>
        setDocumentState(id, { status: UPLOAD_UPLOADED, fileName: payload?.file?.name ?? file.name }),
      )
      .catch((error) => {
        if (error.name === UPLOAD_ABORTED) {
          setDocumentState(id, IDLE_STATE);
          return;
        }
        setDocumentState(id, {
          status: UPLOAD_FAILED,
          error: status.errors[error.code] ?? status.errors.failed,
          // Only the upload failing leaves the file worth resending.
          file: error.code === UPLOAD_ERROR ? file : null,
        });
      })
      .finally(() => {
        delete pending.current[id];
      });
  };

  const handlePick = (doc, event) => {
    const file = event.target.files?.[0];
    // Cleared, so cancelling an upload and choosing that same file again still
    // fires a change event.
    event.target.value = "";
    if (file) send(doc, file);
  };

  const handleCancel = (doc) => pending.current[doc.id]?.();

  const handleRetry = (doc) => {
    const file = states[doc.id]?.file;
    if (file) send(doc, file);
  };

  const uploaded = uploadedCount(states);

  return (
    <details
      className={styles.card}
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary className={styles.summary}>
        <span className={styles.identity}>
          <span className={styles.nameRow}>
            <span className={styles.name}>{name}</span>
            {traveller.primary && <span className={styles.chip}>{content.primaryLabel}</span>}
          </span>
          <span className={styles.position}>{traveller.position}</span>
        </span>
        <span className={styles.count}>
          {format(content.uploadedLabel, { count: uploaded, total: required.length })}
        </span>
        {/* #25304B at 20 on mweb, #000099 at 24 on web. */}
        <Image
          src={chevronIcon.mobile}
          alt=""
          aria-hidden="true"
          width={20}
          height={20}
          className={`${styles.chevron} ${styles.chevronMobile}`}
        />
        <Image
          src={chevronIcon.desktop}
          alt=""
          aria-hidden="true"
          width={24}
          height={24}
          className={`${styles.chevron} ${styles.chevronDesktop}`}
        />
      </summary>

      <ul className={styles.documents}>
        {required.map((doc) => (
          <DocumentRow
            key={doc.id}
            content={content}
            traveller={traveller}
            travellerName={name}
            doc={doc}
            state={states[doc.id] ?? IDLE_STATE}
            onPick={handlePick}
            onCancel={handleCancel}
            onRetry={handleRetry}
          />
        ))}
      </ul>
    </details>
  );
}

/** One name per document for labels read out by a screen reader. */
const plainLabel = (label) => (typeof label === "string" ? label : label.desktop);

/**
 * A document row in whichever of the four states it is in — Figma
 * "Frame 1321318880" (idle), "Frame 1321318879" (uploaded), "error" and
 * "uploading" (1338:114192).
 *
 * The second line and the control on the right change together; everything
 * else — the icon disc, the title and its guide — stays put. The outcome is
 * announced from a live region that is in the DOM from the first render, so a
 * screen reader isn't handed a region and its message at the same moment.
 */
function DocumentRow({ content, traveller, travellerName, doc, state, onPick, onCancel, onRetry }) {
  const { upload, status } = content;
  const inputId = `${traveller.id}-${doc.id}`;
  const tipId = `${inputId}-tip`;
  const label = plainLabel(doc.label);
  const tokens = { document: label, traveller: travellerName };

  const uploading = state.status === UPLOAD_UPLOADING;
  const failed = state.status === UPLOAD_FAILED;
  // Each state lays its row out a little differently; see the module's grid.
  const rowState =
    {
      [UPLOAD_UPLOADING]: styles.uploading,
      [UPLOAD_UPLOADED]: styles.uploaded,
      [UPLOAD_FAILED]: styles.failed,
    }[state.status] ?? "";
  const percent = uploading ? (state.percent ?? 0) : 0;
  // The file itself was refused, so the way back is a different file.
  const retryPicksFile = failed && !state.file;

  const fileInput = (
    <input
      id={inputId}
      type="file"
      name={`documents[${traveller.id}][${doc.id}]`}
      accept={upload.accept}
      className={styles.uploadInput}
      aria-label={format(upload.ariaLabel, tokens)}
      onChange={(event) => onPick(doc, event)}
    />
  );

  return (
    <li className={`${styles.document} ${rowState}`.trimEnd()}>
      <span className={styles.docIcon}>
        <Image src={doc.icon} alt="" aria-hidden="true" width={24} height={24} />
      </span>
      <div className={styles.docText}>
        <div className={styles.docTitleRow}>
          <h3 className={styles.docTitle}>
            <ResponsiveCopy copy={doc.label} />
          </h3>
          {doc.guide ? (
            <span className={styles.info}>
              <DocumentGuide
                content={content.guide}
                guide={doc.guide}
                infoIcon={content.infoIcon}
                infoLabel={format(content.infoLabel, { document: label })}
                className={styles.infoButton}
              />
            </span>
          ) : (
            <span className={styles.info}>
              <button
                type="button"
                className={styles.infoButton}
                aria-label={format(content.infoLabel, { document: label })}
                aria-describedby={tipId}
              >
                <Image src={content.infoIcon} alt="" aria-hidden="true" width={24} height={24} />
              </button>
              {/* PROVISIONAL copy: Figma draws the icon, not what it says. */}
              <span id={tipId} role="tooltip" className={styles.tip}>
                {doc.hint}
              </span>
            </span>
          )}
        </div>

        {/* "photo.png" once it is through, the red message when it isn't,
            "Uploading… 60%" on the way, and the formats before any of it. */}
        {state.status === UPLOAD_UPLOADED && <p className={styles.fileName}>{state.fileName}</p>}
        {failed && <p className={styles.error}>{state.error}</p>}
        {uploading && <p className={styles.formats}>{format(status.uploadingLabel, { percent })}</p>}
        {state.status === UPLOAD_IDLE && <p className={styles.formats}>{content.formats}</p>}

        <span className={styles.announcement} role="status">
          {state.status === UPLOAD_UPLOADED && format(status.uploadedLabel, tokens)}
          {failed && state.error}
        </span>
      </div>

      {state.status === UPLOAD_IDLE && (
        <label htmlFor={inputId} className={styles.button}>
          {fileInput}
          <Image src={upload.icon} alt="" aria-hidden="true" width={24} height={24} className={styles.buttonIcon} />
          {upload.label}
        </label>
      )}

      {uploading && (
        <>
          <button
            type="button"
            className={styles.disc}
            aria-label={format(status.cancelLabel, tokens)}
            onClick={() => onCancel(doc)}
          >
            <Image src={status.cancelIcon} alt="" aria-hidden="true" width={44} height={44} />
          </button>
          <span
            className={styles.progress}
            role="progressbar"
            aria-label={format(status.progressLabel, tokens)}
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span className={styles.progressValue} style={{ width: `${percent}%` }} />
          </span>
        </>
      )}

      {state.status === UPLOAD_UPLOADED && (
        <span className={styles.disc}>
          <Image src={status.uploadedIcon} alt="" aria-hidden="true" width={44} height={44} />
        </span>
      )}

      {failed &&
        (retryPicksFile ? (
          <label htmlFor={inputId} className={styles.button}>
            {fileInput}
            <Image src={status.retry.icon} alt="" aria-hidden="true" width={24} height={24} className={styles.buttonIcon} />
            {status.retry.label}
          </label>
        ) : (
          <button
            type="button"
            className={styles.button}
            aria-label={format(status.retry.ariaLabel, tokens)}
            onClick={() => onRetry(doc)}
          >
            <Image src={status.retry.icon} alt="" aria-hidden="true" width={24} height={24} className={styles.buttonIcon} />
            {status.retry.label}
          </button>
        ))}
    </li>
  );
}

"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { format } from "@/lib/trip";
import ReviewSummary from "../ReviewSummary/ReviewSummary";
import ReviewConsent from "../ReviewConsent/ReviewConsent";
import styles from "./ReviewApplicationModal.module.scss";

/**
 * "Review your application" — Figma web "Popup with Overlay" (595:51941).
 *
 * The desktop presentation of the review step: a 480-wide panel pinned to the
 * right of the viewport over a gradient scrim, holding the same `ReviewSummary`
 * the /review-application page renders below desktop, then the "Pay" button
 * that posts the traveller details form.
 *
 * Nothing in here is a second source of truth — the caller hands it the live
 * form values — and the two "Edit" links close the popup and put the caret
 * back on the section they name, so a correction is made in the form rather
 * than twice over.
 *
 * Portalled to <body>, like common/DropdownSurface's sheet, so it clears the
 * page's own stacking contexts — the sticky header and the fixed bottom bar.
 *
 * @param content      travellerDetailsContent.review
 * @param travellers   `[{ id, name, type }]` — the Adult/Child label included
 * @param primary      `{ name, phone, email }` for the primary traveller
 * @param summary      buildPriceSummary() — `{ rows, totalLabel, total }`
 * @param formId       the form the "Pay" button submits
 * @param consent      whether the payment acknowledgement has been ticked
 * @param consentError message shown when "Pay" is pressed without it
 * @param errorIcon    form.messageIcons.error, for that message
 * @param onEdit       `(elementId) => void` — close and go back to a section
 */
export default function ReviewApplicationModal({
  content,
  travellers,
  primary,
  summary,
  formId,
  consent,
  onConsentChange,
  consentError,
  errorIcon,
  onClose,
  onEdit,
}) {
  const { title, subtitle, closeLabel, closeIcon, payLabel } = content;
  const panelRef = useRef(null);
  const closeRef = useRef(null);

  // Focus starts on the close button, goes back to whatever opened the popup,
  // and stays inside the panel while it's open. Escape and the scrim close it.
  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = panelRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [onClose]);

  return createPortal(
    <div className={styles.layer}>
      {/* Escape and the "Close" button close the popup too, so the scrim needs
          no keyboard role of its own. */}
      <div className={styles.scrim} aria-hidden="true" onClick={onClose} />

      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-title"
        aria-describedby="review-subtitle"
      >
        {/* "Frame 2147227616" + "Divider": the title row, the sub-line, and the
            rule that stays put while the cards below it scroll. */}
        <div className={styles.head}>
          <div className={styles.headRow}>
            <h2 id="review-title" className={styles.title}>
              {title}
            </h2>
            <button ref={closeRef} type="button" className={styles.close} onClick={onClose}>
              <Image src={closeIcon} alt="" aria-hidden="true" width={24} height={24} />
              <span className={styles.closeText}>{closeLabel}</span>
            </button>
          </div>
          <p id="review-subtitle" className={styles.subtitle}>
            {subtitle}
          </p>
        </div>

        <div className={styles.body}>
          <ReviewSummary
            content={content}
            travellers={travellers}
            primary={primary}
            summary={summary}
            onEdit={onEdit}
            headingLevel={3}
          />
        </div>

        {/* "Frame 2147227611" + "Frame 2147227542": the acknowledgement and the
            button, kept in view so a tall application still pays from here. */}
        <div className={styles.foot}>
          <ReviewConsent
            content={content.consent}
            checked={consent}
            onChange={onConsentChange}
            error={consentError}
            errorIcon={errorIcon}
          />

          <button
            type="submit"
            form={formId}
            name="intent"
            value="pay"
            className={consent ? styles.pay : `${styles.pay} ${styles.payInactive}`}
            aria-disabled={consent ? undefined : true}
          >
            {format(payLabel, { amount: summary.total })}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

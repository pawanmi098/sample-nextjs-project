"use client";

import { useState } from "react";
import BottomStickyBar from "@/components/common/BottomStickyBar/BottomStickyBar";
import { format } from "@/lib/trip";
import ReviewConsent from "../ReviewConsent/ReviewConsent";
import styles from "./ReviewPayment.module.scss";

/**
 * The foot of the review application page — Figma mweb "Frame 2147227611"
 * (999:265327) and the "Primary Bottom Sticky" under it (999:265332).
 *
 * The page's one client island: it owns the payment acknowledgement so the
 * sticky "Pay" button can grey out until it's ticked, the way the traveller
 * details form's own button does. Pressing it anyway reveals the error rather
 * than swallowing the click — `aria-disabled`, not `disabled`.
 *
 * @param content    travellerDetailsContent.review
 * @param total      the formatted amount for the button's label
 * @param errorIcon  form.messageIcons.error
 * @param payAction  server action the form posts to
 */
export default function ReviewPayment({ content, total, errorIcon, payAction }) {
  const [consent, setConsent] = useState(false);
  const [tried, setTried] = useState(false);
  const formId = "review-payment-form";

  const handleSubmit = (event) => {
    if (consent) return;
    event.preventDefault();
    setTried(true);
  };

  return (
    <form id={formId} action={payAction} onSubmit={handleSubmit} noValidate className={styles.form}>
      <ReviewConsent
        content={content.consent}
        checked={consent}
        onChange={(next) => {
          setConsent(next);
          if (next) setTried(false);
        }}
        error={tried && !consent ? content.consent.error : undefined}
        errorIcon={errorIcon}
      />

      <BottomStickyBar
        label={format(content.payLabel, { amount: total })}
        formId={formId}
        inactive={!consent}
        review
      />
    </form>
  );
}

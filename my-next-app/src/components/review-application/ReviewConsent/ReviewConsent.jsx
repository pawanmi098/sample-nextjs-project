import Image from "next/image";
import styles from "./ReviewConsent.module.scss";

/**
 * The payment acknowledgement under the summary — Figma mweb
 * "Frame 2147227611" (999:265327) and the web popup's (595:52030).
 *
 * A real checkbox moved off screen with the icon beside it as the visual, like
 * traveller-details/ConsentList. The box alone is the click target rather than
 * the whole row, because the copy carries the Terms link, which has its own
 * destination.
 *
 * PROVISIONAL: both frames draw this ticked and neither draws an error for it.
 * It starts empty, and pressing "Pay" without it turns the box red and says so,
 * following the form's own consents (I999:264813;4361:5832).
 *
 * @param content    review.consent
 * @param checked    controlled by whichever surface is showing this
 * @param error      the message to show under it, or nothing
 * @param errorIcon  form.messageIcons.error, for that message
 */
export default function ReviewConsent({ content, checked, onChange, error, errorIcon, name }) {
  const errorId = error ? "review-consent-error" : undefined;

  return (
    <div className={styles.consent}>
      <div className={styles.row}>
        <input
          id="review-consent"
          type="checkbox"
          name={name}
          className={styles.input}
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-labelledby="review-consent-label"
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
        />
        <label htmlFor="review-consent" className={styles.box}>
          <Image
            src={checked ? content.checkedIcon : error ? content.uncheckedErrorIcon : content.uncheckedIcon}
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
            className={styles.icon}
          />
        </label>
        <span
          id="review-consent-label"
          className={styles.text}
          dangerouslySetInnerHTML={{ __html: content.label }}
        />
      </div>
      {error && (
        <p id={errorId} className={styles.error}>
          <Image src={errorIcon} alt="" aria-hidden="true" width={16} height={16} />
          {error}
        </p>
      )}
    </div>
  );
}

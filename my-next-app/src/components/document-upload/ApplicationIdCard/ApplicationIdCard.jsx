import CopyReference from "../CopyReference/CopyReference";
import styles from "./ApplicationIdCard.module.scss";

/**
 * "Visa Application ID" — Figma "Payment details 4" (948:243273): the title, a
 * dotted rule, the booking ID with its "Copy" link, and where the
 * confirmation went.
 *
 * @param content  documentUploadContent.application; `confirmation` is an
 *                 HTML string whose <span> is the email address
 * @param copy     documentUploadContent.copy
 */
export default function ApplicationIdCard({ content, copy }) {
  return (
    <section className={styles.card} aria-labelledby="application-id-title">
      <h2 id="application-id-title" className={styles.title}>
        {content.title}
      </h2>
      <span className={styles.rule} aria-hidden="true" />
      <CopyReference label={content.bookingLabel} value={content.bookingId} content={copy} />
      <p className={styles.confirmation} dangerouslySetInnerHTML={{ __html: content.confirmation }} />
    </section>
  );
}

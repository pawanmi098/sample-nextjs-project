import Image from "next/image";
import CopyReference from "../CopyReference/CopyReference";
import styles from "./PaymentSummary.module.scss";

/**
 * "Payment Summary" — Figma "Frame 2147227933" (948:243822): what was paid,
 * row by row, the transaction ID with its "Copy" link, and a note.
 *
 * The rows are the review step's own (`buildPriceSummary()`), so the amounts
 * here always match what the traveller was asked to pay.
 *
 * A native <details>, open to start with. Figma draws its chevron pointing
 * down while open; closed, it turns to point right. PROVISIONAL: no frame
 * draws the closed state. The mweb frame (1207:85484) draws no chevron at
 * all, so below desktop there's none.
 *
 * @param content  documentUploadContent.payment
 * @param summary  buildPriceSummary() — `{ rows, totalLabel, total }`
 * @param copy     documentUploadContent.copy
 */
export default function PaymentSummary({ content, summary, copy }) {
  return (
    <details className={styles.section} open>
      <summary className={styles.summary}>
        <h2 className={styles.title}>{content.title}</h2>
        <Image src={content.chevronIcon} alt="" aria-hidden="true" width={16} height={16} className={styles.chevron} />
      </summary>
      <div className={styles.card}>
        <dl className={styles.price}>
          {summary.rows.map((row) => (
            <div key={row.id} className={styles.row}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
          <span className={styles.rule} aria-hidden="true" />
          <div className={`${styles.row} ${styles.total}`}>
            <dt>{summary.totalLabel}</dt>
            <dd>{summary.total}</dd>
          </div>
        </dl>
        <div className={styles.foot}>
          <CopyReference label={content.transactionLabel} value={content.transactionId} content={copy} size="small" />
          <p className={styles.note}>{content.note}</p>
        </div>
      </div>
    </details>
  );
}

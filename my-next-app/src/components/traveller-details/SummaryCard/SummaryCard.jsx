import Image from "next/image";
import styles from "./SummaryCard.module.scss";

/**
 * "Visa Summary" / "Trip Summary" — Figma "Frame 2147227904" (595:47266) and
 * "Frame 2147227903" (595:47393): a section title over a collapsed card.
 *
 * The card is a native <details>, so it opens without JavaScript. Figma only
 * draws it closed; the opened list of `details` is PROVISIONAL.
 *
 * @param id       prefix for the section heading id
 * @param content  `{ title, badge: { label, icon }, name, facts?, details, chevronIcon }`
 * @param variant  "visa" (r12 card) or "trip" (r16 card), as in Figma
 */
export default function SummaryCard({ id, content, variant = "visa" }) {
  const { title, badge, name, facts, details, chevronIcon } = content;
  const titleId = `${id}-title`;

  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      <details className={variant === "trip" ? `${styles.card} ${styles.cardTrip}` : styles.card}>
        <summary className={styles.summary}>
          <span className={styles.text}>
            <span className={styles.badge}>
              <Image src={badge.icon} alt="" aria-hidden="true" width={20} height={20} />
              {badge.label}
            </span>
            <span className={styles.name}>{name}</span>
            {facts?.length > 0 && (
              <span className={styles.facts}>
                {facts.map((fact, index) => (
                  <span key={fact} className={styles.fact}>
                    {index > 0 && (
                      <span className={styles.separator} aria-hidden="true">
                        |
                      </span>
                    )}
                    {fact}
                  </span>
                ))}
              </span>
            )}
          </span>
          <Image src={chevronIcon} alt="" aria-hidden="true" width={20} height={20} className={styles.chevron} />
        </summary>
        <dl className={styles.details}>
          {details.map((row) => (
            <div key={row.label} className={styles.detail}>
              <dt className={styles.detailLabel}>{row.label}</dt>
              <dd className={styles.detailValue}>{row.value}</dd>
            </div>
          ))}
        </dl>
      </details>
    </section>
  );
}

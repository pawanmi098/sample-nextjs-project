import Link from "next/link";
import { format } from "@/lib/trip";
import styles from "./VisaPlanCard.module.scss";

/**
 * One visa plan — Figma web "Frame 2147227603" (1075:305174) with its
 * featured variant "Frame 2147227600" (1075:305136), and mweb "plan 2"
 * (682:141465) with its featured variant "plan 1" (682:141432).
 *
 * The featured plan is the same card with a tinted head, a cyan edge and a
 * processing-time strip at the foot, so both render from this one component.
 *
 * The two viewports arrange the same content differently:
 * - web: title + prices in the head, then the facts columns on their own row.
 *   The per-infant price is drawn on web only; the "View Details" block and
 *   the featured foot strip are switched off in the web frames, so those two
 *   are mweb-only.
 * - mweb: title + "Validity" pill and "Single-entry · 30 days duration" in the
 *   head, the per-adult and per-child prices in a row of their own, then the
 *   CTA on one line. The facts columns aren't shown; their validity and stay
 *   feed the pill and the duration instead, which only render on mweb.
 * The re-ordering is pure CSS (see the module), so nothing is rendered twice.
 */
export default function VisaPlanCard({ plan, priceLabels, summary, details }) {
  const { title, entry, price, facts, footnote, featured, detailsHref, detailsContext } = plan;

  // The per-infant column appears in the web frames only, so it carries an
  // extra class that the module hides below desktop.
  const prices = [
    { key: "adult", label: priceLabels.adult, amount: price.adult },
    { key: "child", label: priceLabels.child, amount: price.child },
    ...(price.infant
      ? [{ key: "infant", label: priceLabels.infant, amount: price.infant, webOnly: true }]
      : []),
  ];
  const validity = facts.find((fact) => fact.id === "validity");
  const stay = facts.find((fact) => fact.id === "stay");

  return (
    <article className={`${styles.card} ${featured ? styles.featured : ""}`}>
      <div className={styles.head}>
        <div className={styles.headRow}>
          <div className={styles.titleBlock}>
            <div className={styles.titleRow}>
              <h3 className={styles.title}>{title}</h3>
              {validity && (
                <p className={styles.validity}>
                  {format(summary.validity, { value: validity.value })}
                </p>
              )}
            </div>
            <p className={styles.entry}>
              {entry}
              {stay && (
                <span className={styles.stay}>
                  {/* The dot before the duration is decorative. */}
                  <span className={styles.srOnly}>, </span>
                  {format(summary.stay, { value: stay.value })}
                </span>
              )}
            </p>
          </div>

          <dl className={styles.prices}>
            {prices.map((entryPrice) => (
              <div
                key={entryPrice.key}
                className={`${styles.price} ${entryPrice.webOnly ? styles.priceWebOnly : ""}`}
              >
                <dt className={styles.priceLabel}>{entryPrice.label}</dt>
                <dd className={styles.priceAmount}>{entryPrice.amount}</dd>
                <dd className={styles.priceTax}>{priceLabels.tax}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className={styles.body}>
        <dl className={styles.facts}>
          {facts.map((fact) => (
            <div key={fact.id} className={styles.fact}>
              <dt className={styles.factLabel}>{fact.label}</dt>
              <dd className={styles.factValue}>{fact.value}</dd>
            </div>
          ))}
        </dl>

        <div className={styles.cta}>
          <p className={styles.ctaNote}>{details.note}</p>
          {/* The plan detail routes don't exist yet: a prefetch of one would
              log a 404 in the console and fail Lighthouse Best Practices. */}
          <Link href={detailsHref} prefetch={false} className={styles.ctaLink}>
            {details.label}
            <span className={styles.srOnly}> {detailsContext}</span>
          </Link>
        </div>
      </div>

      {footnote && <p className={styles.footnote}>{footnote}</p>}
    </article>
  );
}

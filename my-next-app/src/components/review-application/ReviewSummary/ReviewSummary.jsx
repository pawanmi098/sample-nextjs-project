import Image from "next/image";
import Link from "next/link";
import { format } from "@/lib/trip";
import styles from "./ReviewSummary.module.scss";

/**
 * What the application comes to: the visa, the travellers and their fare
 * categories, whoever takes the visa updates, the price, and the
 * "non-refundable" strip under it.
 *
 * Figma mweb "Review application" (999:265215) supplies the base — 320-wide
 * cards with 12 of padding and Bauhaus 16/20 titles; the web popup
 * "Popup with Overlay" (595:51941) supplies the `>=desktop` overrides — 448
 * wide, 16 of padding, 20/24 titles, and a Poppins plan name.
 *
 * Presentational and free of state, so it renders in both trees: the page
 * (a server component) passes `editHref` and gets links back to the form; the
 * popup (a client component) passes `onEdit` and gets buttons that close it.
 *
 * @param content    travellerDetailsContent.review
 * @param travellers `[{ id, name, type }]` — type is the Adult/Child label
 * @param primary    `{ name, phone, email }` for the primary traveller
 * @param summary    buildPriceSummary() — `{ rows, totalLabel, total }`
 * @param editHref     where the "Edit" links go, when they are links
 * @param onEdit       `(elementId) => void`, when they are buttons instead
 * @param headingLevel 2 under the page's <h1>, 3 under the popup's own title
 */
export default function ReviewSummary({
  content,
  travellers,
  primary,
  summary,
  editHref,
  onEdit,
  headingLevel = 2,
}) {
  const Heading = `h${headingLevel}`;
  const { editIcon, plan, price, note } = content;

  // "Frame 1321315562": the parts of a row with a dot between them, rather
  // than inside them, so it never reaches a screen reader as punctuation in
  // the middle of a name.
  const separated = (parts) =>
    parts.map((part, index) => (
      <span key={part.key} className={styles.factItem}>
        {index > 0 && (
          <span className={styles.separator} aria-hidden="true">
            ·
          </span>
        )}
        <span className={part.strong ? styles.factStrong : undefined}>{part.label}</span>
      </span>
    ));

  // "Link" (999:265263 / 595:51973): the 16 pencil and "Edit" in 500 12/18.
  const editControl = (section) => {
    const inner = (
      <>
        <Image src={editIcon} alt="" aria-hidden="true" width={16} height={16} className={styles.editIcon} />
        {section.editLabel}
      </>
    );

    return editHref ? (
      <Link href={editHref} className={styles.edit} aria-label={section.editAriaLabel}>
        {inner}
      </Link>
    ) : (
      <button
        type="button"
        className={styles.edit}
        aria-label={section.editAriaLabel}
        onClick={() => onEdit(section.editTarget)}
      >
        {inner}
      </button>
    );
  };

  return (
    <>
      {/* "Section - Journey Summary Card" (999:265242) — the visa itself. */}
      <section className={styles.card} aria-labelledby="review-plan-name">
        <p id="review-plan-name" className={styles.planName}>
          {plan.name}
        </p>
        <span className={styles.rule} aria-hidden="true" />
        <p className={styles.facts}>
          {separated(
            plan.facts.map((fact) => ({
              key: fact,
              label: format(fact, { count: travellers.length }),
            })),
          )}
        </p>
      </section>

      {/* "Traveller Details" (999:265259) — every traveller and their fare
          category, which the dates of birth decide. */}
      <section className={styles.card} aria-labelledby="review-travellers-title">
        <div className={styles.cardHead}>
          <Heading id="review-travellers-title" className={styles.cardTitle}>
            {content.travellers.title}
          </Heading>
          {editControl(content.travellers)}
        </div>
        <span className={styles.rule} aria-hidden="true" />
        <ul className={styles.list}>
          {travellers.map((traveller) => (
            <li key={traveller.id} className={styles.facts}>
              {separated([
                { key: "name", label: traveller.name, strong: true },
                { key: "type", label: traveller.type },
              ])}
            </li>
          ))}
        </ul>
      </section>

      {/* "Primary Traveller" (999:265278) — who the visa updates go to. */}
      <section className={styles.card} aria-labelledby="review-primary-title">
        <div className={styles.cardHead}>
          <Heading id="review-primary-title" className={styles.cardTitle}>
            {content.primary.title}
          </Heading>
          {editControl(content.primary)}
        </div>
        <span className={styles.rule} aria-hidden="true" />
        <div className={styles.primary}>
          <p className={styles.primaryName}>{primary.name}</p>
          <p className={styles.primaryContact}>
            <span>{primary.phone}</span>
            <span className={styles.contactRule} aria-hidden="true" />
            <span>{primary.email}</span>
          </p>
        </div>
      </section>

      {/* "Price Summary" (999:265298). */}
      <section className={styles.card} aria-labelledby="review-price-title">
        <div className={styles.cardHead}>
          <Heading id="review-price-title" className={styles.cardTitle}>
            {price.title}
          </Heading>
        </div>
        <span className={styles.rule} aria-hidden="true" />
        <dl className={styles.price}>
          {summary.rows.map((row) => (
            <div key={row.id} className={styles.priceRow}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
          <span className={styles.priceRule} aria-hidden="true" />
          <div className={`${styles.priceRow} ${styles.priceTotal}`}>
            <dt>{summary.totalLabel}</dt>
            <dd>{summary.total}</dd>
          </div>
        </dl>
      </section>

      {/* "Section 3: Important Information" (999:265322). */}
      <p className={styles.note}>
        <Image src={note.icon} alt="" aria-hidden="true" width={20} height={20} className={styles.noteIcon} />
        {note.label}
      </p>
    </>
  );
}

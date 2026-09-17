"use client";

import Image from "next/image";
import styles from "./PrimaryContact.module.scss";

/**
 * "Who should receive visa updates?" — Figma "Frame 1321316218" (557:14654):
 * a collapsible card holding one radio per traveller.
 *
 * @param travellers  the booking's travellers; each radio's value is its id
 * @param error       shown under the radios once the form has been submitted
 */
export default function PrimaryContact({ content, travellers, value, onChange, open, onToggle, error }) {
  const { name, title, hint, chevronIcon } = content;
  const toggleId = "primary-contact-toggle";
  const titleId = "primary-contact-title";
  const hintId = "primary-contact-hint";
  const panelId = "primary-contact-panel";
  const errorId = error ? "primary-contact-error" : undefined;

  return (
    <section className={open ? `${styles.card} ${styles.cardOpen}` : styles.card} aria-labelledby={titleId}>
      <h2 className={styles.heading}>
        <button
          type="button"
          id={toggleId}
          className={styles.header}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span className={styles.text}>
            <span id={titleId} className={styles.title}>
              {title}
            </span>
            <span id={hintId} className={styles.hint}>
              {hint}
            </span>
          </span>
          <Image src={chevronIcon} alt="" aria-hidden="true" width={24} height={24} className={styles.chevron} />
        </button>
      </h2>

      <div id={panelId} className={styles.panel} hidden={!open}>
        <div
          role="radiogroup"
          aria-labelledby={titleId}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ")}
          aria-invalid={error ? true : undefined}
          aria-required="true"
          className={styles.options}
        >
          {travellers.map((traveller, index) => (
            <label key={traveller.id} className={styles.option}>
              <input
                type="radio"
                name={name}
                value={traveller.id}
                checked={value === traveller.id}
                onChange={() => onChange(traveller.id)}
                className={styles.radio}
                // Where "focus the first invalid control" should land.
                data-invalid={error && index === 0 ? "" : undefined}
              />
              <span className={styles.optionLabel}>
                {traveller.firstName} {traveller.lastName}
              </span>
            </label>
          ))}
        </div>
        {error && (
          <p id={errorId} className={styles.error}>
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

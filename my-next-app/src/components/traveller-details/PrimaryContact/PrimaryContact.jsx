"use client";

import Image from "next/image";
import DetailsField from "../DetailsField/DetailsField";
import { contactFieldName } from "@/lib/travellerDetails";
import styles from "./PrimaryContact.module.scss";

/**
 * "Who should receive visa updates?" — Figma "Frame 1321316218" (557:14654),
 * filled "Passenger Accordion" (601:12802): a collapsible card holding one
 * radio per traveller.
 *
 * The chosen traveller's row grows (601:12814): a "Primary" chip beside the
 * name, then their phone number and email id under a rule. The other rows stay
 * as they are, so choosing someone else moves the two fields to them.
 *
 * A child can't take visa updates, so their radio is disabled and the card
 * ends with the "#EAF8FF" note strip saying so (999:264807, 999:264808).
 *
 * @param travellers  the booking's travellers; each radio's value is its id
 * @param contact     `{ dialCode, phone, email }` for the chosen traveller
 * @param childIds    travellers who can't be chosen, by id
 * @param error       shown under the radios once the form has been submitted
 * @param errorFor    `(fieldName) => message | undefined` for the contact fields
 * @param icons       `{ error, info }` — the field message icons
 */
export default function PrimaryContact({
  content,
  travellers,
  value,
  onChange,
  contact,
  onContactChange,
  onContactBlur,
  childIds = [],
  errorFor,
  icons,
  open,
  onToggle,
  error,
}) {
  const { name, title, hint, chevronIcon, primaryLabel, fields, childNote } = content;
  const hasChild = travellers.some((traveller) => childIds.includes(traveller.id));
  const toggleId = "primary-contact-toggle";
  const titleId = "primary-contact-title";
  const hintId = "primary-contact-hint";
  const panelId = "primary-contact-panel";
  const errorId = error ? "primary-contact-error" : undefined;

  const dialCode = fields.phone.codes.find((code) => code.value === contact.dialCode) ?? fields.phone.codes[0];

  // "Selection input": the flag, the code and a chevron, ruled off from the
  // number. The <select> covers the box so the value keeps Figma's width —
  // a native select would size itself to its widest option.
  const dialCodePrefix = (
    <span className={styles.dialCode}>
      {dialCode.flag && (
        <Image src={dialCode.flag} alt="" aria-hidden="true" width={25} height={16} className={styles.flag} />
      )}
      <span className={styles.dialValue} aria-hidden="true">
        {dialCode.label}
      </span>
      <Image
        src={fields.phone.chevronIcon}
        alt=""
        aria-hidden="true"
        width={20}
        height={20}
        className={styles.dialChevron}
      />
      <select
        className={styles.dialSelect}
        name={contactFieldName("dialCode")}
        aria-label={fields.phone.countryLabel}
        value={dialCode.value}
        onChange={(event) => onContactChange("dialCode", event.target.value)}
      >
        {fields.phone.codes.map((code) => (
          <option key={code.value} value={code.value}>
            {code.country} ({code.label})
          </option>
        ))}
      </select>
    </span>
  );

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
          {travellers.map((traveller, index) => {
            const chosen = value === traveller.id;
            const barred = childIds.includes(traveller.id);
            const labelClass = [styles.optionLabel, chosen && styles.optionLabelChosen, barred && styles.optionLabelBarred]
              .filter(Boolean)
              .join(" ");

            return (
              <div
                key={traveller.id}
                className={chosen ? `${styles.optionRow} ${styles.optionRowChosen}` : styles.optionRow}
              >
                <label className={barred ? `${styles.option} ${styles.optionBarred}` : styles.option}>
                  <input
                    type="radio"
                    name={name}
                    value={traveller.id}
                    checked={chosen}
                    onChange={() => onChange(traveller.id)}
                    className={styles.radio}
                    // Kept in the tab order and announced, unlike `disabled`,
                    // so the note below explains why it can't be chosen.
                    aria-disabled={barred || undefined}
                    aria-describedby={barred ? "primary-contact-child-note" : undefined}
                    onClick={(event) => {
                      if (barred) event.preventDefault();
                    }}
                    // Where "focus the first invalid control" should land.
                    data-invalid={error && index === 0 ? "" : undefined}
                  />
                  <span className={labelClass}>
                    {traveller.firstName} {traveller.lastName}
                  </span>
                  {chosen && <span className={styles.chip}>{primaryLabel}</span>}
                </label>

                {chosen && (
                  <div className={styles.contactFields}>
                    <DetailsField
                      id="primary-contact-phone"
                      name={contactFieldName("phone")}
                      label={fields.phone.label}
                      placeholder={fields.phone.placeholder}
                      value={contact.phone}
                      onValueChange={(next) => onContactChange("phone", next.replace(/[^\d]/g, ""))}
                      onBlur={() => onContactBlur("phone")}
                      error={errorFor(contactFieldName("phone"))}
                      autoComplete="tel-national"
                      inputMode="tel"
                      maxLength={15}
                      icons={icons}
                      prefix={dialCodePrefix}
                    />
                    <DetailsField
                      id="primary-contact-email"
                      name={contactFieldName("email")}
                      label={fields.email.label}
                      placeholder={fields.email.placeholder}
                      value={contact.email}
                      onValueChange={(next) => onContactChange("email", next)}
                      onBlur={() => onContactBlur("email")}
                      error={errorFor(contactFieldName("email"))}
                      note={fields.email.note}
                      icons={icons}
                      autoComplete="email"
                      inputMode="email"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {error && (
          <p id={errorId} className={styles.error}>
            {error}
          </p>
        )}
      </div>

      {open && hasChild && (
        <p id="primary-contact-child-note" className={styles.childNote}>
          <Image src={childNote.icon} alt="" aria-hidden="true" width={16} height={16} className={styles.noteIcon} />
          {childNote.label}
        </p>
      )}
    </section>
  );
}

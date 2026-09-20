"use client";

import Image from "next/image";
import DetailsField from "../DetailsField/DetailsField";
import { format } from "@/lib/trip";
import { guardianFieldName, travellerFieldName } from "@/lib/travellerDetails";
import styles from "./TravellerAccordion.module.scss";

/**
 * One traveller's card — Figma "Accordian" 584:45841 (open: tinted head,
 * chevron up, the detail fields) and 584:45842 / 584:45843 (closed: white
 * head, "Add details" + chevron down).
 *
 * Collapsed panels are `hidden`, not unmounted, so every traveller's fields
 * are still submitted with the form.
 *
 * A child — 2 to under 12, the airline's own fare category (601:12682, Aarav
 * Kumar) — gets the "authorised by parent / legal guardian" checkbox between
 * the date of birth and the passport fields. Their date of birth comes from
 * the booking, which is how the card knows their age band, so it is shown
 * locked, like the names.
 *
 * @param traveller     `{ id, position, firstName, lastName, dob? }` from the booking
 * @param content       form.passengers copy
 * @param values        `{ dob, passportNumber, passportExpiry, guardian }`
 * @param child         true when the date of birth on the card is 2 to under 12
 * @param errorFor      `(fieldName) => message | undefined`, for shown errors only
 * @param dateLimits    `{ dob, passportExpiry }` → functions returning `{ min, max }`
 * @param icons         `{ error, info }` — the icons beside a field's message
 */
export default function TravellerAccordion({
  traveller,
  content,
  open,
  complete,
  onToggle,
  values,
  child = false,
  onGuardianChange,
  errorFor,
  onFieldChange,
  onFieldBlur,
  dateLimits,
  icons,
}) {
  const { id, position, firstName, lastName, dob: bookedDob } = traveller;
  const { fields } = content;
  const toggleId = `${id}-toggle`;
  const panelId = `${id}-panel`;
  const fieldId = (field) => `${id}-${field}`;
  const guardianName = guardianFieldName(id);
  const guardianId = `${id}-guardian`;
  const guardianError = errorFor(guardianName);

  const dateField = (field, limits, locked = false) => {
    const name = travellerFieldName(id, field);
    return (
      <DetailsField
        id={fieldId(field)}
        name={name}
        type="date"
        label={fields[field].label}
        placeholder={fields[field].placeholder}
        value={values[field]}
        onValueChange={(next) => onFieldChange(field, next)}
        onBlur={() => onFieldBlur(field)}
        readOnly={locked}
        error={locked ? undefined : errorFor(name)}
        hint={locked ? content.lockedDateHint : content.dateHint}
        icons={icons}
        calendar={{
          icon: locked ? content.lockedDateIcon : content.calendarIcon,
          label: format(content.calendarLabel, { label: fields[field].label.replace(/\*$/, "") }),
          limits,
          content: content.calendar,
        }}
      />
    );
  };

  return (
    <li className={open ? `${styles.card} ${styles.cardOpen}` : styles.card}>
      <h3 className={styles.heading}>
        <button
          type="button"
          id={toggleId}
          className={styles.header}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span className={styles.identity}>
            <span className={styles.name}>
              {firstName} {lastName}
            </span>
            <span className={styles.position}>{position}</span>
          </span>
          <span className={styles.action}>
            {!open && (
              <span className={styles.actionLabel}>{complete ? content.editLabel : content.addLabel}</span>
            )}
            <Image
              src={content.chevronIcon}
              alt=""
              aria-hidden="true"
              width={24}
              height={24}
              className={styles.chevron}
            />
          </span>
        </button>
      </h3>

      <div id={panelId} role="group" aria-labelledby={toggleId} className={styles.panel} hidden={!open}>
        {/* Prefilled from the booking, so read-only. Not submitted: the
            server reads names from the booking, not the request. */}
        <div className={styles.row}>
          <DetailsField id={fieldId("firstName")} label={fields.firstName.label} value={firstName} readOnly />
          <DetailsField id={fieldId("lastName")} label={fields.lastName.label} value={lastName} readOnly />
        </div>

        {dateField("dob", dateLimits.dob, Boolean(bookedDob))}

        {child && (
          <div className={styles.guardian}>
            <label htmlFor={guardianId} className={styles.guardianRow}>
              <input
                id={guardianId}
                type="checkbox"
                name={guardianName}
                className={styles.guardianInput}
                checked={Boolean(values.guardian)}
                onChange={(event) => onGuardianChange(event.target.checked)}
                aria-invalid={guardianError ? true : undefined}
                aria-describedby={guardianError ? `${guardianId}-error` : undefined}
                data-invalid={guardianError ? "" : undefined}
              />
              <span className={styles.guardianBox}>
                <Image
                  src={values.guardian ? content.checkedIcon : content.uncheckedIcon}
                  alt=""
                  aria-hidden="true"
                  width={24}
                  height={24}
                  className={styles.guardianIcon}
                />
              </span>
              <span className={styles.guardianLabel}>{fields.guardian.label}</span>
            </label>
            {guardianError && (
              <p id={`${guardianId}-error`} className={styles.guardianError}>
                {guardianError}
              </p>
            )}
          </div>
        )}

        <div role="group" aria-labelledby={`${id}-passport-heading`} className={styles.passport}>
          <p id={`${id}-passport-heading`} className={styles.passportHeading}>
            {fields.passportHeading}
          </p>
          <div className={styles.row}>
            <DetailsField
              id={fieldId("passportNumber")}
              name={travellerFieldName(id, "passportNumber")}
              label={fields.passportNumber.label}
              placeholder={fields.passportNumber.placeholder}
              value={values.passportNumber}
              onValueChange={(next) => onFieldChange("passportNumber", next)}
              onBlur={() => onFieldBlur("passportNumber")}
              error={errorFor(travellerFieldName(id, "passportNumber"))}
              maxLength={9}
              icons={icons}
              uppercase
            />
            {dateField("passportExpiry", dateLimits.passportExpiry)}
          </div>
        </div>
      </div>
    </li>
  );
}

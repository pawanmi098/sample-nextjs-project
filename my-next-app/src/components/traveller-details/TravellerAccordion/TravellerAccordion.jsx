"use client";

import Image from "next/image";
import DetailsField from "../DetailsField/DetailsField";
import { format } from "@/lib/trip";
import { travellerFieldName } from "@/lib/travellerDetails";
import styles from "./TravellerAccordion.module.scss";

/**
 * One traveller's card — Figma "Accordian" 584:45841 (open: tinted head,
 * chevron up, the detail fields) and 584:45842 / 584:45843 (closed: white
 * head, "Add details" + chevron down).
 *
 * Collapsed panels are `hidden`, not unmounted, so every traveller's fields
 * are still submitted with the form.
 *
 * @param traveller     `{ id, position, firstName, lastName }` from the booking
 * @param content       form.passengers copy
 * @param values        `{ dob, passportNumber, passportExpiry }`
 * @param errorFor      `(fieldName) => message | undefined`, for shown errors only
 * @param dateLimits    `{ dob, passportExpiry }` → functions returning `{ min, max }`
 */
export default function TravellerAccordion({
  traveller,
  content,
  open,
  complete,
  onToggle,
  values,
  errorFor,
  onFieldChange,
  onFieldBlur,
  dateLimits,
}) {
  const { id, position, firstName, lastName } = traveller;
  const { fields } = content;
  const toggleId = `${id}-toggle`;
  const panelId = `${id}-panel`;
  const fieldId = (field) => `${id}-${field}`;

  const dateField = (field, limits) => {
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
        error={errorFor(name)}
        hint={content.dateHint}
        calendar={{
          icon: content.calendarIcon,
          label: format(content.calendarLabel, { label: fields[field].label.replace(/\*$/, "") }),
          limits,
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

        {dateField("dob", dateLimits.dob)}

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
              uppercase
            />
            {dateField("passportExpiry", dateLimits.passportExpiry)}
          </div>
        </div>
      </div>
    </li>
  );
}

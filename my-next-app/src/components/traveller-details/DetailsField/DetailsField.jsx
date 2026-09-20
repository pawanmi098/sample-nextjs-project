"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import DateCalendar from "@/components/common/DateCalendar/DateCalendar";
import { displayToIsoDate, formatDateTyping, isoToDisplayDate } from "@/lib/travellerDetails";
import styles from "./DetailsField.module.scss";

/**
 * One traveller detail input — Figma "Dynamic Input / Input" and
 * "Dynamic Input / Date" (I584:45841;4119:18625;…).
 *
 * The Figma component has two looks, and both are this one element:
 * - empty: the grey "Date of birth*" text sits inside the box. That's the
 *   real `placeholder` (the #9BA4B8 grey would fail contrast as a label).
 * - filled: the label floats onto the top edge ("First Name" over "Amit").
 * The <label> is always in the DOM and tied to the input; CSS only hides it
 * visually while the placeholder is showing.
 *
 * `type="date"` keeps a text input — a native date input can't show the
 * placeholder — typed as DD-MM-YYYY, with the calendar icon opening the
 * Figma date picker (common/DateCalendar) under the field.
 *
 * A field holding a value takes a darker edge (#9999DE, 601:12680) than an
 * empty one; that's `:not(:placeholder-shown)`, since every field carries a
 * placeholder.
 *
 * @param value     controlled value; `onValueChange(next)` receives the new one
 * @param readOnly  names, and a child's date of birth, prefilled from the
 *                  booking: grey fill, no edge, and — on a date — a muted icon
 *                  in place of the calendar button
 * @param error     message shown under the field, and `aria-invalid`
 * @param hint      screen-reader-only format hint (dates)
 * @param note      "Form Message" under the field — a 16 icon and 10/16 text,
 *                  red for `error`, `--text-body` for a standing hint such as
 *                  Email Id's "This email id will be used for all
 *                  communications" (I999:264805;5101:27329;1262:1984)
 * @param icons     `{ error, info }` — the message icons
 * @param prefix    a control drawn inside the field's left edge, before the
 *                  input — the phone number's country dialling code
 *                  (I601:12819;5101:27823;1262:5330)
 * @param calendar  `{ icon, label, limits, content }` for date fields;
 *                  `limits()` returns the picker's `{ min, max }` as
 *                  YYYY-MM-DD. It runs when the picker opens, not during
 *                  render, so a server/client clock difference can't cause a
 *                  hydration mismatch. `content` is the picker's own copy —
 *                  form.passengers.calendar.
 */
export default function DetailsField({
  id,
  name,
  label,
  placeholder,
  value,
  onValueChange,
  onBlur,
  readOnly = false,
  type = "text",
  error,
  hint,
  note,
  icons,
  prefix,
  calendar,
  autoComplete = "off",
  inputMode,
  maxLength,
  uppercase = false,
}) {
  const controlRef = useRef(null);
  const buttonRef = useRef(null);
  const pickerRef = useRef(null);
  // The picker's range is read from the clock when it opens, not on render.
  const [picker, setPicker] = useState(null);
  const isDate = type === "date";
  const hintId = hint ? `${id}-hint` : undefined;
  const noteId = note ? `${id}-note` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, noteId, errorId].filter(Boolean).join(" ") || undefined;

  const handleChange = (event) => {
    const raw = event.target.value;
    onValueChange?.(isDate ? formatDateTyping(raw) : uppercase ? raw.toUpperCase() : raw);
  };

  const closePicker = ({ refocus = true } = {}) => {
    setPicker(null);
    if (refocus) buttonRef.current?.focus();
  };

  const togglePicker = () => {
    if (picker) {
      closePicker();
      return;
    }
    const { min = "", max = "" } = calendar.limits?.() ?? {};
    setPicker({ min, max });
  };

  // Close on a click that lands outside both the field and the picker. The
  // mobile sheet's scrim sits inside the picker, so it closes itself.
  useEffect(() => {
    if (!picker) return undefined;

    const onPointerDown = (event) => {
      if (controlRef.current?.contains(event.target)) return;
      if (pickerRef.current?.contains(event.target)) return;
      closePicker({ refocus: false });
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [picker]);

  const fieldClass = [
    styles.field,
    readOnly && styles.readOnly,
    isDate && styles.withCalendar,
    prefix && styles.withPrefix,
    error && styles.invalid,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={fieldClass}>
      <div ref={controlRef} className={styles.control}>
        {prefix}
        <input
          id={id}
          name={name}
          type="text"
          className={styles.input}
          value={value}
          placeholder={placeholder ?? " "}
          onChange={handleChange}
          onBlur={onBlur}
          readOnly={readOnly}
          autoComplete={autoComplete}
          inputMode={isDate ? "numeric" : inputMode}
          maxLength={isDate ? 10 : maxLength}
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          data-invalid={error ? "" : undefined}
        />
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>

        {isDate && calendar && readOnly && (
          <span className={styles.calendarIcon}>
            <Image src={calendar.icon} alt="" aria-hidden="true" width={20} height={20} />
          </span>
        )}

        {isDate && calendar && !readOnly && (
          <>
            <button
              ref={buttonRef}
              type="button"
              className={styles.calendarButton}
              onClick={togglePicker}
              aria-haspopup="dialog"
              aria-expanded={Boolean(picker)}
              aria-controls={picker ? `${id}-calendar` : undefined}
            >
              <Image src={calendar.icon} alt={calendar.label} width={20} height={20} />
            </button>

            {picker && (
              <DateCalendar
                id={`${id}-calendar`}
                label={calendar.label}
                value={displayToIsoDate(value)}
                min={picker.min}
                max={picker.max}
                content={calendar.content}
                rootRef={pickerRef}
                onSelect={(iso) => {
                  onValueChange?.(isoToDisplayDate(iso));
                  closePicker();
                  onBlur?.();
                }}
                onClose={closePicker}
              />
            )}
          </>
        )}
      </div>

      {hint && (
        <span id={hintId} className={styles.visuallyHidden}>
          {hint}
        </span>
      )}
      {/* The error replaces the note while it's showing: Figma never draws
          both under one field. */}
      {error ? (
        <p id={errorId} className={`${styles.message} ${styles.messageError}`}>
          {icons?.error && (
            <Image src={icons.error} alt="" aria-hidden="true" width={16} height={16} className={styles.messageIcon} />
          )}
          {error}
        </p>
      ) : (
        note && (
          <p id={noteId} className={styles.message}>
            {icons?.info && (
              <Image src={icons.info} alt="" aria-hidden="true" width={16} height={16} className={styles.messageIcon} />
            )}
            {note}
          </p>
        )
      )}
    </div>
  );
}

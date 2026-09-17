"use client";

import { useRef } from "react";
import Image from "next/image";
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
 * placeholder — typed as DD/MM/YYYY, with the calendar icon opening the
 * browser's own picker on a hidden native date input.
 *
 * @param value     controlled value; `onValueChange(next)` receives the new one
 * @param readOnly  names prefilled from the booking: grey fill, no edge
 * @param error     message shown under the field, and `aria-invalid`
 * @param hint      screen-reader-only format hint (dates)
 * @param calendar  `{ icon, label, limits }` for date fields; `limits()` returns
 *                  the picker's `{ min, max }` as YYYY-MM-DD. It runs when the
 *                  picker opens, not during render, so a server/client clock
 *                  difference can't cause a hydration mismatch.
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
  calendar,
  autoComplete = "off",
  maxLength,
  uppercase = false,
}) {
  const inputRef = useRef(null);
  const pickerRef = useRef(null);
  const isDate = type === "date";
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const handleChange = (event) => {
    const raw = event.target.value;
    onValueChange?.(isDate ? formatDateTyping(raw) : uppercase ? raw.toUpperCase() : raw);
  };

  const openPicker = () => {
    const picker = pickerRef.current;
    const { min = "", max = "" } = calendar.limits?.() ?? {};
    picker.min = min;
    picker.max = max;
    try {
      picker.showPicker();
    } catch {
      // No showPicker() (older browsers): typing is still available.
      inputRef.current?.focus();
    }
  };

  const fieldClass = [
    styles.field,
    readOnly && styles.readOnly,
    isDate && styles.withCalendar,
    error && styles.invalid,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={fieldClass}>
      <div className={styles.control}>
        <input
          ref={inputRef}
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
          inputMode={isDate ? "numeric" : undefined}
          maxLength={isDate ? 10 : maxLength}
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          data-invalid={error ? "" : undefined}
        />
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>

        {isDate && calendar && (
          <>
            <button type="button" className={styles.calendarButton} onClick={openPicker}>
              <Image src={calendar.icon} alt={calendar.label} width={20} height={20} />
            </button>
            {/* The picker's value source only: not focusable, not announced,
                never submitted (no name). */}
            <input
              ref={pickerRef}
              type="date"
              className={styles.picker}
              value={displayToIsoDate(value)}
              onChange={(event) => onValueChange?.(isoToDisplayDate(event.target.value))}
              tabIndex={-1}
              aria-hidden="true"
              aria-label={calendar.label}
            />
          </>
        )}
      </div>

      {hint && (
        <span id={hintId} className={styles.visuallyHidden}>
          {hint}
        </span>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

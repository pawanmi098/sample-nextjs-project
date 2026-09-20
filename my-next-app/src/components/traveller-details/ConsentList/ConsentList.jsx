"use client";

import Image from "next/image";
import { consentFieldName } from "@/lib/travellerDetails";
import styles from "./ConsentList.module.scss";

/**
 * The two required consents under the form — Figma "Frame 2147225595"
 * (557:14771). Real checkboxes, moved off screen; the icon beside each is the
 * visual, as in common/TravellerPicker.
 *
 * An unticked consent that's being complained about turns red — box and
 * message both (I999:264813;4361:5826).
 *
 * @param checked   `{ [consentId]: boolean }`
 * @param errorFor  `(fieldName) => message | undefined`
 * @param icons     `{ error }` — the icon beside the message
 */
export default function ConsentList({ content, checked, onChange, errorFor, icons }) {
  const { items, checkedIcon, uncheckedIcon, uncheckedErrorIcon } = content;

  return (
    <ul className={styles.list}>
      {items.map((item) => {
        const name = consentFieldName(item.id);
        const inputId = `consent-${item.id}`;
        const error = errorFor(name);
        const errorId = error ? `${inputId}-error` : undefined;
        const isChecked = Boolean(checked[item.id]);

        return (
          <li key={item.id} className={styles.item}>
            <label htmlFor={inputId} className={styles.row}>
              <input
                id={inputId}
                type="checkbox"
                name={name}
                className={styles.checkbox}
                checked={isChecked}
                onChange={(event) => onChange(item.id, event.target.checked)}
                required
                aria-invalid={error ? true : undefined}
                aria-describedby={errorId}
                data-invalid={error ? "" : undefined}
              />
              <span className={styles.box}>
                <Image
                  src={isChecked ? checkedIcon : error ? uncheckedErrorIcon : uncheckedIcon}
                  alt=""
                  aria-hidden="true"
                  width={24}
                  height={24}
                  className={styles.icon}
                />
              </span>
              <span className={styles.text}>{item.label}</span>
            </label>
            {error && (
              <p id={errorId} className={styles.error}>
                {icons?.error && (
                  <Image
                    src={icons.error}
                    alt=""
                    aria-hidden="true"
                    width={16}
                    height={16}
                    className={styles.errorIcon}
                  />
                )}
                {error}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

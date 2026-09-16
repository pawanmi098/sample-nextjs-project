"use client";

import { useEffect, useRef } from "react";
import DropdownSurface from "../DropdownSurface/DropdownSurface";
import styles from "./OptionDropdown.module.scss";

/**
 * The Figma "Dropdown List" component — the list a search field drops to show
 * its options.
 *
 * Two frames use it, and they're the same component with different rows:
 * 740:148277 (destination: title + airport + IATA code, 76-tall rows, with a
 * hint above the list) and 774:198357 (nationality: title only, 56-tall rows,
 * with the custom scrollbar). Both are 392 wide, so web and mweb share every
 * value here; only the *presentation* differs, and that split is below.
 *
 * Presented by DropdownSurface — a popover under the field on desktop, a
 * bottom sheet on mobile.
 *
 * This renders the list only. The combobox input that owns it — the value,
 * the filtering and every key that moves `activeIndex` — lives in SearchForm,
 * so that the ARIA relationship (`aria-controls`, `aria-activedescendant`)
 * points at one listbox no matter which presentation is on screen.
 *
 * @param id             listbox id, the input's `aria-controls` target
 * @param label          `aria-label` for the listbox
 * @param description    optional hint above the list
 * @param emptyLabel     shown when `options` is empty
 * @param options        `[{ value, label, description, code }]`, already filtered
 * @param selectedValue  the option currently chosen
 * @param activeIndex    index into `options` of the keyboard-focused row, or -1
 * @param optionId       `(index) => elementId`, shared with the input's
 *                       `aria-activedescendant`
 * @param onSelect       called with the chosen option
 * @param align          which field edge the popover hangs from — see
 *                       DropdownSurface
 * @param onClose        called when the scrim is tapped
 * @param rootRef        the outermost node, so the input can tell an outside
 *                       click from one that landed in the popup
 */

export default function OptionDropdown({
  id,
  align,
  label,
  description,
  emptyLabel,
  options,
  selectedValue,
  activeIndex,
  optionId,
  onSelect,
  onClose,
  rootRef,
}) {
  const listRef = useRef(null);

  // Keep the arrow-key row in view. Focus never leaves the input, so the
  // browser won't scroll the list for us.
  useEffect(() => {
    if (activeIndex < 0) return;
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const card = (
    <div className={styles.card}>
      {description ? <p className={styles.description}>{description}</p> : null}

      <ul ref={listRef} id={id} role="listbox" aria-label={label} className={styles.list}>
        {options.length === 0 ? (
          <li role="presentation" className={styles.empty}>
            {emptyLabel}
          </li>
        ) : (
          options.map((option, index) => {
            const classNames = [styles.option];
            if (option.value === selectedValue) classNames.push(styles.optionSelected);
            if (index === activeIndex) classNames.push(styles.optionActive);

            return (
              <li
                key={option.value}
                id={optionId(index)}
                role="option"
                aria-selected={option.value === selectedValue}
                className={classNames.join(" ")}
                // Swallowing mousedown is what keeps focus on the combobox
                // input, so picking a row never blurs it and no refocus (and
                // on a phone, no second keyboard flash) is needed. mousedown
                // rather than pointerdown: a touch that turns into a scroll
                // never fires it, so the list still pans by finger.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onSelect(option)}
              >
                <span className={styles.optionText}>
                  <span className={styles.optionTitle}>{option.label}</span>
                  {option.description ? (
                    <span className={styles.optionDescription}>{option.description}</span>
                  ) : null}
                </span>
                {option.code ? <span className={styles.optionCode}>{option.code}</span> : null}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );

  return (
    <DropdownSurface align={align} className={styles.surface} rootRef={rootRef} onClose={onClose}>
      {card}
    </DropdownSurface>
  );
}

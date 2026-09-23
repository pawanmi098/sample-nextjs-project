"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import DropdownSurface from "../DropdownSurface/DropdownSurface";
import styles from "./ChoiceSheet.module.scss";

/**
 * The Figma "Popup Modal" 999:258977 — how "Nationality" and "Country of
 * Residence" pick their value on mweb.
 *
 * One frame serves both fields; only the header and the placeholder change,
 * so the copy comes in through `content` rather than being two components.
 *
 * mweb only. From desktop up those fields still drop OptionDropdown's card
 * under the search row (Figma "Dropdown List" 617:86234), and SearchForm
 * picks between the two on `useIsDesktop()`. That's why this reaches for
 * DropdownSurface's sheet directly instead of going through OptionDropdown:
 * the sheet here is a different thing from the popover — a search box, a
 * close button and a card of rounded rows — not the same list re-dressed.
 *
 * Unlike the popover, focus moves into the sheet (onto the search box), so
 * this is a dialog. The trigger takes focus back when it closes.
 *
 * The list filters as you type. These are closed sets, so an empty result is
 * a dead end rather than a value the form could submit — there's no "use what
 * I typed" here, only `emptyLabel`.
 *
 * @param id             dialog id, the trigger's `aria-controls` target
 * @param content        the field's `sheet` block: title, placeholder,
 *                       searchLabel, emptyLabel, closeLabel
 * @param closeIcon      the 24 "Left-icon" X (I999:258980;1429:6548)
 * @param options        `[{ value, label }]` — the field's whole set
 * @param selectedValue  the option currently chosen
 * @param onSelect       called with the chosen option
 * @param onClose        Escape, the close button, or a tap on the scrim
 * @param rootRef        outermost node, so the trigger can tell an outside
 *                       click from one that landed in the sheet
 */
export default function ChoiceSheet({
  id,
  content,
  closeIcon,
  options,
  selectedValue,
  onSelect,
  onClose,
  rootRef,
}) {
  const { title, placeholder, searchLabel, emptyLabel, closeLabel } = content;

  const inputId = `${id}-search`;
  const listboxId = `${id}-listbox`;
  const optionId = (index) => `${id}-option-${index}`;

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef(null);
  const listRef = useRef(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) => option.label.toLowerCase().includes(needle));
  }, [options, query]);

  // Figma draws the caret sitting in the search box, so the sheet opens with
  // it focused. That also gets focus into the dialog, which the close button
  // and Escape then get back out.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keep the arrow-key row in view. Focus stays in the search box, so the
  // browser won't scroll the list for us.
  useEffect(() => {
    if (activeIndex < 0) return;
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const move = (step) => {
    if (visible.length === 0) return;
    setActiveIndex((index) => {
      if (index < 0) return step > 0 ? 0 : visible.length - 1;
      return (index + step + visible.length) % visible.length;
    });
  };

  const onKeyDown = (event) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        move(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        move(-1);
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(visible.length - 1);
        break;
      case "Enter":
        // Nothing here submits the form — the sheet is portalled out of it —
        // but a row has to be picked out before Enter means anything.
        event.preventDefault();
        if (activeIndex >= 0 && visible[activeIndex]) onSelect(visible[activeIndex]);
        break;
      case "Escape":
        event.preventDefault();
        // The search-result panel closes itself on Escape, from a listener on
        // document. While this sheet is open, Escape belongs to the sheet.
        event.stopPropagation();
        onClose();
        break;
      default:
        break;
    }
  };

  return (
    <DropdownSurface className={styles.surface} rootRef={rootRef} onClose={onClose} modal>
      <div
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        className={styles.panel}
        onKeyDown={onKeyDown}
      >
        {/* "<PopupModalHeader>" 999:258980 — 56 tall, the title against the
            close X at the right edge. */}
        <div className={styles.head}>
          <p id={`${id}-title`} className={styles.title}>
            {title}
          </p>
          <button type="button" className={styles.close} onClick={onClose} aria-label={closeLabel}>
            <Image src={closeIcon} alt="" aria-hidden="true" width={24} height={24} />
          </button>
        </div>

        {/* "Search Input" 999:258981. Figma's "Bar/Blue" inside it is the text
            cursor drawn at rest, so it's the input's own caret here rather
            than an element — see `caret-color` in the stylesheet. */}
        <div className={styles.search}>
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            value={query}
            placeholder={placeholder}
            autoComplete="off"
            role="combobox"
            aria-label={searchLabel}
            aria-expanded="true"
            aria-controls={listboxId}
            aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
            aria-autocomplete="list"
            className={styles.searchInput}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(-1);
            }}
          />
        </div>

        {/* "Dropdown List" 999:258985 — the card of rows under the search box. */}
        <div className={styles.listCard}>
          <ul ref={listRef} id={listboxId} role="listbox" className={styles.list}>
            {visible.length === 0 ? (
              <li role="presentation" className={styles.empty}>
                {emptyLabel}
              </li>
            ) : (
              visible.map((option, index) => {
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
                    // Swallowing mousedown keeps focus in the search box, so
                    // picking a row never blurs it and the phone's keyboard
                    // doesn't flash shut and open again. mousedown rather
                    // than pointerdown: a touch that turns into a scroll
                    // never fires it, so the list still pans by finger.
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onSelect(option)}
                  >
                    {option.label}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </DropdownSurface>
  );
}

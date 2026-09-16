"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import DropdownSurface, { useIsDesktop } from "../DropdownSurface/DropdownSurface";
import styles from "./TravellerPicker.module.scss";

/**
 * Figma "traveller selection" — 617:74196 (nothing picked) and 617:75161
 * (three picked). One 400x368 card in two states, so both are this component.
 *
 * It replaces what used to be a plain "4 Travellers" <select>. The trip is
 * PNR-linked, so the design picks *named* travellers off the booking rather
 * than a count — but the form still submits a count under `travellers`, which
 * is what lib/trip.js and the search-result summary read. That keeps the
 * whole data flow behind this component unchanged.
 *
 * Selection is a draft: ticking a row changes nothing until "Continue". Any
 * other way out — Escape, the scrim, a click outside — discards it, which is
 * what a panel with its own confirm button should do.
 *
 * On mobile it's presented as Figma's "Popup with Overlay" 776:205142: the
 * modal bottom sheet, a "Select Travellers" header, and the card chrome
 * dropped — see the `<desktop` block in the SCSS.
 *
 * Focus moves into the panel while it's open (unlike the destination list,
 * which keeps focus on its combobox input), so this is a dialog.
 *
 * @param id         panel id, the trigger's `aria-controls` target
 * @param content    the `travellers` block of the page's search JSON
 * @param selected   committed traveller ids
 * @param onConfirm  called with the new ids when "Continue" is pressed
 * @param onClose    called when the panel should close without committing
 * @param rootRef    outermost node, so the trigger can tell an outside click
 *                   from one that landed in the panel
 * @param className  the host's own hook for this popup, e.g. a nudge of the
 *                   desktop popover
 */
export default function TravellerPicker({
  id,
  content,
  selected,
  onConfirm,
  onClose,
  rootRef,
  className,
}) {
  const { ariaLabel, sheetTitle, options, summaryLabel, continueLabel, checkedIcon, uncheckedIcon } = content;
  const [draft, setDraft] = useState(selected);
  const isDesktop = useIsDesktop();
  const panelRef = useRef(null);

  // Take focus on open and hand it back on close — the trigger refocuses the
  // button itself, so this only has to get focus *in*.
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  const toggle = (optionId) =>
    setDraft((current) =>
      current.includes(optionId)
        ? current.filter((each) => each !== optionId)
        : // Keep the booking's own order, so the rows never reshuffle.
          options.filter((option) => option.id === optionId || current.includes(option.id))
            .map((option) => option.id),
    );

  const onKeyDown = (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    // The search-result panel closes itself on Escape, from a listener on
    // document. While this panel is open, Escape belongs to it.
    event.stopPropagation();
    onClose();
  };

  const summary = summaryLabel[draft.length === 1 ? "one" : "other"].replace(
    "{count}",
    String(draft.length),
  );

  return (
    <DropdownSurface
      className={[styles.surface, className].filter(Boolean).join(" ")}
      rootRef={rootRef} onClose={onClose} modal>
      <div
        ref={panelRef}
        id={id}
        role="dialog"
        aria-label={ariaLabel}
        aria-modal={isDesktop ? undefined : true}
        tabIndex={-1}
        className={styles.panel}
        onKeyDown={onKeyDown}
      >
        {/* mweb sheet header "Select Travellers" (I776:205147;1429:6535).
            The web card has no title, so it's hidden from desktop up. */}
        {sheetTitle ? <p className={styles.sheetTitle}>{sheetTitle}</p> : null}

        {/* "Frame 2147227152" (617:75162) — the rows, 12 apart. */}
        <ul className={styles.list}>
          {options.map((option) => {
            const checked = draft.includes(option.id);

            return (
              <li key={option.id} className={checked ? `${styles.row} ${styles.rowChecked}` : styles.row}>
                <label className={styles.rowLabel}>
                  <span className={styles.details}>
                    <span className={styles.position}>{option.label}</span>
                    <span className={styles.name}>{option.name}</span>
                  </span>
                  {/* A real checkbox, moved off-screen rather than hidden, so
                      it keeps its keyboard and screen-reader behaviour; the
                      image beside it draws Figma's two states. */}
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(option.id)}
                    className={styles.checkbox}
                  />
                  <Image
                    src={checked ? checkedIcon : uncheckedIcon}
                    alt=""
                    aria-hidden="true"
                    width={24}
                    height={24}
                    className={styles.checkboxIcon}
                  />
                </label>
              </li>
            );
          })}
        </ul>

        {/* "Fare Details" (617:75203) — the count against the Continue button. */}
        <div className={styles.footer}>
          <p className={styles.summary}>{summary}</p>
          <button
            type="button"
            className={styles.continue}
            disabled={draft.length === 0}
            onClick={() => onConfirm(draft)}
          >
            {/* mweb says "Next" (776:205208), web "Continue" (617:75220). */}
            <span className={styles.labelMobile}>{continueLabel.mobile}</span>
            <span className={styles.labelDesktop}>{continueLabel.desktop}</span>
          </button>
        </div>
      </div>
    </DropdownSurface>
  );
}

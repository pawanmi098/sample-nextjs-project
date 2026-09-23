"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import styles from "./DisclaimerPopup.module.scss";

/**
 * The home page's "Disclaimer" popup — Figma web "Popup Modal" (1351:143859)
 * over its "Overlay" (1351:143858), and mweb 1098:308323.
 *
 * The visa assistance disclaimer the page also carries as a section, said in
 * full and acknowledged before the search is used. It opens with the page and
 * closes for good once "Continue" is pressed, so it isn't asked again on the
 * next visit.
 *
 * A native <dialog> opened with showModal(), like document-upload's photo
 * guide: the browser supplies the modal parts — the page behind goes inert,
 * focus stays inside, and Escape closes it — and the overlay is its
 * ::backdrop, which a click also closes it from.
 *
 * The two frames draw the same popup at two sizes: mweb a 320 card with 16/12
 * padding and a full-width button, web a 480 one whose button sits at the
 * right. Only the widths, the title's cut, the acknowledgement's radius and
 * that button differ, so it's one component throughout.
 *
 * @param content  homeContent.disclaimerPopup
 */

// Acknowledging is remembered per browser, so the popup greets a first visit
// only. Reading it can throw in a private window, which is the same answer as
// "not acknowledged yet".
const STORAGE_KEY = "ivs.home.disclaimer-acknowledged";

function readAcknowledged() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

// Whether the popup is due is a browser fact, so it's read as an external
// store rather than set from an effect: the server and the first client pass
// both see `false`, and React opens it as it hydrates. The two flags live
// outside the component so a client-side return to the home page doesn't ask
// again in the same session.
let dismissed = false;
let acknowledged = null;
const listeners = new Set();

function subscribe(onStoreChange) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function getSnapshot() {
  if (dismissed) return false;
  if (acknowledged === null) acknowledged = readAcknowledged();
  return !acknowledged;
}

const getServerSnapshot = () => false;

function dismiss() {
  dismissed = true;
  listeners.forEach((listener) => listener());
}

export default function DisclaimerPopup({ content }) {
  const { title, icon, closeIcon, closeLabel, body, consent, continueLabel } = content;

  const open = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [checked, setChecked] = useState(false);

  const dialogRef = useRef(null);
  const consentRef = useRef(null);

  const id = useId();
  const titleId = `${id}-title`;
  const bodyId = `${id}-body`;
  const consentId = `${id}-consent`;

  useEffect(() => {
    if (!open) return undefined;
    dialogRef.current?.showModal();

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const acknowledge = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
      acknowledged = true;
    } catch {
      // A browser that won't store it simply asks again next time.
    }
    dialogRef.current?.close();
  };

  // A click whose point lies outside the card landed on the ::backdrop.
  const handleClick = (event) => {
    const rect = dialogRef.current.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!inside) dialogRef.current.close();
  };

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      onClose={dismiss}
      onClick={handleClick}
    >
      {/* "<PopupModalHeader>" (1351:143860): the 32 icon tile, the title, and
          the close cross at the far edge, all centred in a 32-tall row. */}
      <div className={styles.head}>
        <span className={styles.avatar} aria-hidden="true">
          <Image src={icon} alt="" width={20} height={20} />
        </span>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <button type="button" className={styles.close} onClick={() => dialogRef.current.close()}>
          <Image src={closeIcon} alt="" aria-hidden="true" width={24} height={24} />
          <span className={styles.closeText}>{closeLabel}</span>
        </button>
      </div>

      {/* "<PopupModalContent>" (1351:143869): the disclaimer itself, with the
          quoted "Calleo" in semibold and the support address as a mailto.
          Both frames give it the whole card, so it is the part that scrolls on
          a screen shorter than the popup — hence its own tab stop, which is
          what makes that scrolling reachable from the keyboard. */}
      <div
        id={bodyId}
        className={styles.body}
        tabIndex={0}
        dangerouslySetInnerHTML={{ __html: body }}
      />

      {/* "Frame 2147224117" (1351:143877): the tinted acknowledgement strip.
          The whole row is the target — unlike the review step's, this copy
          carries no link of its own. */}
      <div className={styles.consent}>
        <input
          ref={consentRef}
          id={consentId}
          type="checkbox"
          className={styles.input}
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
        />
        <label htmlFor={consentId} className={styles.consentLabel}>
          <Image
            src={checked ? consent.checkedIcon : consent.uncheckedIcon}
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
            className={styles.checkbox}
          />
          <span className={styles.consentText}>{consent.label}</span>
        </label>
      </div>

      {/* "<PopupModalAction>" (1351:143881). PROVISIONAL: both frames draw the
          box ticked and the button live, and neither draws it otherwise. Until
          the acknowledgement is given it takes the same grey the sticky
          "Review your application" button wears while its form is incomplete,
          and stays clickable so pressing it can point at what's missing. */}
      <div className={styles.action}>
        <button
          type="button"
          className={checked ? styles.continue : `${styles.continue} ${styles.continueInactive}`}
          aria-disabled={checked ? undefined : true}
          onClick={() => (checked ? acknowledge() : consentRef.current?.focus())}
        >
          {continueLabel}
        </button>
      </div>
    </dialog>
  );
}

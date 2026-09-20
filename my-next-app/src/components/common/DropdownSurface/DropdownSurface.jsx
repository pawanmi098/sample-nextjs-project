"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import styles from "./DropdownSurface.module.scss";

/**
 * How a search field's popup is presented — the one thing the destination
 * list (OptionDropdown) and the traveller picker (TravellerPicker) have in
 * common.
 *
 * - desktop: a popover hanging under the field it belongs to.
 * - mobile: a sheet at the bottom of the viewport over a scrim, portalled to
 *   <body> so it clears both hosts' stacking contexts — the home page's search
 *   widget and the search-result header's own fixed panel layer.
 *
 * It owns placement only. What goes inside, and where focus lives while it's
 * open, is the caller's business: the destination list keeps focus on its
 * combobox input, while the traveller picker takes focus into itself.
 *
 * @param align      which edge of the field the popover hangs from —
 *                   "start" (default) or "end". Fields near the right of the
 *                   search row need "end", or a 392-wide card runs off the
 *                   viewport. Irrelevant to the sheet, which is full width.
 * @param className  the caller's own card width/styling, applied to the
 *                   positioned box in both presentations
 * @param rootRef    outermost node, so the caller can tell an outside click
 *                   from one that landed in the popup
 * @param onClose    called when the mobile scrim is tapped
 * @param modal      mobile only: present the sheet as Figma's "Popup with
 *                   Overlay" (776:206235) — gradient blurred scrim, rounded
 *                   sheet with a grab handle. Off keeps the plain sheet.
 * @param sheetClassName  mobile only: the caller's own class on the sheet bar
 *                   itself, for what belongs to the full-bleed surface rather
 *                   than the card inside it — the date picker's edge-to-edge
 *                   close bar and its own drop shadow.
 */

// Matches $breakpoints.desktop in src/styles/_media.scss. The two
// presentations are different DOM — in place vs. portalled — so a media query
// alone can't switch between them.
const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribe(onStoreChange) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

const getSnapshot = () => window.matchMedia(DESKTOP_QUERY).matches;
// A popup only ever opens after a click or a keypress, so this never decides
// markup that has to match a server render. It's here so the hook is still
// safe if something renders a surface during SSR.
const getServerSnapshot = () => false;

export function useIsDesktop() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default function DropdownSurface({
  align = "start",
  className,
  sheetClassName,
  rootRef,
  onClose,
  modal = false,
  children,
}) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    const placement = [styles.popover, align === "end" && styles.popoverEnd, className];

    return (
      <div ref={rootRef} className={placement.filter(Boolean).join(" ")}>
        {children}
      </div>
    );
  }

  return createPortal(
    <div ref={rootRef} className={[styles.sheetLayer, modal && styles.modal].filter(Boolean).join(" ")}>
      {/* Escape and a tap outside close the popup too, so the scrim needs no
          keyboard role of its own. */}
      <div className={styles.scrim} aria-hidden="true" onClick={onClose} />
      <div className={[styles.sheet, sheetClassName].filter(Boolean).join(" ")}>
        {/* {modal ? <div className={styles.handle} aria-hidden="true" /> : null} */}
        {/* The sheet bar stays edge to edge; the caller's class sizes the card
            inside it, the same box its popover class sizes on desktop. */}
        <div className={className}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}

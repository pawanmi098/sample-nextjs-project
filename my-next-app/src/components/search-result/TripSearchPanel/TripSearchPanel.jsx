"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import SearchForm from "@/components/common/SearchForm/SearchForm";
import styles from "./TripSearchPanel.module.scss";

/**
 * The expanded state of the search-result header.
 *
 * It's drawn twice, so it behaves twice:
 *  - desktop — "Top navigation-Desktop" (617:71171). The frame's 100-tall Menu
 *    Bar is the sticky header that's already on the page, so this renders only
 *    what drops below it: the white "Primary Panel" (617:71210) carrying the
 *    search fields, and the blue screen that covers the rest of the viewport.
 *    It's a fixed layer under the header, so the header's chevron stays
 *    clickable to collapse it.
 *  - mweb — "edit overlay" (999:263879). There it's a full-screen modal: the
 *    #F5F8FC "Overlay" (999:264280) covers the header too, so the panel brings
 *    its own close button — the "<PopupModalHeader>" (999:264538) — and the
 *    fields sit in the rounded card "Frame 2147227925" (999:264282) below it.
 *
 * Both presentations are the same DOM; only the stylesheet switches. What
 * differs is where focus goes: below desktop the header is covered, so focus
 * moves into the overlay.
 *
 * Rendered into a portal by TripSummary: the header sets `backdrop-filter`,
 * which would otherwise make it the containing block for `position: fixed`.
 *
 * The fields themselves are the shared SearchForm — the same component the
 * home page's search widget renders, from the same Figma "Search Input".
 * It's a plain GET back to this same route, so submitting re-renders the page
 * with the new criteria.
 *
 * @param id       matches the toggle button's aria-controls
 * @param content  searchResultContent.editSearch
 * @param values   trip.values — the criteria this page is showing
 * @param onClose  called from the close button and the blue screen
 */

// Matches $breakpoints.desktop in src/styles/_media.scss, and the query
// DropdownSurface switches its own two presentations on.
const DESKTOP_QUERY = "(min-width: 1024px)";

export default function TripSearchPanel({ id, content, values, onClose }) {
  const closeRef = useRef(null);

  // Mount only: below desktop this covers the header, so focus has to follow
  // it in. At desktop the header stays visible and focus stays on its chevron,
  // which is what collapses the panel again. A viewport that later crosses the
  // breakpoint shouldn't steal focus, hence no dependency on the match.
  useEffect(() => {
    if (!window.matchMedia(DESKTOP_QUERY).matches) closeRef.current?.focus();
  }, []);

  return (
    <div className={styles.layer}>
      {/* mweb only — "<PopupModalHeader>" (999:264538): a 56-tall row with the
          24 close icon at its leading edge. */}
      <div className={styles.header}>
        <button
          ref={closeRef}
          type="button"
          className={styles.close}
          aria-label={content.closeLabel}
          onClick={onClose}
        >
          <Image
            src={content.sheetCloseIcon}
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
          />
        </button>
      </div>

      <div id={id} className={styles.panel}>
        {/* Figma greys the city and date values, which is its empty state.
            This panel edits a search that already exists, so the fields carry
            the current criteria as real values — which is also what keeps them
            above the 4.5:1 contrast the grey would fail. */}
        <SearchForm
          idPrefix="trip-search"
          variant="panel"
          className={styles.form}
          ariaLabel={content.ariaLabel}
          content={content}
          values={values}
        />
      </div>

      {/* Desktop only: the blue screen over the rest of the page. Escape and
          the header's chevron close the panel too, so this needs no keyboard
          role of its own. Below desktop the overlay already covers the screen,
          and the close button above is the real control. */}
      <div className={styles.scrim} title={content.closeLabel} aria-hidden="true" onClick={onClose} />
    </div>
  );
}

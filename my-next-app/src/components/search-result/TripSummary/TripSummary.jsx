"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import TripSearchPanel from "../TripSearchPanel/TripSearchPanel";
import styles from "./TripSummary.module.scss";

/**
 * The selected search criteria, shown in the search result page's header.
 * Passed to SiteHeader's `trip` slot — Figma "Menu Bar" 724:142720 (web,
 * as used by "Top navigation-Desktop" 754:168079) and the "Sticky Header"
 * 666:139891 "Bottom" row (mweb).
 *
 * One flat 3-child grid serves both viewports: route, facts and the edit
 * button re-flow via grid-template-areas, so nothing is duplicated to move
 * the edit button from beside the facts (web) to the bar's edge (mweb).
 *
 * The edit button is a disclosure: it drops TripSearchPanel below the header
 * and turns into the bordered chevron of the expanded frame
 * "Top navigation-Desktop" 617:71171. The panel is portalled to <body>
 * because the header sets `backdrop-filter`, which would otherwise become the
 * containing block for the panel's `position: fixed` layer.
 */
function Facts({ facts, className }) {
  return (
    <ul className={`${styles.meta} ${className}`}>
      {facts.map((fact) => (
        <li key={fact.id} className={styles.metaItem}>
          {fact.label}
        </li>
      ))}
    </ul>
  );
}

export default function TripSummary({ content, editSearch, trip }) {
  const { ariaLabel, routeSeparatorLabel, swapIcon, arrowIcon, edit, collapse } = content;
  const [open, setOpen] = useState(false);
  const toggleRef = useRef(null);
  const panelId = useId();

  const close = () => {
    setOpen(false);
    toggleRef.current?.focus();
  };

  // Escape closes the panel, as it would any overlay.
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // The mobile-only fact is first and the desktop-only ones last, so each
  // viewport's list stays a contiguous run of the same array.
  // Expanded, the web bar also shows the trip purpose: the collapsed frame
  // (724:142732…) lists four facts, the expanded one (617:71508…) all five.
  const mobileFacts = trip.facts.filter((fact) => fact.show !== "desktop");
  const desktopFacts = open ? trip.facts : trip.facts.filter((fact) => fact.show !== "mobile");
  const toggle = open ? collapse : edit;

  return (
    <section className={styles.tripSummary} aria-label={ariaLabel}>
      <p className={styles.route}>
        <span className={styles.routeCity}>{trip.from}</span>
        {/* Two icons, one per viewport — mweb uses a swap glyph, web an
            arrow. The hidden one stays lazy, so it's never downloaded. */}
        <Image
          src={swapIcon}
          alt=""
          aria-hidden="true"
          width={20}
          height={20}
          className={styles.routeIconMobile}
        />
        <Image
          src={arrowIcon}
          alt=""
          aria-hidden="true"
          width={24}
          height={24}
          className={styles.routeIconDesktop}
        />
        {/* The icon is decorative, so name the direction for screen readers. */}
        <span className={styles.srOnly}>{routeSeparatorLabel}</span>
        <span className={styles.routeCity}>{trip.to}</span>
      </p>

      <Facts facts={mobileFacts} className={styles.metaMobile} />
      <Facts facts={desktopFacts} className={styles.metaDesktop} />

      <button
        ref={toggleRef}
        type="button"
        className={open ? `${styles.editButton} ${styles.editButtonOpen}` : styles.editButton}
        aria-label={toggle.label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
      >
        <Image src={toggle.icon} alt="" aria-hidden="true" width={20} height={20} />
      </button>

      {open &&
        createPortal(
          <TripSearchPanel
            id={panelId}
            content={editSearch}
            values={trip.values}
            onClose={close}
          />,
          document.body,
        )}
    </section>
  );
}

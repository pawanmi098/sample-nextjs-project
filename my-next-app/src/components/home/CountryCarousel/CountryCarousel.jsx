"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./CountryCarousel.module.scss";

export default function CountryCarousel({ content }) {
  const { sectionTitle, regionLabel, previousLabel, nextLabel, chevronIcon, items } = content;
  const trackRef = useRef(null);
  const [scrollState, setScrollState] = useState({
    canScrollPrevious: false,
    canScrollNext: true,
  });

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const maxScrollLeft = track.scrollWidth - track.clientWidth;
    setScrollState({
      canScrollPrevious: track.scrollLeft > 1,
      canScrollNext: track.scrollLeft < maxScrollLeft - 1,
    });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    // ResizeObserver fires once on observe, which seeds the initial state.
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(track);
    track.addEventListener("scroll", updateScrollState, { passive: true });

    return () => {
      resizeObserver.disconnect();
      track.removeEventListener("scroll", updateScrollState);
    };
  }, [updateScrollState]);

  const scrollByCard = (direction) => {
    const track = trackRef.current;
    const list = track.firstElementChild;
    const card = list.firstElementChild;
    const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    track.scrollBy({
      left: direction * (card.offsetWidth + gap),
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <section className={styles.countries} aria-labelledby="visa-countries-heading">
      <h2 id="visa-countries-heading" className={styles.sectionTitle}>
        {sectionTitle}
      </h2>

      <div className={styles.viewport}>
        <div
          ref={trackRef}
          className={styles.track}
          role="region"
          aria-label={regionLabel}
          tabIndex={0}
        >
          <ul className={styles.list}>
            {items.map((country) => (
              <li key={country.name} className={styles.card}>
                <Image
                  src={country.image.src}
                  alt={country.image.alt}
                  fill
                  sizes="(min-width: 1024px) 168px, 145px"
                  className={styles.photo}
                />
                <span className={styles.overlay} aria-hidden="true" />
                <div className={styles.caption}>
                  <h3 className={styles.name}>{country.name}</h3>
                  <p className={styles.meta}>{country.meta}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {scrollState.canScrollPrevious && (
          <button
            type="button"
            className={`${styles.navButton} ${styles.navButtonPrevious}`}
            onClick={() => scrollByCard(-1)}
            aria-label={previousLabel}
          >
            <Image
              src={chevronIcon}
              alt=""
              aria-hidden="true"
              width={16}
              height={16}
              className={`${styles.navIcon} ${styles.navIconPrevious}`}
            />
          </button>
        )}
        <button
          type="button"
          className={styles.navButton}
          onClick={() => scrollByCard(1)}
          aria-label={nextLabel}
          disabled={!scrollState.canScrollNext}
        >
          <Image
            src={chevronIcon}
            alt=""
            aria-hidden="true"
            width={16}
            height={16}
            className={styles.navIcon}
          />
        </button>
      </div>
    </section>
  );
}

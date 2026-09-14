import Image from "next/image";
import styles from "./DestinationPromo.module.scss";

export default function DestinationPromo({ content }) {
  const { title, headline, image, slideCount } = content;

  return (
    <section className={styles.promo} aria-labelledby="destination-promo-title">
      <div className={styles.header}>
        <h2 id="destination-promo-title" className={styles.title}>
          {title}
        </h2>
        {/* Slide indicator from the Figma card; only the first slide is designed so far. */}
        <span className={styles.indicator} aria-hidden="true">
          {Array.from({ length: slideCount }, (_, index) => (
            <span
              key={index}
              className={index === 0 ? styles.indicatorActive : styles.indicatorDot}
            />
          ))}
        </span>
      </div>

      <div className={styles.media}>
        <Image
          src={image.src}
          alt={image.alt}
          fill
          // The page's one preloaded image: mobile LCP (lazy loading delayed
          // it by ~1.5s). The section is hidden on desktop, where a preloaded
          // image still downloads, so desktop asks for the smallest variant.
          preload
          sizes="(min-width: 1024px) 16px, calc(100vw - 72px)"
          className={styles.photo}
        />
        <span className={styles.overlay} aria-hidden="true" />
        <p className={styles.headline}>
          {headline.map((line) => (
            <span key={line} className={styles.headlineLine}>
              {line}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}

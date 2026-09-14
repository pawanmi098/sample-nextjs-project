import Link from "next/link";
import styles from "./Disclaimer.module.scss";

export default function Disclaimer({ content, className }) {
  const { ariaLabel, label, text, readMore } = content;

  return (
    <section
      className={className ? `${styles.disclaimer} ${className}` : styles.disclaimer}
      aria-label={ariaLabel}
    >
      <p className={styles.text}>
        <strong className={styles.label}>{label}</strong>
        {text}{" "}
        <Link href={readMore.href} prefetch={false} className={styles.readMore}>
          {readMore.label}
          {/* "Read more" alone fails Lighthouse's descriptive link text audit. */}
          <span className={styles.visuallyHidden}> {readMore.context}</span>
        </Link>
      </p>
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";
import styles from "./MoreInfo.module.scss";

/**
 * "More Information" — Figma "Frame 1321316897" (761:196905): one closed row
 * per topic ("review summary" 761:196927, "Terms & Conditions"). Each row is a
 * native <details>.
 *
 * PROVISIONAL: Figma draws the rows closed only, so what opens under one is
 * the topic's `body` and `link` from the JSON, set like the card's own text.
 *
 * @param content  documentUploadContent.moreInfo
 */
export default function MoreInfo({ content }) {
  const { title, items, chevronIcon } = content;

  return (
    <section className={styles.section} aria-labelledby="more-info-title">
      <h2 id="more-info-title" className={styles.title}>
        {title}
      </h2>
      {items.map((item) => (
        <details key={item.id} className={styles.card}>
          <summary className={styles.summary}>
            <Image src={item.icon} alt="" aria-hidden="true" width={24} height={24} className={styles.icon} />
            <span className={styles.label}>{item.label}</span>
            <Image src={chevronIcon} alt="" aria-hidden="true" width={16} height={16} className={styles.chevron} />
          </summary>
          <div className={styles.body}>
            <p>{item.body}</p>
            {item.link && (
              <Link href={item.link.href} prefetch={false} className={styles.link}>
                {item.link.label}
              </Link>
            )}
          </div>
        </details>
      ))}
    </section>
  );
}

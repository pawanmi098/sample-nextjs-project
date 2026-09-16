import Image from "next/image";
import Link from "next/link";
import styles from "./SiteHeader.module.scss";

/**
 * The one site-wide top bar. Rendered per route segment, not in the root
 * layout, so a route can fill the `trip` slot from its own searchParams
 * (a layout never receives them).
 *
 * @param content  commonContent.header
 * @param trip     Optional element for the centre slot. When given, it
 *                 replaces the mobile title + 6Eskai avatar and fills the
 *                 space beside the desktop logo — Figma "Top navigation-
 *                 Desktop" 754:168079 (web) / "Sticky Header" 666:139891
 *                 (mweb), the search result page's taller header variant.
 */
export default function SiteHeader({ content, trip = null }) {
  const { logo, back, title, assistant } = content;

  // Mobile shows back link · page title · 6Eskai entry; desktop shows the logo.
  // The hidden set's images stay lazy, so they're never downloaded.
  return (
    <header className={trip ? `${styles.siteHeader} ${styles.withTrip}` : styles.siteHeader}>
      <div className={styles.primaryPanel}>
        <Link href={back.href} prefetch={false} className={styles.backLink}>
          <Image
            src={back.icon}
            alt={back.label}
            width={20}
            height={20}
            className={styles.backIcon}
          />
        </Link>
        <Link href={logo.href} className={styles.logoLink}>
          <Image
            src={logo.src}
            alt={logo.alt}
            width={logo.width}
            height={logo.height}
            className={styles.logo}
          />
        </Link>
        {trip ?? (
          <>
            <p className={styles.title}>{title}</p>
            <Link href={assistant.href} prefetch={false} className={styles.assistantLink}>
              <Image
                src={assistant.image}
                alt={assistant.label}
                width={32}
                height={32}
                className={styles.assistantAvatar}
              />
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

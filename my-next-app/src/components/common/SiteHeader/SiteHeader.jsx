import Image from "next/image";
import Link from "next/link";
import styles from "./SiteHeader.module.scss";

export default function SiteHeader({ content }) {
  const { logo, back, title, assistant } = content;

  // Mobile shows back link · page title · 6Eskai entry; desktop shows the logo.
  // The hidden set's images stay lazy, so they're never downloaded.
  return (
    <header className={styles.siteHeader}>
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
      </div>
    </header>
  );
}

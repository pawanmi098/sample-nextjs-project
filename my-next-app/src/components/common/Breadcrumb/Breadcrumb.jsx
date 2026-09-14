import Image from "next/image";
import Link from "next/link";
import styles from "./Breadcrumb.module.scss";

export default function Breadcrumb({ ariaLabel, items, separatorIcon }) {
  const lastIndex = items.length - 1;

  return (
    <nav aria-label={ariaLabel} className={styles.breadcrumb}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isCurrent = index === lastIndex;

          return (
            <li key={item.label} className={styles.item}>
              {isCurrent ? (
                <span className={styles.current} aria-current="page">
                  {item.label}
                </span>
              ) : (
                // No prefetch: breadcrumb targets are low-intent and a
                // prefetch of a not-yet-built route logs a 404 in the console
                // (fails Lighthouse Best Practices).
                <Link href={item.href} prefetch={false} className={styles.link}>
                  {item.icon ? (
                    <Image
                      src={item.icon.src}
                      alt={item.label}
                      width={item.icon.width}
                      height={item.icon.height}
                      className={styles.icon}
                    />
                  ) : (
                    item.label
                  )}
                </Link>
              )}
              {!isCurrent && (
                <Image
                  src={separatorIcon}
                  alt=""
                  aria-hidden="true"
                  width={16}
                  height={16}
                  className={styles.separator}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

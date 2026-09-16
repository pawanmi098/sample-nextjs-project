import Image from "next/image";
import Link from "next/link";
import styles from "./VisaPlanFilters.module.scss";

/**
 * Visa type chips and the sort toggle above the plan list — Figma web
 * "Frame 2147227879" (724:142594) and mweb "discount categories"
 * (682:141417). The mweb frame has no sort button, so it's hidden there.
 *
 * Both controls are links back to /search-result with one query param
 * changed (see src/lib/plans.js), so the row is a server component and the
 * page keeps working without JavaScript. `prefetch` stays on: the target is
 * this same route, so there's no 404 prefetch to worry about.
 */
export default function VisaPlanFilters({ ariaLabel, options, sort }) {
  return (
    <nav aria-label={ariaLabel} className={styles.filters}>
      <ul className={styles.chips}>
        {options.map((option) => (
          <li key={option.id}>
            <Link
              href={option.href}
              aria-current={option.selected ? "true" : undefined}
              className={`${styles.chip} ${option.selected ? styles.chipSelected : ""}`}
            >
              {option.label}
            </Link>
          </li>
        ))}
      </ul>

      <Link href={sort.href} aria-label={sort.label} className={styles.sort}>
        <Image src={sort.icon} alt="" aria-hidden="true" width={24} height={24} />
      </Link>
    </nav>
  );
}

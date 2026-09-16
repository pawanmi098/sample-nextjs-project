import Breadcrumb from "@/components/common/Breadcrumb/Breadcrumb";
import { format } from "@/lib/trip";
import styles from "./ResultsIntro.module.scss";

/**
 * Page heading for the search result page — Figma "Frame 2147227589"
 * (754:167952, web) and "Frame 1321316059" (666:139788, mweb).
 *
 * Both the title and the subtitle are worded differently per viewport, so
 * each is one element holding two spans; only one <h1> ever exists.
 */
export default function ResultsIntro({ content, trip }) {
  const { breadcrumb, partnerBadge, title, subtitle } = content;
  const tokens = { to: trip.to, purpose: trip.purposeAdjective };

  return (
    <section className={styles.intro} aria-labelledby="search-result-intro-title">
      <div className={styles.topRow}>
        <div className={styles.breadcrumb}>
          <Breadcrumb
            ariaLabel={breadcrumb.ariaLabel}
            items={breadcrumb.items}
            separatorIcon={breadcrumb.separatorIcon}
          />
        </div>
        <p className={styles.partnerBadge}>{partnerBadge}</p>
      </div>
      <div className={styles.heading}>
        <h1 id="search-result-intro-title" className={styles.title}>
          <span className={styles.mobileCopy}>{format(title.mobile, tokens)}</span>
          <span className={styles.desktopCopy}>{format(title.desktop, tokens)}</span>
        </h1>
        <p className={styles.subtitle}>
          <span className={styles.mobileCopy}>{subtitle.mobile}</span>
          <span className={styles.desktopCopy}>{subtitle.desktop}</span>
        </p>
      </div>
    </section>
  );
}

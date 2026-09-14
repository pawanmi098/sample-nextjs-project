import Breadcrumb from "@/components/common/Breadcrumb/Breadcrumb";
import styles from "./VisaSearchIntro.module.scss";

export default function VisaSearchIntro({ content }) {
  const { breadcrumb, partnerBadge, title, subtitle } = content;

  return (
    <section className={styles.intro} aria-labelledby="visa-search-intro-title">
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
        <h1 id="visa-search-intro-title" className={styles.title}>
          {title}
        </h1>
        {/* The mweb and web frames word the subtitle differently. */}
        <p className={styles.subtitle}>
          <span className={styles.subtitleMobile}>{subtitle.mobile}</span>
          <span className={styles.subtitleDesktop}>{subtitle.desktop}</span>
        </p>
      </div>
    </section>
  );
}

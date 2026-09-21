import Breadcrumb from "@/components/common/Breadcrumb/Breadcrumb";
import styles from "./PageIntro.module.scss";

/**
 * A copy string, or `{ mobile, desktop }` when the two frames word it
 * differently. Exported for the other places a page's frames disagree on
 * wording (the document upload page's titles, labels and sticky button).
 */
export function ResponsiveCopy({ copy }) {
  if (typeof copy === "string") return copy;

  return (
    <>
      <span className={styles.mobileCopy}>{copy.mobile}</span>
      <span className={styles.desktopCopy}>{copy.desktop}</span>
    </>
  );
}

/**
 * Page heading: breadcrumb, "Powered by Calleo" pill, the page's one <h1> and
 * its sub-heading. Search result — Figma "Frame 2147227589" (754:167952, web)
 * and "Frame 1321316059" (682:141425, mweb); traveller details —
 * "Frame 2147227589" (557:15117, web) and "Frame 1321316059" (653:138315, mweb).
 *
 * @param id        prefix for the heading id the section is labelled by
 * @param content   `{ breadcrumb, partnerBadge, title, subtitle }`; `title` and
 *                  `subtitle` are ready-to-render copy (see ResponsiveCopy)
 * @param children  mobile only: shown under the pill, above the heading
 *                  (traveller details' stepper)
 */
export default function PageIntro({ id, content, children }) {
  const { breadcrumb, partnerBadge, title, subtitle } = content;
  const titleId = `${id}-title`;

  return (
    <section className={styles.intro} aria-labelledby={titleId}>
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
      {children && <div className={styles.mobileSlot}>{children}</div>}
      <div className={styles.heading}>
        <h1 id={titleId} className={styles.title}>
          <ResponsiveCopy copy={title} />
        </h1>
        <p className={styles.subtitle}>
          <ResponsiveCopy copy={subtitle} />
        </p>
      </div>
    </section>
  );
}

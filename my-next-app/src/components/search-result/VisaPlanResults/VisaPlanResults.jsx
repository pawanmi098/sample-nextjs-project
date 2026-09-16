import VisaPlanCard from "@/components/search-result/VisaPlanCard/VisaPlanCard";
import VisaPlanFilters from "@/components/search-result/VisaPlanFilters/VisaPlanFilters";
import styles from "./VisaPlanResults.module.scss";

/**
 * The visa plan list under the page intro — Figma web "Frame 2147227914"
 * (724:142593) and mweb "discount categories" + "Frame 2147227865"
 * (682:141417, 682:141431): a filter/sort row, then one card per plan.
 *
 * The section has no visible heading in the design, so it carries a
 * screen-reader-only <h2> rather than an aria-label: that keeps the page's
 * heading outline intact (h1 intro → h2 here → h3 per plan).
 */
export default function VisaPlanResults({ content, plans }) {
  const { ariaLabel, filters, priceLabels, summary, details, emptyLabel } = content;

  return (
    <section className={styles.results} aria-labelledby="visa-plans-title">
      <h2 id="visa-plans-title" className={styles.srOnly}>
        {ariaLabel}
      </h2>

      <VisaPlanFilters
        ariaLabel={filters.ariaLabel}
        options={plans.filters}
        sort={plans.sort}
      />

      {plans.items.length === 0 ? (
        <p className={styles.empty}>{emptyLabel}</p>
      ) : (
        <ul className={styles.list}>
          {plans.items.map((plan) => (
            <li key={plan.id}>
              <VisaPlanCard
                plan={plan}
                priceLabels={priceLabels}
                summary={summary}
                details={details}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

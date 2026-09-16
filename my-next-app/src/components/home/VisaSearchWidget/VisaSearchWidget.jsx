import Image from "next/image";
import SearchForm from "@/components/common/SearchForm/SearchForm";
import styles from "./VisaSearchWidget.module.scss";

/**
 * The home page's search card — Figma web "Search Widget - Web" (617:63755)
 * and the mweb search card (653:133856).
 *
 * The form inside it is shared with the search-result header's edit panel
 * (src/components/common/SearchForm); what's left here is the card itself and
 * the PNR ribbon, which only this frame has.
 */
export default function VisaSearchWidget({ content }) {
  const { ariaLabel, pnr } = content;

  return (
    <section className={styles.widget} aria-label={ariaLabel}>
      <p className={styles.pnr}>
        <Image
          src={pnr.icon}
          alt=""
          aria-hidden="true"
          width={16}
          height={16}
          className={styles.pnrIcon}
        />
        <span>{pnr.label}</span>
      </p>

      {/* The id is the target of the mobile sticky "Continue" button (page.js). */}
      <SearchForm
        id="visa-search-form"
        idPrefix="visa-search"
        variant="widget"
        content={content}
      />
    </section>
  );
}

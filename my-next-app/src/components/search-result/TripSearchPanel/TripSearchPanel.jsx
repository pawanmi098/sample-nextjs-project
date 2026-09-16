import SearchForm from "@/components/common/SearchForm/SearchForm";
import styles from "./TripSearchPanel.module.scss";

/**
 * The expanded state of the search-result header — Figma web
 * "Top navigation-Desktop" (617:71171).
 *
 * The frame's 100-tall Menu Bar is the sticky header that's already on the
 * page, so this renders only what drops below it: the white "Primary Panel"
 * (617:71210) carrying the search fields, and the blue screen that covers the
 * rest of the viewport. It's a fixed layer under the header (z-index 9 against
 * the header's 10), so the header's chevron stays clickable to collapse it.
 *
 * Rendered into a portal by TripSummary: the header sets `backdrop-filter`,
 * which would otherwise make it the containing block for `position: fixed`.
 *
 * The fields themselves are the shared SearchForm — the same component the
 * home page's search widget renders, from the same Figma "Search Input".
 * It's a plain GET back to this same route, so submitting re-renders the page
 * with the new criteria.
 *
 * @param id       matches the toggle button's aria-controls
 * @param content  searchResultContent.editSearch
 * @param values   trip.values — the criteria this page is showing
 * @param onClose  called when the blue screen is clicked
 */
export default function TripSearchPanel({ id, content, values, onClose }) {
  return (
    <div className={styles.layer}>
      <div id={id} className={styles.panel}>
        {/* Figma greys the city and date values, which is its empty state.
            This panel edits a search that already exists, so the fields carry
            the current criteria as real values — which is also what keeps them
            above the 4.5:1 contrast the grey would fail. */}
        <SearchForm
          idPrefix="trip-search"
          variant="panel"
          className={styles.form}
          ariaLabel={content.ariaLabel}
          content={content}
          values={values}
        />
      </div>

      {/* The blue screen over the page. Escape and the header's chevron close
          the panel too, so this needs no keyboard role of its own. */}
      <div className={styles.scrim} title={content.closeLabel} aria-hidden="true" onClick={onClose} />
    </div>
  );
}

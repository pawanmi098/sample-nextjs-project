import SiteHeader from "@/components/common/SiteHeader/SiteHeader";
import TripSummary from "@/components/search-result/TripSummary/TripSummary";
import ResultsIntro from "@/components/search-result/ResultsIntro/ResultsIntro";
import commonContent from "@/data/commonContent.json";
import searchResultContent from "@/data/searchResultContent.json";
import { resolveTrip } from "@/lib/trip";
import styles from "./page.module.scss";

export const metadata = {
  title: searchResultContent.meta.title,
  description: searchResultContent.meta.description,
};

/**
 * Search result page — Figma web "SRP" (754:167951) and mweb "srp"
 * (666:139769).
 *
 * This route renders its own SiteHeader instead of inheriting the one in
 * app/(site)/layout.js, because its header carries the selected trip and a
 * layout never receives searchParams.
 */
export default async function SearchResultPage({ searchParams }) {
  const trip = resolveTrip(await searchParams, searchResultContent.trip);

  return (
    <>
      <SiteHeader
        content={commonContent.header}
        trip={
          <TripSummary
            content={searchResultContent.tripSummary}
            editSearch={searchResultContent.editSearch}
            trip={trip}
          />
        }
      />
      <main className={styles.page}>
        <ResultsIntro content={searchResultContent.intro} trip={trip} />
      </main>
    </>
  );
}

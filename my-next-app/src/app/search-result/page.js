import SiteHeader from "@/components/common/SiteHeader/SiteHeader";
import TripSummary from "@/components/search-result/TripSummary/TripSummary";
import ResultsIntro from "@/components/search-result/ResultsIntro/ResultsIntro";
import VisaPlanResults from "@/components/search-result/VisaPlanResults/VisaPlanResults";
import commonContent from "@/data/commonContent.json";
import searchResultContent from "@/data/searchResultContent.json";
import { resolvePlans } from "@/lib/plans";
import { resolveTrip } from "@/lib/trip";
import styles from "./page.module.scss";
import homeContent from "@/data/homeContent.json";
import Disclaimer from "@/components/common/Disclaimer/Disclaimer";
import BottomStickyBar from "@/components/common/BottomStickyBar/BottomStickyBar";


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
  const params = await searchParams;
  const trip = resolveTrip(params, searchResultContent.trip);
  const plans = resolvePlans(params, searchResultContent.plans);

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
        <VisaPlanResults content={searchResultContent.plans} plans={plans} />
        <Disclaimer content={homeContent.disclaimer} />
        {/* Fixed "Continue" bar — web "Primary Bottom Sticky" (724:142592),
            mweb "Secondary Bottom Sticky" (666:139892). */}
        <BottomStickyBar label={searchResultContent.stickyBar.continueLabel} />
      </main>
    </>
  );
}

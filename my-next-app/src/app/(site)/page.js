import VisaSearchIntro from "@/components/home/VisaSearchIntro/VisaSearchIntro";
import VisaSearchWidget from "@/components/home/VisaSearchWidget/VisaSearchWidget";
import DestinationPromo from "@/components/home/DestinationPromo/DestinationPromo";
import VisaProcessShowcase from "@/components/home/VisaProcessShowcase/VisaProcessShowcase";
import CountryCarousel from "@/components/home/CountryCarousel/CountryCarousel";
import Disclaimer from "@/components/common/Disclaimer/Disclaimer";
import BottomStickyBar from "@/components/common/BottomStickyBar/BottomStickyBar";
import homeContent from "@/data/homeContent.json";
import styles from "./page.module.scss";

export const metadata = {
  title: homeContent.meta.title,
  description: homeContent.meta.description,
};

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.searchArea}>
        <VisaSearchIntro content={homeContent.intro} />
        <VisaSearchWidget content={homeContent.search} />
      </div>
      {/* Mobile only */}
      <DestinationPromo content={homeContent.destinationPromo} />
      {/* Desktop only */}
      <VisaProcessShowcase content={homeContent.visaProcess} />
      <CountryCarousel content={homeContent.countries} />
      <Disclaimer content={homeContent.disclaimer} className={styles.mobileOnly} />
      {/* Mobile only: replaces the web Search button, which is hidden there. */}
      <BottomStickyBar
        label={homeContent.search.continueLabel}
        formId="visa-search-form"
        className={styles.mobileOnly}
      />
    </main>
  );
}

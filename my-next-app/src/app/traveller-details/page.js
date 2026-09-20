import SiteHeader from "@/components/common/SiteHeader/SiteHeader";
import PageIntro from "@/components/common/PageIntro/PageIntro";
import TravellerDetailsForm from "@/components/traveller-details/TravellerDetailsForm/TravellerDetailsForm";
import StepProgress from "@/components/traveller-details/StepProgress/StepProgress";
import SummaryCard from "@/components/traveller-details/SummaryCard/SummaryCard";
import commonContent from "@/data/commonContent.json";
import travellerDetailsContent from "@/data/travellerDetailsContent.json";
import { fetchSavedTravellerDetails, submitTravellerDetails } from "./actions";
import styles from "./page.module.scss";

export const metadata = {
  title: travellerDetailsContent.meta.title,
  description: travellerDetailsContent.meta.description,
};

/**
 * Traveller details — Figma web "Applicant Details" (557:14539) and mweb
 * "Applicant Details" (653:138308). The step between choosing a visa
 * (/search-result) and reviewing the application, which leads on to Juspay
 * payment.
 *
 * Renders its own SiteHeader rather than sitting in app/(site): the mweb
 * header is titled "Traveller Details" and steps back to the results. Below
 * desktop the stepper moves under the "Powered by Calleo" pill and the
 * summary cards aren't shown, as in the mweb frame. The saved
 * passport profiles in the JSON stay on the server: only the actions read
 * them, and the form receives the booking's names alone.
 *
 * The "Review your application" button doesn't leave the page: it opens the
 * "Popup with Overlay" (595:51941) over it, and paying from there is what
 * posts the form.
 */
export default function TravellerDetailsPage() {
  const { header, intro, form, review, asideLabel, stepper, visaSummary, tripSummary, booking } =
    travellerDetailsContent;
  // `dob` is only there for a child, whose date of birth the booking already
  // knows; their card shows it locked and asks for a guardian's authorisation.
  const travellers = booking.travellers.map(({ id, position, firstName, lastName, dob }) => ({
    id,
    position,
    firstName,
    lastName,
    ...(dob ? { dob } : null),
  }));

  return (
    <>
      <SiteHeader content={{ ...commonContent.header, ...header }} />
      <main className={styles.page}>
        <PageIntro id="traveller-details-intro" content={intro}>
          <StepProgress content={stepper} />
        </PageIntro>
        <div className={styles.layout}>
          <TravellerDetailsForm
            content={form}
            review={review}
            travellers={travellers}
            submitAction={submitTravellerDetails}
            fetchSavedAction={fetchSavedTravellerDetails}
            toast={commonContent.toast}
          />
          <aside className={styles.aside} aria-label={asideLabel}>
            <StepProgress content={stepper} />
            <SummaryCard id="visa-summary" content={visaSummary} variant="visa" />
            <SummaryCard id="trip-summary" content={tripSummary} variant="trip" />
          </aside>
        </div>
      </main>
    </>
  );
}

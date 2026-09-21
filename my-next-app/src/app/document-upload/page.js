import SiteHeader from "@/components/common/SiteHeader/SiteHeader";
import PageIntro from "@/components/common/PageIntro/PageIntro";
import BottomStickyBar from "@/components/common/BottomStickyBar/BottomStickyBar";
import StepProgress from "@/components/traveller-details/StepProgress/StepProgress";
import SummaryCard from "@/components/traveller-details/SummaryCard/SummaryCard";
import DocumentChecklist from "@/components/document-upload/DocumentChecklist/DocumentChecklist";
import ApplicationIdCard from "@/components/document-upload/ApplicationIdCard/ApplicationIdCard";
import NextSteps from "@/components/document-upload/NextSteps/NextSteps";
import PaymentSummary from "@/components/document-upload/PaymentSummary/PaymentSummary";
import HelpCard from "@/components/document-upload/HelpCard/HelpCard";
import MoreInfo from "@/components/document-upload/MoreInfo/MoreInfo";
import commonContent from "@/data/commonContent.json";
import documentUploadContent from "@/data/documentUploadContent.json";
import travellerDetailsContent from "@/data/travellerDetailsContent.json";
import { bookingDigest, resolveReviewApplication } from "@/lib/reviewApplication";
import styles from "./page.module.scss";

export const metadata = {
  title: documentUploadContent.meta.title,
  description: documentUploadContent.meta.description,
};

/**
 * Document upload — Figma web "Document upload" (761:196637), the step after
 * payment: each traveller's required documents on the left; the stepper, the
 * visa, what happens next, what was paid, and where to get help on the right.
 *
 * The booking — its travellers, the visa and the price — is the one the
 * traveller details and review steps use (`travellerDetailsContent`), so the
 * visa card and the payment rows can never disagree with what was paid for.
 *
 * mweb "Document Upload" (1168:23394) is one column: the stepper under the
 * "Powered by Calleo" pill, the documents, then the visa summary *before* the
 * application ID card, then the rest of the aside, over the 72-tall `review`
 * sticky bar. The DOM keeps the web columns; see page.module.scss for the
 * reordering.
 */
export default function DocumentUploadPage() {
  const { header, intro, stepper, asideLabel, documents, application, copy, nextSteps, payment, help, moreInfo, track } =
    documentUploadContent;
  const { booking, review, form, visaSummary } = travellerDetailsContent;

  const digest = bookingDigest(booking);
  const { summary } = resolveReviewApplication({
    digest,
    travellers: booking.travellers,
    review,
    rules: form.rules,
  });

  // PROVISIONAL: nothing is uploaded yet on the page's first view; the
  // counts come from the application once uploads are saved.
  const travellers = booking.travellers.map(({ id, position, firstName, lastName }) => ({
    id,
    position,
    firstName,
    lastName,
    primary: id === digest.primaryContact,
    uploaded: 0,
  }));

  return (
    <>
      <SiteHeader content={{ ...commonContent.header, ...header }} />
      <main className={styles.page}>
        <PageIntro id="document-upload-intro" content={intro}>
          <StepProgress content={stepper} />
        </PageIntro>
        <div className={styles.layout}>
          <div className={styles.main}>
            <DocumentChecklist content={documents} travellers={travellers} />
            <ApplicationIdCard content={application} copy={copy} />
          </div>
          <aside className={styles.aside} aria-label={asideLabel}>
            <div className={styles.stepper}>
              <StepProgress content={stepper} />
            </div>
            <SummaryCard id="visa-summary" content={visaSummary} variant="visa" />
            <NextSteps content={nextSteps} />
            <PaymentSummary content={payment} summary={summary} copy={copy} />
            <HelpCard content={help} />
            <MoreInfo content={moreInfo} />
          </aside>
        </div>
      </main>
      <BottomStickyBar label={track.label} href={track.href} review />
    </>
  );
}

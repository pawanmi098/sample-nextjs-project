import { cookies } from "next/headers";
import SiteHeader from "@/components/common/SiteHeader/SiteHeader";
import PageIntro from "@/components/common/PageIntro/PageIntro";
import ReviewSummary from "@/components/review-application/ReviewSummary/ReviewSummary";
import ReviewPayment from "@/components/review-application/ReviewPayment/ReviewPayment";
import commonContent from "@/data/commonContent.json";
import travellerDetailsContent from "@/data/travellerDetailsContent.json";
import {
  APPLICATION_COOKIE,
  bookingDigest,
  parseApplicationDigest,
  resolveReviewApplication,
} from "@/lib/reviewApplication";
import { payForApplication } from "./actions";
import styles from "./page.module.scss";

const { review, form, booking } = travellerDetailsContent;

export const metadata = {
  title: review.page.meta.title,
  description: review.page.meta.description,
};

/**
 * Review application — Figma mweb "Review application" (999:265215). The step
 * between filling in the traveller details and paying: the same cards the
 * desktop popup shows, laid out as a page.
 *
 * This route is the mweb half of the review. Above desktop the traveller
 * details form opens `ReviewApplicationModal` over itself instead and never
 * comes here, so the page's own desktop layout is PROVISIONAL — a centred
 * column, since Figma has no web frame for it.
 *
 * Renders its own SiteHeader rather than sitting in app/(site): the mweb
 * header reads "Review Application" and steps back to the form. The
 * application comes off the cookie `submitTravellerDetails` wrote; opened
 * without one — a deep link, or a reload an hour later — it falls back to what
 * the booking itself knows.
 */
export default async function ReviewApplicationPage() {
  const store = await cookies();
  const digest =
    parseApplicationDigest(store.get(APPLICATION_COOKIE)?.value) ?? bookingDigest(booking);

  const { travellers, primary, summary } = resolveReviewApplication({
    digest,
    travellers: booking.travellers,
    review,
    rules: form.rules,
  });

  const intro = { ...review.page.intro, title: review.title, subtitle: review.subtitle };

  return (
    <>
      <SiteHeader content={{ ...commonContent.header, ...review.page.header }} />
      <main className={styles.page}>
        <PageIntro id="review-application-intro" content={intro} />
        <section className={styles.summary} aria-label={review.page.summaryLabel}>
          <ReviewSummary
            content={review}
            travellers={travellers}
            primary={primary}
            summary={summary}
            editHref={review.page.header.back.href}
          />
        </section>
        <ReviewPayment
          content={review}
          total={summary.total}
          errorIcon={form.messageIcons.error}
          payAction={payForApplication}
        />
      </main>
    </>
  );
}

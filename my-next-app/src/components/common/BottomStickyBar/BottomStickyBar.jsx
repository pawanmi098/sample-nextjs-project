import Link from "next/link";
import { ResponsiveCopy } from "@/components/common/PageIntro/PageIntro";
import styles from "./BottomStickyBar.module.scss";

// Fixed bottom action bar. The button submits the form named by `formId`, so
// the bar can live outside that form in the DOM. Without a `formId` it's a
// plain button.
//
// `inactive` is the grey look of traveller details' "Review your application"
// (I578:40653;4123:20773) while the form is incomplete. The button stays
// clickable, with `aria-disabled`, so a click can still reach the form's
// submit handler and point at what's missing — a `disabled` button would
// swallow the click silently. `pending` does disable it, while a submit is
// in flight.
//
// `compact` is the mweb "Primary Bottom Sticky" (traveller details,
// 653:138388): 68 tall with a 36 button, instead of the 84-tall home/SRP bar.
// `review` is the mweb bar of the review application page (999:265332): 72
// tall over a 1 top edge, keeping the base 40 button. Web is the same for all
// three.
//
// `label` may be `{ mobile, desktop }` when the frames word it differently —
// document upload's "Track Application Status" (mweb 1168:23747) / "Track
// your application" (web).
//
// `href` makes the button a link instead — document upload's "Track your
// application" (I835:206992;4123:20773) goes to another page rather than
// submitting anything. It isn't prefetched, as its route may not exist yet.
export default function BottomStickyBar({
  label,
  href,
  formId,
  className,
  inactive = false,
  pending = false,
  compact = false,
  review = false,
}) {
  const barClass = [styles.bar, compact && styles.compact, review && styles.review, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={barClass}>
      <div className={styles.inner}>
        {/* Web only: the dotted rule before the button. */}
        <span className={styles.divider} aria-hidden="true" />
        {href ? (
          <Link href={href} prefetch={false} className={styles.button}>
            <ResponsiveCopy copy={label} />
          </Link>
        ) : (
          <button
            type={formId ? "submit" : "button"}
            form={formId}
            className={inactive || pending ? `${styles.button} ${styles.buttonInactive}` : styles.button}
            aria-disabled={inactive || undefined}
            disabled={pending}
            aria-busy={pending || undefined}
          >
            <ResponsiveCopy copy={label} />
          </button>
        )}
      </div>
    </div>
  );
}

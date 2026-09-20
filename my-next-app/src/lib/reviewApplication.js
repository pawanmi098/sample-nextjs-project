/**
 * The review step's data — Figma mweb "Review application" (999:265215) and
 * the web popup "Popup with Overlay" (595:51941).
 *
 * Both surfaces render the same `ReviewSummary`, so both shape their data
 * here: the popup from the form values it already holds, the page from what
 * the submit carried over. Pure and synchronous; `today` is a parameter so
 * callers and tests control the clock.
 */

import { isChildDob, buildPriceSummary } from "./travellerDetails";

/**
 * Where a submitted application waits for the review page.
 *
 * TODO: this is a stand-in for the booking API that `submitTravellerDetails`
 * is meant to save to. Swap both ends for a real application id once it
 * exists — the cookie is httpOnly and short-lived, but a server-side record
 * is where this belongs.
 */
export const APPLICATION_COOKIE = "ivs-application";
export const APPLICATION_COOKIE_MAX_AGE = 60 * 60;

/**
 * The part of a submitted application the review step needs: the dates of
 * birth (which decide who is a child, and so the fare categories and the
 * price), who takes the visa updates, and their contact details.
 *
 * Passport numbers are deliberately left out. The review never shows one, so
 * there is no reason for them to travel to the next page.
 */
export function applicationDigest(values) {
  return {
    travellers: Object.fromEntries(
      Object.entries(values.travellers ?? {}).map(([id, entry]) => [id, entry.dob ?? ""]),
    ),
    primaryContact: values.primaryContact ?? "",
    contact: {
      dialCode: values.contact?.dialCode ?? "",
      phone: values.contact?.phone ?? "",
      email: values.contact?.email ?? "",
    },
  };
}

/** Read a digest back, or null when there isn't a usable one. */
export function parseApplicationDigest(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && parsed.travellers ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * What the review page shows when it's opened without a submit behind it — a
 * deep link, or a reload after the cookie has expired. The booking's own saved
 * profiles and sample contact stand in, so the page always renders something
 * truthful about the booking rather than an empty shell.
 */
export function bookingDigest(booking) {
  return {
    travellers: Object.fromEntries(
      booking.travellers.map((traveller) => [
        traveller.id,
        traveller.dob ?? booking.savedProfiles?.[traveller.id]?.dob ?? "",
      ]),
    ),
    primaryContact: booking.travellers[0]?.id ?? "",
    contact: booking.sampleContact,
  };
}

/**
 * A digest → the props `ReviewSummary` takes.
 *
 * @param digest      applicationDigest() or bookingDigest()
 * @param travellers  the booking's travellers (`id`, `firstName`, `lastName`)
 * @param review      travellerDetailsContent.review
 * @param rules       form.rules — `childAgeYears` decides the fare categories
 * @returns           `{ travellers, primary, summary }`
 */
export function resolveReviewApplication({ digest, travellers, review, rules }, today = new Date()) {
  const rows = travellers.map((traveller) => {
    const child = isChildDob(digest.travellers?.[traveller.id] ?? "", rules.childAgeYears, today);

    return {
      id: traveller.id,
      name: `${traveller.firstName} ${traveller.lastName}`,
      type: child ? review.travellers.types.child : review.travellers.types.adult,
      child,
    };
  });

  const chosen = rows.find((row) => row.id === digest.primaryContact);
  const contact = digest.contact ?? {};

  return {
    travellers: rows,
    primary: {
      name: chosen?.name ?? "",
      phone: `${contact.dialCode ?? ""} ${contact.phone ?? ""}`.trim(),
      email: contact.email ?? "",
    },
    summary: buildPriceSummary(
      {
        adult: rows.filter((row) => !row.child).length,
        child: rows.filter((row) => row.child).length,
      },
      review.price,
    ),
  };
}

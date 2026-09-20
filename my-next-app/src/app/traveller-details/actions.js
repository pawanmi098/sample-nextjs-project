"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import travellerDetailsContent from "@/data/travellerDetailsContent.json";
import {
  TRAVELLER_FIELDS,
  readTravellerDetails,
  validateTravellerDetails,
} from "@/lib/travellerDetails";
import {
  APPLICATION_COOKIE,
  APPLICATION_COOKIE_MAX_AGE,
  applicationDigest,
} from "@/lib/reviewApplication";

const { form, booking } = travellerDetailsContent;

const validationConfig = {
  travellers: booking.travellers,
  consents: form.consents.items,
  rules: form.rules,
  errors: form.errors,
};

/**
 * "Fetch travellers' information from IndiGo database." — the saved passport
 * details of this booking's travellers.
 *
 * Served by an action rather than passed down as page props, so passport
 * numbers only leave the server when the traveller asks for them, not in
 * every page's HTML. Reads the JSON fixture today; this is the one place to
 * swap in the IndiGo profile API.
 *
 * @returns `{ [travellerId]: { dob, passportNumber, passportExpiry } }`
 */
export async function fetchSavedTravellerDetails() {
  // TODO: authenticate the booking session and call the profile API.
  const profiles = {};

  for (const traveller of booking.travellers) {
    const saved = booking.savedProfiles[traveller.id];
    if (saved) {
      profiles[traveller.id] = Object.fromEntries(TRAVELLER_FIELDS.map((field) => [field, saved[field] ?? ""]));
    }
  }

  return profiles;
}

/**
 * Submit handler for the traveller details form (`useActionState`).
 *
 * Re-validates everything: the client's checks are for feedback only. The
 * traveller list comes from the booking, never from the request, so a
 * tampered form can't add or rename travellers.
 *
 * Where it goes next depends on which button submitted. Below desktop the
 * review is its own page (mweb 999:265215), so the sticky
 * "Review your application" button posts and lands on `booking.reviewHref`.
 * At desktop the review is a popup over this page, and only its "Pay" button
 * posts — it carries `intent=pay` and goes straight on to payment.
 *
 * @returns `{ errors }` when something is missing; redirects when complete
 */
export async function submitTravellerDetails(previousState, formData) {
  const values = readTravellerDetails(formData, validationConfig);
  const errors = validateTravellerDetails(values, validationConfig);

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  // TODO: authenticate the booking session and save the application with
  // the booking API before moving on. Passport numbers are stored uppercase.
  // Until that exists the review step reads what was typed from a short-lived
  // httpOnly cookie — passport numbers excluded, see applicationDigest().
  const store = await cookies();
  store.set(APPLICATION_COOKIE, JSON.stringify(applicationDigest(values)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: APPLICATION_COOKIE_MAX_AGE,
  });

  redirect(formData.get("intent") === "pay" ? booking.paymentHref : booking.reviewHref);
}

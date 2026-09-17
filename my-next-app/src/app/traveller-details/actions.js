"use server";

import { redirect } from "next/navigation";
import travellerDetailsContent from "@/data/travellerDetailsContent.json";
import {
  TRAVELLER_FIELDS,
  readTravellerDetails,
  validateTravellerDetails,
} from "@/lib/travellerDetails";

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
 * @returns `{ errors }` when something is missing; redirects to the review
 *          step (then Juspay payment) when the form is complete
 */
export async function submitTravellerDetails(previousState, formData) {
  const values = readTravellerDetails(formData, validationConfig);
  const errors = validateTravellerDetails(values, validationConfig);

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  // TODO: authenticate the booking session and save the application with
  // the booking API before moving on. Passport numbers are stored uppercase.
  redirect(booking.reviewHref);
}

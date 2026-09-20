"use server";

import { redirect } from "next/navigation";
import travellerDetailsContent from "@/data/travellerDetailsContent.json";

const { booking } = travellerDetailsContent;

/**
 * "Pay ₹ 9,723" on the review application page — Figma mweb "Primary Bottom
 * Sticky" (999:265332).
 *
 * The application was already validated and saved by
 * `submitTravellerDetails`, which is what sent the traveller here, so this
 * only hands off to payment.
 *
 * TODO: authenticate the booking session, re-read the saved application and
 * open the Juspay session against it. `booking.paymentHref` isn't a route yet.
 */
export async function payForApplication() {
  redirect(booking.paymentHref);
}

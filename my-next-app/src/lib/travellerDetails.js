/**
 * Traveller details form — field names, date handling and validation.
 *
 * Shared by the client form (live "0/3 Added" count, inline errors, the
 * inactive sticky button) and the server action that receives the submit, so
 * the two can never disagree about what "complete" means. Pure and
 * synchronous; `today` is a parameter so callers and tests control the clock.
 *
 * Copy (error messages) and the rules' numbers live in
 * src/data/travellerDetailsContent.json → form.rules / form.errors.
 */

import { format } from "./trip";

/** The editable fields each traveller has. Names come from the booking. */
export const TRAVELLER_FIELDS = ["dob", "passportNumber", "passportExpiry"];

/** Form field name — and error key — for one traveller's field, e.g. `t1.dob`. */
export function travellerFieldName(travellerId, field) {
  return `${travellerId}.${field}`;
}

/** Form field name — and error key — for a consent checkbox. */
export function consentFieldName(consentId) {
  return `consent.${consentId}`;
}

// -----------------------------------------------------------------------------
// Dates — shown and typed as DD/MM/YYYY.
// -----------------------------------------------------------------------------

/**
 * Format what's being typed into a date field: keep the digits and put the
 * slashes in, so "14031986" reads "14/03/1986".
 */
export function formatDateTyping(raw) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** "DD/MM/YYYY" → `{ year, month, day }`, or null if it isn't a real date. */
export function parseDisplayDate(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value ?? "");
  if (!match) return null;

  const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  const real =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;

  return real ? { year, month, day } : null;
}

/** "DD/MM/YYYY" → "YYYY-MM-DD" for a native date picker, or "" if invalid. */
export function displayToIsoDate(value) {
  const parts = parseDisplayDate(value);
  if (!parts) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

/** "YYYY-MM-DD" (a native date picker's value) → "DD/MM/YYYY". */
export function isoToDisplayDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
}

/** Comparable day number (YYYYMMDD) for a `{ year, month, day }`. */
function dayKey({ year, month, day }) {
  return year * 10000 + month * 100 + day;
}

/** Local calendar date of `now`, shifted by whole months, as `{ year, month, day }`. */
function localDate(now, addMonths = 0) {
  const shifted = new Date(now.getFullYear(), now.getMonth() + addMonths, now.getDate());
  return { year: shifted.getFullYear(), month: shifted.getMonth() + 1, day: shifted.getDate() };
}

/** Local date `addMonths` from `now`, as "YYYY-MM-DD" (a date picker's min/max). */
export function localIsoDate(now = new Date(), addMonths = 0) {
  const { year, month, day } = localDate(now, addMonths);
  const pad = (n) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

// -----------------------------------------------------------------------------
// Validation
// -----------------------------------------------------------------------------

/**
 * @param values  `{ travellers: { [id]: { dob, passportNumber, passportExpiry } },
 *                  primaryContact, consents: { [id]: boolean } }`
 * @param config  `{ travellers, consents, rules, errors }` — the booking's
 *                travellers, the consent items, and form.rules / form.errors
 * @returns       `{ [fieldName]: message }` — empty when the form is complete
 */
export function validateTravellerDetails(values, config, today = new Date()) {
  const { travellers, consents, rules, errors: messages } = config;
  const errors = {};
  const passportPattern = new RegExp(rules.passportNumberPattern);
  const todayKey = dayKey(localDate(today));
  const minExpiryKey = dayKey(localDate(today, rules.passportMinValidityMonths));

  for (const traveller of travellers) {
    const entry = values.travellers?.[traveller.id] ?? {};
    const name = (field) => travellerFieldName(traveller.id, field);

    const dobValue = (entry.dob ?? "").trim();
    const dob = parseDisplayDate(dobValue);
    if (!dobValue) errors[name("dob")] = messages.dobRequired;
    else if (!dob || dob.year < rules.minBirthYear) errors[name("dob")] = messages.dobInvalid;
    else if (dayKey(dob) >= todayKey) errors[name("dob")] = messages.dobFuture;

    const passportNumber = (entry.passportNumber ?? "").trim().toUpperCase();
    if (!passportNumber) errors[name("passportNumber")] = messages.passportNumberRequired;
    else if (!passportPattern.test(passportNumber)) {
      errors[name("passportNumber")] = messages.passportNumberInvalid;
    }

    const expiryValue = (entry.passportExpiry ?? "").trim();
    const expiry = parseDisplayDate(expiryValue);
    if (!expiryValue) errors[name("passportExpiry")] = messages.passportExpiryRequired;
    else if (!expiry) errors[name("passportExpiry")] = messages.passportExpiryInvalid;
    else if (dayKey(expiry) < minExpiryKey) {
      errors[name("passportExpiry")] = format(messages.passportExpiryTooSoon, {
        months: rules.passportMinValidityMonths,
      });
    }
  }

  if (!travellers.some((traveller) => traveller.id === values.primaryContact)) {
    errors.primaryContact = messages.primaryContactRequired;
  }

  for (const consent of consents) {
    if (!values.consents?.[consent.id]) errors[consentFieldName(consent.id)] = messages.consentRequired;
  }

  return errors;
}

/** True when none of this traveller's fields has an error. */
export function isTravellerComplete(travellerId, errors) {
  return TRAVELLER_FIELDS.every((field) => !errors[travellerFieldName(travellerId, field)]);
}

/** Read a submitted form back into the shape validateTravellerDetails() takes. */
export function readTravellerDetails(formData, { travellers, consents }) {
  const text = (name) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };

  return {
    travellers: Object.fromEntries(
      travellers.map((traveller) => [
        traveller.id,
        Object.fromEntries(
          TRAVELLER_FIELDS.map((field) => [field, text(travellerFieldName(traveller.id, field))]),
        ),
      ]),
    ),
    primaryContact: text("primaryContact"),
    consents: Object.fromEntries(
      consents.map((consent) => [consent.id, formData.get(consentFieldName(consent.id)) === "on"]),
    ),
  };
}

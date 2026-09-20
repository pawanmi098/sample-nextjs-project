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

/** The primary contact's own fields, asked once the traveller is chosen. */
export const CONTACT_FIELDS = ["phone", "email"];

/** Form field name — and error key — for one traveller's field, e.g. `t1.dob`. */
export function travellerFieldName(travellerId, field) {
  return `${travellerId}.${field}`;
}

/**
 * Form field name — and error key — for a child's "authorised by parent /
 * legal guardian" checkbox, e.g. `t3.guardian`.
 */
export function guardianFieldName(travellerId) {
  return `${travellerId}.guardian`;
}

/** Form field name — and error key — for a primary-contact field. */
export function contactFieldName(field) {
  return `contact.${field}`;
}

/** Form field name — and error key — for a consent checkbox. */
export function consentFieldName(consentId) {
  return `consent.${consentId}`;
}

// -----------------------------------------------------------------------------
// Dates — shown and typed as DD-MM-YYYY (Figma 601:12680, "01-11-1970").
// -----------------------------------------------------------------------------

/**
 * Format what's being typed into a date field: keep the digits and put the
 * dashes in, so "14031986" reads "14-03-1986".
 */
export function formatDateTyping(raw) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

/** "DD-MM-YYYY" → `{ year, month, day }`, or null if it isn't a real date. */
export function parseDisplayDate(value) {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value ?? "");
  if (!match) return null;

  const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  const real =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;

  return real ? { year, month, day } : null;
}

/** "DD-MM-YYYY" → "YYYY-MM-DD" for a native date picker, or "" if invalid. */
export function displayToIsoDate(value) {
  const parts = parseDisplayDate(value);
  if (!parts) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

/** "YYYY-MM-DD" (a native date picker's value) → "DD-MM-YYYY". */
export function isoToDisplayDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
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

/** Whole years between `dob` and `today`, both `{ year, month, day }`. */
function ageInYears(dob, today) {
  const years = today.year - dob.year;
  return dayKey({ ...dob, year: today.year }) > dayKey(today) ? years - 1 : years;
}

/**
 * True when the date of birth typed for a traveller puts them in the child
 * band — 2 years up to, but not including, 12, the airline's own `child` fare
 * category. That is what puts the "authorised by parent / legal guardian"
 * checkbox on their card (Figma 601:12682, Aarav Kumar).
 *
 * @param childAgeYears  form.rules.childAgeYears — `{ min, max }`, max exclusive
 */
export function isChildDob(dobValue, childAgeYears, today = new Date()) {
  const dob = parseDisplayDate(dobValue);
  if (!dob) return false;

  const age = ageInYears(dob, localDate(today));
  return age >= childAgeYears.min && age < childAgeYears.max;
}

// -----------------------------------------------------------------------------
// Validation
// -----------------------------------------------------------------------------

/**
 * @param values  `{ travellers: { [id]: { dob, passportNumber, passportExpiry,
 *                  guardian } }, primaryContact, contact: { phone, email },
 *                  consents: { [id]: boolean } }`
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

    // A child (2–12) needs the guardian's authorisation before the rest of
    // their card counts as done.
    if (isChildDob(dobValue, rules.childAgeYears, today) && !entry.guardian) {
      errors[guardianFieldName(traveller.id)] = messages.guardianRequired;
    }
  }

  const chosen = travellers.find((traveller) => traveller.id === values.primaryContact);
  const chosenIsChild =
    chosen && isChildDob(values.travellers?.[chosen.id]?.dob ?? "", rules.childAgeYears, today);

  if (!chosen) {
    errors.primaryContact = messages.primaryContactRequired;
  } else if (chosenIsChild) {
    // Visa updates can't go to a child (999:264807).
    errors.primaryContact = messages.primaryContactChild;
  } else {
    // The chosen traveller's own phone and email — the visa updates go there.
    const phone = (values.contact?.phone ?? "").replace(/[\s-]/g, "");
    if (!phone) errors[contactFieldName("phone")] = messages.phoneRequired;
    else if (!new RegExp(rules.phonePattern).test(phone)) {
      errors[contactFieldName("phone")] = messages.phoneInvalid;
    }

    const email = (values.contact?.email ?? "").trim();
    if (!email) errors[contactFieldName("email")] = messages.emailRequired;
    else if (!new RegExp(rules.emailPattern).test(email)) {
      errors[contactFieldName("email")] = messages.emailInvalid;
    }
  }

  for (const consent of consents) {
    if (!values.consents?.[consent.id]) errors[consentFieldName(consent.id)] = messages.consentRequired;
  }

  return errors;
}

/** True when none of this traveller's fields — guardian included — has an error. */
export function isTravellerComplete(travellerId, errors) {
  return (
    TRAVELLER_FIELDS.every((field) => !errors[travellerFieldName(travellerId, field)]) &&
    !errors[guardianFieldName(travellerId)]
  );
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
        {
          ...Object.fromEntries(
            TRAVELLER_FIELDS.map((field) => [field, text(travellerFieldName(traveller.id, field))]),
          ),
          // A date of birth the booking already knows is shown locked, so the
          // booking's value wins over whatever the request carried.
          ...(traveller.dob ? { dob: traveller.dob } : null),
          guardian: formData.get(guardianFieldName(traveller.id)) === "on",
        },
      ]),
    ),
    primaryContact: text("primaryContact"),
    // The dialling code rides with the number but isn't validated, so it sits
    // outside CONTACT_FIELDS — read it by name or the review step shows a
    // number with no country on it.
    contact: {
      dialCode: text(contactFieldName("dialCode")),
      ...Object.fromEntries(CONTACT_FIELDS.map((field) => [field, text(contactFieldName(field))])),
    },
    consents: Object.fromEntries(
      consents.map((consent) => [consent.id, formData.get(consentFieldName(consent.id)) === "on"]),
    ),
  };
}

// -----------------------------------------------------------------------------
// Review popup — Figma "Price Summary" (595:52006)
// -----------------------------------------------------------------------------

/** "₹ 3,000" — the currency symbol, a space, then Indian digit grouping. */
export function formatAmount(amount, currency) {
  return `${currency} ${new Intl.NumberFormat("en-IN").format(amount)}`;
}

/**
 * The rows and total the review popup prices the application at.
 *
 * Adults and children are counted from the dates of birth already typed into
 * the form, not from anything the booking stores, so the figures always match
 * the travellers listed above them. A fare category with nobody in it drops
 * out; one traveller reads "1 Child · ₹ 2,000", more than one "2 Adults ·
 * 2 X ₹ 3,000".
 *
 * @param counts  `{ adult, child }` — how many travellers in each category
 * @param price   review.price — rates, row labels, the fixed fees and copy
 * @returns       `{ rows: [{ id, label, value }], total, totalAmount }`
 */
export function buildPriceSummary(counts, price) {
  const { currency, rates, labels, multipleFormat, fees, totalLabel } = price;

  const travellerRows = Object.keys(rates)
    .filter((category) => counts[category] > 0)
    .map((category) => {
      const count = counts[category];
      const rate = rates[category];
      const unit = formatAmount(rate, currency);

      return {
        id: category,
        label: count === 1 ? labels[category].one : format(labels[category].other, { count }),
        value: count === 1 ? unit : format(multipleFormat, { count, amount: unit }),
        amount: count * rate,
      };
    });

  const feeRows = fees.map((fee) => ({
    id: fee.id,
    label: fee.label,
    value: formatAmount(fee.amount, currency),
    amount: fee.amount,
  }));

  const rows = [...travellerRows, ...feeRows];
  const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0);

  return { rows, totalLabel, total: formatAmount(totalAmount, currency), totalAmount };
}

"use client";

import { useActionState, useRef, useState } from "react";
import { flushSync } from "react-dom";
import BottomStickyBar from "@/components/common/BottomStickyBar/BottomStickyBar";
import FetchDetailsToggle from "../FetchDetailsToggle/FetchDetailsToggle";
import TravellerAccordion from "../TravellerAccordion/TravellerAccordion";
import PrimaryContact from "../PrimaryContact/PrimaryContact";
import ConsentList from "../ConsentList/ConsentList";
import { format } from "@/lib/trip";
import {
  TRAVELLER_FIELDS,
  isTravellerComplete,
  localIsoDate,
  travellerFieldName,
  validateTravellerDetails,
} from "@/lib/travellerDetails";
import styles from "./TravellerDetailsForm.module.scss";

const initialActionState = { errors: {} };

/**
 * The traveller details form — Figma "left column" (557:14572) plus the
 * "Review your application" sticky bar (578:40653).
 *
 * The page's one client island. It owns the values so it can keep the
 * "0/3 Added" count live, open the card holding the first problem, and grey
 * the sticky button until everything is filled in. Errors appear once a field
 * has been left, or for everything after a submit attempt.
 *
 * A complete form is posted to `submitAction`, which re-validates on the
 * server and redirects to the review step.
 *
 * @param content            form.* copy, rules and error messages
 * @param travellers         the booking's travellers
 * @param submitAction       server action `(prevState, formData) => { errors }`
 * @param fetchSavedAction   server action `() => { [travellerId]: savedFields }`
 */
export default function TravellerDetailsForm({ content, travellers, submitAction, fetchSavedAction }) {
  const { id: formId, fetchToggle, passengers, primaryContact, consents, submitLabel, rules, errors } = content;

  const [values, setValues] = useState(() => ({
    travellers: Object.fromEntries(
      travellers.map((traveller) => [
        traveller.id,
        Object.fromEntries(TRAVELLER_FIELDS.map((field) => [field, ""])),
      ]),
    ),
    primaryContact: "",
    consents: Object.fromEntries(consents.items.map((item) => [item.id, false])),
  }));
  // Figma opens the first traveller and the contact card.
  const [openTravellers, setOpenTravellers] = useState(() => ({ [travellers[0]?.id]: true }));
  const [contactOpen, setContactOpen] = useState(true);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [fetchState, setFetchState] = useState({ checked: false, busy: false, error: null });
  // What the toggle filled in, so turning it off only clears those values.
  const savedProfiles = useRef({});

  const [actionState, formAction, pending] = useActionState(submitAction, initialActionState);

  const validationConfig = { travellers, consents: consents.items, rules, errors };
  const clientErrors = validateTravellerDetails(values, validationConfig);
  const complete = Object.keys(clientErrors).length === 0;
  const addedCount = travellers.filter((traveller) => isTravellerComplete(traveller.id, clientErrors)).length;

  const errorFor = (name) => {
    if (!submitted && !touched[name]) return undefined;
    return clientErrors[name] ?? (submitted ? actionState.errors?.[name] : undefined);
  };

  const dateLimits = {
    dob: () => ({ min: `${rules.minBirthYear}-01-01`, max: localIsoDate() }),
    passportExpiry: () => ({ min: localIsoDate(new Date(), rules.passportMinValidityMonths) }),
  };

  const setTravellerField = (travellerId, field, next) => {
    setValues((current) => ({
      ...current,
      travellers: {
        ...current.travellers,
        [travellerId]: { ...current.travellers[travellerId], [field]: next },
      },
    }));
  };

  const touch = (name) => setTouched((current) => (current[name] ? current : { ...current, [name]: true }));

  // Fill (or, turning off, clear) the fields the saved profiles cover —
  // never overwriting anything the traveller typed themselves.
  const applySavedProfiles = (profiles, fill) => {
    setValues((current) => {
      const nextTravellers = { ...current.travellers };
      for (const [travellerId, saved] of Object.entries(profiles)) {
        if (!nextTravellers[travellerId]) continue;
        const entry = { ...nextTravellers[travellerId] };
        for (const field of TRAVELLER_FIELDS) {
          if (!saved[field]) continue;
          if (fill && entry[field] === "") entry[field] = saved[field];
          if (!fill && entry[field] === saved[field]) entry[field] = "";
        }
        nextTravellers[travellerId] = entry;
      }
      return { ...current, travellers: nextTravellers };
    });
  };

  const handleFetchToggle = async (checked) => {
    if (!checked) {
      applySavedProfiles(savedProfiles.current, false);
      savedProfiles.current = {};
      setFetchState({ checked: false, busy: false, error: null });
      return;
    }

    setFetchState({ checked: true, busy: true, error: null });
    try {
      const profiles = await fetchSavedAction();
      savedProfiles.current = profiles;
      applySavedProfiles(profiles, true);
      setFetchState({ checked: true, busy: false, error: null });
    } catch {
      setFetchState({ checked: false, busy: false, error: fetchToggle.errorLabel });
    }
  };

  const handleSubmit = (event) => {
    if (complete) {
      // Let the server action run. Should the server still reject something
      // (it re-validates), its errors show because the form now counts as
      // submitted.
      setSubmitted(true);
      return;
    }

    event.preventDefault();
    const form = event.currentTarget;

    // Show every error and open whatever hides one, then move focus to the
    // first problem — its error is announced through aria-describedby.
    flushSync(() => {
      setSubmitted(true);
      setOpenTravellers((current) => {
        const next = { ...current };
        for (const traveller of travellers) {
          if (!isTravellerComplete(traveller.id, clientErrors)) next[traveller.id] = true;
        }
        return next;
      });
      if (clientErrors.primaryContact) setContactOpen(true);
    });
    form.querySelector("[data-invalid]")?.focus();
  };

  return (
    <form id={formId} action={formAction} onSubmit={handleSubmit} noValidate className={styles.form}>
      <div className={styles.main}>
        <FetchDetailsToggle
          id="fetch-saved-details"
          label={fetchToggle.label}
          checked={fetchState.checked}
          busy={fetchState.busy}
          error={fetchState.error}
          onChange={handleFetchToggle}
        />

        <section className={styles.passengers} aria-labelledby="passengers-title">
          <div className={styles.passengersHeader}>
            <h2 id="passengers-title" className={styles.passengersTitle}>
              {passengers.title}
            </h2>
            <p className={styles.addedCount} aria-live="polite">
              {format(passengers.addedLabel, { count: addedCount, total: travellers.length })}
            </p>
          </div>

          <ul className={styles.travellerList}>
            {travellers.map((traveller) => (
              <TravellerAccordion
                key={traveller.id}
                traveller={traveller}
                content={passengers}
                open={Boolean(openTravellers[traveller.id])}
                complete={isTravellerComplete(traveller.id, clientErrors)}
                onToggle={() =>
                  setOpenTravellers((current) => ({ ...current, [traveller.id]: !current[traveller.id] }))
                }
                values={values.travellers[traveller.id]}
                errorFor={errorFor}
                onFieldChange={(field, next) => setTravellerField(traveller.id, field, next)}
                onFieldBlur={(field) => touch(travellerFieldName(traveller.id, field))}
                dateLimits={dateLimits}
              />
            ))}
          </ul>
        </section>

        <PrimaryContact
          content={primaryContact}
          travellers={travellers}
          value={values.primaryContact}
          onChange={(next) => setValues((current) => ({ ...current, primaryContact: next }))}
          open={contactOpen}
          onToggle={() => setContactOpen((current) => !current)}
          error={errorFor("primaryContact")}
        />
      </div>

      <ConsentList
        content={consents}
        checked={values.consents}
        onChange={(consentId, next) =>
          setValues((current) => ({ ...current, consents: { ...current.consents, [consentId]: next } }))
        }
        errorFor={errorFor}
      />

      <BottomStickyBar label={submitLabel} formId={formId} inactive={!complete} pending={pending} compact />
    </form>
  );
}

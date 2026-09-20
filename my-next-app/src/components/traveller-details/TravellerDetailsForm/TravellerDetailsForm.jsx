"use client";

import { useActionState, useRef, useState } from "react";
import { flushSync } from "react-dom";
import BottomStickyBar from "@/components/common/BottomStickyBar/BottomStickyBar";
import { useIsDesktop } from "@/components/common/DropdownSurface/DropdownSurface";
import ToastStack, { useToasts } from "@/components/common/Toast/ToastStack";
import FetchDetailsToggle from "../FetchDetailsToggle/FetchDetailsToggle";
import TravellerAccordion from "../TravellerAccordion/TravellerAccordion";
import PrimaryContact from "../PrimaryContact/PrimaryContact";
import ConsentList from "../ConsentList/ConsentList";
import ReviewApplicationModal from "@/components/review-application/ReviewApplicationModal/ReviewApplicationModal";
import { applicationDigest, resolveReviewApplication } from "@/lib/reviewApplication";
import { format } from "@/lib/trip";
import {
  CONTACT_FIELDS,
  TRAVELLER_FIELDS,
  contactFieldName,
  guardianFieldName,
  isChildDob,
  isTravellerComplete,
  localIsoDate,
  travellerFieldName,
  validateTravellerDetails,
} from "@/lib/travellerDetails";
import styles from "./TravellerDetailsForm.module.scss";

const initialActionState = { errors: {} };

/**
 * The traveller details form — Figma "left column" (557:14572, filled
 * 601:12672) plus the "Review your application" sticky bar (578:40653).
 *
 * The page's one client island. It owns the values so it can keep the
 * "0/3 Added" count live, open the card holding the first problem, and grey
 * the sticky button until everything is filled in. Errors appear once a field
 * has been left, or for everything after a submit attempt.
 *
 * What the sticky button does when the form is complete depends on the width,
 * because the review step is drawn twice. At desktop it opens the
 * "Review your application" popup (595:51941) over the page, and only the
 * popup's "Pay" button posts. Below desktop the review is its own page
 * (mweb 999:265215), so the button posts straight away and `submitAction`
 * redirects there. Either way the server re-validates.
 *
 * @param content            form.* copy, rules and error messages
 * @param review             review.* copy for the popup
 * @param travellers         the booking's travellers
 * @param submitAction       server action `(prevState, formData) => { errors }`
 * @param fetchSavedAction   server action `() => { [travellerId]: savedFields }`
 * @param toast              common toast chrome — `{ icons, closeLabel }`
 */
export default function TravellerDetailsForm({
  content,
  review,
  travellers,
  submitAction,
  fetchSavedAction,
  toast,
}) {
  const {
    id: formId,
    fetchToggle,
    passengers,
    primaryContact,
    consents,
    messageIcons,
    submitLabel,
    rules,
    errors,
  } = content;

  const { toasts, showToast, dismissToast } = useToasts();

  const [values, setValues] = useState(() => ({
    travellers: Object.fromEntries(
      travellers.map((traveller) => [
        traveller.id,
        {
          ...Object.fromEntries(TRAVELLER_FIELDS.map((field) => [field, ""])),
          // A child's date of birth comes from the booking and stays locked.
          ...(traveller.dob ? { dob: traveller.dob } : null),
          guardian: false,
        },
      ]),
    ),
    primaryContact: "",
    contact: { dialCode: primaryContact.fields.phone.codes[0].value, phone: "", email: "" },
    consents: Object.fromEntries(consents.items.map((item) => [item.id, false])),
  }));
  // The filled frame (601:12672) opens every traveller's card, and the contact
  // card with it. A card holding prefilled values — a child's locked date of
  // birth, and the guardian checkbox that comes with it — would otherwise be
  // hidden behind "Add details" on load.
  const [openTravellers, setOpenTravellers] = useState(() =>
    Object.fromEntries(travellers.map((traveller) => [traveller.id, true])),
  );
  const [contactOpen, setContactOpen] = useState(true);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [fetchState, setFetchState] = useState({ checked: false, busy: false, error: null });
  // Desktop shows the review as a popup over this page; below it the review
  // is its own route and this form just posts.
  const isDesktop = useIsDesktop();
  // The review popup, and the payment acknowledgement inside it. Figma draws
  // that box already ticked; it starts empty here, and the popup's "Pay"
  // button wears the same grey as the sticky one until it is.
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewConsent, setReviewConsent] = useState(false);
  const [reviewConsentTried, setReviewConsentTried] = useState(false);
  // What the toggle filled in, so turning it off only clears those values.
  const savedProfiles = useRef({});

  const [actionState, formAction, pending] = useActionState(submitAction, initialActionState);

  const validationConfig = { travellers, consents: consents.items, rules, errors };
  const clientErrors = validateTravellerDetails(values, validationConfig);
  // Whoever the dates of birth currently make a child: their card carries the
  // guardian checkbox, and they can't be the primary contact.
  const childIds = travellers
    .filter((traveller) => isChildDob(values.travellers[traveller.id].dob, rules.childAgeYears))
    .map((traveller) => traveller.id);
  const complete = Object.keys(clientErrors).length === 0;
  const addedCount = travellers.filter((traveller) => isTravellerComplete(traveller.id, clientErrors)).length;

  // The popup renders the same summary the /review-application page does, off
  // the values typed into this form rather than anything the server holds.
  const reviewData = resolveReviewApplication({
    digest: applicationDigest(values),
    travellers,
    review,
    rules,
  });

  const errorFor = (name) => {
    if (!submitted && !touched[name]) return undefined;
    return clientErrors[name] ?? (submitted ? actionState.errors?.[name] : undefined);
  };

  const dateLimits = {
    dob: () => ({ min: `${rules.minBirthYear}-01-01`, max: localIsoDate() }),
    passportExpiry: () => ({ min: localIsoDate(new Date(), rules.passportMinValidityMonths) }),
  };

  const setContactField = (field, next) =>
    setValues((current) => ({ ...current, contact: { ...current.contact, [field]: next } }));

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

  // An "Edit" link in the popup: close it and put the caret back on the
  // section it names. The popup returns focus to the button that opened it as
  // it goes, so this waits for that to have happened.
  const handleReviewEdit = (targetId) => {
    setReviewOpen(false);
    requestAnimationFrame(() => {
      const target = document.getElementById(targetId);
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: "center" });
    });
  };

  const handleSubmit = (event) => {
    // The popup's "Pay" button is the only submitter that names itself; the
    // sticky bar's "Review your application" doesn't.
    const paying = event.nativeEvent.submitter?.name === "intent";

    if (complete) {
      if (isDesktop && !paying) {
        event.preventDefault();
        setReviewOpen(true);
        return;
      }

      if (paying && !reviewConsent) {
        event.preventDefault();
        setReviewConsentTried(true);
        return;
      }

      // Let the server action run, and step out of its way: the sticky bar
      // carries the pending state, and should the server still reject
      // something (it re-validates), its errors are on the form behind the
      // popup, which now counts as submitted.
      setReviewOpen(false);
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
      const contactProblem =
        clientErrors.primaryContact ||
        CONTACT_FIELDS.some((field) => clientErrors[contactFieldName(field)]);
      if (contactProblem) setContactOpen(true);
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
            {/* tabIndex so the popup's "Edit" link can land on it. */}
            <h2 id="passengers-title" tabIndex={-1} className={styles.passengersTitle}>
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
                child={childIds.includes(traveller.id)}
                onGuardianChange={(next) => {
                  setTravellerField(traveller.id, "guardian", next);
                  touch(guardianFieldName(traveller.id));
                }}
                errorFor={errorFor}
                onFieldChange={(field, next) => setTravellerField(traveller.id, field, next)}
                onFieldBlur={(field) => touch(travellerFieldName(traveller.id, field))}
                dateLimits={dateLimits}
                icons={messageIcons}
              />
            ))}
          </ul>
        </section>

        <PrimaryContact
          content={primaryContact}
          travellers={travellers}
          value={values.primaryContact}
          onChange={(next) => {
            setValues((current) => ({ ...current, primaryContact: next }));
            // Figma's success toast (595:50608) is written for exactly this
            // moment. One `key`, so choosing again replaces it rather than
            // stacking a second copy of the same sentence.
            showToast({ key: "primary-contact", variant: "success", ...primaryContact.toast });
          }}
          contact={values.contact}
          onContactChange={setContactField}
          onContactBlur={(field) => touch(contactFieldName(field))}
          childIds={childIds}
          errorFor={errorFor}
          icons={messageIcons}
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
        icons={messageIcons}
      />

      <BottomStickyBar label={submitLabel} formId={formId} inactive={!complete} pending={pending} compact />

      {reviewOpen && (
        <ReviewApplicationModal
          content={review}
          travellers={reviewData.travellers}
          primary={reviewData.primary}
          summary={reviewData.summary}
          formId={formId}
          consent={reviewConsent}
          onConsentChange={(next) => {
            setReviewConsent(next);
            if (next) setReviewConsentTried(false);
          }}
          consentError={reviewConsentTried && !reviewConsent ? review.consent.error : undefined}
          errorIcon={messageIcons.error}
          onClose={() => setReviewOpen(false)}
          onEdit={handleReviewEdit}
        />
      )}

      <ToastStack toasts={toasts} onDismiss={dismissToast} icons={toast.icons} closeLabel={toast.closeLabel} />
    </form>
  );
}

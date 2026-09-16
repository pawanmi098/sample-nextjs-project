"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import OptionDropdown from "../OptionDropdown/OptionDropdown";
import TravellerPicker from "../TravellerPicker/TravellerPicker";
import styles from "./SearchForm.module.scss";

/**
 * The one trip-search form.
 *
 * The home page's search widget and the search-result header's edit panel are
 * the same Figma component — "Search Input" 617:63762 and 774:198091 are the
 * same 1152x62 frame, and the mweb card is 653:133857 — so they're one
 * component here, not two copies. Each page keeps only its own chrome:
 *  - home/VisaSearchWidget — the bordered card and the PNR ribbon
 *  - search-result/TripSearchPanel — the fixed panel and its blue screen
 * Both pass their own layout down through `className` on the <form>.
 *
 * A plain GET form: with JS off every field still submits, and the only
 * client state is the destination dropdown below.
 *
 * @param id         form id — the home page's mobile "Continue" bar submits
 *                   this form from outside it, via `form={id}`
 * @param idPrefix   prefix for the field ids, unique per host
 * @param variant    "widget" (home) or "panel" (search result) — see the
 *                   `.widget` / `.panel` rules in the stylesheet
 * @param className  layout for the <form> box, owned by the host
 * @param content    homeContent.search or searchResultContent.editSearch
 * @param values     current criteria, when the host has some (the search
 *                   result page prefills from its searchParams). Otherwise
 *                   each field falls back to its own `value` in the JSON.
 */

function FieldIcon({ src }) {
  return (
    <Image
      src={src}
      alt=""
      aria-hidden="true"
      width={24}
      height={24}
      className={styles.fieldIcon}
    />
  );
}

/**
 * "Nationality" and "Country of Residence" — Figma "Dropdown List" 617:86234,
 * the one-line variant of the same card the destination field drops.
 *
 * A select-only combobox (ARIA 1.2): the trigger is a button, focus stays on
 * it, and `aria-activedescendant` points into the listbox. These are closed
 * sets — unlike "Where", there is nothing to type — so there's no text input
 * and no filtering.
 *
 * It replaces a native <select>, which is what the design costs: the OS popup
 * can't be styled into this card. The value still travels in a hidden input,
 * so without JS the form submits the default rather than breaking.
 */
function ChoiceField({ field, value, dropdownIcon, idPrefix, align }) {
  const triggerId = `${idPrefix}-${field.id}`;
  const labelId = `${triggerId}-label`;
  const listboxId = `${triggerId}-listbox`;
  const optionId = (index) => `${triggerId}-option-${index}`;

  const options = field.options;
  const [selected, setSelected] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const fieldRef = useRef(null);
  const popupRef = useRef(null);
  const triggerRef = useRef(null);

  const current = options.find((option) => option.value === selected) ?? options[0];

  const openList = () => {
    setActiveIndex(options.findIndex((option) => option.value === selected));
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setActiveIndex(-1);
    triggerRef.current?.focus();
  };

  const select = (option) => {
    setSelected(option.value);
    close();
  };

  const move = (step) => {
    if (!open) {
      openList();
      return;
    }
    setActiveIndex((index) => {
      if (index < 0) return step > 0 ? 0 : options.length - 1;
      return (index + step + options.length) % options.length;
    });
  };

  const onKeyDown = (event) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        move(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        move(-1);
        break;
      case "Home":
        if (!open) break;
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        if (!open) break;
        event.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        // Closed, these are the button's own click — let it open the list.
        // Open, they pick the active row, so the click must not fire.
        if (!open) break;
        event.preventDefault();
        if (activeIndex >= 0) select(options[activeIndex]);
        else close();
        break;
      case "Escape":
        if (!open) break;
        event.preventDefault();
        // The search-result panel closes itself on Escape, from a listener on
        // document. While this list is open, Escape belongs to the list.
        event.stopPropagation();
        close();
        break;
      case "Tab":
        // Focus is leaving, so close without pulling it back.
        setOpen(false);
        break;
      default:
        break;
    }
  };

  // Close on a click that lands outside both the field and the list. The
  // mobile sheet's scrim sits inside the list, so it closes itself instead.
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (fieldRef.current?.contains(event.target)) return;
      if (popupRef.current?.contains(event.target)) return;
      setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={fieldRef} className={styles.field}>
      <FieldIcon src={field.icon} />
      <div className={styles.fieldBody}>
        {/* A <button> can't be the target of `for`, so the visible label is a
            span the trigger names itself with. */}
        <span id={labelId} className={styles.label}>
          {field.label}
        </span>
        <div className={styles.selectWrap}>
          <button
            ref={triggerRef}
            type="button"
            id={triggerId}
            role="combobox"
            aria-labelledby={`${labelId} ${triggerId}`}
            aria-expanded={open}
            aria-controls={open ? listboxId : undefined}
            aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
            className={`${styles.control} ${styles.valueControl} ${styles.select} ${styles.trigger}`}
            onClick={() => (open ? close() : openList())}
            onKeyDown={onKeyDown}
          >
            {current.label}
          </button>
          <Image
            src={dropdownIcon}
            alt=""
            aria-hidden="true"
            width={20}
            height={20}
            className={styles.selectChevron}
          />
        </div>
      </div>

      <input type="hidden" name={field.name} value={selected} />

      {open ? (
        <OptionDropdown
          id={listboxId}
          align={align}
          label={field.label}
          options={options}
          selectedValue={selected}
          activeIndex={activeIndex}
          optionId={optionId}
          onSelect={select}
          onClose={close}
          rootRef={popupRef}
        />
      ) : null}
    </div>
  );
}

/**
 * "Travellers" — a button opening the Figma "traveller selection" panel
 * (617:74196 / 617:75161), in place of the plain <select> this used to be.
 *
 * The trip is PNR-linked, so the panel picks named travellers off the
 * booking. The form still submits a *count* under `travellers` — via the
 * hidden input below — because that's what lib/trip.js and the search-result
 * trip summary read, so nothing downstream had to change. Coming the other
 * way, a count in the URL selects that many travellers from the top of the
 * booking, which is the only mapping a bare number supports.
 *
 * Without JS the hidden input still submits the default count; the panel is
 * the part that needs the client, so this field degrades to "can't change it"
 * rather than to a broken form.
 */
function TravellerField({ field, value, dropdownIcon, idPrefix }) {
  const triggerId = `${idPrefix}-travellers`;
  const labelId = `${triggerId}-label`;
  const panelId = `${triggerId}-panel`;

  const parsed = Number.parseInt(value, 10);
  const initialCount = Number.isNaN(parsed)
    ? field.options.length
    : Math.min(Math.max(parsed, 0), field.options.length);

  const [selected, setSelected] = useState(() =>
    field.options.slice(0, initialCount).map((option) => option.id),
  );
  const [open, setOpen] = useState(false);

  const fieldRef = useRef(null);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  // Close on a click that lands outside both the field and the panel. The
  // mobile sheet's scrim sits inside the panel, so it closes itself instead.
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (fieldRef.current?.contains(event.target)) return;
      if (panelRef.current?.contains(event.target)) return;
      setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const valueText = field.valueLabel[selected.length === 1 ? "one" : "other"].replace(
    "{count}",
    String(selected.length),
  );

  return (
    <div ref={fieldRef} className={styles.field}>
      <FieldIcon src={field.icon} />
      <div className={styles.fieldBody}>
        {/* A <button> can't be the target of `for`, so the visible label is a
            span the trigger names itself with. */}
        <span id={labelId} className={styles.label}>
          {field.label}
        </span>
        <div className={styles.selectWrap}>
          <button
            ref={triggerRef}
            type="button"
            id={triggerId}
            aria-labelledby={`${labelId} ${triggerId}`}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={open ? panelId : undefined}
            className={`${styles.control} ${styles.valueControl} ${styles.select} ${styles.trigger}`}
            onClick={() => (open ? close() : setOpen(true))}
          >
            {valueText}
          </button>
          <Image
            src={dropdownIcon}
            alt=""
            aria-hidden="true"
            width={20}
            height={20}
            className={styles.selectChevron}
          />
        </div>
      </div>

      <input type="hidden" name={field.name} value={selected.length} />

      {open ? (
        <TravellerPicker
          id={panelId}
          content={field}
          selected={selected}
          onConfirm={(ids) => {
            setSelected(ids);
            close();
          }}
          onClose={close}
          rootRef={panelRef}
        />
      ) : null}
    </div>
  );
}

/**
 * "Where" — a combobox over the Figma "Dropdown List" (740:148277).
 *
 * It stays a real text input, so the field still submits its value with the
 * form and a typed destination that isn't on the list still works. The list
 * filters as you type, across the city, the airport and the IATA code.
 *
 * Focus never leaves the input while the list is open — that's what lets one
 * `aria-activedescendant` drive both the popover and the mobile sheet.
 */
function DestinationField({ field, value: initialValue, inputId }) {
  const { label, name, placeholder, dropdown } = field;
  const listboxId = `${inputId}-listbox`;
  const optionId = (index) => `${inputId}-option-${index}`;

  const [value, setValue] = useState(initialValue);
  const [open, setOpen] = useState(false);
  // null until the user types: opening the list shows every destination, not
  // just the ones matching the value already in the box.
  const [query, setQuery] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const fieldRef = useRef(null);
  const dropdownRef = useRef(null);

  const allOptions = dropdown.options;
  const options = useMemo(() => {
    const needle = query?.trim().toLowerCase();
    if (!needle) return allOptions;
    return allOptions.filter((option) =>
      [option.label, option.description, option.code].some(
        (text) => text && text.toLowerCase().includes(needle),
      ),
    );
  }, [allOptions, query]);

  const openList = () => {
    setQuery(null);
    setActiveIndex(allOptions.findIndex((option) => option.value === value));
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const select = (option) => {
    setValue(option.value);
    setQuery(null);
    close();
  };

  const move = (step) => {
    if (!open) {
      openList();
      return;
    }
    if (options.length === 0) return;
    setActiveIndex((current) => {
      if (current < 0) return step > 0 ? 0 : options.length - 1;
      return (current + step + options.length) % options.length;
    });
  };

  const onKeyDown = (event) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        move(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        move(-1);
        break;
      case "Home":
        if (!open) break;
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        if (!open) break;
        event.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
        // Only swallow the submit once a row has actually been picked out;
        // Enter on a typed destination still searches.
        if (!open || activeIndex < 0 || !options[activeIndex]) break;
        event.preventDefault();
        select(options[activeIndex]);
        break;
      case "Escape":
        if (!open) break;
        event.preventDefault();
        // The search-result panel closes itself on Escape, from a listener on
        // document. While this list is open, Escape belongs to the list.
        event.stopPropagation();
        close();
        break;
      case "Tab":
        close();
        break;
      default:
        break;
    }
  };

  // Close on a click that lands outside both the field and the list. The
  // mobile sheet's scrim sits inside the list, so it closes itself instead.
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (fieldRef.current?.contains(event.target)) return;
      if (dropdownRef.current?.contains(event.target)) return;
      close();
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={fieldRef} className={`${styles.place} ${styles.placeTo}`}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        type="text"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        aria-autocomplete="list"
        className={`${styles.control} ${styles.cityControl}`}
        onChange={(event) => {
          setValue(event.target.value);
          setQuery(event.target.value);
          setActiveIndex(-1);
          setOpen(true);
        }}
        onFocus={openList}
        onClick={() => {
          if (!open) openList();
        }}
        onKeyDown={onKeyDown}
      />

      {open ? (
        <OptionDropdown
          rootRef={dropdownRef}
          id={listboxId}
          label={dropdown.ariaLabel}
          description={dropdown.description}
          emptyLabel={dropdown.emptyLabel}
          options={options}
          selectedValue={value}
          activeIndex={activeIndex}
          optionId={optionId}
          onSelect={select}
          onClose={close}
        />
      ) : null}
    </div>
  );
}

export default function SearchForm({
  id,
  idPrefix,
  variant = "widget",
  className,
  ariaLabel,
  content,
  values,
}) {
  const { action, from, to, travelDate, travellers, selects, dropdownIcon, purpose, submitLabel } =
    content;

  // The search result page prefills from its searchParams; the home page has
  // no criteria yet, so each field falls back to its own JSON `value`.
  const valueOf = (field) => values?.[field.name] ?? field.value ?? "";
  const legendId = `${idPrefix}-purpose-label`;

  const formClassName = [styles.form, styles[variant], className].filter(Boolean).join(" ");

  return (
    <form
      id={id}
      className={formClassName}
      action={action}
      method="get"
      aria-label={ariaLabel}
    >
      <div className={styles.searchInput}>
        <div className={`${styles.field} ${styles.places}`}>
          <div className={styles.place}>
            <label htmlFor={`${idPrefix}-from`} className={styles.label}>
              {from.label}
            </label>
            <input
              id={`${idPrefix}-from`}
              name={from.name}
              type="text"
              defaultValue={valueOf(from)}
              placeholder={from.placeholder}
              autoComplete="off"
              className={`${styles.control} ${styles.cityControl}`}
            />
          </div>
          <Image
            src={to.icon}
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
            className={styles.placesArrow}
          />
          <DestinationField field={to} value={valueOf(to)} inputId={`${idPrefix}-to`} />
        </div>

        <span className={styles.divider} aria-hidden="true" />

        <div className={`${styles.field} ${styles.dates}`}>
          <FieldIcon src={travelDate.icon} />
          <div className={styles.fieldBody}>
            <label htmlFor={`${idPrefix}-travel-date`} className={styles.label}>
              {travelDate.label}
            </label>
            <input
              id={`${idPrefix}-travel-date`}
              name={travelDate.name}
              type="text"
              defaultValue={valueOf(travelDate)}
              placeholder={travelDate.placeholder}
              autoComplete="off"
              className={`${styles.control} ${styles.valueControl} ${styles.dateControl}`}
            />
          </div>
        </div>

        <span className={styles.divider} aria-hidden="true" />

        <TravellerField
          field={travellers}
          value={valueOf(travellers)}
          dropdownIcon={dropdownIcon}
          idPrefix={idPrefix}
        />

        {/* Nationality and Country of Residence sit in the right half of the
            row, so their cards hang from the field's right edge. */}
        {selects.map((field) => (
          <div key={field.id} className={styles.fieldGroup}>
            <span className={styles.divider} aria-hidden="true" />
            <ChoiceField
              field={field}
              value={valueOf(field)}
              dropdownIcon={dropdownIcon}
              idPrefix={idPrefix}
              align="end"
            />
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <div className={styles.purpose} role="radiogroup" aria-labelledby={legendId}>
          <p id={legendId} className={styles.purposeLabel}>
            {purpose.label}
          </p>
          <div className={styles.radios}>
            {purpose.options.map((option) => (
              <label key={option.value} className={styles.radio}>
                <input
                  type="radio"
                  name={purpose.name}
                  value={option.value}
                  defaultChecked={option.value === valueOf(purpose)}
                  className={styles.radioInput}
                />
                <span className={styles.radioLabel}>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className={styles.submit}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

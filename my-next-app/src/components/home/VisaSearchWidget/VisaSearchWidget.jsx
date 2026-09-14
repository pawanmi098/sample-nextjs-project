import Image from "next/image";
import styles from "./VisaSearchWidget.module.scss";

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

function SelectField({ field, dropdownIcon }) {
  const inputId = `visa-search-${field.id}`;

  return (
    <div className={styles.field}>
      <FieldIcon src={field.icon} />
      <div className={styles.fieldBody}>
        <label htmlFor={inputId} className={styles.label}>
          {field.label}
        </label>
        <div className={styles.selectWrap}>
          <select
            id={inputId}
            name={field.name}
            defaultValue={field.value}
            className={`${styles.control} ${styles.valueControl} ${styles.select}`}
          >
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
    </div>
  );
}

export default function VisaSearchWidget({ content }) {
  const {
    ariaLabel,
    action,
    pnr,
    from,
    to,
    travelDate,
    selects,
    dropdownIcon,
    purpose,
    submitLabel,
  } = content;

  return (
    <section className={styles.widget} aria-label={ariaLabel}>
      <p className={styles.pnr}>
        <Image
          src={pnr.icon}
          alt=""
          aria-hidden="true"
          width={16}
          height={16}
          className={styles.pnrIcon}
        />
        <span>{pnr.label}</span>
      </p>

      {/* id is the target of the mobile sticky "Continue" button (page.js). */}
      <form id="visa-search-form" className={styles.form} action={action} method="get">
        <div className={styles.searchInput}>
          <div className={`${styles.field} ${styles.places}`}>
            <div className={styles.place}>
              <label htmlFor="visa-search-from" className={styles.label}>
                {from.label}
              </label>
              <input
                id="visa-search-from"
                name={from.name}
                type="text"
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
            <div className={`${styles.place} ${styles.placeTo}`}>
              <label htmlFor="visa-search-to" className={styles.label}>
                {to.label}
              </label>
              <input
                id="visa-search-to"
                name={to.name}
                type="text"
                defaultValue={to.value}
                autoComplete="off"
                className={`${styles.control} ${styles.cityControl}`}
              />
            </div>
          </div>

          <span className={styles.divider} aria-hidden="true" />

          <div className={styles.field}>
            <FieldIcon src={travelDate.icon} />
            <div className={styles.fieldBody}>
              <label htmlFor="visa-search-travel-date" className={styles.label}>
                {travelDate.label}
              </label>
              <input
                id="visa-search-travel-date"
                name={travelDate.name}
                type="text"
                placeholder={travelDate.placeholder}
                autoComplete="off"
                className={`${styles.control} ${styles.valueControl} ${styles.dateControl}`}
              />
            </div>
          </div>

          {selects.map((field) => (
            <div key={field.id} className={styles.fieldGroup}>
              <span className={styles.divider} aria-hidden="true" />
              <SelectField field={field} dropdownIcon={dropdownIcon} />
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <div
            className={styles.purpose}
            role="radiogroup"
            aria-labelledby="visa-search-purpose-label"
          >
            <p id="visa-search-purpose-label" className={styles.purposeLabel}>
              {purpose.label}
            </p>
            <div className={styles.radios}>
              {purpose.options.map((option) => (
                <label key={option.value} className={styles.radio}>
                  <input
                    type="radio"
                    name={purpose.name}
                    value={option.value}
                    defaultChecked={option.value === purpose.value}
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
    </section>
  );
}

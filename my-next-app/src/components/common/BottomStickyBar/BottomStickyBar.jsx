import styles from "./BottomStickyBar.module.scss";

// Fixed bottom action bar. The button submits the form named by `formId`, so
// the bar can live outside that form in the DOM. Without a `formId` it's a
// plain button.
export default function BottomStickyBar({ label, formId, className }) {
  return (
    <div className={className ? `${styles.bar} ${className}` : styles.bar}>
      <div className={styles.inner}>
        {/* Web only: the dotted rule before the button. */}
        <span className={styles.divider} aria-hidden="true" />
        <button
          type={formId ? "submit" : "button"}
          form={formId}
          className={styles.button}
        >
          {label}
        </button>
      </div>
    </div>
  );
}

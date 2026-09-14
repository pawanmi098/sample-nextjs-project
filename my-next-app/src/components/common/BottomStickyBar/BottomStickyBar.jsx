import styles from "./BottomStickyBar.module.scss";

// Fixed bottom action bar. The button submits the form named by `formId`, so
// the bar can live outside that form in the DOM.
export default function BottomStickyBar({ label, formId, className }) {
  return (
    <div className={className ? `${styles.bar} ${className}` : styles.bar}>
      <button type="submit" form={formId} className={styles.button}>
        {label}
      </button>
    </div>
  );
}

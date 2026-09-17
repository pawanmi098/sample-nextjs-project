import styles from "./FetchDetailsToggle.module.scss";

/**
 * "Fetch travellers' information from IndiGo database." — Figma "Toggle set"
 * (557:14574). A native checkbox with `role="switch"`; the parent decides what
 * turning it on does.
 *
 * @param busy   true while saved details are loading. The switch ignores
 *               changes then, but stays enabled: disabling the focused
 *               control would drop keyboard focus.
 * @param error  message shown when loading failed
 */
export default function FetchDetailsToggle({ id, label, checked, busy = false, error, onChange }) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={styles.toggleSet}>
      <label className={styles.row} htmlFor={id}>
        <span className={styles.switch}>
          <input
            id={id}
            type="checkbox"
            role="switch"
            className={styles.input}
            checked={checked}
            onChange={(event) => {
              if (!busy) onChange(event.target.checked);
            }}
            aria-busy={busy || undefined}
            aria-describedby={errorId}
          />
          <span className={styles.knob} aria-hidden="true" />
        </span>
        <span className={styles.label}>{label}</span>
      </label>
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

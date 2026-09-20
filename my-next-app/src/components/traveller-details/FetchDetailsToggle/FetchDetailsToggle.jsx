import styles from "./FetchDetailsToggle.module.scss";

/**
 * The switch over the traveller cards — Figma "Toggle set" (557:14574, web;
 * 999:264597, mweb). A native checkbox with `role="switch"`; the parent
 * decides what turning it on does.
 *
 * The two frames word it differently — mweb "Pre-fill details from IndiGo
 * database.", web "Fetch travellers' information from IndiGo database." — so
 * `label` may be `{ mobile, desktop }`, and only the one in play is rendered.
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
        <span className={styles.label}>
          {typeof label === "string" ? (
            label
          ) : (
            <>
              <span className={styles.mobileCopy}>{label.mobile}</span>
              <span className={styles.desktopCopy}>{label.desktop}</span>
            </>
          )}
        </span>
      </label>
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

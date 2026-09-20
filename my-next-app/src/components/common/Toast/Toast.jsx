"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./Toast.module.scss";

/**
 * One toast — Figma "Toast" 595:50608 (success) and 761:196473 (error). The
 * two frames are the same 420-wide component with a different status colour
 * and icon, so this is one component with a `variant`:
 *
 * - success: #F0FFF6 on a 2 #218946 edge, the tick icon
 * - error:   #F4DEDF on a 2 #C3272E edge, the warning icon
 *
 * The title and the body line are both #25304B in both frames — only the edge,
 * the fill and the icon carry the status, so the text stays legible on either
 * tint (10.6:1 and 8.7:1).
 *
 * @param id        the toast's own id; handed back to `onDismiss`
 * @param variant   "success" | "error"
 * @param title     the 600 16/24 line ("Primary Traveller")
 * @param message   the 400 14/20 line under it; wraps to as many lines as it
 *                  needs, which is the only reason the two frames differ in
 *                  height (84 against 64)
 * @param icons     `{ success, error, close }` asset paths, from JSON
 * @param closeLabel  the close button's aria-label
 * @param onDismiss   `(id) => void`, from the close button and the timer.
 *                    Must be stable, or the timer below restarts on every
 *                    render of whatever raised the toast.
 * @param durationSeconds  how long it stays, **in seconds**. Opt-in: with
 *                  nothing passed there is no timer and the toast waits to be
 *                  closed, which is what Figma draws. Hovering or focusing it
 *                  holds the clock, so it can't vanish mid-sentence.
 */
export default function Toast({
  id,
  variant = "success",
  title,
  message,
  icons,
  closeLabel,
  onDismiss,
  durationSeconds,
}) {
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (!durationSeconds || held) return undefined;
    const timer = setTimeout(() => onDismiss(id), durationSeconds * 1000);
    return () => clearTimeout(timer);
    // Letting go starts the count again from the top rather than resuming the
    // remainder: a toast someone just read past is worth the extra few seconds.
  }, [durationSeconds, held, onDismiss, id]);

  return (
    <div
      className={`${styles.toast} ${variant === "error" ? styles.error : styles.success}`}
      // An error interrupts; a success waits its turn. The stack around it is
      // a polite live region, and this overrides it for errors only.
      role={variant === "error" ? "alert" : undefined}
      // Pointer or keyboard, the clock stops while someone is on it. React's
      // onFocus/onBlur bubble, so the close button's focus counts too.
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      <Image
        src={variant === "error" ? icons.error : icons.success}
        alt=""
        aria-hidden="true"
        width={24}
        height={24}
        className={styles.icon}
      />

      <div className={styles.body}>
        <p className={styles.title}>{title}</p>
        {message && <p className={styles.message}>{message}</p>}
      </div>

      <button type="button" className={styles.close} onClick={() => onDismiss(id)} aria-label={closeLabel}>
        <Image src={icons.close} alt="" aria-hidden="true" width={24} height={24} />
      </button>
    </div>
  );
}

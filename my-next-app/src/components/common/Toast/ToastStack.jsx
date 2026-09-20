"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Toast from "./Toast";
import styles from "./Toast.module.scss";

/**
 * Where toasts appear: the top right of the viewport, under the sticky header,
 * lined up with the page's own right gutter. Newest first, stacked 12 apart.
 *
 * Portalled to <body>, so no host's stacking or clipping context decides
 * where it lands, and so the region is in the DOM from the first render —
 * a live region that appears at the same moment as its message is the one
 * case screen readers reliably miss.
 *
 * Figma draws the toast alone (595:50608, 761:196473) and says nothing about
 * where it sits or how it leaves, so the placement here is PROVISIONAL: the
 * header's own height plus 16, and the page gutter (16, 44 from desktop).
 * A page with a taller header sets `--toast-top` on itself.
 *
 * @param toasts    `[{ id, variant, title, message, durationSeconds? }]`,
 *                  newest first. `durationSeconds` is opt-in: a toast without
 *                  one stays until it is closed.
 * @param onDismiss `(id) => void` — stable, so a toast's timer survives a
 *                  re-render of whatever raised it
 * @param icons     `{ success, error, close }` asset paths
 * @param closeLabel  the close button's aria-label
 */
// There is no <body> to portal into while the page renders on the server, and
// the first client render has to match that. This is the same shape as
// DropdownSurface's media-query store, with nothing to subscribe to.
const noSubscribe = () => () => {};

export default function ToastStack({ toasts, onDismiss, icons, closeLabel }) {
  const isClient = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );

  // Past that first render the region stays mounted for the life of the page,
  // empty or not, so a live region is never born with its message inside it.
  if (!isClient) return null;

  return createPortal(
    <div className={styles.stack} aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          variant={toast.variant}
          title={toast.title}
          message={toast.message}
          durationSeconds={toast.durationSeconds}
          icons={icons}
          closeLabel={closeLabel}
          // Passed straight through, not wrapped: an arrow here would be a new
          // function every render and would reset every running timer.
          onDismiss={onDismiss}
        />
      ))}
    </div>,
    document.body,
  );
}

/**
 * The queue behind a ToastStack. Kept a hook rather than a context, because
 * this codebase prop-drills everywhere else and exactly one client island —
 * the traveller details form — raises toasts today.
 *
 * `showToast` is stable, so an effect may depend on it.
 */
export function useToasts() {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((toast) => {
    // `key` lets a caller replace its own last toast instead of stacking a
    // second one — choosing a primary traveller twice says it once.
    const id = toast.key ?? `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((current) => [{ ...toast, id }, ...current.filter((existing) => existing.id !== id)]);
  }, []);

  return { toasts, showToast, dismissToast };
}
